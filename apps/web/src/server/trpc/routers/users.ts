import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "..";
import { user as users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const usersRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: users.role,
        isActive: users.isActive,
        position: users.position,
      })
      .from(users)
      .where(eq(users.orgId, ctx.user.orgId || ""));
  }),

  getById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [u] = await ctx.db
        .select()
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.orgId, ctx.user.orgId || "")));
      if (!u) throw new TRPCError({ code: "NOT_FOUND" });
      return u;
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      position: z.string().max(100).optional(),
      bio: z.string().max(2000).optional(),
      cvUrl: z.string().url().optional().or(z.literal("")),
      skills: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) updates.name = input.name;
      if (input.position !== undefined) updates.position = input.position;
      if (input.bio !== undefined) updates.bio = input.bio;
      if (input.cvUrl !== undefined) updates.cvUrl = input.cvUrl || null;
      if (input.skills !== undefined) updates.skills = JSON.stringify(input.skills);

      await ctx.db.update(users).set(updates).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  updateRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(["admin", "manager", "member"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users)
        .set({ role: input.role })
        .where(and(
          eq(users.id, input.userId),
          eq(users.orgId, ctx.user.orgId || "")
        ));
      return { success: true };
    }),
});
