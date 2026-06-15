import { z } from "zod";

export const CreateBlogSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  image: z.string(),
  excerpt: z.string(),
  published: z.boolean(),
  publishedAt: z.string().nullable(),
  version: z.number().int(),
});

export const UpdateBlogSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  image: z.string().optional(),
  excerpt: z.string().optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().nullable(),
  version: z.number().int().optional(),
});

export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogSchema>;
