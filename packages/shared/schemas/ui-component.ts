import { z } from "zod";

export const CreateUIComponentSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.string(),
  files: z.string(),
  dependencies: z.string(),
  registryDeps: z.string(),
  previewCode: z.string(),
  isPublic: z.boolean(),
});

export const UpdateUIComponentSchema = z.object({
  name: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  files: z.string().optional(),
  dependencies: z.string().optional(),
  registryDeps: z.string().optional(),
  previewCode: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type CreateUIComponentInput = z.infer<typeof CreateUIComponentSchema>;
export type UpdateUIComponentInput = z.infer<typeof UpdateUIComponentSchema>;
