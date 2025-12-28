import Groq from "groq-sdk";
import "dotenv/config";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});


const SYSTEM_PROMPT = `
You are a helpful support agent for a small e-commerce store.

Store policies:
- Shipping: Worldwide shipping, 5–7 business days
- Returns: 30-day return window, unused items only
- Support hours: Mon–Fri, 9am–6pm IST

Answer clearly, concisely, and politely.
`;

export async function generateReply(
  history: { sender: string; text: string }[],
  userMessage: string
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...history.map(
      (m): ChatMessage => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })
    ),
    {
      role: "user",
      content: userMessage,
    },
  ];
  
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.2,
    max_tokens: 300,
  });

  return (
    completion.choices[0]?.message?.content ??
    "Sorry, I couldn’t generate a response right now."
  );
}
