import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCollection = vi.fn();

vi.mock('astro:content', () => ({
  getCollection,
  getEntry: vi.fn(),
}));

const { getPreviewLessons } = await import('../../src/lib/content/queries');

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
});

function lessonEntry(id: string, status: 'planned' | 'draft' | 'review' | 'published') {
  return { id, data: { status } };
}
