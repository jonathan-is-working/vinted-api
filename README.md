# Vinted Search Proxy (Foundation)

Production-ready starter for a proxy API in front of Vinted’s internal search, plus a minimal UI to validate the end-to-end flow.

## Backend (Fastify + TypeScript)

From `backend/`:

```bash
# Recommended: Node 20 LTS (see `backend/.nvmrc`)
npm install
npm run playwright:install
cp .env.example .env
# Default mode uses Playwright to bootstrap an anonymous session automatically.
# If you want manual/static mode, set VINTED_SESSION_MODE=static and fill VINTED_* from curl.md.
npm run dev
```

API:

- `GET http://localhost:3000/v1/search?q=...&page=1&perPage=24&sort=relevance`
- `POST http://localhost:3000/v1/alerts` (saved search)
- `GET http://localhost:3000/v1/alerts/:id/stream` (SSE new items)
- `GET http://localhost:3000/v1/status/upstream` (session debug)
- `GET http://localhost:3000/v1/health`

Persistence:

- Alerts are stored in Postgres by default (`ALERTS_STORE=postgres`, `DATABASE_URL=...`).

Telegram notifications (optional):
- Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to receive a Telegram message for each new item (alerts + live query).
- Test quickly: `curl -X POST http://localhost:3000/v1/admin/telegram/test -H 'content-type: application/json' -d '{"text":"ping"}'`
- Resend missed notifications from the last 3 hours: `./scripts/resend-missed.sh 3`. It previews the pending count, then asks for confirmation. Use `--dry-run` to only inspect, or `--yes` for unattended execution.
- On Arch Linux, install the system-wide NetworkManager recovery cron with `sudo ./scripts/install-network-reconnect.sh`. It checks Internet and Telegram DNS every five minutes and reconnects disconnected interfaces when needed.
- Optional commands (polling): set `TELEGRAM_ENABLE_COMMANDS=true`. Then send `/clear` (or `/clear 100`) to delete the last bot messages (best-effort).
- Commands: `/help`, `/ping`, `/status`, `/alerts`, `/clear [n]`.

Performance notes:
- Alerts + Live Query use a fast path to emit new items ASAP (no fill-to-perPage scanning; Telegram sends are non-blocking).

Rate limit notes:
- If Vinted rate-limits you, tune: `VINTED_MIN_SPACING_MS`, `VINTED_MAX_CONCURRENCY`, `VINTED_COOLDOWN_ON_429_MS`, `LIVE_POLL_INTERVAL_MS`.

## Docker (backend + Postgres)

```bash
# Starts frontend (http://localhost:5173), backend (http://localhost:3000) and Postgres.
# Provide VINTED_* in your shell or via an env file.
docker compose up --build
```

Notes:
- Ports are bound to `127.0.0.1` (localhost-only) by default.
- The Docker frontend is a built/static UI (no hot reload). For dev, run the frontend locally (`frontend/` → `npm run dev`).
- If you see `getaddrinfo EAI_AGAIN www.vinted.fr` in Docker, it's usually a DNS resolver issue. The compose files pin DNS to `1.1.1.1`/`8.8.8.8` for the backend.

## Docker Dev (hot reload)

Hot reload for both backend (tsx watch) and frontend (Vite HMR):

```bash
./dev.sh
```

## Frontend (React + TypeScript)

From `frontend/`:

```bash
npm install
npm run dev
```

By default it calls `http://localhost:3000`. Override with:

```bash
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

UI notes:
- No external font/icon CDNs (system fonts + inline SVG icons) to avoid extra network requests.
- No client-side caching: refreshes always hit the API for the latest data.
