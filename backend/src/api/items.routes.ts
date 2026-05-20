import { type FastifyInstance } from "fastify";
import { ItemDetailsSchema, ItemIdSchema } from "../domain/item.types.js";
import { type ItemService } from "../domain/item.service.js";

export async function registerItemsRoutes(
  app: FastifyInstance,
  deps: { itemService: ItemService }
) {
  app.get("/items/:id", async (req, reply) => {
    const idParsed = ItemIdSchema.safeParse((req.params as any)?.id);
    if (!idParsed.success) {
      return reply.code(400).send({ error: "BadRequest", message: "Invalid item id" });
    }

    try {
      const data = await deps.itemService.getItemDetailsByHtml(idParsed.data);
      return reply.send(ItemDetailsSchema.parse(data));
    } catch (err) {
      const upstreamStatus =
        err && typeof err === "object" && "upstreamStatus" in err
          ? (err as any).upstreamStatus
          : undefined;
      req.log.error({ err, upstreamStatus }, "Item details failed");
      return reply.code(502).send({
        error: "BadGateway",
        message: "Upstream request failed",
        upstreamStatus: typeof upstreamStatus === "number" ? upstreamStatus : null
      });
    }
  });
}

