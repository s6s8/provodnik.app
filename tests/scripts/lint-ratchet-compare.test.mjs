import { describe, it, expect } from 'vitest';
import { compareCounts } from '../../scripts/lib/lint-ratchet-compare.mjs';

const emptyByFile = {};

describe('compareCounts', () => {
  it('passes when current totals equal baseline', () => {
    const current = { totals: { errors: 10, warnings: 5 }, byFile: emptyByFile };
    const baseline = { totals: { errors: 10, warnings: 5 }, byFile: emptyByFile };
    const result = compareCounts(current, baseline);
    expect(result.passed).toBe(true);
    expect(result.delta).toEqual({ errors: 0, warnings: 0 });
    expect(result.regressions).toEqual([]);
  });

  it('passes when current totals are below baseline', () => {
    const current = { totals: { errors: 5, warnings: 2 }, byFile: emptyByFile };
    const baseline = { totals: { errors: 10, warnings: 5 }, byFile: emptyByFile };
    const result = compareCounts(current, baseline);
    expect(result.passed).toBe(true);
    expect(result.delta).toEqual({ errors: -5, warnings: -3 });
    expect(result.regressions).toEqual([]);
  });

  it('fails when current errors exceed baseline', () => {
    const current = { totals: { errors: 11, warnings: 5 }, byFile: emptyByFile };
    const baseline = { totals: { errors: 10, warnings: 5 }, byFile: emptyByFile };
    const result = compareCounts(current, baseline);
    expect(result.passed).toBe(false);
    expect(result.delta.errors).toBe(1);
    expect(result.delta.warnings).toBe(0);
  });

  it('fails when current warnings exceed baseline', () => {
    const current = { totals: { errors: 10, warnings: 7 }, byFile: emptyByFile };
    const baseline = { totals: { errors: 10, warnings: 5 }, byFile: emptyByFile };
    const result = compareCounts(current, baseline);
    expect(result.passed).toBe(false);
    expect(result.delta.warnings).toBe(2);
  });

  it('regressions list pinpoints files with more errors', () => {
    const current = {
      totals: { errors: 6, warnings: 0 },
      byFile: {
        'a.ts': { errors: 5, warnings: 0 },
        'b.ts': { errors: 1, warnings: 0 },
      },
    };
    const baseline = {
      totals: { errors: 3, warnings: 0 },
      byFile: {
        'a.ts': { errors: 2, warnings: 0 },
        'b.ts': { errors: 1, warnings: 0 },
      },
    };
    const result = compareCounts(current, baseline);
    expect(result.regressions).toHaveLength(1);
    expect(result.regressions[0].file).toBe('a.ts');
  });

  it('regressions list includes new files with errors', () => {
    const current = {
      totals: { errors: 3, warnings: 0 },
      byFile: {
        'a.ts': { errors: 0, warnings: 0 },
        'newfile.ts': { errors: 3, warnings: 0 },
      },
    };
    const baseline = {
      totals: { errors: 0, warnings: 0 },
      byFile: {
        'a.ts': { errors: 0, warnings: 0 },
      },
    };
    const result = compareCounts(current, baseline);
    expect(result.regressions).toHaveLength(1);
    expect(result.regressions[0].file).toBe('newfile.ts');
    expect(result.regressions[0].baseline).toEqual({ errors: 0, warnings: 0 });
  });

  it('regressions sorted by errors-delta descending then path ascending', () => {
    const current = {
      totals: { errors: 15, warnings: 0 },
      byFile: {
        'a.ts': { errors: 5, warnings: 0 },
        'b.ts': { errors: 10, warnings: 0 },
      },
    };
    const baseline = {
      totals: { errors: 7, warnings: 0 },
      byFile: {
        'a.ts': { errors: 2, warnings: 0 },
        'b.ts': { errors: 5, warnings: 0 },
      },
    };
    const result = compareCounts(current, baseline);
    expect(result.regressions[0].file).toBe('b.ts'); // delta +5
    expect(result.regressions[1].file).toBe('a.ts'); // delta +3
  });
});
