import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { type TelegramNotifier } from "../integrations/telegram/telegram.notifier.js";

const TestBodySchema = z.object({
  text: z.string().trim().min(1).max(400).default("Test notification from vinted-api")
});

export async function registerTelegramRoutes(
  app: FastifyInstance,
  deps: { telegram: TelegramNotifier }
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
}
