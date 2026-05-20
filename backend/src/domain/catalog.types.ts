import { z } from "zod";

export const CatalogCategorySchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  parentId: z.number().int().positive().nullable()
});

export type CatalogCategory = z.infer<typeof CatalogCategorySchema>;

export const CatalogOptionSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  count: z.number().int().nonnegative().optional(),
  description: z.string().optional()
});

export type CatalogOption = z.infer<typeof CatalogOptionSchema>;

export const CatalogFiltersResponseSchema = z.object({
  categories: z.array(CatalogCategorySchema),
  brands: z.array(CatalogOptionSchema),
  sizes: z.array(CatalogOptionSchema),
  statuses: z.array(CatalogOptionSchema),
  colors: z.array(CatalogOptionSchema),
  materials: z.array(CatalogOptionSchema),
  filterDefinitions: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      displayType: z.string().nullable(),
      selectionType: z.string().nullable(),
      isLazy: z.boolean().default(false)
    })
  ),
  raw: z.unknown().optional()
});

export type CatalogFiltersResponse = z.infer<typeof CatalogFiltersResponseSchema>;
