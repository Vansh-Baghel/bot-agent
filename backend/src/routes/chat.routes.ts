import { Router } from "express";
import { pool } from "../db";
import { generateReply } from "../services/llm.service";
import { getConversationHistory, pushToRedis } from "../helper/redis";

const router = Router();

router.post("/message", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    let conversationId = sessionId;

    // 1. Create conversation if needed
    if (!conversationId) {
      const result = await pool.query(
        "INSERT INTO conversations DEFAULT VALUES RETURNING id"
      );
      conversationId = result.rows[0].id;
    }

    // 2. Persist user message (source of truth)
    await pool.query(
      `INSERT INTO messages (conversation_id, sender, text)
       VALUES ($1, 'user', $2)`,
      [conversationId, message]
    );

    // 3. Cache user message
    try {
      await pushToRedis(conversationId, "user", message);
    } catch (err) {
      console.warn("Redis write failed (user message)");
    }

    // 4. Get history (Redis-first)
    const history = await getConversationHistory(conversationId);

    // 5. Call LLM
    let reply: string;
    try {
      reply = await generateReply(history, message);
    } catch (err) {
      reply =
        "Sorry, I’m having trouble responding right now. Please try again.";
    }

    // 6. Persist AI reply
    await pool.query(
      `INSERT INTO messages (conversation_id, sender, text)
       VALUES ($1, 'ai', $2)`,
      [conversationId, reply]
    );

    // 7. Cache AI reply
    try {
      await pushToRedis(conversationId, "ai", reply);
    } catch (err) {
      console.warn("Redis write failed (ai message)");
    }

    return res.json({
      reply,
      sessionId: conversationId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Unexpected server error",
    });
  }
});

router.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const result = await pool.query(
      `SELECT sender, text, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    return res.json({
      sessionId,
      messages: result.rows,
    });
  } catch (err) {
    console.error("FETCH HISTORY ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch conversation history",
    });
  }
});

router.get("/conversations", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        MIN(m.text) as title,
        c.created_at
      FROM conversations c
      LEFT JOIN messages m
        ON c.id = m.conversation_id
        AND m.sender = 'user'
      GROUP BY c.id
      ORDER BY c.created_at DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

export default router;
