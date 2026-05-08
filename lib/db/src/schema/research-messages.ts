import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { researchSessionsTable } from "./research-sessions";

export const researchMessagesTable = pgTable("research_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => researchSessionsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResearchMessageSchema = createInsertSchema(researchMessagesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertResearchMessage = z.infer<typeof insertResearchMessageSchema>;
export type ResearchMessage = typeof researchMessagesTable.$inferSelect;
