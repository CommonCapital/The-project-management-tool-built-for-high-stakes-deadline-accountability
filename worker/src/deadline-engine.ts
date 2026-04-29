import cron from "node-cron";
import { db } from "../../apps/web/src/server/db";
import { tasks } from "../../apps/web/src/server/db/schema";
import { sendNotification } from "../../apps/web/src/server/notifications/sender";
import { and, eq, lte, isNull, or, lt, ne } from "../../apps/web/node_modules/drizzle-orm";
import { redis } from "../../apps/web/src/server/redis";

export function setupDeadlineEngine() {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Worker] Checking deadlines...");

    const now = new Date();
    const threeDaysOut = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const upcomingTasks = await db.select().from(tasks).where(
      and(
        lt(tasks.deadline, threeDaysOut),
        ne(tasks.status, "done")
      )
    );

    for (const task of upcomingTasks) {
      if (!task.deadline || !task.assigneeId) continue;

      const timeLeft = task.deadline.getTime() - now.getTime();
      const hoursLeft = timeLeft / (1000 * 60 * 60);

      let type = "";
      let title = "";
      let body = "";

      if (timeLeft < 0) {
        type = "overdue";
        title = "CRITICAL: Task Overdue";
        body = `Task "${task.title}" is overdue. Immediate escalation initiated.`;
      } else if (hoursLeft < 2) {
        type = "critical";
        title = "2H ALERT: Final Warning";
        body = `Task "${task.title}" is due in less than 2 hours.`;
      } else if (hoursLeft < 24) {
        type = "urgent";
        title = "24H ALERT: Deadline Approaching";
        body = `Task "${task.title}" is due in 24 hours.`;
      } else if (hoursLeft < 72) {
        type = "warning";
        title = "72H NOTICE: Reminder";
        body = `Task "${task.title}" is due in 3 days.`;
      }

      if (type) {
        await sendNotification({
          userId: task.assigneeId,
          orgId: task.orgId,
          type,
          title,
          body,
          link: `/tasks/${task.id}`,
        });
      }
    }
  });
}
