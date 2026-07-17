export type PrerequisiteNode = {
  id: string;
  prerequisiteIds: string[];
};

export function findPrerequisiteCycles(nodes: PrerequisiteNode[]): string[][] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const cycles = new Map<string, string[]>();

  function visit(id: string) {
    const currentState = state.get(id);
    if (currentState === 'visited') return;
    if (currentState === 'visiting') {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      cycles.set(canonicalCycleKey(cycle), cycle);
      return;
    }

    const node = byId.get(id);
    if (!node) return;

    state.set(id, 'visiting');
    stack.push(id);
    for (const prerequisiteId of [...node.prerequisiteIds].sort()) {
      visit(prerequisiteId);
    }
    stack.pop();
    state.set(id, 'visited');
  }

  for (const id of [...byId.keys()].sort()) {
    visit(id);
  }

  return [...cycles.values()].sort((left, right) => left.join('→').localeCompare(right.join('→')));
}

function canonicalCycleKey(cycle: string[]) {
  const withoutClosure = cycle.slice(0, -1);
  if (withoutClosure.length === 0) return '';
  const rotations = withoutClosure.map((_, index) => [
    ...withoutClosure.slice(index),
    ...withoutClosure.slice(0, index),
  ]);
  return rotations.map((rotation) => rotation.join('→')).sort()[0] ?? '';
}
