import { z } from 'astro/zod';

export const canonicalIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase ASCII kebab-case.');

export const contentStatusSchema = z.enum(['planned', 'draft', 'review', 'published']);
export const coverageStatusSchema = z.enum(['covered', 'partial', 'planned', 'blocked']);
export const releaseTierSchema = z.enum(['preview', 'v1.0']);
export const levelSchema = z.enum(['foundation', 'intermediate', 'advanced']);
export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export const problemKindSchema = z.enum(['guided', 'independent']);

export const sourceSchema = z
  .object({
    title: z.string().min(1),
    url: z.url().refine((value) => value.startsWith('https://'), {
      message: 'Sources must use HTTPS.',
    }),
  })
  .strict();

const reviewFields = {
  author: z.string().min(1),
  editorialReviewer: z.string().min(1).optional(),
  technicalReviewer: z.string().min(1).optional(),
  lastReviewedAt: z.iso.date().optional(),
  reviewVersion: z.number().int().positive(),
};

export const trackSchema = z
  .object({
    id: canonicalIdSchema,
    titleVi: z.string().min(1),
    titleEn: z.string().min(1),
    audience: z.string().min(1),
    outcomes: z.array(z.string().min(1)).min(1),
    topicIds: z.array(canonicalIdSchema).min(1),
    status: contentStatusSchema,
  })
  .strict();

export const topicSchema = z
  .object({
    id: canonicalIdSchema,
    domain: canonicalIdSchema,
    titleVi: z.string().min(1),
    titleEn: z.string().min(1),
    aliases: z.array(z.string().min(1)).default([]),
    prerequisiteIds: z.array(canonicalIdSchema).default([]),
    lessonIds: z.array(canonicalIdSchema).min(1),
    problemIds: z.array(canonicalIdSchema).min(1),
    outcomes: z.array(z.string().min(1)).min(1),
    status: contentStatusSchema,
  })
  .strict();

export const lessonEvidenceSchema = z
  .object({
    workedExample: z.boolean(),
    accessibleTrace: z.boolean(),
    retrieval: z.boolean(),
    guidedPractice: z.boolean(),
    independentPractice: z.boolean(),
    summary: z.boolean(),
  })
  .strict();

export const lessonSchema = z
  .object({
    id: canonicalIdSchema,
    topicId: canonicalIdSchema,
    level: levelSchema,
    objectives: z.array(z.string().min(1)).min(1),
    prerequisiteIds: z.array(canonicalIdSchema).default([]),
    estimatedMinutes: z.number().int().positive(),
    concepts: z.array(canonicalIdSchema).min(1),
    patternIds: z.array(canonicalIdSchema).default([]),
    assessmentIds: z.array(canonicalIdSchema).min(1),
    problemIds: z.array(canonicalIdSchema).min(2),
    visualizerIds: z.array(canonicalIdSchema).default([]),
    codeLanguage: z.literal('typescript'),
    evidence: lessonEvidenceSchema,
    sources: z.array(sourceSchema).min(1),
    ...reviewFields,
    status: contentStatusSchema,
  })
  .strict();

export const problemSchema = z
  .object({
    id: canonicalIdSchema,
    topicIds: z.array(canonicalIdSchema).min(1),
    patternIds: z.array(canonicalIdSchema).min(1),
    kind: problemKindSchema,
    difficulty: difficultySchema,
    constraints: z.array(z.string().min(1)).min(1),
    hints: z.array(z.string().min(1)).min(1),
    solutionRef: z.string().min(1),
    language: z.literal('typescript'),
    source: sourceSchema,
    ...reviewFields,
    status: contentStatusSchema,
  })
  .strict();

const assessmentOptionSchema = z
  .object({
    id: canonicalIdSchema,
    label: z.string().min(1),
  })
  .strict();

export const assessmentSchema = z
  .object({
    id: canonicalIdSchema,
    lessonId: canonicalIdSchema,
    kind: z.enum(['single-choice', 'multiple-choice', 'short-answer', 'prediction']),
    prompt: z.string().min(1),
    options: z.array(assessmentOptionSchema).default([]),
    expected: z.array(z.string().min(1)).min(1),
    feedbackByMisconception: z.record(z.string(), z.string().min(1)),
    reviewable: z.boolean(),
    status: contentStatusSchema,
  })
  .strict();

export const glossarySchema = z
  .object({
    id: canonicalIdSchema,
    termVi: z.string().min(1),
    termEn: z.string().min(1),
    aliases: z.array(z.string().min(1)).default([]),
    definition: z.string().min(1),
    relatedTopicIds: z.array(canonicalIdSchema).default([]),
    status: contentStatusSchema,
  })
  .strict();

export const domainRequirementSchema = z
  .object({
    id: canonicalIdSchema,
    titleVi: z.string().min(1),
    mandatory: z.boolean(),
    requiredConcepts: z.array(canonicalIdSchema).min(1),
    blockedBy: z.array(canonicalIdSchema).default([]),
  })
  .strict();

export const patternRequirementSchema = z
  .object({
    id: canonicalIdSchema,
    titleVi: z.string().min(1),
    mandatory: z.boolean(),
  })
  .strict();

export const curriculumManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    defaultTier: releaseTierSchema,
    domains: z.array(domainRequirementSchema).min(1),
    patterns: z.array(patternRequirementSchema).min(1),
  })
  .strict();

export const redirectAliasSchema = z
  .object({
    from: canonicalIdSchema,
    to: canonicalIdSchema,
  })
  .strict();

export const tombstoneSchema = z
  .object({
    id: canonicalIdSchema,
    replacementId: canonicalIdSchema.optional(),
    reason: z.string().min(1),
  })
  .strict();

export const contentIdentitySchema = z
  .object({
    schemaVersion: z.literal(1),
    redirects: z.array(redirectAliasSchema).default([]),
    tombstones: z.array(tombstoneSchema).default([]),
  })
  .strict();
