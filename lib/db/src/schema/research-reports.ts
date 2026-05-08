import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { researchSessionsTable } from "./research-sessions";

export const researchReportsTable = pgTable("research_reports", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => researchSessionsTable.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  domain: text("domain").notNull(),
  summary: text("summary").notNull(),
  scientificBasis: text("scientific_basis").notNull(),
  marketAnalysis: text("market_analysis").notNull(),
  technicalRecommendations: text("technical_recommendations").notNull(),
  strategicInsights: text("strategic_insights").notNull(),
  riskAnalysis: text("risk_analysis").notNull(),
  frameworks: text("frameworks").notNull(),
  sources: text("sources").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResearchReportSchema = createInsertSchema(researchReportsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertResearchReport = z.infer<typeof insertResearchReportSchema>;
export type ResearchReport = typeof researchReportsTable.$inferSelect;
