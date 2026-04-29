import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";

export const projectTemplates = pgTable("project_templates", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  structure: jsonb("structure").notNull(), // Stores tasks and relative deadlines
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
