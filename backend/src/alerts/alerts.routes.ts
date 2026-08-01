import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { CreateAlertBodySchema, UpdateAlertBodySchema } from "./alerts.types.js";
import { type AlertsService } from "./alerts.service.js";

const BackfillBodySchema = z.object({
  maxPages: z.coerce.number().int().min(1).max(200).default(20),
  perPage: z.coerce.number().int().min(1).max(96).default(96),
  since: z.coerce.number().int().nonnegative().optional()
});

export async function registerAlertsRoutes(
  app: FastifyInstance,
  deps: { alertsService: AlertsService }
) {
  app.get("/alerts", async () => deps.alertsService.listAlerts());

  app.get("/alerts/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const alert = await deps.alertsService.getAlert(id);
    if (!alert) return reply.code(404).send({ error: "NotFound" });
    return reply.send(alert);
  });

  app.post("/alerts", async (req, reply) => {
    const parsed = CreateAlertBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid request body",
        issues: parsed.error.issues
      });
    }
    const alert = await deps.alertsService.createAlert(parsed.data);
    return reply.code(201).send(alert);
  });

  app.patch("/alerts/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const alert = await deps.alertsService.getAlert(id);
    if (!alert) return reply.code(404).send({ error: "NotFound" });

    const parsed = UpdateAlertBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid request body",
        issues: parsed.error.issues
      });
    }
    const updated = await deps.alertsService.updateAlert(id, parsed.data);
    return reply.send(updated);
  });

  app.delete("/alerts/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const alert = await deps.alertsService.getAlert(id);
    if (!alert) return reply.code(404).send({ error: "NotFound" });
    await deps.alertsService.deleteAlert(id);
    return reply.send({ ok: true });
  });

  app.post("/alerts/:id/run", async (req, reply) => {
    const id = (req.params as any).id as string;
    const alert = await deps.alertsService.getAlert(id);
    if (!alert) return reply.code(404).send({ error: "NotFound" });
    const res = await deps.alertsService.runOnce(id);
    return reply.send(res);
  });

  app.post("/alerts/:id/backfill", async (req, reply) => {
    const id = (req.params as any).id as string;
    const alert = await deps.alertsService.getAlert(id);
    if (!alert) return reply.code(404).send({ error: "NotFound" });

    const parsed = BackfillBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid request body",
        issues: parsed.error.issues
      });
    }

    try {
      const res = await deps.alertsService.backfillFromApi({
        alertId: id,
        maxPages: parsed.data.maxPages,
        perPage: parsed.data.perPage,
        since: parsed.data.since
      });
      return reply.send({ ok: true, alertId: id, ...res });
    } catch (e) {
      const message = e instanceof Error ? e.message : "UnknownError";
      return reply.code(400).send({ error: "BadRequest", message });
    }
  });

  app.get("/alerts/:id/events", async (req, reply) => {
    const id = (req.params as any).id as string;
    const alert = await deps.alertsService.getAlert(id);
    if (!alert) return reply.code(404).send({ error: "NotFound" });
    const since = (req.query as any)?.since ? Number((req.query as any).since) : undefined;
    return reply.send({ events: await deps.alertsService.listEvents(id, since) });
  });

  app.get("/alerts/:id/stream", async (req, reply) => {
    const id = (req.params as any).id as string;
    const alert = await deps.alertsService.getAlert(id);
    if (!alert) return reply.code(404).send({ error: "NotFound" });

    // Keep the connection open for SSE.
    reply.hijack();
    const origin = (req.headers.origin as string | undefined) ?? "*";
    reply.raw.setHeader("access-control-allow-origin", origin);
    reply.raw.setHeader("vary", "origin");
    reply.raw.setHeader("content-type", "text/event-stream; charset=utf-8");
    reply.raw.setHeader("cache-control", "no-cache, no-transform");
    reply.raw.setHeader("connection", "keep-alive");
    // Avoid proxy buffering (nginx).
    reply.raw.setHeader("x-accel-buffering", "no");
    reply.raw.flushHeaders();

    const sinceQ = (req.query as any)?.since ? Number((req.query as any).since) : undefined;
    let lastSeen = Number.isFinite(sinceQ as number) ? (sinceQ as number) : 0;

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send("ready", { alertId: id });

    // Send existing backlog immediately so clients don't miss first-run events.
    const backlog = await deps.alertsService.listEvents(id, lastSeen);
    for (const ev of backlog) {
      send(ev.type, ev);
      lastSeen = Math.max(lastSeen, ev.createdAt);
    }

    // Heartbeat to prevent timeouts (CDNs / proxies / browser).
    const heartbeat = setInterval(() => {
      // SSE comment line
      reply.raw.write(`: ping ${Date.now()}\n\n`);
    }, 15_000);

    const timer = setInterval(() => {
      void (async () => {
        const events = await deps.alertsService.listEvents(id, lastSeen);
        for (const ev of events) {
          send(ev.type, ev);
          lastSeen = Math.max(lastSeen, ev.createdAt);
        }
      })();
    }, 1000);

    req.raw.on("close", () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    });

    return;
  });
}
