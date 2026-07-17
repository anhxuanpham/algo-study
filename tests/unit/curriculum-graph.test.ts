import { describe, expect, it } from 'vitest';
import { findPrerequisiteCycles } from '../../src/lib/curriculum/graph';

describe('curriculum prerequisite graph', () => {
  it('returns a complete deterministic cycle path', () => {
    const cycles = findPrerequisiteCycles([
      { id: 'arrays', prerequisiteIds: ['foundations'] },
      { id: 'graphs', prerequisiteIds: ['arrays'] },
      { id: 'foundations', prerequisiteIds: ['graphs'] },
    ]);
    expect(cycles).toEqual([['arrays', 'foundations', 'graphs', 'arrays']]);
  });

  it('returns no cycles for a directed acyclic curriculum', () => {
    expect(
      findPrerequisiteCycles([
        { id: 'foundations', prerequisiteIds: [] },
        { id: 'arrays', prerequisiteIds: ['foundations'] },
        { id: 'graphs', prerequisiteIds: ['arrays'] },
      ]),
    ).toEqual([]);
  });
});
