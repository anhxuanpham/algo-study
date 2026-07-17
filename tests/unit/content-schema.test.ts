import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadContentModel } from '../../src/lib/content/load-content';
import { canonicalIdSchema, lessonSchema, sourceSchema } from '../../src/lib/content/schemas';
import { validateContentModel } from '../../src/lib/content/validate-model';
import { parseFixture } from '../helpers/content-model';

const root = process.cwd();

describe('content schemas and valid vertical slice', () => {
  it('accepts canonical kebab-case IDs and rejects unstable IDs', () => {
    expect(canonicalIdSchema.safeParse('arrays-basics-01').success).toBe(true);
    expect(canonicalIdSchema.safeParse('Mảng cơ bản').success).toBe(false);
    expect(canonicalIdSchema.safeParse('arrays_basics').success).toBe(false);
  });

  it('requires HTTPS sources', () => {
    expect(sourceSchema.safeParse({ title: 'Official', url: 'https://example.com' }).success).toBe(
      true,
    );
    expect(sourceSchema.safeParse({ title: 'Insecure', url: 'http://example.com' }).success).toBe(
      false,
    );
  });

  it('requires canonical lesson evidence and TypeScript language', () => {
    const result = lessonSchema.safeParse({
      id: 'lesson-one',
      topicId: 'topic-one',
      level: 'foundation',
      objectives: ['Explain the invariant'],
      prerequisiteIds: [],
      estimatedMinutes: 10,
      concepts: ['invariant'],
      patternIds: [],
      assessmentIds: ['assessment-one'],
      problemIds: ['guided-one', 'independent-one'],
      visualizerIds: [],
      codeLanguage: 'python',
      evidence: {
        workedExample: true,
        accessibleTrace: true,
        retrieval: true,
        guidedPractice: true,
        independentPractice: true,
        summary: true,
      },
      sources: [{ title: 'Source', url: 'https://example.com' }],
      author: 'Algo Study',
      reviewVersion: 1,
      status: 'draft',
    });
    expect(result.success).toBe(false);
  });

  it('loads the repository vertical slice and passes preview validation', async () => {
    const model = await loadContentModel(root);
    const expectedContents = await readFile(
      path.join(root, 'tests/fixtures/content/valid/expected.yaml'),
      'utf8',
    );
    const expected = parseFixture<{
      collections: Record<
        keyof Pick<
          typeof model,
          'tracks' | 'topics' | 'lessons' | 'problems' | 'assessments' | 'glossary'
        >,
        number
      >;
      canonicalIds: string[];
      previewCoverage: { partial: string[] };
    }>(expectedContents);
    const result = validateContentModel(model, 'preview');

    for (const [collection, count] of Object.entries(expected.collections)) {
      expect(model[collection as keyof typeof expected.collections]).toHaveLength(count);
    }
    expect(
      [
        ...model.tracks,
        ...model.topics,
        ...model.lessons,
        ...model.problems,
        ...model.assessments,
        ...model.glossary,
      ]
        .map((entry) => entry.id)
        .sort(),
    ).toEqual([...expected.canonicalIds].sort());
    expect(result.issues).toEqual([]);
    expect(result.coverage.domains.find((item) => item.id === 'arrays-strings')?.status).toBe(
      'partial',
    );
    expect(result.coverage.patterns.find((item) => item.id === 'two-pointers')?.status).toBe(
      'partial',
    );
  });
});
