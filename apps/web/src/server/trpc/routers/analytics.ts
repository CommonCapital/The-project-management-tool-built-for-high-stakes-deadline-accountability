import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "..";
import { tasks, projects, users, auditLog } from "@/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const analyticsRouter = createTRPCRouter({
  getOrgStats: adminProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId || "";

    const [taskStats] = await ctx.db
      .select({
        total: sql<number>`count(*)`,
        overdue: sql<number>`count(*) filter (where deadline < now() and status != 'done')`,
        completed: sql<number>`count(*) filter (where status = 'done')`,
      })
      .from(tasks)
      .where(eq(tasks.orgId, orgId));

    const [projectCount] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.orgId, orgId), eq(projects.isArchived, false)));

    const [userCount] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.orgId, orgId));

    return {
      tasks: taskStats || { total: 0, overdue: 0, completed: 0 },
      projects: projectCount?.count || 0,
      users: userCount?.count || 0,
    };
  }),

  getAuditLog: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.auditLog.findMany({
        where: eq(auditLog.orgId, ctx.user.orgId || ""),
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(auditLog.createdAt)],
      });
    }),
});
