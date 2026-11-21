# Textwall

A live anonymous message wall: people post short messages and they appear on a shared board.

Live site: https://textwall.netlify.app

## Architecture

| Layer    | Tech                     | Hosted on |
|----------|--------------------------|-----------|
| Frontend | React + Vite (`frontend/`) | Netlify — builds `frontend`, publishes `dist` (see `netlify.toml`) |
| Backend  | Node + Express (`backend/server.js`) | Render — https://winter-les-arcs.onrender.com |
| Database | MongoDB (Mongoose)       | MongoDB Atlas |

### Environment variables
- **Netlify:** `VITE_API_URL` — backend URL (baked in at build time)
- **Render:** `MONGODB_URI` — MongoDB connection string. If the connection fails, the backend falls back to in-memory storage (lost on restart).

### API
- `GET /health` — health check
- `GET /messages` — all messages, newest first
- `POST /messages` — `{ "content": "..." }`
- `DELETE /dashboard_delete` — clear all messages (see `clear-messages.ps1` / `.sh`)

## Running locally

```bash
npm install          # root (concurrently)
npm run install-all  # frontend + backend deps
```

Create `backend/.env` with `MONGODB_URI=...` (optional — runs in-memory without it), and set `VITE_API_URL=http://localhost:3000` for the frontend (`project-env.ps1` does this on Windows).

```bash
npm run dev          # frontend on :5173, backend on :3000
```
