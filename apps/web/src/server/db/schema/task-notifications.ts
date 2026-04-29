import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";

export const taskNotificationsSent = pgTable("task_notifications_sent", {
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }).primaryKey(),
  tier72hSent: boolean("tier_72h_sent").default(false).notNull(),
  tier24hSent: boolean("tier_24h_sent").default(false).notNull(),
  tier2hSent: boolean("tier_2h_sent").default(false).notNull(),
  overdueSent: boolean("overdue_sent").default(false).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
