import { z } from "zod";

export const CreateContentManifestSchema = z.object({
  version: z.number().int(),
  notes: z.string(),
  bundleUrl: z.string(),
  published: z.boolean(),
});

export const UpdateContentManifestSchema = z.object({
  version: z.number().int().optional(),
  notes: z.string().optional(),
  bundleUrl: z.string().optional(),
  published: z.boolean().optional(),
});

export type CreateContentManifestInput = z.infer<typeof CreateContentManifestSchema>;
export type UpdateContentManifestInput = z.infer<typeof UpdateContentManifestSchema>;
