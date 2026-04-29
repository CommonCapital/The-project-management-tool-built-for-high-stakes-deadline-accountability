import cron from "node-cron";
import { db } from "../../apps/web/src/server/db";
import { tasks } from "../../apps/web/src/server/db/schema";
import { sendNotification } from "../../apps/web/src/server/notifications/sender";
import { and, eq, lte } from "../../apps/web/node_modules/drizzle-orm";

export function setupRecurringTasks() {
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[Worker] Spawning recurring tasks...");

    const recurringParents = await db.select().from(tasks).where(
      and(
        eq(tasks.isRecurring, true),
      )
    );

    for (const parent of recurringParents) {
      const id = crypto.randomUUID();
      
      const nextDeadline = new Date();
      nextDeadline.setDate(nextDeadline.getDate() + 7); 

      await db.insert(tasks).values({
        id,
        projectId: parent.projectId,
        orgId: parent.orgId,
        title: parent.title,
        description: parent.description,
        status: "todo",
        priority: parent.priority,
        assigneeId: parent.assigneeId,
        createdBy: parent.createdBy,
        deadline: nextDeadline,
        parentTaskId: parent.id,
      });

      if (parent.assigneeId) {
        await sendNotification({
          userId: parent.assigneeId,
          orgId: parent.orgId,
          type: "task_assigned",
          title: "New Recurring Task Spawned",
          body: `A new instance of "${parent.title}" has been created for your queue.`,
          link: `/tasks/${id}`,
        });
      }
    }
  });
}
