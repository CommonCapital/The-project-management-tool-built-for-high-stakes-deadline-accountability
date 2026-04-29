import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull().references(() => organizations.id),
  type: text("type").notNull(), // e.g., "task_assigned", "deadline_approaching"
  title: text("title").notNull(),
  body: text("body").notNull(),
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
