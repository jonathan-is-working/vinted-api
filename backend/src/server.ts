import Fastify from "fastify";
import cors from "@fastify/cors";
import { getEnv } from "./config/env.js";
import { VintedClient } from "./upstream/vinted.client.js";
import { SearchService } from "./domain/search.service.js";
import { VintedSessionManager } from "./session/session.manager.js";
import { AlertsStore } from "./alerts/alerts.store.js";
import { AlertsService } from "./alerts/alerts.service.js";
import { registerV1Routes } from "./api/v1.routes.js";
import { CatalogService } from "./domain/catalog.service.js";
import { ItemService } from "./domain/item.service.js";
import { AsyncMemoryAlertsStore } from "./alerts/alerts.store.memory.async.js";
import { PostgresAlertsStore } from "./alerts/alerts.store.postgres.js";
import { createPgPool, migratePg } from "./db/postgres.js";
import { LiveSearchService } from "./live/live-search.service.js";
import { NotificationsRepo } from "./notifications/notifications.repo.js";
import { TelegramNotifier } from "./integrations/telegram/telegram.notifier.js";
import { TelegramCommandPoller } from "./integrations/telegram/telegram.commands.js";

const env = getEnv();

const app = Fastify({
  logger: true
});
let telegramCommandPoller: TelegramCommandPoller | undefined;

await app.register(cors, {
  origin: true
});

const sessions = new VintedSessionManager(env);
const vinted = new VintedClient(env, sessions);
const searchService = new SearchService(vinted, env);

const alertsStore =
  env.ALERTS_STORE === "postgres"
    ? (() => {
        const pool = createPgPool(env.DATABASE_URL);
        return { store: new PostgresAlertsStore(pool), pool };
      })()
    : { store: new AsyncMemoryAlertsStore(new AlertsStore()), pool: null as any };
if (env.ALERTS_STORE === "postgres") {
  await migratePg(alertsStore.pool);
}

const notifications =
  env.ALERTS_STORE === "postgres"
    ? new NotificationsRepo(alertsStore.pool)
    : null;

if (notifications) {
  await notifications.migrate();
}

const telegram =
  env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID
    ? new TelegramNotifier({ botToken: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID })
    : undefined;

const alertsService = new AlertsService(
  alertsStore.store,
  searchService,
  notifications ?? undefined,
  telegram
);

if (telegram && env.TELEGRAM_ENABLE_COMMANDS && notifications) {
  telegramCommandPoller = new TelegramCommandPoller(
    { botToken: env.TELEGRAM_BOT_TOKEN!, chatId: env.TELEGRAM_CHAT_ID! },
    notifications,
    { clearLimit: env.TELEGRAM_CLEAR_LIMIT, sessions, alertsService }
  );
  telegramCommandPoller.start();
}
const catalogService = new CatalogService(vinted, env);
const itemService = new ItemService(vinted);
const liveSearch = new LiveSearchService(searchService, notifications ?? undefined, telegram, env);

await registerV1Routes(app, {
  searchService,
  alertsService,
  liveSearch,
  notifications,
  telegram,
  sessions,
  catalogService,
  itemService,
  healthcheck: async () => {
    if (env.ALERTS_STORE !== "postgres") return true;
    try {
      await alertsStore.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
alertsService.startAll();

await app.listen({ port: env.PORT, host: env.HOST });

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "Shutting down");
  try {
    telegramCommandPoller?.stop();
    await app.close();
    if (env.ALERTS_STORE === "postgres") {
      await alertsStore.pool.end();
    }
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, "Shutdown failed");
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
