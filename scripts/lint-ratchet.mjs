#!/usr/bin/env node
// Lint ratchet: compare current eslint counts to a committed baseline.
// Usage:
//   node scripts/lint-ratchet.mjs           — check (exit 0 if <= baseline, 1 if >)
//   node scripts/lint-ratchet.mjs --init    — write initial baseline (refuses if exists)
//   node scripts/lint-ratchet.mjs --update  — overwrite baseline (use after a deliberate cleanup)

import { ESLint } from 'eslint';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { compareCounts } from './lib/lint-ratchet-compare.mjs';

const args = process.argv.slice(2);
const isInit = args.includes('--init');
const isUpdate = args.includes('--update');

const repoRoot = process.cwd();
const baselinePath = resolve(repoRoot, '.eslint-baseline.json');

const eslint = new ESLint({ cache: false });
const results = await eslint.lintFiles(['.']);

let totalErrors = 0;
let totalWarnings = 0;
const byFile = {};
for (const r of results) {
  if (r.errorCount + r.warningCount === 0) continue;
  totalErrors += r.errorCount;
  totalWarnings += r.warningCount;
  const rel = r.filePath.startsWith(repoRoot)
    ? r.filePath.slice(repoRoot.length + 1)
    : r.filePath;
  const normalized = sep === '\\' ? rel.split(sep).join('/') : rel;
  byFile[normalized] = { errors: r.errorCount, warnings: r.warningCount };
}

const current = { totals: { errors: totalErrors, warnings: totalWarnings }, byFile };

const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);
const fileCount = Object.keys(byFile).length;

function writeBaseline(state) {
  const sortedByFile = Object.fromEntries(
    Object.entries(state.byFile).sort(([a], [b]) => a.localeCompare(b))
  );
  const out = {
    generatedAt: new Date().toISOString(),
    eslintVersion: ESLint.version,
    totals: state.totals,
    byFile: sortedByFile,
  };
  writeFileSync(baselinePath, JSON.stringify(out, null, 2) + '\n');
}

if (isInit) {
  if (existsSync(baselinePath)) {
    console.error(`Refusing to overwrite existing .eslint-baseline.json (use --update).`);
    process.exit(1);
  }
  writeBaseline(current);
  console.log(`Initial baseline written: ${totalErrors} errors, ${totalWarnings} warnings, ${fileCount} files.`);
  process.exit(0);
}

if (isUpdate) {
  writeBaseline(current);
  console.log(`Baseline updated: ${totalErrors} errors, ${totalWarnings} warnings, ${fileCount} files.`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error(`No baseline file found at ${baselinePath}. Run 'bun run lint:ratchet:init' first.`);
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const cmp = compareCounts(current, baseline);

if (cmp.passed) {
  console.log(`Pass: ${totalErrors} errors (${sign(cmp.delta.errors)}), ${totalWarnings} warnings (${sign(cmp.delta.warnings)}) vs baseline.`);
  process.exit(0);
}

console.error(`Fail: lint baseline exceeded.`);
console.error(`  errors:   baseline=${baseline.totals.errors} current=${totalErrors} (Δ ${sign(cmp.delta.errors)})`);
console.error(`  warnings: baseline=${baseline.totals.warnings} current=${totalWarnings} (Δ ${sign(cmp.delta.warnings)})`);
if (cmp.regressions.length > 0) {
  const shown = cmp.regressions.slice(0, 20);
  console.error(`Regressed files (top ${shown.length}${cmp.regressions.length > 20 ? ` of ${cmp.regressions.length}` : ''}):`);
  for (const r of shown) {
    console.error(`  ${r.file}: errors ${r.baseline.errors}→${r.current.errors}, warnings ${r.baseline.warnings}→${r.current.warnings}`);
  }
}
process.exit(1);
