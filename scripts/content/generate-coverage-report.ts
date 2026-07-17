import process from 'node:process';
import path from 'node:path';
import { loadContentModel } from '../../src/lib/content/load-content';
import type { CoverageReport } from '../../src/lib/content/types';
import { calculateCoverage } from '../../src/lib/curriculum/coverage';
import {
  getCoverageReportFreshness,
  renderFormattedCoverageReport,
  writeCoverageReport,
} from './coverage-report';

const root = process.cwd();
const args = process.argv.slice(2);
const tier = readTier(args);
const checkOnly = args.includes('--check');
const model = await loadContentModel(root);
const report = calculateCoverage(model, tier);
const outputPath = path.join(root, 'docs/content-coverage.md');
const contents = await renderFormattedCoverageReport(report, outputPath);

if (checkOnly) {
  const freshness = await getCoverageReportFreshness(outputPath, contents);
  if (freshness !== 'current') {
    console.error(
      `Content coverage report is ${freshness}. Run "npm run coverage:content" and commit docs/content-coverage.md.`,
    );
    process.exitCode = 1;
  } else {
    console.log(`Content coverage report is current for tier ${tier}.`);
  }
} else {
  await writeCoverageReport(outputPath, contents);
  console.log(`Wrote ${path.relative(root, outputPath)} for tier ${tier}.`);
}

function readTier(args: string[]): CoverageReport['tier'] {
  const index = args.indexOf('--tier');
  const value = index >= 0 ? args[index + 1] : 'preview';
  if (value !== 'preview' && value !== 'v1.0') {
    throw new Error(`Unknown tier "${value}". Use preview or v1.0.`);
  }
  return value;
}
