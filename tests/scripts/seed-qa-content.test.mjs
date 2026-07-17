import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

// The seed script connects to Supabase at import time, so this reads it as text.
// These two invariants are the ones that reached users as bugs (owner 609):
// a 5 000 ₽/чел demo open group, and listings seeded with format = NULL.
const source = readFileSync(join(process.cwd(), 'scripts/seed-qa-content.mjs'), 'utf8');

describe('seed-qa-content fixtures', () => {
  it('seeds the demo open group at ~1 000 ₽ per person', () => {
    const match = source.match(/budget_minor:\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match[1])).toBe(100_000);
  });

  it('gives every seeded listing a real format', () => {
    // listings.format is nullable with no default; a NULL makes every price
    // surface fall back to a bare «от X ₽» with no per-person/per-group scope.
    const formats = [...source.matchAll(/slug:\s*"[^"]+",[^}]*?format:\s*"([^"]+)"/g)].map(
      (m) => m[1],
    );

    expect(formats.length).toBeGreaterThanOrEqual(6);
    for (const format of formats) {
      expect(['group', 'private', 'combo']).toContain(format);
    }
  });

  it('writes format into the listings upsert', () => {
    expect(source).toMatch(/format:\s*l\.format/);
  });
});
