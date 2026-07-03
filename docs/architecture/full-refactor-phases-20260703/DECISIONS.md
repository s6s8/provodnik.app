# DECISIONS — PM/MVP decisions made without asking the owner

Each row: decision, rationale, why it is safe under the north star.

## Phase 0

- **Delete the `tripster-v1/01–06` E2E specs rather than repair them.** They target a
  legacy direct-book UI (`/search`, listing type-picker) with data-testids that do not
  exist in the current request-first codebase, and every step had a silent mid-test
  `test.skip()` escape hatch (green-by-construction). Repairing selectors blind, against
  a UI they never matched, would produce equally unverifiable tests. Replaced with one
  honest request-first lifecycle spec + a seed-free role-gate-denial spec. Sanctioned by
  plan G0 ("delete or fix ERR-059 spec rot").

- **Wire the pgTAP RLS suite into CI as the primary Phase 0 deliverable.** The launch
  work already authored ~96 RLS assertions; the real gap was that nothing ran them. A
  test that never runs is not a safety net. Adding `test:db` + a `db-tests` CI job turns
  the existing coverage into an enforced gate — higher leverage than writing more
  assertions.

- **Empty-but-valid `storageState` stubs when `QA_SEED_PASSWORD` is absent.** Keeps
  `storageState`-bound Playwright projects loadable in unseeded environments while the
  authenticated specs skip themselves — the suite never passes by pretending to be
  logged in.
