import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "..";
import { tasks, taskActivityLog } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../../calendar/google";
import { sendNotification } from "../../notifications/sender";

export const tasksRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      status: z.enum(["todo", "in_progress", "review", "done", "blocked"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const filters = [eq(tasks.orgId, ctx.user.orgId || "")];
      if (input.projectId) filters.push(eq(tasks.projectId, input.projectId));
      if (input.status) filters.push(eq(tasks.status, input.status));

      return await ctx.db.query.tasks.findMany({
        where: and(...filters),
        orderBy: (tasks, { asc }) => [asc(tasks.deadline)],
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.tasks.findFirst({
        where: and(
          eq(tasks.id, input.id),
          eq(tasks.orgId, ctx.user.orgId || "")
        ),
      });
    }),

  create: managerProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      projectId: z.string(),
      priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
      assigneeId: z.string().optional(),
      deadline: z.date().optional(),
      estimatedHours: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const [task] = await ctx.db.insert(tasks).values({
        id,
        projectId: input.projectId,
        orgId: ctx.user.orgId || "",
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        deadline: input.deadline,
        estimatedHours: input.estimatedHours,
        createdBy: ctx.user.id,
      }).returning();

      // 1. Sync to Google Calendar if assignee has it connected
      if (task.assigneeId && task.deadline) {
        try {
          const eventId = await createCalendarEvent(task.assigneeId, {
            title: task.title,
            description: task.description || undefined,
            deadline: task.deadline,
          });
          if (eventId) {
            await ctx.db.update(tasks).set({ calendarEventId: eventId }).where(eq(tasks.id, id));
          }
        } catch (err) {
          console.error("[Calendar] Sync failed:", err);
        }
      }

      // 2. Send Notification
      if (task.assigneeId) {
        await sendNotification({
          userId: task.assigneeId,
          orgId: task.orgId,
          type: "task_assigned",
          title: "NEW_ASSIGNMENT",
          body: `Identity assigned to task "${task.title}".`,
          link: `/tasks/${id}`,
        });
      }

      return task;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.enum(["todo", "in_progress", "review", "done", "blocked"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db.select().from(tasks).where(eq(tasks.id, input.taskId));
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      if (task.assigneeId !== ctx.user.id && ctx.user.role === "member") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.update(tasks)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(tasks.id, input.taskId));

      // Activity Log
      await ctx.db.insert(taskActivityLog).values({
        id: crypto.randomUUID(),
        taskId: input.taskId,
        userId: ctx.user.id,
        action: "status_change",
        oldValue: task.status,
        newValue: input.status,
      });

      // 3. Update Calendar (Mark as cancelled/deleted if Done)
      if (task.assigneeId && task.calendarEventId && input.status === "done") {
        try {
          await deleteCalendarEvent(task.assigneeId, task.calendarEventId);
        } catch (err) {
          console.error("[Calendar] Cleanup failed:", err);
        }
      }

      return { success: true };
    }),
});
