import cron from "node-cron";
import { db } from "../../apps/web/src/server/db";
import { users, notifications } from "../../apps/web/src/server/db/schema";
import { sendNotification } from "../../apps/web/src/server/notifications/sender";
import { and, eq, gte } from "../../apps/web/node_modules/drizzle-orm";

export function setupEmailDigest() {
  // Run daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[Worker] Preparing daily email digests...");

    const allUsers = await db.select().from(users);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const user of allUsers) {
      const unread = await db.select().from(notifications).where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.isRead, false),
          gte(notifications.createdAt, yesterday)
        )
      );

      if (unread.length > 0) {
        await sendNotification({
          userId: user.id,
          orgId: user.orgId || "default",
          type: "digest",
          title: "Daily Operational Summary",
          body: `You have ${unread.length} unread notifications from the last 24 hours.`,
          link: "/notifications",
          emailOnly: true, 
        });
      }
    }
  });
}
