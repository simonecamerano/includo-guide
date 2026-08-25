# IncluDO Guide - Deployment & Operations Manual

### Enterprise-Grade Vocational Orientation Platform

This guide provides comprehensive instructions for deploying and maintaining the IncluDO project in a production environment. Pages and API are served by a **single container on the project's own infrastructure**, on one domain: no external service delivers the site to visitors, and the RAG index is built without calling any provider.

---

## 🏗️ Cloud Infrastructure Overview

- **Frontend**: React (Vite), compiled at build time and served by the backend itself from `public/`.
- **Backend**: Node.js v22 (ESM) in Docker via **Coolify** on **Hetzner**. Pages on the root, API under `/api`, same origin, so CORS is not needed.
- **Generation**: Anthropic `claude-haiku-4-5`, the only external provider in use.
- **Embeddings**: `multilingual-e5-small` running in-process through ONNX Runtime. No API key, no outbound call: the text of a visitor's question never leaves the server.
- **Monitoring**: uptime monitor on the `/api/health` endpoint.

---

## 🟢 Deployment (Coolify on Hetzner)

### 1. Preparation

Connect your GitHub repository to your **Coolify** instance and create a new application from the repository.

- **Build Pack**: Dockerfile
- **Branch**: `main`
- **Dockerfile Location**: `Dockerfile` (repository root)
- **Base Directory / Build Context**: `/` — **not** `server`. The build needs both
  `client/` and `server/`: the first stage compiles the frontend, the second copies
  the result into the backend's `public/`.
- **Exposed Port**: `3001`

The build downloads the embedding model weights into the image, so it takes longer
than a plain Node build and produces an image of roughly 600 MB.

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

## 🔵 Frontend

There is no separate frontend deployment. The root `Dockerfile` compiles `client/`
in its first stage and copies `dist/` into the backend's `public/`, which Express
serves on the root path with an SPA fallback for deep links.

In the built application the client calls `/api` on the origin that served the
page, so nothing has to be configured. `VITE_API_BASE` remains available as an
override for a setup that splits the two again; in local development, where Vite
serves the client on its own port, it defaults to `http://localhost:3001/api`.

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

- **Pages return 404 but `/api/health` works**: the image was built with Base
  Directory `server` instead of `/`, so `public/` is missing. Rebuild with the
  root `Dockerfile`.
- **`vite: not found` during build**: Coolify injects `NODE_ENV=production` as a
  build ARG. The frontend stage uses `npm ci --include=dev` for exactly this
  reason; do not remove the flag.
- **`ERR_DLOPEN_FAILED` looking for `ld-linux-x86-64.so.2`**: the base image was
  switched to Alpine. `onnxruntime-node` has no musl build; stay on `node:22-slim`.
- **401 Unauthorized during Seed**: Check that the `x-admin-token` header sent by `seed_production.js` matches the `ADMIN_INGEST_TOKEN` on the server.
- **Missing Embeddings**: If courses are visible but recommendations fail, re-run the Data Synchronization step.

---

&copy; 2026 IncluDO Project - _Engineering inclusive futures._
