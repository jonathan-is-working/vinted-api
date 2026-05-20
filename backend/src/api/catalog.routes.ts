import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { type CatalogService } from "../domain/catalog.service.js";
import { CatalogFiltersResponseSchema } from "../domain/catalog.types.js";

const IdsSchema = z
  .union([
    z.array(z.coerce.number().int().positive()),
    z.coerce.number().int().positive(),
    z.string()
  ])
  .optional()
  .transform((v) => {
    if (v == null) return undefined;
    if (Array.isArray(v)) return v;
    if (typeof v === "number") return [v];
    const s = v.trim();
    if (!s) return undefined;
    const nums = s
      .split(",")
      .map((p) => Number(p.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    return nums.length ? (nums as number[]) : undefined;
  });

const CatalogFiltersQuerySchema = z.object({
  q: z.string().optional(),
  currency: z.string().trim().min(3).max(4).default("EUR"),
  order: z.string().default("newest_first"),
  catalogIds: IdsSchema,
  sizeIds: IdsSchema,
  brandIds: IdsSchema,
  statusIds: IdsSchema,
  colorIds: IdsSchema,
  materialIds: IdsSchema
});

export async function registerCatalogRoutes(
  app: FastifyInstance,
  deps: { catalogService: CatalogService }
) {
  app.get("/catalog/filters", async (req, reply) => {
    const parsed = CatalogFiltersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid query parameters",
        issues: parsed.error.issues
      });
    }

    const data = await deps.catalogService.getFilters(parsed.data);
    return reply.send(CatalogFiltersResponseSchema.parse(data));
  });

  app.get("/catalog/categories", async (req, reply) => {
    const parsed = CatalogFiltersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid query parameters",
        issues: parsed.error.issues
      });
    }
    const data = await deps.catalogService.getFacetedCategories({
      currency: parsed.data.currency,
      catalogIds: parsed.data.catalogIds,
      sizeIds: parsed.data.sizeIds,
      brandIds: parsed.data.brandIds,
      statusIds: parsed.data.statusIds,
      colorIds: parsed.data.colorIds,
      materialIds: parsed.data.materialIds
    });
    return reply.send(data);
  });

  const CatalogFacetsQuerySchema = z.object({
    filterCode: z.enum(["brand", "size", "status", "color", "material"]),
    searchText: z.string().default(""),
    currency: z.string().trim().min(3).max(4).default("EUR"),
    catalogIds: IdsSchema,
    sizeIds: IdsSchema,
    brandIds: IdsSchema,
    statusIds: IdsSchema,
    colorIds: IdsSchema,
    materialIds: IdsSchema
  });

  app.get("/catalog/facets", async (req, reply) => {
    const parsed = CatalogFacetsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid query parameters",
        issues: parsed.error.issues
      });
    }
    const data = await deps.catalogService.getFilterFacets({
      filterCode: parsed.data.filterCode,
      searchText: parsed.data.searchText,
      currency: parsed.data.currency,
      catalogIds: parsed.data.catalogIds,
      sizeIds: parsed.data.sizeIds,
      brandIds: parsed.data.brandIds,
      statusIds: parsed.data.statusIds,
      colorIds: parsed.data.colorIds,
      materialIds: parsed.data.materialIds
    });
    return reply.send(data);
  });

  const CatalogOptionsQuerySchema = z.object({
    code: z.enum(["brand", "size", "status", "color", "material"]),
    q: z.string().default(""),
    currency: z.string().trim().min(3).max(4).default("EUR"),
    catalogIds: IdsSchema,
    sizeIds: IdsSchema,
    brandIds: IdsSchema,
    statusIds: IdsSchema,
    colorIds: IdsSchema,
    materialIds: IdsSchema
  });

  app.get("/catalog/options", async (req, reply) => {
    const parsed = CatalogOptionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "BadRequest",
        message: "Invalid query parameters",
        issues: parsed.error.issues
      });
    }
    const data = await deps.catalogService.searchOptions({
      code: parsed.data.code,
      q: parsed.data.q,
      currency: parsed.data.currency,
      catalogIds: parsed.data.catalogIds,
      sizeIds: parsed.data.sizeIds,
      brandIds: parsed.data.brandIds,
      statusIds: parsed.data.statusIds,
      colorIds: parsed.data.colorIds,
      materialIds: parsed.data.materialIds
    });
    return reply.send(data);
  });
}
