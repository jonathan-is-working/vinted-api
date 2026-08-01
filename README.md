# Friply

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

## Telegram setup

Telegram is optional. The app sends new-item notifications for saved alerts and live query feeds to one configured Telegram chat.

### 1. Create the bot

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the prompts.
3. Copy the bot token returned by BotFather. Keep it secret; anyone with this token can control the bot.
4. Open a chat with the new bot and send `/start` (or any message).

### 2. Find the chat ID

With the bot token, query Telegram for updates:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates"
```

Copy `result[].message.chat.id` into `TELEGRAM_CHAT_ID`. For a group, add the bot to the group and send a message there first; group IDs are usually negative.

### 3. Configure the app

Add these variables to the root `.env` file used by Docker Compose:

```env
TELEGRAM_BOT_TOKEN=<token from BotFather>
TELEGRAM_CHAT_ID=<your chat ID>
TELEGRAM_ENABLE_COMMANDS=true
TELEGRAM_CLEAR_LIMIT=50
```

Restart the backend so it loads the variables:

```bash
docker compose up -d --build backend
```

Test the connection:

```bash
curl -X POST http://localhost:3000/v1/admin/telegram/test \
  -H 'content-type: application/json' \
  -d '{"text":"Telegram connected"}'
```

Available bot commands when `TELEGRAM_ENABLE_COMMANDS=true`:

- `/help` — list commands.
- `/ping` — test bot connectivity.
- `/status` — show the Vinted session status.
- `/alerts` — list saved alerts.
- `/clear [n]` — delete the last `n` bot messages, best effort.

### Telegram security and profiles

The app supports local Telegram profiles for per-alert routing. It still has one shared alerts database and one local management UI. The legacy global `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` configuration remains available as a fallback for alerts without a selected profile.

Therefore, do not give the current instance to several unrelated users: they would share the same alerts and could access the unauthenticated API. To support separate users today, run one isolated deployment per user with a separate `.env`, database, bot/chat configuration, and ideally separate host/API access.

### Local multi-profile mode

The UI now includes a `Telegram` button for local profile management. This is intended for an owner-hosted server: friends do not need access to the UI or API.

For each friend:

1. They create their own bot with `@BotFather` using `/newbot`.
2. They open the bot and send `/start`.
3. They call `https://api.telegram.org/bot<TOKEN>/getUpdates` and send you the value of `result[].message.chat.id`.
4. You create a profile in the UI and enter their name, bot token, and chat ID.
5. Select that profile before creating/arming their alert, then use `Tester` to verify delivery.

The alert stores its selected profile, so matching items are routed to that profile's bot. The bot token is stored by the local backend and is only returned to the UI in masked form. Keep the server and API bound to localhost or protect them with a private network/authentication before exposing them outside your machine.

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
