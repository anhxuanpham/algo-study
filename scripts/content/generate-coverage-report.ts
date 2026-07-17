import process from 'node:process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loadContentModel } from '../../src/lib/content/load-content';
import { calculateCoverage } from '../../src/lib/curriculum/coverage';
import type { CoverageItem, CoverageReport } from '../../src/lib/content/types';

const root = process.cwd();
const tier = readTier(process.argv.slice(2));
const model = await loadContentModel(root);
const report = calculateCoverage(model, tier);
const outputPath = path.join(root, 'docs/content-coverage.md');
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, renderReport(report), 'utf8');
console.log(`Wrote ${path.relative(root, outputPath)} for tier ${tier}.`);

function readTier(args: string[]): CoverageReport['tier'] {
  const index = args.indexOf('--tier');
  const value = index >= 0 ? args[index + 1] : 'preview';
  if (value !== 'preview' && value !== 'v1.0') {
    throw new Error(`Unknown tier "${value}". Use preview or v1.0.`);
  }
  return value;
}

function renderReport(report: CoverageReport) {
  return `# Content Coverage\n\nRelease tier: \`${report.tier}\`. Generated deterministically from the current content model.\n\n## Summary\n\n| Covered | Partial | Planned | Blocked |\n|---:|---:|---:|---:|\n| ${report.summary.covered} | ${report.summary.partial} | ${report.summary.planned} | ${report.summary.blocked} |\n\n## Domains\n\n${renderItems(report.domains)}\n\n## Patterns\n\n${renderItems(report.patterns)}\n`;
}

function renderItems(items: CoverageItem[]) {
  return `| ID | Status | Mandatory | Evidence | Gaps |\n|---|---|---:|---|---|\n${items
    .map(
      (item) =>
        `| \`${item.id}\` | ${item.status} | ${item.mandatory ? 'yes' : 'no'} | ${item.evidence.join('<br>') || '—'} | ${item.gaps.join('<br>') || '—'} |`,
    )
    .join('\n')}`;
}
