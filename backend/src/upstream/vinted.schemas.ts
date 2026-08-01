import { z } from "zod";

export const VintedPriceSchema = z.object({
  amount: z.string(),
  currency_code: z.string()
});

export const VintedPhotoSchema = z.object({
  url: z.string().url(),
  is_main: z.boolean().optional()
});

export const VintedItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  url: z.string().url(),
  price: VintedPriceSchema,
  brand_title: z.string().optional(),
  size_title: z.string().optional(),
  status: z.string().optional(),
  created_at_ts: z.number().int().optional(),
  photo: z
    .object({
      url: z.string().url()
    })
    .optional(),
  photos: z.array(VintedPhotoSchema).optional()
});

export const VintedPaginationSchema = z.object({
  current_page: z.number().int(),
  total_pages: z.number().int(),
  total_entries: z.number().int(),
  per_page: z.number().int()
});

export const VintedCatalogItemsResponseSchema = z.object({
  items: z.array(VintedItemSchema),
  pagination: VintedPaginationSchema.optional()
});

export type VintedCatalogItemsResponse = z.infer<
  typeof VintedCatalogItemsResponseSchema
>;

// Catalog filters response (structure can evolve; we normalize what we need).
export const VintedCatalogFiltersResponseSchema = z
  .object({})
  .passthrough();

export type VintedCatalogFiltersResponse = z.infer<
  typeof VintedCatalogFiltersResponseSchema
>;

export const VintedFilterSearchResponseSchema = z.object({}).passthrough();
export type VintedFilterSearchResponse = z.infer<
  typeof VintedFilterSearchResponseSchema
>;

export const VintedBrandResponseSchema = z.object({}).passthrough();
export type VintedBrandResponse = z.infer<typeof VintedBrandResponseSchema>;

export const VintedFacetedCategoriesResponseSchema = z.object({}).passthrough();
export type VintedFacetedCategoriesResponse = z.infer<
  typeof VintedFacetedCategoriesResponseSchema
>;

export const VintedFilterFacetsResponseSchema = z.object({}).passthrough();
export type VintedFilterFacetsResponse = z.infer<
  typeof VintedFilterFacetsResponseSchema
>;
