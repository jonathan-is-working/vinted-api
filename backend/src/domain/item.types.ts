import { z } from "zod";

export const ItemIdSchema = z.coerce.number().int().positive();

export const ItemDetailsSchema = z.object({
  id: z.number().int(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  url: z.string().url().nullable(),
  source: z.enum(["html_scrape"])
});

export type ItemDetails = z.infer<typeof ItemDetailsSchema>;

