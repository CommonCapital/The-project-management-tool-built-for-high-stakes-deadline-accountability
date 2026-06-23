import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "..";
import { tasks, projects, user as users, auditLog } from "@/server/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { subDays, startOfDay } from "date-fns";

const PRIORITY_WEIGHT: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

export const analyticsRouter = createTRPCRouter({
  getOrgStats: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId || "";

    const [taskStats] = await ctx.db
      .select({
        total: sql<number>`count(*)`,
        overdue: sql<number>`count(*) filter (where deadline < now() and status != 'done')`,
        completed: sql<number>`count(*) filter (where status = 'done')`,
        inReview: sql<number>`count(*) filter (where status = 'review')`,
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
      tasks: taskStats ?? { total: 0, overdue: 0, completed: 0, inReview: 0 },
      projects: projectCount?.count ?? 0,
      users: userCount?.count ?? 0,
    };
  }),

  getPersonalStats: protectedProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where status = 'done')`,
        inProgress: sql<number>`count(*) filter (where status = 'in_progress')`,
        overdue: sql<number>`count(*) filter (where deadline < now() and status != 'done')`,
        inReview: sql<number>`count(*) filter (where status = 'review')`,
      })
      .from(tasks)
      .where(eq(tasks.assigneeId, ctx.user.id));

    return stats ?? { total: 0, completed: 0, inProgress: 0, overdue: 0, inReview: 0 };
  }),

  getTaskStatusDistribution: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId || "";
    const rows = await ctx.db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)`,
      })
      .from(tasks)
      .where(eq(tasks.orgId, orgId))
      .groupBy(tasks.status);

    return rows.map(r => ({ name: r.status.replace("_", " ").toUpperCase(), value: Number(r.count) }));
  }),

  getTasksCreatedPerDay: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId || "";
    const since = startOfDay(subDays(new Date(), 6));

    const rows = await ctx.db
      .select({
        day: sql<string>`date_trunc('day', ${tasks.createdAt})::date::text`,
        created: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where status = 'done')`,
      })
      .from(tasks)
      .where(and(eq(tasks.orgId, orgId), gte(tasks.createdAt, since)))
      .groupBy(sql`date_trunc('day', ${tasks.createdAt})::date`);

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = d.toISOString().slice(0, 10);
      const found = rows.find(r => r.day === key);
      result.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        created: Number(found?.created ?? 0),
        completed: Number(found?.completed ?? 0),
      });
    }
    return result;
  }),

  getUserKPI: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId;
      // Verify target is in same org
      const [targetUser] = await ctx.db.select({ orgId: users.orgId }).from(users).where(eq(users.id, targetUserId));
      if (!targetUser || targetUser.orgId !== ctx.user.orgId) {
        return { kpi: 0, completionRate: 0, onTimeRate: 0, total: 0, completed: 0, onTime: 0, missed: 0, byPriority: [] };
      }

      const allTasks = await ctx.db
        .select({
          id: tasks.id,
          status: tasks.status,
          priority: tasks.priority,
          deadline: tasks.deadline,
          completedAt: tasks.completedAt,
        })
        .from(tasks)
        .where(eq(tasks.assigneeId, targetUserId));

      const total = allTasks.length;
      if (total === 0) return { kpi: 0, completionRate: 0, onTimeRate: 0, total: 0, completed: 0, onTime: 0, missed: 0, byPriority: [] };

      let weightedDone = 0;
      let weightedTotal = 0;
      let weightedOnTime = 0;
      let weightedHasDeadline = 0;
      let completed = 0;
      let onTime = 0;
      let missed = 0;

      for (const t of allTasks) {
        const w = PRIORITY_WEIGHT[t.priority] ?? 1;
        weightedTotal += w;
        if (t.status === "done") {
          completed++;
          weightedDone += w;
          if (t.deadline) {
            weightedHasDeadline += w;
            const deadlineDate = new Date(t.deadline);
            const completedDate = t.completedAt ? new Date(t.completedAt) : null;
            if (completedDate && completedDate <= deadlineDate) {
              onTime++;
              weightedOnTime += w;
            } else {
              missed++;
            }
          }
        }
      }

      const completionRate = weightedTotal > 0 ? Math.round((weightedDone / weightedTotal) * 100) : 0;
      const onTimeRate = weightedHasDeadline > 0 ? Math.round((weightedOnTime / weightedHasDeadline) * 100) : 100;
      const kpi = Math.round(completionRate * 0.5 + onTimeRate * 0.5);

      // By priority breakdown
      const priorities = ["urgent", "high", "medium", "low"];
      const byPriority = priorities.map(p => {
        const pTasks = allTasks.filter(t => t.priority === p);
        const pDone = pTasks.filter(t => t.status === "done").length;
        return { priority: p, total: pTasks.length, completed: pDone };
      }).filter(p => p.total > 0);

      return { kpi, completionRate, onTimeRate, total, completed, onTime, missed, byPriority };
    }),

  getUserTaskBreakdown: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [targetUser] = await ctx.db.select({ orgId: users.orgId }).from(users).where(eq(users.id, input.userId));
      if (!targetUser || targetUser.orgId !== ctx.user.orgId) return [];

      return await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          deadline: tasks.deadline,
          completedAt: tasks.completedAt,
          projectId: tasks.projectId,
        })
        .from(tasks)
        .where(eq(tasks.assigneeId, input.userId))
        .orderBy(desc(tasks.createdAt));
    }),

  getWorkspaceHealth: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId || "";

    const allProjects = await ctx.db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(and(eq(projects.orgId, orgId), eq(projects.isArchived, false)));

    const allTasks = await ctx.db
      .select({
        projectId: tasks.projectId,
        status: tasks.status,
        priority: tasks.priority,
        deadline: tasks.deadline,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .where(eq(tasks.orgId, orgId));

    const projectStats = allProjects.map(p => {
      const pTasks = allTasks.filter(t => t.projectId === p.id);
      const total = pTasks.length;
      const done = pTasks.filter(t => t.status === "done").length;
      const overdue = pTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
      const inProgress = pTasks.filter(t => t.status === "in_progress" || t.status === "review").length;
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
      return { id: p.id, name: p.name, total, done, overdue, inProgress, completionRate, weight: 1 };
    });

    // Weighted org health score
    const totalWeight = projectStats.reduce((s, p) => s + p.weight, 0);
    const weightedScore = totalWeight > 0
      ? projectStats.reduce((s, p) => s + p.completionRate * p.weight, 0) / totalWeight
      : 0;

    const totalOverdue = allTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;

    return {
      healthScore: Math.round(weightedScore),
      totalOverdue,
      projects: projectStats,
    };
  }),

  getAuditLog: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(auditLog)
        .where(eq(auditLog.orgId, ctx.user.orgId || ""))
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),
});
