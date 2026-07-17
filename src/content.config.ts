import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  assessmentSchema,
  glossarySchema,
  lessonSchema,
  problemSchema,
  topicSchema,
  trackSchema,
} from './lib/content/schemas';

function canonicalId({ data, entry }: { data: Record<string, unknown>; entry: string }) {
  if (typeof data.id !== 'string' || data.id.length === 0) {
    throw new Error(`${entry}: frontmatter/data field "id" is required and is the canonical ID.`);
  }
  return data.id;
}

const tracks = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/content/tracks',
    generateId: canonicalId,
  }),
  schema: trackSchema,
});

const topics = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/content/topics',
    generateId: canonicalId,
  }),
  schema: topicSchema,
});

const lessons = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/lessons',
    generateId: canonicalId,
  }),
  schema: lessonSchema,
});

const problems = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/problems',
    generateId: canonicalId,
  }),
  schema: problemSchema,
});

const assessments = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/content/assessments',
    generateId: canonicalId,
  }),
  schema: assessmentSchema,
});

const glossary = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/content/glossary',
    generateId: canonicalId,
  }),
  schema: glossarySchema,
});

export const collections = { tracks, topics, lessons, problems, assessments, glossary };
