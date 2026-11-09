<div align="center">

# 🛍️ Friply (`vinted-api`)

**Fast proxy API & live monitor for Vinted catalog search with instant Telegram alerts.**  
_A local-first, rate-limited Fastify proxy in TypeScript with Playwright session recovery and a clean React inspector._

[![CI](https://img.shields.io/github/actions/workflow/status/jonathan-is-working/vinted-api/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/jonathan-is-working/vinted-api/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6%2B-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-v4-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20Apache--2.0-blue?style=for-the-badge)](#-license)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)](#-docker)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-telegram-alerts">Telegram</a> •
  <a href="#-docker">Docker</a> •
  <a href="#%EF%B8%8F-disclaimer">Disclaimer</a> •
  <a href="#-license">License</a>
</p>

</div>

---

## ⚠️ Disclaimer

> [!WARNING]
> **This is an unofficial, community-driven tool.** It is **not** affiliated with, authorized, maintained, sponsored, or endorsed by Vinted, UAB or any of its affiliates. Use this tool at your own risk. It is intended strictly for personal, research, and educational purposes. Always respect fair-use limits and applicable terms of service.

---

## ✨ Features

- **Automated session bootstrap**: Uses headless Playwright to negotiate anonymous session cookies and CSRF tokens automatically—no manual browser cookie dumping needed.
- **Throttling & anti-ban protection**: Built-in token-bucket rate limiter, spacing controls (`VINTED_MIN_SPACING_MS`), and automatic backoff on 429 status codes.
- **Persistent alert monitors**: Store searches in PostgreSQL or in-memory, polling periodically for newly listed items.
- **Instant Telegram notifications**: Real-time push alerts formatted with item titles, prices, pictures, brand info, and direct links.
- **Multi-profile Telegram routing**: Support multiple independent Telegram bots/chats with masked token storage in PostgreSQL.
- **Real-time Server-Sent Events (SSE)**: Live streaming endpoint for new items directly to frontend applications.
- **Full Docker & Observability stack**: Pre-configured Docker Compose with PostgreSQL, plus optional Grafana + Loki + Promtail logging stack.

---

## 🚀 Quick Start

### Local Development (Node.js 20+)

```bash
# 1. Clone the repository
git clone https://github.com/jonathan-is-working/vinted-api.git && cd vinted-api

# 2. Setup Backend
cd backend
npm install
npm run playwright:install
cp .env.example .env
npm run dev

# 3. Setup Frontend (in another terminal)
cd ../frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3000`.

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/v1/search?q=...&page=1&perPage=24&sort=relevance` | Query Vinted catalog items with filter options |
| `POST` | `/v1/alerts` | Create a saved search alert for polling |
| `GET` | `/v1/alerts` | List all configured search alerts |
| `GET` | `/v1/alerts/:id/stream` | Real-time SSE stream of incoming new items |
| `GET` | `/v1/status/upstream` | Check Vinted session health and upstream cookies |
| `GET` | `/v1/health` | Service health status check |
| `POST` | `/v1/admin/telegram/test` | Test Telegram bot connectivity |

---

## 📱 Telegram Alerts

Telegram alerts notify you the second a new item matching your search criteria is listed.

### 1. Create a Bot & Get Chat ID
1. Chat with `@BotFather` on Telegram, send `/newbot`, and copy the bot token.
2. Start a chat with your bot and send any message (e.g. `/start`).
3. Query Telegram updates to find your `chat.id`:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
   ```

### 2. Configure Environment
Add credentials to your root `.env` or `backend/.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_CHAT_ID=123456789
TELEGRAM_DEFAULT_PROFILE_NAME=Default
TELEGRAM_ENABLE_COMMANDS=true
```

### 3. Multi-profile Mode
Friply supports routing distinct alerts to different friends' Telegram bots. Open the web UI, click **Telegram Profiles**, and add individual profiles without exposing raw bot tokens.

---

## 🐳 Docker

Start the full production-ready stack (Frontend + Backend + PostgreSQL) bound to `127.0.0.1`:

```bash
# 1. Prepare environment variables
cp .env.example .env

# 2. Start all services
docker compose up --build -d
```

---

## 🤝 Contributing

Issues and PRs are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

---

## 📜 License

Dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option.

<div align="center">
  <sub>Built with TypeScript, Fastify, React and Playwright. If this project helps you, consider starring the repository.</sub>
</div>
