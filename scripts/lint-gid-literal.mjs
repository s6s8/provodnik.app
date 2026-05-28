#!/usr/bin/env node
// Guard rail: forbid «Гид» literal as a display-name fallback.
// Role labels and the resolver test are intentionally exempt.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(process.cwd(), "src");
const SKIP_DIR = new Set(["node_modules", ".next", ".turbo", "dist"]);

const ALLOWLIST = new Set([
  "src/lib/copy.ts",
  "src/components/shared/user-account-drawer.tsx",
  "src/components/shared/breadcrumbs.tsx",
  "src/components/shared/site-header.tsx",
  "src/features/profile/components/NotificationPrefsMatrix.tsx",
  "src/lib/profile/resolve-display-name.test.ts",
]);

const LITERAL = /["']Гид["']/;
const hits = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;

    const p = join(dir, entry);
    const s = statSync(p);

    if (s.isDirectory()) {
      walk(p);
      continue;
    }

    if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(entry)) continue;

    const rel = relative(process.cwd(), p).split(sep).join("/");
    if (ALLOWLIST.has(rel)) continue;

    const src = readFileSync(p, "utf8");
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (LITERAL.test(lines[i])) {
        hits.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
      }
    }
  }
}

walk(ROOT);

if (hits.length > 0) {
  console.error("Forbidden «Гид» literal as display name:");
  for (const h of hits) console.error("  " + h);
  process.exit(1);
}

console.log("OK: no «Гид» literal as display name.");
