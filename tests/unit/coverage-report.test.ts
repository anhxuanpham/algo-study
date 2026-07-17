import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  getCoverageReportFreshness,
  renderFormattedCoverageReport,
} from '../../scripts/content/coverage-report';
import { loadContentModel } from '../../src/lib/content/load-content';
import type { ContentModel } from '../../src/lib/content/types';
import { calculateCoverage } from '../../src/lib/curriculum/coverage';
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

  it('renders the checked-in preview report canonically', async () => {
    const outputPath = path.join(process.cwd(), 'docs/content-coverage.md');
    const expected = await renderFormattedCoverageReport(
      calculateCoverage(baseModel, 'preview'),
      outputPath,
    );

    expect(await readFile(outputPath, 'utf8')).toBe(expected);
  });

  it('detects current, stale, and missing reports without writing', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'algo-coverage-'));
    const outputPath = path.join(directory, 'content-coverage.md');

    try {
      const expected = await renderFormattedCoverageReport(
        calculateCoverage(baseModel, 'preview'),
        outputPath,
      );

      expect(await getCoverageReportFreshness(outputPath, expected)).toBe('missing');
      await writeFile(outputPath, 'stale report\n', 'utf8');
      expect(await getCoverageReportFreshness(outputPath, expected)).toBe('stale');
      expect(await readFile(outputPath, 'utf8')).toBe('stale report\n');
      await writeFile(outputPath, expected, 'utf8');
      expect(await getCoverageReportFreshness(outputPath, expected)).toBe('current');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
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
