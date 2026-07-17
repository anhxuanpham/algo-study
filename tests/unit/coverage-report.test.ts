import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentModel } from '../../src/lib/content/load-content';
import { calculateCoverage } from '../../src/lib/curriculum/coverage';
import type { ContentModel } from '../../src/lib/content/types';
import { cloneModel } from '../helpers/content-model';

let baseModel: ContentModel;

beforeAll(async () => {
  baseModel = await loadContentModel(process.cwd());
});

describe('coverage report', () => {
  it('is deterministic for the same model and tier', () => {
    expect(calculateCoverage(baseModel, 'preview')).toEqual(
      calculateCoverage(baseModel, 'preview'),
    );
  });

  it('marks a reviewed published vertical slice as covered', () => {
    const model = cloneModel(baseModel);
    model.manifest.domains = [
      {
        id: 'arrays-strings',
        titleVi: 'Mảng và chuỗi',
        mandatory: true,
        requiredConcepts: ['array-memory', 'traversal', 'two-pointers'],
        blockedBy: [],
      },
    ];
    model.manifest.patterns = [{ id: 'two-pointers', titleVi: 'Hai con trỏ', mandatory: true }];

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

    const coverage = calculateCoverage(model, 'v1.0');
    expect(coverage.domains[0]?.status).toBe('covered');
    expect(coverage.patterns[0]?.status).toBe('covered');
    expect(coverage.summary).toEqual({ covered: 2, partial: 0, planned: 0, blocked: 0 });
  });
});
