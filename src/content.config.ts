import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { BLOG_CATEGORY_IDS } from '@features/blog/model/categories';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(BLOG_CATEGORY_IDS),
      cover: image(),
      coverAlt: z.string(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      draft: z.boolean().default(false),
    }),
});

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date(),
  }),
});

export const collections = { blog, legal };
