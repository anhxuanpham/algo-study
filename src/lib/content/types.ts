import type { z } from 'astro/zod';
import type {
  assessmentSchema,
  contentIdentitySchema,
  curriculumManifestSchema,
  glossarySchema,
  lessonSchema,
  problemSchema,
  topicSchema,
  trackSchema,
} from './schemas';

export type Track = z.infer<typeof trackSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Problem = z.infer<typeof problemSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type GlossaryEntry = z.infer<typeof glossarySchema>;
export type CurriculumManifest = z.infer<typeof curriculumManifestSchema>;
export type ContentIdentity = z.infer<typeof contentIdentitySchema>;

export type CollectionName =
  'tracks' | 'topics' | 'lessons' | 'problems' | 'assessments' | 'glossary';

export type CollectionValueMap = {
  tracks: Track;
  topics: Topic;
  lessons: Lesson;
  problems: Problem;
  assessments: Assessment;
  glossary: GlossaryEntry;
};

export type SourceEntry<K extends CollectionName = CollectionName> = {
  collection: K;
  id: string;
  sourcePath: string;
  data: CollectionValueMap[K];
  body?: string;
};

export type ContentModel = {
  tracks: SourceEntry<'tracks'>[];
  topics: SourceEntry<'topics'>[];
  lessons: SourceEntry<'lessons'>[];
  problems: SourceEntry<'problems'>[];
  assessments: SourceEntry<'assessments'>[];
  glossary: SourceEntry<'glossary'>[];
  manifest: CurriculumManifest;
  identity: ContentIdentity;
};

export type ValidationIssue = {
  code: string;
  message: string;
  sourcePath?: string;
  id?: string;
  recovery: string;
};

export type ValidationResult = {
  issues: ValidationIssue[];
  coverage: CoverageReport;
};

export type CoverageItem = {
  id: string;
  titleVi: string;
  mandatory: boolean;
  status: 'covered' | 'partial' | 'planned' | 'blocked';
  evidence: string[];
  gaps: string[];
};

export type CoverageReport = {
  tier: 'preview' | 'v1.0';
  domains: CoverageItem[];
  patterns: CoverageItem[];
  summary: Record<'covered' | 'partial' | 'planned' | 'blocked', number>;
};
