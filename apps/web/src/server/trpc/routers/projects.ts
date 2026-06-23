import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, managerProcedure } from "..";
import { projects, projectMembers, user as users, tasks } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(projects).where(eq(projects.orgId, ctx.user.orgId || ""));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [project] = await ctx.db.select().from(projects).where(
        and(eq(projects.id, input.id), eq(projects.orgId, ctx.user.orgId || ""))
      );
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),

  getStats: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [stats] = await ctx.db
        .select({
          total: sql<number>`count(*)`,
          done: sql<number>`count(*) filter (where status = 'done')`,
          inProgress: sql<number>`count(*) filter (where status = 'in_progress')`,
          review: sql<number>`count(*) filter (where status = 'review')`,
          overdue: sql<number>`count(*) filter (where deadline < now() and status != 'done')`,
        })
        .from(tasks)
        .where(and(eq(tasks.projectId, input.projectId), eq(tasks.orgId, ctx.user.orgId || "")));
      return stats ?? { total: 0, done: 0, inProgress: 0, review: 0, overdue: 0 };
    }),

  getMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          position: users.position,
          joinedAt: projectMembers.joinedAt,
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, input.projectId));
      return rows;
    }),

  addMember: managerProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify project belongs to org
      const [project] = await ctx.db.select().from(projects).where(
        and(eq(projects.id, input.projectId), eq(projects.orgId, ctx.user.orgId || ""))
      );
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.insert(projectMembers).values({
        projectId: input.projectId,
        userId: input.userId,
      }).onConflictDoNothing();
      return { success: true };
    }),

  removeMember: managerProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(projectMembers).where(
        and(eq(projectMembers.projectId, input.projectId), eq(projectMembers.userId, input.userId))
      );
      return { success: true };
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      color: z.string().optional(),
      deadline: z.date().optional(),
      memberIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const [project] = await ctx.db.insert(projects).values({
        id,
        orgId: ctx.user.orgId || "",
        name: input.name,
        description: input.description,
        color: input.color,
        deadline: input.deadline,
        createdBy: ctx.user.id,
      }).returning();

      // Add creator + selected members
      const memberSet = new Set([ctx.user.id, ...(input.memberIds ?? [])]);
      for (const userId of memberSet) {
        await ctx.db.insert(projectMembers).values({ projectId: id, userId }).onConflictDoNothing();
      }

      return project;
    }),

  update: managerProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["active", "archived", "completed"]).optional(),
      deadline: z.date().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.status) updates.status = input.status;
      if (input.deadline !== undefined) updates.deadline = input.deadline;

      await ctx.db.update(projects).set(updates).where(
        and(eq(projects.id, input.projectId), eq(projects.orgId, ctx.user.orgId || ""))
      );
      return { success: true };
    }),
});
