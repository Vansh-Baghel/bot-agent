import { pool } from "../db";
import { redis } from "../redis";

export async function pushToRedis(
  conversationId: string,
  sender: "user" | "ai",
  text: string
) {
  const key = `chat:${conversationId}`;
  const payload = JSON.stringify({ sender, text });

  await redis.lpush(key, payload);
  await redis.ltrim(key, 0, 9); // keep last 10 messages
}

export async function getConversationHistory(conversationId: string) {
  const key = `chat:${conversationId}`;

  try {
    const cached = await redis.lrange(key, 0, -1);

    if (cached.length > 0) {
      return cached
        .map((item) => JSON.parse(item))
        .reverse();
    }
  } catch (err) {
    console.warn("Redis read failed, falling back to DB");
  }

  // Fallback: fetch from Postgres
  const result = await pool.query(
    `SELECT sender, text
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [conversationId]
  );

  return result.rows.reverse();
}
