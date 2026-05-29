import { type FastifyInstance } from "fastify";
import { registerSearchRoute } from "./search.route.js";
import { type SearchService } from "../domain/search.service.js";
import { registerAlertsRoutes } from "../alerts/alerts.routes.js";
import { type AlertsService } from "../alerts/alerts.service.js";
import { registerUpstreamStatusRoutes } from "./v1.upstream.routes.js";
import { type VintedSessionManager } from "../session/session.manager.js";
import { registerCatalogRoutes } from "./catalog.routes.js";
import { type CatalogService } from "../domain/catalog.service.js";
import { registerItemsRoutes } from "./items.routes.js";
import { type ItemService } from "../domain/item.service.js";
import { registerLiveRoutes } from "./live.routes.js";
import { type LiveSearchService } from "../live/live-search.service.js";
import { registerNotificationsRoutes } from "../notifications/notifications.routes.js";
import { type NotificationsRepo } from "../notifications/notifications.repo.js";
import { registerTelegramRoutes } from "./telegram.routes.js";
import { type TelegramNotifier } from "../integrations/telegram/telegram.notifier.js";

export async function registerV1Routes(
  app: FastifyInstance,
  deps: {
    searchService: SearchService;
    alertsService: AlertsService;
    liveSearch: LiveSearchService;
    notifications?: NotificationsRepo | null;
    telegram?: TelegramNotifier;
    sessions: VintedSessionManager;
    catalogService: CatalogService;
    itemService: ItemService;
    healthcheck?: () => Promise<boolean>;
  }
) {
  // Stable API surface.
  await app.register(async (v1) => {
    v1.get("/health", async (_req, reply) => {
      const ok = deps.healthcheck ? await deps.healthcheck() : true;
      if (!ok) {
        return reply.code(503).send({ ok: false });
      }
      return { ok: true };
    });
    await registerSearchRoute(v1, { searchService: deps.searchService });
    await registerAlertsRoutes(v1, { alertsService: deps.alertsService });
    await registerLiveRoutes(v1, { liveSearch: deps.liveSearch });
    if (deps.notifications) {
      await registerNotificationsRoutes(v1, { notifications: deps.notifications });
    }
    if (deps.telegram) {
      await registerTelegramRoutes(v1, { telegram: deps.telegram });
    }
    await registerUpstreamStatusRoutes(v1, { sessions: deps.sessions });
    await registerCatalogRoutes(v1, { catalogService: deps.catalogService });
    await registerItemsRoutes(v1, { itemService: deps.itemService });
  }, { prefix: "/v1" });

  // Back-compat for earlier PoC.
  await registerSearchRoute(app, { searchService: deps.searchService });
  app.get("/health", async (_req, reply) => {
    const ok = deps.healthcheck ? await deps.healthcheck() : true;
    if (!ok) {
      return reply.code(503).send({ ok: false });
    }
    return { ok: true };
  });
}
