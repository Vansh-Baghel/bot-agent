import axios from "axios";

// used it without env for simplicity
const BASE_URL = "http://localhost:4000";

export async function sendMessage(message: string, sessionId?: string) {
  const res = await axios.post(`${BASE_URL}/chat/message`, {
    message,
    sessionId,
  });

  return res.data;
}

export async function fetchHistory(sessionId: string) {
  const res = await axios.get(`${BASE_URL}/chat/history/${sessionId}`);

  return res.data;
}

export async function fetchConversations() {
  const res = await axios.get(`${BASE_URL}/chat/conversations`);
  return res.data;
}
