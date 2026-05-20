import { type FastifyInstance } from "fastify";
import { SearchQuerySchema } from "../domain/search.types.js";
import { type LiveSearchService } from "../live/live-search.service.js";

export async function registerLiveRoutes(
  app: FastifyInstance,
  deps: { liveSearch: LiveSearchService }
) {
  // Subscribe to a search query and receive `item.new` events over SSE.
  // Contract matches alert stream events for frontend reuse.
  app.get("/search/stream", async (req, reply) => {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid query params",
        issues: parsed.error.issues
      });
    }

    reply.hijack();
    const origin = (req.headers.origin as string | undefined) ?? "*";
    reply.raw.setHeader("access-control-allow-origin", origin);
    reply.raw.setHeader("vary", "origin");
    reply.raw.setHeader("content-type", "text/event-stream; charset=utf-8");
    reply.raw.setHeader("cache-control", "no-cache, no-transform");
    reply.raw.setHeader("connection", "keep-alive");
    reply.raw.setHeader("x-accel-buffering", "no");
    reply.raw.flushHeaders();

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send("ready", { ok: true });

    const heartbeat = setInterval(() => {
      reply.raw.write(`: ping ${Date.now()}\n\n`);
    }, 15_000);

    const { unsubscribe } = deps.liveSearch.subscribe(parsed.data, {
      send,
      closed: () => req.raw.destroyed
    });

    req.raw.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });

    return;
  });
}
