import { type FastifyInstance } from "fastify";
import axios from "axios";
import { CreateTelegramProfileSchema } from "../telegram/profiles.types.js";
import { type TelegramProfilesRepo } from "../telegram/profiles.repo.js";
import { toPublicTelegramProfile } from "../telegram/profiles.types.js";

export async function registerTelegramProfilesRoutes(
  app: FastifyInstance,
  deps: { profiles: TelegramProfilesRepo }
) {
  app.get("/telegram-profiles", async () => {
    const profiles = await deps.profiles.list();
    return profiles.map(toPublicTelegramProfile);
  });

  app.post("/telegram-profiles", async (req, reply) => {
    const parsed = CreateTelegramProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "BadRequest", message: "Invalid Telegram profile", issues: parsed.error.issues });
    }
    const profile = await deps.profiles.create(parsed.data);
    return reply.code(201).send(toPublicTelegramProfile(profile));
  });

  app.post("/telegram-profiles/:id/test", async (req, reply) => {
    const profile = await deps.profiles.get((req.params as any).id as string);
    if (!profile) return reply.code(404).send({ error: "NotFound" });
    const text = ((req.body as any)?.text as string | undefined)?.trim() || "Telegram profile connected";
    const http = axios.create({ baseURL: `https://api.telegram.org/bot${profile.botToken}`, timeout: 10_000 });
    await http.post("/sendMessage", { chat_id: profile.chatId, text });
    return { ok: true };
  });

  app.delete("/telegram-profiles/:id", async (req, reply) => {
    const deleted = await deps.profiles.delete((req.params as any).id as string);
    if (!deleted) return reply.code(404).send({ error: "NotFound" });
    return { ok: true };
  });
}
