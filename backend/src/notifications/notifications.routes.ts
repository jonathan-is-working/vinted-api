import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { type NotificationsRepo } from "./notifications.repo.js";

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.coerce.number().int().positive().optional()
});

const StreamQuerySchema = z.object({
  since: z.coerce.number().int().nonnegative().optional(),
  sourceType: z.enum(["alert", "query"]).optional(),
  sourceKeys: z.string().trim().optional(),
  pollMs: z.coerce.number().int().min(250).max(10_000).default(1000)
});

export async function registerNotificationsRoutes(
  app: FastifyInstance,
  deps: { notifications: NotificationsRepo }
) {
  app.get("/notifications", async (req, reply) => {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid query parameters",
        issues: parsed.error.issues
      });
    }
    const res = await deps.notifications.list(parsed.data);
    return reply.send(res);
  });

  app.delete("/notifications", async (_req, reply) => {
    const deleted = await deps.notifications.deleteAll();
    return reply.send({ ok: true, deleted });
  });

  app.delete("/notifications/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const ok = await deps.notifications.deleteOne(id);
    if (!ok) return reply.code(404).send({ error: "NotFound" });
    return reply.send({ ok: true });
  });

  app.get("/notifications/stream", async (req, reply) => {
    const parsed = StreamQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid query parameters",
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

    const sourceKeys = parsed.data.sourceKeys
      ? parsed.data.sourceKeys
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    let cursor = typeof parsed.data.since === "number" ? parsed.data.since : Date.now();

    send("ready", { cursor });

    const heartbeat = setInterval(() => {
      reply.raw.write(`: ping ${Date.now()}\n\n`);
    }, 15_000);

    const timer = setInterval(() => {
      void (async () => {
        const batch = await deps.notifications.listAfter({
          limit: 250,
          since: cursor,
          sourceType: parsed.data.sourceType,
          sourceKeys
        });
        for (const n of batch.items) {
          const data = {
            id: n.id,
            alertId: n.sourceKey,
            type: "item.new",
            createdAt: n.createdAt,
            payload: n.item,
            sourceType: n.sourceType,
            sourceKey: n.sourceKey,
            itemId: n.itemId
          };
          send("item.new", data);
          cursor = Math.max(cursor, n.createdAt);
        }
      })();
    }, parsed.data.pollMs);

    req.raw.on("close", () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    });

    return;
  });
}
