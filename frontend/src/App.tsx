import { useEffect, useRef, useState } from "react";
import { fetchConversations, fetchHistory, sendMessage } from "./api";

type Message = {
  sender: "user" | "ai";
  text: string;
};

function TypingIndicator() {
  return (
    <div className="mr-auto bg-zinc-800 px-4 py-2 rounded-lg text-sm">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
        <span
          className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.3s" }}
        />
      </span>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("sessionId")
  );
  const [chatSessions, setChatSessions] = useState<
    { id: string; title: string }[]
  >([]);

  useEffect(() => {
    fetchConversations().then(setChatSessions).catch(console.error);
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load history on reload
  useEffect(() => {
    if (!sessionId) return;

    fetchHistory(sessionId)
      .then((data) => setMessages(data.messages))
      .catch(console.error);
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const text = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { sender: "user", text }]);

    try {
      const res = await sendMessage(text, sessionId || undefined);

      setSessionId(res.sessionId);
      localStorage.setItem("sessionId", res.sessionId);

      setMessages((prev) => [...prev, { sender: "ai", text: res.reply }]);
      setChatSessions((prev) => {
        const exists = prev.some((c) => c.id === res.sessionId);
        if (exists) return prev;

        return [
          {
            id: res.sessionId,
            title: text.slice(0, 30),
          },
          ...prev,
        ];
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-zinc-800">
          <button
            onClick={() => {
              localStorage.removeItem("sessionId");
              setSessionId(null);
              setMessages([]);
            }}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatSessions.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setSessionId(chat.id);
                localStorage.setItem("sessionId", chat.id);
              }}
              className={`w-full text-left px-3 py-2 text-sm truncate
              ${chat.id === sessionId ? "bg-zinc-800" : "hover:bg-zinc-800"}`}
            >
              {chat.title || "New conversation"}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 text-sm font-medium">
          Spur AI Support
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[75%] px-4 py-2 rounded-xl text-sm
              ${
                m.sender === "user"
                  ? "ml-auto bg-emerald-600 text-white"
                  : "mr-auto bg-zinc-800"
              }`}
            >
              {m.text}
            </div>
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-800 flex gap-2">
          <input
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Send a message…"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-emerald-600 px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
