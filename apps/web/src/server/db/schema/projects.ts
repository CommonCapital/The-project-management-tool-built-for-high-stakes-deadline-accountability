import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";

export const projectStatusEnum = pgEnum("project_status", ["active", "archived", "completed"]);

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  status: projectStatusEnum("status").notNull().default("active"),
  deadline: timestamp("deadline"),
  calendarEventId: text("calendar_event_id"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projectMembers = pgTable("project_members", {
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => {
  return {
    pk: [table.projectId, table.userId],
  };
});
