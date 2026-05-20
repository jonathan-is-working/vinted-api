import { z } from "zod";

export const VintedSessionSchema = z.object({
  createdAt: z.number().int(),
  // Headers used by upstream calls.
  headers: z.record(z.string(), z.string())
});

export type VintedSession = z.infer<typeof VintedSessionSchema>;

