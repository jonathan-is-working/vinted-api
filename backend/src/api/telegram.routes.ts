import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { type TelegramNotifier } from "../integrations/telegram/telegram.notifier.js";
import { type NotificationsRepo } from "../notifications/notifications.repo.js";
import { type SearchItem } from "../domain/search.types.js";

const TestBodySchema = z.object({
  text: z.string().trim().min(1).max(400).default("Test notification from vinted-api")
});

const ResendBodySchema = z.object({
  since: z.coerce.number().int().nonnegative(),
  until: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(1000),
  dryRun: z.boolean().optional().default(false)
});

export async function registerTelegramRoutes(
  app: FastifyInstance,
  deps: { telegram: TelegramNotifier; notifications?: NotificationsRepo }
) {
  app.get("/status/telegram", async () => {
    return { enabled: true };
  });

  // Local convenience endpoint. Only registered when Telegram env vars are set.
  app.post("/admin/telegram/test", async (req, reply) => {
    const parsed = TestBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid body",
        issues: parsed.error.issues
      });
    }

    await deps.telegram.notifyNewItem({
      sourceType: "alert",
      sourceKey: "test",
      item: {
        id: 0,
        title: parsed.data.text,
        price: { minor: 0, currency: "EUR" },
        imageUrl: null,
        url: "http://localhost",
        brand: null,
        size: null,
        condition: null
      }
    });

    return reply.send({ ok: true });
  });

  app.post("/admin/telegram/resend-missed", async (req, reply) => {
    if (!deps.notifications) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Notifications repository is not available"
      });
    }

    const parsed = ResendBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid body",
        issues: parsed.error.issues
      });
    }

    const { since, until, dryRun } = parsed.data;
    const maxToProcess = parsed.data.limit;
    const batchSize = 250;

    let cursor: number | undefined;
    let scanned = 0;
    let sent = 0;
    let failed = 0;
    let processed = 0;

    while (processed < maxToProcess) {
      const remaining = maxToProcess - processed;
      const batch = await deps.notifications.listPendingTelegram({
        since,
        until,
        cursor,
        limit: Math.min(batchSize, remaining)
      });
      if (!batch.items.length) break;

      scanned += batch.items.length;
      for (const row of batch.items) {
        processed += 1;
        cursor = row.createdAt;

        if (dryRun) continue;

        const messageId = await deps.telegram.notifyNewItem({
          sourceType: row.sourceType,
          sourceKey: row.sourceKey,
          item: row.item as SearchItem
        });
        if (typeof messageId === "number") {
          await deps.notifications.setTelegramMessageId(row.id, messageId);
          sent += 1;
        } else {
          failed += 1;
        }
      }

      if (!batch.nextCursor) break;
    }

    return reply.send({
      ok: true,
      dryRun,
      since,
      until: until ?? null,
      scanned,
      processed,
      sent,
      failed
    });
  });
}
