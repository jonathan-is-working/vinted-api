import { z } from "zod";
import { SearchQuerySchema } from "../domain/search.types.js";

export const AlertIdSchema = z.string().min(8);

export const CreateAlertBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  query: SearchQuerySchema.omit({ page: true }).extend({
    // For alerts we always track "newest" to catch new items quickly.
    sort: z.literal("newest").default("newest")
  }),
  pollIntervalSeconds: z.coerce.number().int().min(15).max(3600).default(60)
});

export type CreateAlertBody = z.infer<typeof CreateAlertBodySchema>;

export const UpdateAlertBodySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  query: CreateAlertBodySchema.shape.query.optional(),
  pollIntervalSeconds: z.coerce.number().int().min(15).max(3600).optional(),
  enabled: z.boolean().optional()
});

export type UpdateAlertBody = z.infer<typeof UpdateAlertBodySchema>;

export const AlertSchema = z.object({
  id: AlertIdSchema,
  name: z.string(),
  query: CreateAlertBodySchema.shape.query,
  pollIntervalSeconds: z.number().int(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  lastRunAt: z.number().int().nullable(),
  lastError: z.string().nullable(),
  enabled: z.boolean().default(true)
});

export type Alert = z.infer<typeof AlertSchema>;

export const AlertEventSchema = z.object({
  id: z.string(),
  alertId: AlertIdSchema,
  type: z.enum(["item.new", "alert.error"]),
  createdAt: z.number().int(),
  payload: z.unknown()
});

export type AlertEvent = z.infer<typeof AlertEventSchema>;
