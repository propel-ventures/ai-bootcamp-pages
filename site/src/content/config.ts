import { defineCollection, z } from 'astro:content';

const modulesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    course: z.number(),
    module: z.number(),
    description: z.string(),
    objectives: z.array(z.string()),
    resources: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        type: z.enum(['docs', 'video', 'repo', 'article']).optional(),
      })
    ).optional(),
    quiz: z.array(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        answer: z.number(),
      })
    ).optional(),
  }),
});

export const collections = {
  modules: modulesCollection,
};
