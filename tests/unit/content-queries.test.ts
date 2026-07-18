import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCollection = vi.fn();

vi.mock('astro:content', () => ({
  getCollection,
  getEntry: vi.fn(),
}));

const { getPreviewLessons, getPublishedLessons, getPublishedProblems } =
  await import('../../src/lib/content/queries');

describe('content queries', () => {
  beforeEach(() => {
    getCollection.mockReset();
  });

  it('returns non-planned lessons in canonical ID order', async () => {
    getCollection.mockResolvedValue([
      lessonEntry('review-lesson', 'review'),
      lessonEntry('planned-lesson', 'planned'),
      lessonEntry('draft-lesson', 'draft'),
      lessonEntry('published-lesson', 'published'),
    ]);

    expect((await getPreviewLessons()).map((entry) => entry.id)).toEqual([
      'draft-lesson',
      'published-lesson',
      'review-lesson',
    ]);
  });

  it('returns only published lessons and problems', async () => {
    getCollection.mockImplementation(async (collection: string) => {
      if (collection === 'lessons') {
        return [
          lessonEntry('planned-lesson', 'planned'),
          lessonEntry('published-lesson', 'published'),
          lessonEntry('review-lesson', 'review'),
        ];
      }
      return [
        { id: 'draft-problem', data: { status: 'draft' } },
        { id: 'published-problem', data: { status: 'published' } },
      ];
    });

    expect((await getPublishedLessons()).map((entry) => entry.id)).toEqual(['published-lesson']);
    expect((await getPublishedProblems()).map((entry) => entry.id)).toEqual(['published-problem']);
  });
});

function lessonEntry(id: string, status: 'planned' | 'draft' | 'review' | 'published') {
  return { id, data: { status } };
}
