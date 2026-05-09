// Pure comparator for the lint ratchet.
// Inputs: { totals: { errors, warnings }, byFile: { path: { errors, warnings } } }
// Output: { passed, delta, regressions }

const ZERO = { errors: 0, warnings: 0 };

export function compareCounts(current, baseline) {
  const delta = {
    errors: current.totals.errors - baseline.totals.errors,
    warnings: current.totals.warnings - baseline.totals.warnings,
  };
  const passed = delta.errors <= 0 && delta.warnings <= 0;

  const regressions = [];
  for (const [file, cur] of Object.entries(current.byFile)) {
    const base = baseline.byFile[file] ?? ZERO;
    const errsRegressed = cur.errors > base.errors;
    const warnsRegressed = cur.warnings > base.warnings;
    if (errsRegressed || warnsRegressed) {
      regressions.push({ file, current: cur, baseline: base });
    }
  }

  regressions.sort((a, b) => {
    const da = a.current.errors - a.baseline.errors;
    const db = b.current.errors - b.baseline.errors;
    if (db !== da) return db - da; // errors-delta DESC
    return a.file.localeCompare(b.file); // path ASC
  });

  return { passed, delta, regressions };
}
