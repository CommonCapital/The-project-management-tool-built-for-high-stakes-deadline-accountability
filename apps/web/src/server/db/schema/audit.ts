import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organization as organizations, user as users } from "./auth";

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // e.g., "task", "project"
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
