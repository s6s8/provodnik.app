#!/usr/bin/env node
// Guard rail: dead-component detector (ratchet-style, like scripts/lint-ratchet.mjs).
// A component under src/components/** or src/features/** with ZERO production importers is dead.
// The committed baseline (.lint-dead-baseline.json) freezes the backlog found by
// docs/COMPONENT_AUDIT.md; the check fails only when NEW dead files appear.
//
// Usage:
//   node scripts/lint-dead.mjs            — check (exit 1 if a dead file is not in baseline)
//   node scripts/lint-dead.mjs --init     — write initial baseline (refuses if exists)
//   node scripts/lint-dead.mjs --update   — overwrite baseline (after deliberate cleanup/approved WIP)

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, dirname, resolve, sep } from "node:path";

const repoRoot = process.cwd();
const SRC = join(repoRoot, "src");
const baselinePath = join(repoRoot, ".lint-dead-baseline.json");
const args = process.argv.slice(2);
const isInit = args.includes("--init");
const isUpdate = args.includes("--update");

const SKIP_DIR = new Set(["node_modules", ".next", ".turbo", "dist"]);
const prod = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (/\.(test|spec)\./.test(entry) || p.includes(`${sep}__tests__${sep}`)) continue;
    prod.push(p);
  }
})(SRC);

// Import graph: resolve @/ aliases and relative specifiers, including /index barrels.
const byKey = new Map();
const rel = (p) => relative(repoRoot, p).split(sep).join("/");
for (const p of prod) {
  const noExt = p.replace(/\.(tsx|ts)$/, "");
  byKey.set(noExt, p);
  if (noExt.endsWith(`${sep}index`)) byKey.set(noExt.slice(0, -6), p);
}
const importedBy = new Map(prod.map((p) => [p, 0]));
const impRe = /(?:from\s+|import\()\s*['"]([^'"]+)['"]/g;
for (const p of prod) {
  const src = readFileSync(p, "utf8");
  const dir = dirname(p);
  for (const m of src.matchAll(impRe)) {
    const spec = m[1];
    let abs = null;
    if (spec.startsWith("@/")) abs = join(SRC, spec.slice(2));
    else if (spec.startsWith(".")) abs = resolve(dir, spec);
    else continue;
    const target = byKey.get(abs);
    if (target && target !== p) importedBy.set(target, importedBy.get(target) + 1);
  }
}

// Only components are gated: they must be imported to render. lib/data/app are exempt
// (routes, config entry points, and next conventions import them implicitly).
const dead = prod
  .filter((p) => {
    const r = rel(p);
    return (
      (r.startsWith("src/components/") || r.startsWith("src/features/")) &&
      importedBy.get(p) === 0
    );
  })
  .map(rel)
  .sort();

if (isInit || isUpdate) {
  if (isInit && existsSync(baselinePath)) {
    console.error("Baseline already exists. Use --update after a deliberate cleanup.");
    process.exit(1);
  }
  writeFileSync(baselinePath, JSON.stringify({ dead }, null, 2) + "\n");
  console.log(`lint:dead baseline written — ${dead.length} known-dead files frozen.`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error("No .lint-dead-baseline.json — run: node scripts/lint-dead.mjs --init");
  process.exit(1);
}
const baseline = new Set(JSON.parse(readFileSync(baselinePath, "utf8")).dead);
const fresh = dead.filter((f) => !baseline.has(f));
const cleaned = [...baseline].filter((f) => !dead.includes(f)).sort();

if (cleaned.length) {
  console.log(
    `ℹ ${cleaned.length} baseline entr${cleaned.length === 1 ? "y" : "ies"} no longer dead — shrink the baseline with --update:\n  ` +
      cleaned.join("\n  ")
  );
}
if (fresh.length) {
  console.error(
    `✗ lint:dead — ${fresh.length} NEW component(s) with zero production importers:\n  ` +
      fresh.join("\n  ") +
      "\n\nWire the component up, delete it, or (for approved WIP) add it to the baseline via --update." +
      "\nBefore creating a component, check .claude/sot/CANON_COMPONENTS.md — a canonical one may already exist."
  );
  process.exit(1);
}
console.log(`lint:dead ok (baseline: ${baseline.size} known-dead, new: 0)`);
