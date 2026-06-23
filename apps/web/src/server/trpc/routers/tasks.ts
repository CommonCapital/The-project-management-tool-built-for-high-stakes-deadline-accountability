import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "..";
import { tasks, taskActivityLog, taskAssignees, taskAttachments, user as users } from "@/server/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createCalendarEvent, deleteCalendarEvent } from "../../calendar/google";
import { sendNotification } from "../../notifications/sender";

// Attach assigneeIds array to tasks
async function withAssignees<T extends { id: string }>(db: typeof import("@/server/db").db, rows: T[]) {
  if (rows.length === 0) return rows.map(t => ({ ...t, assigneeIds: [] as string[] }));
  const ids = rows.map(r => r.id);
  const assigneeRows = await db.select().from(taskAssignees).where(inArray(taskAssignees.taskId, ids));
  const map = new Map<string, string[]>();
  for (const a of assigneeRows) {
    if (!map.has(a.taskId)) map.set(a.taskId, []);
    map.get(a.taskId)!.push(a.userId);
  }
  return rows.map(t => ({ ...t, assigneeIds: map.get(t.id) ?? [] }));
}

export const tasksRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      status: z.enum(["todo", "in_progress", "review", "done", "blocked"]).optional(),
      assigneeId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const filters = [eq(tasks.orgId, ctx.user.orgId || "")];
      if (input.projectId) filters.push(eq(tasks.projectId, input.projectId));
      if (input.status) filters.push(eq(tasks.status, input.status));

      const rows = await ctx.db.select().from(tasks).where(and(...filters));
      const enriched = await withAssignees(ctx.db, rows);
      if (input.assigneeId) return enriched.filter(t => t.assigneeIds.includes(input.assigneeId!));
      return enriched;
    }),

  myTasks: protectedProcedure.query(async ({ ctx }) => {
    // Tasks where user is in assigneeIds (via junction) or primary assigneeId
    const assigneeRows = await ctx.db.select({ taskId: taskAssignees.taskId })
      .from(taskAssignees).where(eq(taskAssignees.userId, ctx.user.id));
    const taskIds = assigneeRows.map(r => r.taskId);

    if (taskIds.length === 0) return [];
    const rows = await ctx.db.select().from(tasks).where(
      and(inArray(tasks.id, taskIds), eq(tasks.orgId, ctx.user.orgId || ""))
    );
    return withAssignees(ctx.db, rows);
  }),

  listForCalendar: protectedProcedure
    .input(z.object({ start: z.date(), end: z.date() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId || "";
      const isMember = ctx.user.role === "member";

      const allScheduled = await ctx.db.select().from(tasks).where(
        and(eq(tasks.orgId, orgId), gte(tasks.scheduledStart, input.start), lte(tasks.scheduledStart, input.end))
      );
      const enriched = await withAssignees(ctx.db, allScheduled);

      if (isMember) {
        return enriched.filter(t => t.isCommon || t.assigneeIds.includes(ctx.user.id));
      }
      return enriched;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [task] = await ctx.db.select().from(tasks).where(
        and(eq(tasks.id, input.id), eq(tasks.orgId, ctx.user.orgId || ""))
      );
      return task ?? null;
    }),

  create: managerProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      projectId: z.string(),
      priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
      assigneeId: z.string().optional(),
      assigneeIds: z.array(z.string()).optional(),
      deadline: z.date().optional(),
      estimatedHours: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const primaryAssignee = input.assigneeId ?? input.assigneeIds?.[0] ?? null;
      const [task] = await ctx.db.insert(tasks).values({
        id,
        projectId: input.projectId,
        orgId: ctx.user.orgId || "",
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: primaryAssignee,
        deadline: input.deadline,
        estimatedHours: input.estimatedHours,
        createdBy: ctx.user.id,
      }).returning();

      // Insert all assignees into junction table
      const allAssignees = [...new Set([...(input.assigneeIds ?? []), ...(primaryAssignee ? [primaryAssignee] : [])])];
      for (const uid of allAssignees) {
        await ctx.db.insert(taskAssignees).values({ taskId: id, userId: uid }).onConflictDoNothing();
        await sendNotification({
          userId: uid,
          orgId: task.orgId,
          type: "task_assigned",
          title: "NEW_ASSIGNMENT",
          body: `You have been assigned to task "${task.title}".`,
          link: `/tasks`,
        });
      }

      return task;
    }),

  createScheduled: managerProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      projectId: z.string(),
      priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
      assigneeId: z.string().optional(),
      assigneeIds: z.array(z.string()).optional(),
      isCommon: z.boolean().default(false),
      scheduledStart: z.date(),
      scheduledEnd: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const allAssignees = [...new Set([...(input.assigneeIds ?? []), ...(input.assigneeId ? [input.assigneeId] : [])])];
      const primaryAssignee = allAssignees[0] ?? null;

      const [task] = await ctx.db.insert(tasks).values({
        id,
        projectId: input.projectId,
        orgId: ctx.user.orgId || "",
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.isCommon ? null : primaryAssignee,
        isCommon: input.isCommon,
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        deadline: input.scheduledEnd,
        createdBy: ctx.user.id,
      }).returning();

      if (!input.isCommon) {
        for (const uid of allAssignees) {
          await ctx.db.insert(taskAssignees).values({ taskId: id, userId: uid }).onConflictDoNothing();
          await sendNotification({
            userId: uid,
            orgId: task.orgId,
            type: "task_assigned",
            title: "NEW_ASSIGNMENT",
            body: `You have been scheduled for "${task.title}" starting ${task.scheduledStart?.toLocaleString()}.`,
            link: `/calendar`,
          });
        }
      }

      return task;
    }),

  deleteScheduled: managerProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(tasks).where(
        and(eq(tasks.id, input.taskId), eq(tasks.orgId, ctx.user.orgId || ""))
      );
      return { success: true };
    }),

  updateScheduled: managerProcedure
    .input(z.object({
      taskId: z.string(),
      scheduledStart: z.date().optional(),
      scheduledEnd: z.date().optional(),
      title: z.string().optional(),
      assigneeId: z.string().nullable().optional(),
      isCommon: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.scheduledStart) updates.scheduledStart = input.scheduledStart;
      if (input.scheduledEnd) { updates.scheduledEnd = input.scheduledEnd; updates.deadline = input.scheduledEnd; }
      if (input.title) updates.title = input.title;
      if (input.assigneeId !== undefined) updates.assigneeId = input.assigneeId;
      if (input.isCommon !== undefined) updates.isCommon = input.isCommon;

      await ctx.db.update(tasks).set(updates).where(
        and(eq(tasks.id, input.taskId), eq(tasks.orgId, ctx.user.orgId || ""))
      );
      return { success: true };
    }),

  getAttachments: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(taskAttachments).where(eq(taskAttachments.taskId, input.taskId));
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.enum(["todo", "in_progress", "review", "done", "blocked"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db.select().from(tasks).where(eq(tasks.id, input.taskId));
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.user.role === "member") {
        const [junctionRow] = await ctx.db.select().from(taskAssignees).where(
          and(eq(taskAssignees.taskId, input.taskId), eq(taskAssignees.userId, ctx.user.id))
        );
        const isPrimary = task.assigneeId === ctx.user.id;
        if (!isPrimary && !junctionRow) throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.update(tasks)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(tasks.id, input.taskId));

      await ctx.db.insert(taskActivityLog).values({
        id: crypto.randomUUID(),
        taskId: input.taskId,
        userId: ctx.user.id,
        action: "status_change",
        oldValue: task.status,
        newValue: input.status,
      });

      if (task.assigneeId && task.calendarEventId && input.status === "done") {
        try {
          await deleteCalendarEvent(task.assigneeId, task.calendarEventId);
        } catch (err) {
          console.error("[Calendar] Cleanup failed:", err);
        }
      }

      return { success: true };
    }),

  submitCompletion: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      note: z.string().optional(),
      attachmentUrl: z.string().optional(),
      attachmentName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db.select().from(tasks).where(eq(tasks.id, input.taskId));
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      // Allow primary assignee OR any junction-table assignee to submit
      const isPrimary = task.assigneeId === ctx.user.id;
      if (!isPrimary) {
        const [junctionRow] = await ctx.db.select().from(taskAssignees).where(
          and(eq(taskAssignees.taskId, input.taskId), eq(taskAssignees.userId, ctx.user.id))
        );
        if (!junctionRow) throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.update(tasks)
        .set({ status: "review", completionNote: input.note, updatedAt: new Date() })
        .where(eq(tasks.id, input.taskId));

      if (input.attachmentUrl) {
        await ctx.db.insert(taskAttachments).values({
          id: crypto.randomUUID(),
          taskId: input.taskId,
          userId: ctx.user.id,
          fileName: input.attachmentName ?? "attachment",
          fileUrl: input.attachmentUrl,
        });
      }

      await ctx.db.insert(taskActivityLog).values({
        id: crypto.randomUUID(),
        taskId: input.taskId,
        userId: ctx.user.id,
        action: "status_change",
        oldValue: task.status,
        newValue: "review",
      });

      return { success: true };
    }),

  approveCompletion: managerProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db.select().from(tasks).where(eq(tasks.id, input.taskId));
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      if (task.status !== "review") throw new TRPCError({ code: "BAD_REQUEST", message: "Task is not in review" });

      await ctx.db.update(tasks)
        .set({ status: "done", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(tasks.id, input.taskId));

      await ctx.db.insert(taskActivityLog).values({
        id: crypto.randomUUID(),
        taskId: input.taskId,
        userId: ctx.user.id,
        action: "approved",
        oldValue: "review",
        newValue: "done",
      });

      if (task.assigneeId) {
        await sendNotification({
          userId: task.assigneeId,
          orgId: task.orgId,
          type: "task_approved",
          title: "TASK_APPROVED",
          body: `Your completion of "${task.title}" has been approved.`,
          link: `/tasks`,
        });
        if (task.calendarEventId) {
          try { await deleteCalendarEvent(task.assigneeId, task.calendarEventId); } catch {}
        }
      }

      return { success: true };
    }),

  rejectCompletion: managerProcedure
    .input(z.object({
      taskId: z.string(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db.select().from(tasks).where(eq(tasks.id, input.taskId));
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      if (task.status !== "review") throw new TRPCError({ code: "BAD_REQUEST", message: "Task is not in review" });

      await ctx.db.update(tasks)
        .set({ status: "in_progress", completionNote: input.note ?? null, updatedAt: new Date() })
        .where(eq(tasks.id, input.taskId));

      await ctx.db.insert(taskActivityLog).values({
        id: crypto.randomUUID(),
        taskId: input.taskId,
        userId: ctx.user.id,
        action: "rejected",
        oldValue: "review",
        newValue: "in_progress",
      });

      if (task.assigneeId) {
        await sendNotification({
          userId: task.assigneeId,
          orgId: task.orgId,
          type: "task_rejected",
          title: "COMPLETION_REJECTED",
          body: `Completion of "${task.title}" was rejected.${input.note ? ` Reason: ${input.note}` : ""}`,
          link: `/tasks`,
        });
      }

      return { success: true };
    }),
});
