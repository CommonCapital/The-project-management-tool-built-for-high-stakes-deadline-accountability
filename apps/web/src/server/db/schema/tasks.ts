import { pgTable, text, timestamp, boolean, pgEnum, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { organization as organizations, user as users } from "./auth";
import { projects } from "./projects";

export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "review", "done", "blocked"]);
export const taskPriorityEnum = pgEnum("task_priority", ["urgent", "high", "medium", "low"]);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  assigneeId: text("assignee_id").references(() => users.id),
  createdBy: text("created_by").notNull().references(() => users.id),
  deadline: timestamp("deadline"),
  estimatedHours: doublePrecision("estimated_hours"),
  actualHours: doublePrecision("actual_hours"),
  calendarEventId: text("calendar_event_id"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule"), // Cron expression
  parentTaskId: text("parent_task_id"), // For recurring series
  templateId: text("template_id"),
  completedAt: timestamp("completed_at"),
  completionNote: text("completion_note"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  isCommon: boolean("is_common").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const taskAssignees = pgTable("task_assignees", {
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => ({ pk: [table.taskId, table.userId] }));

export const taskDependencies = pgTable("task_dependencies", {
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnTaskId: text("depends_on_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    pk: [table.taskId, table.dependsOnTaskId],
  };
});

export const taskComments = pgTable("task_comments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentCommentId: text("parent_comment_id"),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taskActivityLog = pgTable("task_activity_log", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // e.g., "status_change", "assigned"
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taskAttachments = pgTable("task_attachments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  hours: doublePrecision("hours").notNull(),
  note: text("note"),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
});
