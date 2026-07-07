# Refactor Baseline — 2026-07-07

Phase 0 safety-net record. All later gates compare against THIS, not perfection.

## Environment
- Branch at recon time: `handover/excel-fixes` @ `f076b3a0`
- Refactor branch (create on Go): `refactor/deslop-20260707` — forks from clean product-code state
- Package manager: `bun`. Node/Next 16.2.6, React 19.2.4.

## Gates (baseline = GREEN, reproducible)
| Gate | Command | Result |
|---|---|---|
| typecheck | `bun run typecheck` | ✅ 0 errors |
| lint (eslint + canon + dead) | `bun run lint` / `bun run check` | ✅ 0 errors |
| tests | `bun run test:run` | ✅ **1082 passed / 1082** (224 files) |
| build | `bun run build` | ✅ succeeds, full route tree emits |

Oracle: the 1082-test suite is the behavior-preservation oracle; no characterization tests needed.

## Size census (tracked files)
| Scope | LOC |
|---|---|
| src non-test (.ts/.tsx) | 59,902 |
| src test (.ts/.tsx) | 22,329 |
| supabase/migrations (.sql) | 7,016 |
| scripts | 1,068 |
| tracked files total | 1,633 |

## Quarantined pre-existing failures (Phase 0 — compare against these, not perfection)
- **`node scripts/lint-gid-literal.mjs` (part of `bun run check`) fails on arrival** — 3 unmodified files carry a `"Гид"` role-label literal not in the guard's allowlist: `src/features/admin/components/disputes/disputes-queue.tsx:69`, `src/features/bookings/components/booking-detail-screen.tsx:416`, `src/features/disputes/components/DisputeThread.tsx:56`. The repo's real pre-commit gate uses `lint:ratchet` (not `check`), so this was never enforced. **Refactor gate therefore = `typecheck && lint && lint:canon && lint:dead && test:run && build`** (the pre-commit set), and lint-gid violations must not *increase*.

## Caveats
- No dead-code/dup scanners installed (knip/jscpd/madge/depcheck absent) → recon used import-graph resolution + rg census (same method that already out-found the component audit's tsx-only sweep, e.g. 7 dead `.ts` files it missed).
- Working tree was dirty at recon (3 modified `.claude` docs + untracked dirs, all non-product). The refactor branch forks from committed product state; these do not affect gates.
- Existing guards that constrain the plan: `.lint-dead-baseline.json` (46 known-dead **component** files, already frozen — do not re-report), `scripts/lint-canon.mjs` frozen allowlists (legacy, tracked for `docs/COMPONENT_AUDIT.md` waves — do NOT casually delete allowlisted files).
