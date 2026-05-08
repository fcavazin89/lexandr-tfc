import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const researchSessionsTable = pgTable("research_sessions", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  domain: text("domain").notNull(),
  description: text("description"),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResearchSessionSchema = createInsertSchema(researchSessionsTable).omit({
  id: true,
  messageCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;
export type ResearchSession = typeof researchSessionsTable.$inferSelect;
