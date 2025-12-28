# AI Live Chat Support Agent

A production-ready AI-powered live chat application for customer support.

---

## 🚀 Running Locally

### Prerequisites

- Node.js (>= 18)
- PostgreSQL
- A Groq API key ([get one free](https://console.groq.com))

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   
   Create `.env` in `backend/`:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/spur_chat
   GROQ_API_KEY=your_groq_api_key_here
   PORT=4000
   ```

3. **Set up database**
   ```bash
   # Create database
   createdb spur_chat
   
   # Run migrations
   psql "$DATABASE_URL" -f prisma/schema.sql
   ```

4. **Start backend**
   ```bash
   npm run dev
   ```
   Backend runs at `http://localhost:4000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   
   Create `.env` in `frontend/`:
   ```bash
   VITE_API_URL=http://localhost:4000
   ```

3. **Start frontend**
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`

---

## 🏗 Architecture Overview

### Backend Structure

**Layers:**
- **Routes** – HTTP request handling, input validation, response shaping
- **Services** – Business logic (LLM integration isolated in `llm.service.ts`)
- **Persistence** – PostgreSQL as source of truth, Redis for optional caching

**Key principles:**
- Backend owns conversation state
- Frontend never sends chat history to LLM
- One API call per user message
- Clean separation of concerns

### Frontend Structure 

- React state manages UI
- Backend manages data consistency
- Session ID persisted in `localStorage`
- Chat history restored on page reload
- Sidebar updates optimistically

### API Endpoints

- `POST /chat/message` – Send a message (creates/continues session)
- `GET /chat/history/:sessionId` – Fetch conversation history
- `GET /chat/conversations` – Fetch all conversations (sidebar)

---

## 🤖 LLM Integration

### Provider: Groq

**Why Groq?**
- Free tier available
- Extremely fast inference (~300 tokens/sec)
- Simple SDK
- Good response quality

**Model:** `llama-3.1-8b-instant`

### Prompting Strategy

System prompt injects domain knowledge:

```
You are a helpful support agent for a small e-commerce store.

Store policies:
- Shipping: Worldwide shipping, 5–7 business days
- Returns: 30-day return window, unused items only
- Support hours: Mon–Fri, 9am–6pm IST
```

Each request includes:
- System prompt
- Last N messages from conversation
- Current user message

---

## ⚖️ Trade-offs & If I Had More Time

### Current Trade-offs

- **No streaming responses** – Using simple HTTP instead of SSE/WebSockets
- **No authentication** – Single-user mode for simplicity
- **Basic prompting** – No RAG, embeddings, or knowledge base

### If I Had More Time

- **Streaming responses** via Server-Sent Events
- **Authentication** – User accounts + session management
- **Conversation summarization** – For long chat histories
- **Delete/rename chats** – Better conversation management
- **Analytics** – Track response times, user satisfaction
- **RAG integration** – Connect to knowledge base/docs

---

## 🛡 Error Handling

- Empty messages rejected
- LLM failures handled gracefully
- Backend never crashes on bad input
- Redis failure falls back to PostgreSQL
- No secrets committed to git