import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "..";
import { organization, member, user, invitation, channels } from "@/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const workspacesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.orgId) return null;
    const [org] = await ctx.db.select().from(organization).where(eq(organization.id, ctx.user.orgId));
    return org ?? null;
  }),

  // List all workspaces the user belongs to
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.select({ orgId: member.organizationId })
      .from(member).where(eq(member.userId, ctx.user.id));
    if (memberships.length === 0) return [];
    const orgIds = memberships.map(m => m.orgId);
    return ctx.db.select().from(organization).where(inArray(organization.id, orgIds));
  }),

  // Switch to a different workspace the user is already a member of
  switchWorkspace: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [membership] = await ctx.db.select().from(member).where(
        and(eq(member.userId, ctx.user.id), eq(member.organizationId, input.orgId))
      );
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace" });

      await ctx.db.update(user)
        .set({ orgId: input.orgId, role: membership.role, updatedAt: new Date() })
        .where(eq(user.id, ctx.user.id));
      return { orgId: input.orgId };
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(80),
      slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {

      const inviteToken = crypto.randomUUID();
      const orgId = crypto.randomUUID();

      await ctx.db.insert(organization).values({
        id: orgId,
        name: input.name,
        slug: input.slug,
        createdAt: new Date(),
        metadata: JSON.stringify({ inviteToken, inviteEnabled: true }),
      });

      await ctx.db.update(user)
        .set({ orgId, role: "admin", updatedAt: new Date() })
        .where(eq(user.id, ctx.user.id));

      await ctx.db.insert(member).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: ctx.user.id,
        role: "admin",
        createdAt: new Date(),
      });

      await ctx.db.insert(channels).values({
        id: crypto.randomUUID(),
        orgId,
        name: "general",
        type: "public",
        createdBy: ctx.user.id,
        createdAt: new Date(),
      });

      await ctx.db.insert(channels).values({
        id: crypto.randomUUID(),
        orgId,
        name: "announcements",
        type: "public",
        createdBy: ctx.user.id,
        isReadonly: true,
        createdAt: new Date(),
      });

      return { orgId, inviteToken };
    }),

  generateInviteLink: adminProcedure.mutation(async ({ ctx }) => {
    const orgId = ctx.user.orgId || "";
    const inviteToken = crypto.randomUUID();

    await ctx.db.update(organization)
      .set({ metadata: JSON.stringify({ inviteToken, inviteEnabled: true }) })
      .where(eq(organization.id, orgId));

    return { inviteToken, orgId };
  }),

  getInviteInfo: protectedProcedure
    .input(z.object({ orgId: z.string(), token: z.string() }))
    .query(async ({ ctx, input }) => {
      const [org] = await ctx.db.select().from(organization).where(eq(organization.id, input.orgId));
      if (!org) return null;
      const meta = org.metadata ? JSON.parse(org.metadata) : {};
      if (!meta.inviteEnabled || meta.inviteToken !== input.token) return null;
      return { orgName: org.name, orgId: org.id };
    }),

  joinByToken: protectedProcedure
    .input(z.object({ orgId: z.string(), token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [org] = await ctx.db.select().from(organization).where(eq(organization.id, input.orgId));
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });

      const meta = org.metadata ? JSON.parse(org.metadata) : {};
      if (!meta.inviteEnabled || meta.inviteToken !== input.token) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid or expired invite link" });
      }

      await ctx.db.update(user)
        .set({ orgId: input.orgId, role: "member", updatedAt: new Date() })
        .where(eq(user.id, ctx.user.id));

      await ctx.db.insert(member).values({
        id: crypto.randomUUID(),
        organizationId: input.orgId,
        userId: ctx.user.id,
        role: "member",
        createdAt: new Date(),
      }).onConflictDoNothing();

      return { orgId: input.orgId };
    }),

  createEmailInvitation: adminProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(["admin", "manager", "member"]).default("member"),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId || "";
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const [inv] = await ctx.db.insert(invitation).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        email: input.email,
        role: input.role,
        status: "pending",
        expiresAt,
        inviterId: ctx.user.id,
      }).returning();
      return inv;
    }),

  getPendingInvitations: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(invitation).where(
      and(eq(invitation.organizationId, ctx.user.orgId || ""), eq(invitation.status, "pending"))
    );
  }),

  createChannel: adminProcedure
    .input(z.object({ name: z.string().min(1).max(50), isReadonly: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const [channel] = await ctx.db.insert(channels).values({
        id: crypto.randomUUID(),
        orgId: ctx.user.orgId || "",
        name: input.name.toLowerCase().replace(/\s+/g, "-"),
        type: "public",
        createdBy: ctx.user.id,
        isReadonly: input.isReadonly,
        createdAt: new Date(),
      }).returning();
      return channel;
    }),
});
