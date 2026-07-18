import { promises as fs } from 'node:fs';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';
import type { CoverageItem, CoverageReport } from '../../src/lib/content/types';

export type CoverageReportFreshness = 'current' | 'missing' | 'stale';

export async function renderFormattedCoverageReport(
  report: CoverageReport,
  outputPath: string,
): Promise<string> {
  const config = await resolveConfig(outputPath);
  return format(renderCoverageReport(report), {
    ...(config ?? {}),
    filepath: outputPath,
  });
}

export async function getCoverageReportFreshness(
  outputPath: string,
  expected: string,
): Promise<CoverageReportFreshness> {
  try {
    const current = await fs.readFile(outputPath, 'utf8');
    return current === expected ? 'current' : 'stale';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw error;
  }
}

export async function writeCoverageReport(outputPath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, contents, 'utf8');
}

function renderCoverageReport(report: CoverageReport) {
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
