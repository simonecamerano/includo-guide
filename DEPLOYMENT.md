# IncluDO Guide - Deployment & Operations Manual

### Enterprise-Grade Vocational Orientation Platform

This guide provides comprehensive instructions for deploying and maintaining the IncluDO project in a production environment. The architecture is designed for a **distributed cloud setup** (Frontend on Vercel, Backend self-hosted on DigitalOcean via Coolify) with a persistent RAG (Retrieval-Augmented Generation) infrastructure.

---

## 🏗️ Cloud Infrastructure Overview

- **Frontend**: React (Vite) deployed on **Vercel**.
- **Backend**: Node.js v22 (ESM) deployed in Docker via **Coolify** on **DigitalOcean**.
- **AI Engine**: OpenAI GPT-4o-mini & Text-Embedding-3-Small.
- **Monitoring**: Uptime Robot (via `/api/health` endpoint).

---

## 🟢 Backend Deployment (Coolify on DigitalOcean)

### 1. Preparation

Connect your GitHub repository to your **Coolify** instance and create a new application from the repository.

- **Build Pack**: Dockerfile
- **Branch**: `main`
- **Dockerfile Location**: `server/Dockerfile`
- **Base Directory / Build Context**: `server`
- **Exposed Port**: `3001`

### 2. Required Environment Variables

Configure these in Coolify for the backend service:

| Variable             | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | Anthropic API key, used for text generation only.       |
| `ADMIN_INGEST_TOKEN` | A secret string used to authorize data synchronization. |
| `PORT`               | Set to `3001` (default).                                |
| `NODE_ENV`           | Set to `production`.                                    |

### 3. Persistent Disk (Recommended)

By default, the `sessions.json` file is ephemeral and will be reset on every container restart or redeploy. For true production persistence, mount a **persistent volume** and configure `SESSIONS_DIR` to point to that mounted path.

---

## 🔵 Frontend Deployment (Vercel)

### 1. Project Setup

Import your repository into [Vercel](https://vercel.com).

- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2. Environment Variables

- **VITE_API_BASE**: The URL of your production backend (e.g., `https://api.your-domain.example/api`).

---

## 🔄 Data Synchronization (RAG Ingestion)

Once the backend is live, you must synchronize the local course catalog with the production vector database.

1. Ensure the `ADMIN_INGEST_TOKEN` is set on your production backend service in Coolify.
2. From your local development machine, run:

```bash
# Set the token and production URL
EXPORT ADMIN_INGEST_TOKEN=your_secret_token
EXPORT PRODUCTION_INGEST_URL=https://api.your-domain.example/api/admin/ingest

# Run the ingestion script
node server/scripts/seed_production.js
```

---

## 🛡️ Uptime & Monitoring Strategy

1. **Health Endpoint**: The server exposes a lightweight `GET /api/health` endpoint.
2. **Automated Ping**: Use a service like **Uptime Robot** or **Cron-job.org**.
   - **Type**: HTTP(s) Monitor.
   - **URL**: `https://api.your-domain.example/api/health`
   - **Interval**: 5 minutes.
3. **Benefit**: This gives you external availability checks and early warning if the backend becomes unhealthy.

---

## 🧪 Quality Assurance & Troubleshooting

### Running Tests

Before every deployment, ensure the full test suite passes locally:

```bash
cd server && npm test
cd ../client && npm test
```

### Common Issues

- **CORS Errors**: Ensure `VITE_API_BASE` in Vercel matches your production backend URL exactly.
- **401 Unauthorized during Seed**: Check that the `x-admin-token` header sent by `seed_production.js` matches the `ADMIN_INGEST_TOKEN` on the server.
- **Missing Embeddings**: If courses are visible but recommendations fail, re-run the Data Synchronization step.

---

&copy; 2026 IncluDO Project - _Engineering inclusive futures._
