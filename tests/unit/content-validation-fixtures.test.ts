import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentModel } from '../../src/lib/content/load-content';
import { validateContentModel } from '../../src/lib/content/validate-model';
import type { ContentModel } from '../../src/lib/content/types';
import { cloneModel, parseFixture } from '../helpers/content-model';

const root = process.cwd();
let baseModel: ContentModel;

type Scenario = {
  name: string;
  mutation: string;
  expectedCode: string;
};

beforeAll(async () => {
  baseModel = await loadContentModel(root);
});

describe('invalid content fixtures', async () => {
  const contents = await readFile(
    path.join(root, 'tests/fixtures/content/invalid/scenarios.yaml'),
    'utf8',
  );
  const scenarios = parseFixture<Scenario[]>(contents);

  for (const scenario of scenarios) {
    it(`reports ${scenario.name}`, () => {
      const model = cloneModel(baseModel);
      applyMutation(model, scenario.mutation);
      const result = validateContentModel(
        model,
        scenario.mutation === 'coverage-gap' ? 'v1.0' : 'preview',
      );
      expect(result.issues.map((issue) => issue.code)).toContain(scenario.expectedCode);
    });
  }

  it('reports both source paths for duplicate IDs', () => {
    const model = cloneModel(baseModel);
    applyMutation(model, 'duplicate-global-id');
    const issues = validateContentModel(model, 'preview').issues.filter(
      (issue) => issue.code === 'DUPLICATE_GLOBAL_ID',
    );
    expect(issues).toHaveLength(2);
    expect(issues[0]?.message).toContain('/fixtures/duplicate.yaml');
    expect(issues[0]?.message).toContain('/topics/arrays-basics.yaml');
  });

  it('reports the complete prerequisite cycle path', () => {
    const model = cloneModel(baseModel);
    applyMutation(model, 'prerequisite-cycle');
    const issue = validateContentModel(model, 'preview').issues.find(
      (candidate) => candidate.code === 'PREREQUISITE_CYCLE',
    );
    expect(issue?.message).toContain('arrays-basics → foundations-extra → arrays-basics');
  });
});

function applyMutation(model: ContentModel, mutation: string) {
  switch (mutation) {
    case 'duplicate-global-id': {
      const original = model.topics[0];
      if (!original) throw new Error('Fixture requires a topic.');
      model.topics.push({
        ...structuredClone(original),
        sourcePath: '/fixtures/duplicate.yaml',
      });
      return;
    }
    case 'dangling-reference':
      model.topics[0]?.data.lessonIds.push('missing-lesson');
      return;
    case 'prerequisite-cycle': {
      const original = model.topics[0];
      if (!original) throw new Error('Fixture requires a topic.');
      original.data.prerequisiteIds = ['foundations-extra'];
      model.topics.push({
        collection: 'topics',
        id: 'foundations-extra',
        sourcePath: '/fixtures/foundations-extra.yaml',
        data: {
          ...structuredClone(original.data),
          id: 'foundations-extra',
          prerequisiteIds: ['arrays-basics'],
        },
      });
      model.tracks[0]?.data.topicIds.push('foundations-extra');
      return;
    }
    case 'orphan-assessment': {
      const assessment = model.assessments[0];
      if (!assessment) throw new Error('Fixture requires an assessment.');
      model.assessments.push({
        ...structuredClone(assessment),
        id: 'orphan-assessment',
        sourcePath: '/fixtures/orphan-assessment.yaml',
        data: { ...structuredClone(assessment.data), id: 'orphan-assessment' },
      });
      return;
    }
    case 'canonical-id-mismatch':
      if (model.lessons[0]) model.lessons[0].sourcePath = '/fixtures/wrong-name.mdx';
      return;
    case 'published-review-missing':
      if (model.lessons[0]) model.lessons[0].data.status = 'published';
      return;
    case 'coverage-gap': {
      const domain = model.manifest.domains.find((entry) => entry.id === 'arrays-strings');
      const pattern = model.manifest.patterns.find((entry) => entry.id === 'two-pointers');
      const independentProblem = model.problems.find(
        (entry) => entry.id === 'pair-sum-sorted-independent',
      );
      if (!domain || !pattern || !independentProblem) {
        throw new Error('Coverage fixture requires the arrays/two-pointers vertical slice.');
      }

      model.manifest.domains = [
        {
          ...domain,
          requiredConcepts: ['array-memory', 'traversal', 'two-pointers'],
          blockedBy: [],
        },
      ];
      model.manifest.patterns = [pattern];
      for (const lesson of model.lessons) {
        Object.assign(lesson.data, {
          status: 'published',
          editorialReviewer: 'Editorial reviewer',
          technicalReviewer: 'Technical reviewer',
          lastReviewedAt: '2026-07-17',
        });
      }
      for (const problem of model.problems) {
        Object.assign(problem.data, {
          status: 'published',
          editorialReviewer: 'Editorial reviewer',
          technicalReviewer: 'Technical reviewer',
          lastReviewedAt: '2026-07-17',
        });
      }
      for (const assessment of model.assessments) assessment.data.status = 'published';
      independentProblem.data.status = 'review';
      return;
    }
    case 'alias-shadows-live-id':
      model.identity.redirects.push({ from: 'arrays-basics', to: 'foundations' });
      return;
    case 'unknown-domain': {
      const topic = model.topics.find((entry) => entry.id === 'arrays-basics');
      if (!topic) throw new Error('Fixture requires the arrays-basics topic.');
      topic.data.domain = 'missing-domain';
      return;
    }
    case 'unknown-pattern': {
      const lesson = model.lessons.find((entry) => entry.id === 'arrays-basics-01-two-pointers');
      if (!lesson) throw new Error('Fixture requires the two-pointers lesson.');
      lesson.data.patternIds.push('missing-pattern');
      return;
    }
    case 'owner-back-reference': {
      const assessment = model.assessments.find(
        (entry) => entry.id === 'arrays-basics-01-retrieval-01',
      );
      const lesson = model.lessons.find((entry) => entry.id === assessment?.data.lessonId);
      if (!assessment || !lesson) {
        throw new Error('Fixture requires an assessment and its owning lesson.');
      }
      lesson.data.assessmentIds = lesson.data.assessmentIds.filter((id) => id !== assessment.id);
      return;
    }
    default:
      throw new Error(`Unknown fixture mutation: ${mutation}`);
  }
}
