import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  researchSessionsTable,
  researchMessagesTable,
  researchReportsTable,
} from "@workspace/db";
import {
  CreateResearchSessionBody,
  GetResearchSessionParams,
  DeleteResearchSessionParams,
  SendResearchMessageParams,
  SendResearchMessageBody,
  GenerateResearchReportParams,
  GetResearchReportParams,
  ListResearchSessionsResponse,
  GetResearchSessionResponse,
  ListResearchReportsResponse,
  GetResearchReportResponse,
  GetResearchStatsResponse,
} from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { LEXANDR_SYSTEM_PROMPT } from "../../lib/lexandr-system-prompt";

const router: IRouter = Router();

router.get("/research/sessions", async (_req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(researchSessionsTable)
    .orderBy(desc(researchSessionsTable.updatedAt));

  res.json(ListResearchSessionsResponse.parse(sessions));
});

router.post("/research/sessions", async (req, res): Promise<void> => {
  const parsed = CreateResearchSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(researchSessionsTable)
    .values({
      topic: parsed.data.topic,
      domain: parsed.data.domain,
      description: parsed.data.description ?? null,
    })
    .returning();

  res.status(201).json(session);
});

router.get("/research/sessions/:id", async (req, res): Promise<void> => {
  const params = GetResearchSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(researchSessionsTable)
    .where(eq(researchSessionsTable.id, params.data.id));

  if (!session) {
    res.status(404).json({ error: "Research session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(researchMessagesTable)
    .where(eq(researchMessagesTable.sessionId, params.data.id))
    .orderBy(researchMessagesTable.createdAt);

  res.json(
    GetResearchSessionResponse.parse({
      ...session,
      messages,
    })
  );
});

router.delete("/research/sessions/:id", async (req, res): Promise<void> => {
  const params = DeleteResearchSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(researchSessionsTable)
    .where(eq(researchSessionsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Research session not found" });
    return;
  }

  res.sendStatus(204);
});

router.post(
  "/research/sessions/:id/messages",
  async (req, res): Promise<void> => {
    const params = SendResearchMessageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = SendResearchMessageBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [session] = await db
      .select()
      .from(researchSessionsTable)
      .where(eq(researchSessionsTable.id, params.data.id));

    if (!session) {
      res.status(404).json({ error: "Research session not found" });
      return;
    }

    const existingMessages = await db
      .select()
      .from(researchMessagesTable)
      .where(eq(researchMessagesTable.sessionId, params.data.id))
      .orderBy(researchMessagesTable.createdAt);

    await db.insert(researchMessagesTable).values({
      sessionId: params.data.id,
      role: "user",
      content: body.data.content,
    });

    await db
      .update(researchSessionsTable)
      .set({
        messageCount: session.messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(researchSessionsTable.id, params.data.id));

    const chatMessages = existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    chatMessages.push({ role: "user", content: body.data.content });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const contextualSystemPrompt =
      LEXANDR_SYSTEM_PROMPT +
      `\n\n## CURRENT RESEARCH SESSION\n**Topic:** ${session.topic}\n**Domain:** ${session.domain}${session.description ? `\n**Context:** ${session.description}` : ""}`;

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: contextualSystemPrompt,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text;
        res.write(
          `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
        );
      }
    }

    await db.insert(researchMessagesTable).values({
      sessionId: params.data.id,
      role: "assistant",
      content: fullResponse,
    });

    await db
      .update(researchSessionsTable)
      .set({
        messageCount: session.messageCount + 2,
        updatedAt: new Date(),
      })
      .where(eq(researchSessionsTable.id, params.data.id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
);

router.post(
  "/research/sessions/:id/report",
  async (req, res): Promise<void> => {
    const params = GenerateResearchReportParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [session] = await db
      .select()
      .from(researchSessionsTable)
      .where(eq(researchSessionsTable.id, params.data.id));

    if (!session) {
      res.status(404).json({ error: "Research session not found" });
      return;
    }

    const messages = await db
      .select()
      .from(researchMessagesTable)
      .where(eq(researchMessagesTable.sessionId, params.data.id))
      .orderBy(researchMessagesTable.createdAt);

    const conversationText = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const reportPrompt = `Based on the following research conversation about "${session.topic}" in the domain of "${session.domain}", generate a comprehensive structured research report.

CONVERSATION:
${conversationText}

Generate a detailed JSON report with the following fields. Be thorough and specific:
- summary: Executive summary (2-3 paragraphs)
- scientificBasis: Academic and scientific foundations, papers, and theoretical frameworks referenced or relevant
- marketAnalysis: Market landscape, competitive analysis, case studies, and benchmarks
- technicalRecommendations: Specific technical architecture recommendations and implementation guidance
- strategicInsights: Key strategic insights, opportunities, and differentiation strategies
- riskAnalysis: Comprehensive risk matrix covering technical, economic, regulatory, and adoption risks
- frameworks: Recommended frameworks, models, and methodologies to apply
- sources: Key sources, references, papers, protocols, and resources to consult

Respond ONLY with a valid JSON object matching this exact structure:
{
  "summary": "...",
  "scientificBasis": "...",
  "marketAnalysis": "...",
  "technicalRecommendations": "...",
  "strategicInsights": "...",
  "riskAnalysis": "...",
  "frameworks": "...",
  "sources": "..."
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: LEXANDR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: reportPrompt }],
    });

    const block = response.content[0];
    const rawText = block.type === "text" ? block.text : "{}";

    let reportData: Record<string, string>;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      reportData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      reportData = {};
    }

    const [report] = await db
      .insert(researchReportsTable)
      .values({
        sessionId: params.data.id,
        topic: session.topic,
        domain: session.domain,
        summary: reportData.summary ?? "Report generation incomplete.",
        scientificBasis: reportData.scientificBasis ?? "",
        marketAnalysis: reportData.marketAnalysis ?? "",
        technicalRecommendations: reportData.technicalRecommendations ?? "",
        strategicInsights: reportData.strategicInsights ?? "",
        riskAnalysis: reportData.riskAnalysis ?? "",
        frameworks: reportData.frameworks ?? "",
        sources: reportData.sources ?? "",
      })
      .returning();

    res.json(report);
  }
);

router.get("/research/reports", async (_req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(researchReportsTable)
    .orderBy(desc(researchReportsTable.createdAt));

  res.json(ListResearchReportsResponse.parse(reports));
});

router.get("/research/reports/:id", async (req, res): Promise<void> => {
  const params = GetResearchReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(researchReportsTable)
    .where(eq(researchReportsTable.id, params.data.id));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(GetResearchReportResponse.parse(report));
});

router.get("/research/stats", async (_req, res): Promise<void> => {
  const [sessionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(researchSessionsTable);

  const [messageCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(researchMessagesTable);

  const [reportCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(researchReportsTable);

  const sessionsByDomain = await db
    .select({
      domain: researchSessionsTable.domain,
      count: sql<number>`count(*)::int`,
    })
    .from(researchSessionsTable)
    .groupBy(researchSessionsTable.domain)
    .orderBy(desc(sql`count(*)`));

  const recentSessions = await db
    .select()
    .from(researchSessionsTable)
    .orderBy(desc(researchSessionsTable.updatedAt))
    .limit(5);

  res.json(
    GetResearchStatsResponse.parse({
      totalSessions: sessionCount?.count ?? 0,
      totalMessages: messageCount?.count ?? 0,
      totalReports: reportCount?.count ?? 0,
      sessionsByDomain,
      recentSessions,
    })
  );
});

export default router;
