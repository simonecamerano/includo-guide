# IncluDO Guide

> Production-ready RAG-powered orientation platform for artisan vocational training.

[![Live Demo](https://img.shields.io/badge/Live-includo--guide.vercel.app-brightgreen?logo=vercel)](https://includo-guide.vercel.app)

Generic chatbots give generic answers. IncluDO Guide is built around a different premise: a structured knowledge base of artisan training paths, a custom vector store with cosine similarity search, and a prompt factory with pedagogical constraints that guarantee focused, relevant recommendations — never more than two courses per session.

The result is an AI assistant that stays on topic, remembers the conversation, and guides users through a domain it actually knows.

---

## Architecture

```
User message
     │
     ▼
Session Manager
(anonymous session creation + server-side history persistence)
     │
     ▼
RAG Pipeline
(query → cosine similarity search → top-k chunks from vector_db.json)
     │
     ▼
Modular Prompt Factory
(system prompt + retrieved context + conversation history + pedagogical constraints)
     │
     ▼
GPT-4o-mini
(response generation)
     │
     ▼
Telegram-style UI
(streaming response + session continuity)
```

**Key architectural decisions:**

- **Custom vector store** over an off-the-shelf solution — the course catalog is small and stable, a local JSON-based store with cosine similarity is faster, cheaper, and fully controllable
- **Dual-layer pedagogical constraint** — the "max 2 recommendations" rule is enforced both at the prompt level and validated in the response handler, not left to model discretion
- **Server-side session persistence** — sessions survive backend restarts via `sessions.json`, with configurable TTL and background pruning
- **Admin ingestion API** — catalog updates go through a protected `/api/admin/ingest` endpoint with token auth and rate limiting, not manual file edits

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Framer Motion, Vanilla CSS |
| Backend | Node.js 20+ (ESM), Express 5 |
| AI | OpenAI GPT-4o-mini + Text-Embedding-3-Small |
| Storage | Custom JSON vector store + session persistence |
| Deployment | Vercel (frontend) + Coolify/DigitalOcean (backend) |
| Testing | Vitest (backend integration + frontend UI) |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/simonecamerano/includo-guide.git
cd includo-guide

cd server && npm install
cd ../client && npm install

# 2. Configure environment
cp server/.env.example server/.env
# Fill in ANTHROPIC_API_KEY and ADMIN_INGEST_TOKEN

# 3. Seed the vector store
cd server && ADMIN_INGEST_TOKEN=your_secret node scripts/seed.js

# 4. Start backend (terminal A)
cd server && npm start

# 5. Start frontend (terminal B)
cd client && npm run dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key, for text generation only. Embeddings run locally and need no key |
| `EMBEDDING_MODEL` | Local embedding model (default `Xenova/multilingual-e5-small`) |
| `EMBEDDING_CACHE_DIR` | Where the model weights live (default `./.models`) |
| `ADMIN_INGEST_TOKEN` | Shared secret for `/api/admin/ingest` |
| `SESSIONS_DIR` | Filesystem path for session persistence |
| `SESSION_TTL_MS` | Max inactivity time before session expiry |
| `SESSION_PRUNE_INTERVAL_MS` | Background prune interval |
| `MAX_SESSION_MESSAGES` | Max messages retained per session window |
| `INGEST_RATE_LIMIT_WINDOW_MS` | Admin ingest rate-limit window |
| `INGEST_RATE_LIMIT_MAX` | Max ingest requests per window |

---

## API

### `POST /api/chat`

```json
// Request
{ "message": "I'm interested in woodworking", "sessionId": "sid_abc" }

// Response
{
  "reply": "...",
  "history": [...],
  "sessionId": "sid_abc"
}
```

If `sessionId` is omitted, the server generates a new anonymous session and returns it in the response. Empty or missing `message` returns `400`.

### `POST /api/admin/ingest`

Synchronizes `courses.json` with the vector store. Requires `x-admin-token` header. Protected by token authentication, payload validation, and rate limiting.

```bash
curl -X POST https://your-backend/api/admin/ingest \
  -H "x-admin-token: your_secret" \
  -H "Content-Type: application/json" \
  -d @courses.json
```

### `GET /api/health`

Returns server status. Used for external monitoring.

---

## Running Tests

```bash
# Backend integration tests
cd server && npm test

# Frontend UI tests
cd client && npm test
```

Tests cover API status codes, AI response logic, session initialization, component rendering, and accessibility roles.

---

## Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Static deploy, zero config |
| Backend | Coolify + DigitalOcean | Docker-based, persistent volume for `sessions.json` |

The backend requires a persistent filesystem for session stability. See [DEPLOYMENT.md](./DEPLOYMENT.md) for full configuration details.

---

## Adapting to Other Domains

The platform is domain-agnostic. To deploy it for a different knowledge base:

1. Replace `courses.json` with your own catalog
2. Update the system prompt in `server/src/prompts/` to reflect the new domain
3. Run `node scripts/seed.js` to rebuild the vector store
4. Adjust pedagogical constraints in the prompt factory as needed

The RAG pipeline, session management, and API layer require no changes.

---

## Author

**Simone Camerano** — AI workflow engineer and full stack developer.

- 🌐 [simonecamerano.dev](https://simonecamerano.dev)
- 💼 [linkedin.com/in/simone-camerano](https://linkedin.com/in/simone-camerano)
- 🐙 [github.com/simonecamerano](https://github.com/simonecamerano)

---

© 2026 IncluDO Project
