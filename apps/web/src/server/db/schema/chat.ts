import { pgTable, text, timestamp, boolean, pgEnum, integer } from "drizzle-orm/pg-core";
import { organization as organizations, user as users } from "./auth";
import { projects } from "./projects";

export const channelTypeEnum = pgEnum("channel_type", ["public", "private", "dm", "project"]);

export const channels = pgTable("channels", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  name: text("name"),
  type: channelTypeEnum("type").notNull().default("public"),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  createdBy: text("created_by").references(() => users.id),
  isReadonly: boolean("is_readonly").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const channelMembers = pgTable("channel_members", {
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => {
  return {
    pk: [table.channelId, table.userId],
  };
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  replyToId: text("reply_to_id"),
  isEdited: boolean("is_edited").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messageAttachments = pgTable("message_attachments", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messageReactions = pgTable("message_reactions", {
  messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    pk: [table.messageId, table.userId, table.emoji],
  };
});
