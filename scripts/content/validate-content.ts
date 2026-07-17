import process from 'node:process';
import path from 'node:path';
import { loadContentModel, ContentLoadError } from '../../src/lib/content/load-content';
import { validateContentModel } from '../../src/lib/content/validate-model';
import type { CoverageReport, ValidationIssue } from '../../src/lib/content/types';

const tier = readTier(process.argv.slice(2));
const root = process.cwd();

try {
  const model = await loadContentModel(root);
  const result = validateContentModel(model, tier);
  printCoverage(result.coverage);

  if (result.issues.length > 0) {
    printIssues(result.issues, root);
    process.exitCode = 1;
  } else {
    console.log(`\nContent validation passed for tier ${tier}.`);
  }
} catch (error) {
  if (error instanceof ContentLoadError) {
    printIssues(error.issues, root);
    process.exitCode = 1;
  } else {
    throw error;
  }
}

function readTier(args: string[]): CoverageReport['tier'] {
  const index = args.indexOf('--tier');
  const value = index >= 0 ? args[index + 1] : 'preview';
  if (value !== 'preview' && value !== 'v1.0') {
    throw new Error(`Unknown tier "${value}". Use preview or v1.0.`);
  }
  return value;
}

function printCoverage(report: CoverageReport) {
  console.log(`Content coverage (${report.tier})`);
  console.log(
    `covered=${report.summary.covered} partial=${report.summary.partial} planned=${report.summary.planned} blocked=${report.summary.blocked}`,
  );
}

function printIssues(issues: ValidationIssue[], root: string) {
  console.error(`\n${issues.length} content validation error(s):`);
  for (const issue of issues) {
    const location = issue.sourcePath ? path.relative(root, issue.sourcePath) : '<manifest>';
    console.error(`- [${issue.code}] ${location}${issue.id ? ` (${issue.id})` : ''}`);
    console.error(`  ${issue.message}`);
    console.error(`  Fix: ${issue.recovery}`);
  }
}
