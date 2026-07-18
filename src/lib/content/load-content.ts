import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import type { z } from 'astro/zod';
import {
  assessmentSchema,
  contentIdentitySchema,
  curriculumManifestSchema,
  glossarySchema,
  lessonSchema,
  problemSchema,
  topicSchema,
  trackSchema,
} from './schemas';
import type {
  CollectionName,
  CollectionValueMap,
  ContentModel,
  SourceEntry,
  ValidationIssue,
} from './types';

const schemas = {
  tracks: trackSchema,
  topics: topicSchema,
  lessons: lessonSchema,
  problems: problemSchema,
  assessments: assessmentSchema,
  glossary: glossarySchema,
} satisfies Record<CollectionName, z.ZodType>;

export class ContentLoadError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super(`${issues.length} content load error(s).`);
    this.name = 'ContentLoadError';
  }
}

export async function loadContentModel(root: string): Promise<ContentModel> {
  const contentRoot = path.join(root, 'src/content');
  const issues: ValidationIssue[] = [];
  const collections = {
    tracks: await loadCollection('tracks', contentRoot, issues),
    topics: await loadCollection('topics', contentRoot, issues),
    lessons: await loadCollection('lessons', contentRoot, issues),
    problems: await loadCollection('problems', contentRoot, issues),
    assessments: await loadCollection('assessments', contentRoot, issues),
    glossary: await loadCollection('glossary', contentRoot, issues),
  };

  const manifest = await loadDataFile(
    path.join(root, 'src/data/curriculum-manifest.yaml'),
    curriculumManifestSchema,
    issues,
  );
  const identity = await loadDataFile(
    path.join(root, 'src/data/content-identity.yaml'),
    contentIdentitySchema,
    issues,
  );

  if (issues.length > 0 || !manifest || !identity) {
    throw new ContentLoadError(sortIssues(issues));
  }

  return { ...collections, manifest, identity };
}

async function loadCollection<K extends CollectionName>(
  collection: K,
  contentRoot: string,
  issues: ValidationIssue[],
): Promise<SourceEntry<K>[]> {
  const directory = path.join(contentRoot, collection);
  const files = await walkFiles(directory);
  const entries: SourceEntry<K>[] = [];

  for (const sourcePath of files) {
    try {
      const extension = path.extname(sourcePath).toLowerCase();
      const contents = await fs.readFile(sourcePath, 'utf8');
      const parsed =
        extension === '.md' || extension === '.mdx'
          ? matter(contents)
          : { data: parseYaml(contents), content: undefined };
      const result = schemas[collection].safeParse(parsed.data);

      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({
            code: 'SCHEMA_INVALID',
            message: `${issue.path.join('.') || '<root>'}: ${issue.message}`,
            sourcePath,
            id: typeof parsed.data?.id === 'string' ? parsed.data.id : undefined,
            recovery: 'Fix the field to match the collection schema.',
          });
        }
        continue;
      }

      const data = result.data as CollectionValueMap[K];
      entries.push({
        collection,
        id: data.id,
        sourcePath,
        data,
        ...(parsed.content === undefined ? {} : { body: parsed.content }),
      });
    } catch (error) {
      issues.push({
        code: 'SOURCE_PARSE_FAILED',
        message: error instanceof Error ? error.message : String(error),
        sourcePath,
        recovery: 'Fix YAML/MDX syntax and rerun content validation.',
      });
    }
  }

  return entries.sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

async function loadDataFile<T>(
  sourcePath: string,
  schema: z.ZodType<T>,
  issues: ValidationIssue[],
): Promise<T | undefined> {
  try {
    const contents = await fs.readFile(sourcePath, 'utf8');
    const result = schema.safeParse(parseYaml(contents));
    if (result.success) return result.data;

    for (const issue of result.error.issues) {
      issues.push({
        code: 'SCHEMA_INVALID',
        message: `${issue.path.join('.') || '<root>'}: ${issue.message}`,
        sourcePath,
        recovery: 'Fix the data file to match its schema.',
      });
    }
  } catch (error) {
    issues.push({
      code: 'SOURCE_PARSE_FAILED',
      message: error instanceof Error ? error.message : String(error),
      sourcePath,
      recovery: 'Create or repair the required data file.',
    });
  }
  return undefined;
}

async function walkFiles(directory: string): Promise<string[]> {
  const entries = await fs
    .readdir(directory, { withFileTypes: true })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
  const paths: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
    const sourcePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      paths.push(...(await walkFiles(sourcePath)));
    } else if (/\.(?:md|mdx|ya?ml)$/i.test(entry.name)) {
      paths.push(sourcePath);
    }
  }

  return paths;
}

function sortIssues(issues: ValidationIssue[]) {
  return issues.sort((left, right) =>
    [left.sourcePath ?? '', left.id ?? '', left.code, left.message]
      .join('\0')
      .localeCompare(
        [right.sourcePath ?? '', right.id ?? '', right.code, right.message].join('\0'),
      ),
  );
}
