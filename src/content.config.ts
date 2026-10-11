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
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
