import { type FastifyInstance } from "fastify";
import { type VintedSessionManager } from "../session/session.manager.js";

export async function registerUpstreamStatusRoutes(
  app: FastifyInstance,
  deps: { sessions: VintedSessionManager }
) {
  app.get("/status/upstream", async () => {
    const meta = deps.sessions.getMeta();
    return {
      session: {
        mode: meta.mode,
        hasSession: meta.hasSession,
        createdAt: meta.createdAt,
        lastRefreshAt: meta.lastRefreshAt,
        lastRefreshReason: meta.lastRefreshReason,
        lastErrorAt: meta.lastErrorAt,
        lastError: meta.lastError
      }
    };
  });

  app.post("/admin/session/refresh", async () => {
    await deps.sessions.getSession({ forceRefresh: true, reason: "manual" });
    return { ok: true };
  });
}

