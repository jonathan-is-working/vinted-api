import { type FastifyInstance } from "fastify";
import { SearchQuerySchema, SearchResponseSchema } from "../domain/search.types.js";
import { type SearchService } from "../domain/search.service.js";
import { z } from "zod";

export async function registerSearchRoute(
  app: FastifyInstance,
  deps: { searchService: SearchService }
) {
  app.get("/search", async (req, reply) => {
    const WithOptsSchema = SearchQuerySchema.extend({
      // For raw search endpoint, default to max responsiveness (1 upstream call).
      // If you want stable page sizes while using strict size filters, pass fill=1.
      fill: z
        .enum(["0", "1", "true", "false"])
        .optional()
        .transform((v) => (v == null ? false : v === "1" || v === "true"))
    });
    const parsed = WithOptsSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid query parameters",
        issues: parsed.error.issues
      });
    }

    try {
      const { fill, ...query } = parsed.data as any;
      const data = await deps.searchService.search(query, { fillToPerPage: !!fill });
      // Ensure the contract remains stable even if upstream changes.
      const safe = SearchResponseSchema.parse(data);
      return reply.send(safe);
    } catch (err) {
      const upstreamStatus =
        err && typeof err === "object" && "upstreamStatus" in err
          ? (err as any).upstreamStatus
          : undefined;

      req.log.error(
        { err, upstreamStatus },
        "Search failed while calling upstream"
      );

      return reply.code(502).send({
        error: "BadGateway",
        message: "Upstream request failed",
        upstreamStatus: typeof upstreamStatus === "number" ? upstreamStatus : null
      });
    }
  });
}
