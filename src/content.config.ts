import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const shops = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/shops' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    image: z.string(),
    order: z.number(),
    orientationRequired: z.boolean(),
    equipment: z.array(z.string()),
  }),
});

export const collections = { shops };
