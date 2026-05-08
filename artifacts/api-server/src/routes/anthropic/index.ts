import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import {
  CreateAnthropicConversationBody,
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
  ListAnthropicConversationsResponse,
  GetAnthropicConversationResponse,
  ListAnthropicMessagesResponse,
} from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

router.get("/anthropic/conversations", async (_req, res): Promise<void> => {
  const list = await db
    .select()
    .from(conversations)
    .orderBy(conversations.createdAt);

  res.json(ListAnthropicConversationsResponse.parse(list));
});

router.post("/anthropic/conversations", async (req, res): Promise<void> => {
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .insert(conversations)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json(conversation);
});

router.get(
  "/anthropic/conversations/:id",
  async (req, res): Promise<void> => {
    const params = GetAnthropicConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.data.id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(messages.createdAt);

    res.json(
      GetAnthropicConversationResponse.parse({ ...conversation, messages: msgs })
    );
  }
);

router.delete(
  "/anthropic/conversations/:id",
  async (req, res): Promise<void> => {
    const params = DeleteAnthropicConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [deleted] = await db
      .delete(conversations)
      .where(eq(conversations.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.sendStatus(204);
  }
);

router.get(
  "/anthropic/conversations/:id/messages",
  async (req, res): Promise<void> => {
    const params = ListAnthropicMessagesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(messages.createdAt);

    res.json(ListAnthropicMessagesResponse.parse(msgs));
  }
);

router.post(
  "/anthropic/conversations/:id/messages",
  async (req, res): Promise<void> => {
    const params = SendAnthropicMessageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = SendAnthropicMessageBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.data.id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const existingMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(messages.createdAt);

    await db.insert(messages).values({
      conversationId: params.data.id,
      role: "user",
      content: body.data.content,
    });

    const chatMessages = existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    chatMessages.push({ role: "user", content: body.data.content });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
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

    await db.insert(messages).values({
      conversationId: params.data.id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
);

export default router;
