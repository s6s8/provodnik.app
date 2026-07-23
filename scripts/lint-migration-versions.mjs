#!/usr/bin/env node
// Guard rail: Supabase migration filenames must use unique version prefixes.

import { readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");
const VERSION_RE = /^(\d{14})_.+\.sql$/;

const versions = new Map();

for (const entry of readdirSync(MIGRATIONS_DIR)) {
  const match = VERSION_RE.exec(entry);
  if (!match) continue;

  const version = match[1];
  const files = versions.get(version) ?? [];
  files.push(entry);
  versions.set(version, files);
}

const duplicates = [...versions.entries()].filter(([, files]) => files.length > 1);

if (duplicates.length > 0) {
  console.error("Duplicate Supabase migration versions:");
  for (const [version, files] of duplicates) {
    console.error(`  ${version}:`);
    for (const file of files) {
      console.error(`    - ${file}`);
    }
  }
  process.exit(1);
}

console.log(`OK: ${versions.size} unique migration versions.`);
