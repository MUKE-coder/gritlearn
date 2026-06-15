import { z } from "zod";

export const CreateProgressSchema = z.object({
  userId: z.string(),
  user: z.unknown(),
  conceptSlug: z.string(),
  status: z.string(),
  completedAt: z.string().nullable(),
  syncedAt: z.string().nullable(),
  version: z.number().int(),
});

export const UpdateProgressSchema = z.object({
  userId: z.string().optional(),
  user: z.unknown().optional(),
  conceptSlug: z.string().optional(),
  status: z.string().optional(),
  completedAt: z.string().nullable(),
  syncedAt: z.string().nullable(),
  version: z.number().int().optional(),
});

export type CreateProgressInput = z.infer<typeof CreateProgressSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
