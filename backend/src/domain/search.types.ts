import { z } from "zod";

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
    const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
    const nums = parts.map((p) => Number(p)).filter((n) => Number.isFinite(n) && n > 0);
    return nums.length ? (nums as number[]) : undefined;
  });

export const SearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(96).default(24),
  sort: z
    .enum(["relevance", "newest", "price_asc", "price_desc"])
    .default("relevance"),

  // Stable filter contract (minor units = cents).
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),

  // Upstream-backed filters (captured from real XHR params).
  currency: z.string().trim().min(3).max(4).default("EUR"),
  catalogIds: IdsSchema,
  brandIds: IdsSchema,
  // Legacy: ungrouped size ids (kept for backwards compatibility).
  sizeIds: IdsSchema,
  // Grouped sizes as seen in Vinted web UI (e.g. size_ids_4[], size_ids_14[]).
  sizeIds4: IdsSchema,
  sizeIds14: IdsSchema,
  sizeIds7: IdsSchema, // chaussures femme
  sizeIds53: IdsSchema, // soutiens-gorge
  sizeIds64: IdsSchema, // ceintures femme
  sizeIds38: IdsSchema, // chaussures hommes
  sizeIds52: IdsSchema, // bagues
  sizeIds60: IdsSchema, // chapeaux adulte
  sizeIds61: IdsSchema, // gants adulte
  sizeIds62: IdsSchema, // montres
  sizeIds63: IdsSchema, // ceintures homme
  sizeIds73: IdsSchema, // chaussettes homme
  sizeIds74: IdsSchema, // chemises homme
  sizeIds75: IdsSchema, // vestes de costume homme
  sizeIds77: IdsSchema, // pantalons homme
  statusIds: IdsSchema,
  colorIds: IdsSchema,
  materialIds: IdsSchema,

  // Page-level filters (derived from item fields we can reliably normalize today).
  brand: z.string().trim().min(1).max(80).optional(),
  size: z.string().trim().min(1).max(40).optional(),
  condition: z.string().trim().min(1).max(80).optional()
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const SearchItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  price: z.object({
    minor: z.number().int().nonnegative(),
    currency: z.string()
  }),
  imageUrl: z.string().url().nullable(),
  url: z.string().url(),
  brand: z.string().nullable(),
  size: z.string().nullable(),
  condition: z.string().nullable(),
  createdAt: z.number().int().nonnegative().nullable().optional()
});

export type SearchItem = z.infer<typeof SearchItemSchema>;

export const SearchResponseSchema = z.object({
  items: z.array(SearchItemSchema),
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
  totalPages: z.number().int().nonnegative().nullable(),
  totalItems: z.number().int().nonnegative().nullable(),
  facets: z.object({
    brands: z.array(z.object({ value: z.string(), count: z.number().int().nonnegative() })),
    sizes: z.array(z.object({ value: z.string(), count: z.number().int().nonnegative() })),
    conditions: z.array(z.object({ value: z.string(), count: z.number().int().nonnegative() }))
  })
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;
