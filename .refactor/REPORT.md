# Refactor REPORT — deslop Provodnik (Phase 3/4 execution)

**Branch:** `refactor/deslop-20260707` · **Baseline:** `f076b3a0` · **HEAD:** `23686a8b`
**Date:** 2026-07-07 · **Method:** subtraction only (behavior preservation is the prime directive).

---

## 1. Executive summary

Batches 1–3 of `.refactor/PLAN.md` (all LOW-risk, mechanical, revertible) are **executed and committed**: dead modules, dead exports, dead feature flags, unused deps, orphan SVGs, retired env vars, and three exact-duplicate merges. **Net −1,339 LOC** across 55 files, plus 4 dependencies, 5 SVGs, 5 dead flags, and 8 env vars removed.

Batches 4–6 (MED risk, semantic/structural, overlapping the component-audit waves) are **deferred** — an active parallel worktree `refactor/component-dedup-20260706` already owns the component-dedup track, so executing Batch 4 here would collide with it. This matches the PLAN's own "Recommended execution path."

All final gates are **green** and match baseline (modulo tests intentionally deleted with their dead code). **No DB change was required** — the refactor touches only TypeScript. No `supabase db push`, no data mutation.

---

## 2. Commits (baseline → HEAD)

| Commit | Scope | Files | LOC |
|---|---|---|---|
| `b3f807c9` | delete dead superseded modules (data/lib) | 24 | −813 |
| `8e41f4f3` | remove dead exports + 5 dead feature flags | 18 | +17 / −503 |
| `acf6cf04` | drop 4 unused deps + 5 orphan scaffolding SVGs | 8 | −24 |
| `23686a8b` | consolidate 3 relation-unwrap helpers → `firstRow`; fold `/form` into `next.config` | 6 | +22 / −38 |
| **Total** | | **55** | **+39 / −1,378 = net −1,339** |

Plus this Phase-4 docs commit: `.refactor/` SOT artifacts (PLAN, BASELINE, WIP-LEDGER, packet, this REPORT) + the `data/favorites/active-user.ts` → `.refactor/quarantine/` move.

## 3. Cleanup numbers

- **Code:** net −1,339 LOC (−1,378 deleted / +39 added; the +39 is the `firstRow` helper + its self-check + a select const).
- **Dependencies (−4):** `@fontsource-variable/inter`, `@fontsource/cormorant-garamond`, `@fontsource/geist-mono` (fonts load via `next/font/google`), `@tanstack/react-query-devtools` (never mounted). 0 import sites each.
- **Public SVGs (−5):** default Next scaffolding `file/globe/next/vercel/window.svg`, 0 refs.
- **Feature flags (−5):** `FEATURE_TR_KPI`, `FEATURE_TR_PERIPHERALS`, `FEATURE_TR_HELP`, `FEATURE_TR_QUIZ`, `FEATURE_DEPOSITS` (+ their `flags.test.ts` cases).
- **Env vars (−8) from `.env.example`:** 3 app-version (`NEXT_PUBLIC_APP_VERSION`, `VERCEL_DEPLOYMENT_ID`, `VERCEL_GIT_COMMIT_SHA`) + the 5 dead flags. Verified 0 residual refs in `src`.

Every deletion passed PROVE-BEFORE-DELETE (fresh 0-reference grep across `src`/`tests`/`supabase`/config) and was checked against the framework-magic VETO LIST.

## 4. Per-batch status

| Batch | Status | Notes |
|---|---|---|
| 1 — zero-risk deletions (dead files + dead exports) | ✅ DONE | `b3f807c9` + `8e41f4f3`. WIP-scaffolding exports split out and **quarantined**, not deleted (see §6). |
| 2 — manifest pruning (deps/SVGs/env) | ✅ DONE | `acf6cf04` + env prune. |
| 3 — exact-duplicate merges | ✅ DONE | `23686a8b`: `firstRow<T>` in `utils.ts` (survivor) with a 3-line assert self-check; `GUIDE_PROFILE_STATS_SELECT` const; `/form` redirect moved to `next.config.ts`. |
| 4 — semantic consolidation | ⏸️ DEFERRED | Overlaps `docs/COMPONENT_AUDIT.md` waves; **active parallel track** `refactor/component-dedup-20260706` owns it. Executing here would collide. Net-new items (`formatRating` ×12, `PROFILE_MINI_SELECT` ×15, `parseAndValidateOfferForm` ×2) belong to that track — the offer-form extraction is a money path (needs TDD there). |
| 5 — React Compiler memo removal | ⏸️ DEFERRED | Per PLAN + Context7 (react.dev preserve-manual-memoization): compiler already preserves manual memo harmlessly; per-file behavior review not worth a deslop-pass regression risk. |
| 6 — structural data-layering moves | ⏸️ DEFERRED | Architecture debt (`src/data/*/supabase.ts` I/O placement), its own session per PLAN. |

## 5. DB actions

**None.** Linked Supabase ref confirmed = `yjzpshutgmhxizosbeef` (from `supabase/.temp/project-ref`). The refactor introduces **0 migrations** (`git log f076b3a0..HEAD -- supabase/migrations` empty) and mutates no data. No `supabase db push` executed. Rollback: n/a (no DB change).

- Out of scope (separate product-fix track, not this deslop): the known guide-visibility backfill `20260702000001` never applied to prod — belongs to the open-tasks deploy track, not touched here.

## 6. Deferred / preserved items (with reason)

- **WIP scaffolding (WIP-LEDGER §A)** — favorites (`getUserFavorites`/`toggleFavorite`/`getActiveFavoritesUserId`), notification triggers (`notifyBookingConfirmed`/`notifyReviewRequested`), notifications read/write, guide-template photos, moderation-case CRUD + types, storage reservations. All 0-ref today but shaped like **pending-feature scaffolding**. **Quarantined/preserved** (deletion is behavior-neutral either way; erasing pending scaffold is the only risk). `active-user.ts` moved to `.refactor/quarantine/`; the rest left in place with a ledger row. Re-check **2026-10-01** or when the owning feature is decided.
- **Auth routing + admin-access dead exports (WIP-LEDGER §B)** — NOT touched; collides with the pending open-tasks #34 relogin / #35 blocked-user auth fixes.
- **State-machine transition guards (WIP-LEDGER §B)** — `assertTransition`/`assertReviewTransition`/`assertReplyTransition`/`assertListingTransition` are 0-ref. This is a **real design gap, not just dead code**: status transitions are currently unguarded. Handed to product/security; deliberately **not** silently deleted.
- **`FEATURE_TR_REPUTATION`** — recon dimensions disagreed (1 ref vs 0). **Kept** (excluded from the 5 confirmed-dead flags) pending verification.
- **Demo-session orphans (WIP-LEDGER §C)** — `createDemoSession`/`serializeDemoSessionCookieValue` were **already removed** in `b3f807c9` (they no longer exist in `demo-session.ts`; 0 refs). Ledger §C is **complete**.
- **SOT `ERR-030` stale** — logged in PLAN; tracked as S1 in the open-tasks goal, not this pass.

## 7. Final gate results (at HEAD `23686a8b`)

| Gate | Command | Result |
|---|---|---|
| typecheck | `bun run typecheck` | ✅ 0 errors |
| eslint | `bun run lint` | ✅ 0 errors |
| canon | `bun run lint:canon` | ✅ `lint:canon ok` |
| dead | `bun run lint:dead` | ✅ `ok (baseline: 46 known-dead, new: 0)` |
| ratchet (real pre-commit gate) | `bun run lint:ratchet` | ✅ `0 errors (+0), 0 warnings (-2)` |
| tests | `bun run test:run` | ✅ **1054 passed** (220 files) |
| build | `bun run build` | ✅ succeeds, full route tree emits, Proxy middleware present |

**Test-count delta:** baseline 1082/224 files → 1054/220 files (**−28 tests, −4 files**). This is expected and intentional: the deleted test files exercised only now-deleted dead modules (`format.test.ts`, `access-token-claims.test.ts`, `checklist-account-emails.test.ts`, `marketplace-events/client.test.ts`, and the dead-fn cases in `queries.test.ts` / `flags.test.ts`). No live-behavior test was removed. `bun run check` still carries the pre-existing quarantined `lint-gid-literal` caveat (3 unmodified files, Baseline §Quarantined); the refactor did not increase it, and the repo's real pre-commit gate is `lint:ratchet` (green above).

## 8. Known caveats

- No dead-code/dup scanners installed (knip/jscpd/madge/depcheck absent); recon + PROVE-BEFORE-DELETE used import-graph + rg census.
- `lint-gid-literal` pre-existing failure (3 files) is unchanged — not part of the enforced pre-commit set.
- Batches 4–6 remain for their dedicated tracks; LOC in the PLAN scoreboard beyond Batch 1–3 is not claimed here.

## 9. Сводка для владельца (RU)

- ✅ Мёртвый код удалён: −1 339 строк
- ✅ 4 зависимости и 5 SVG убраны
- ✅ 5 мёртвых флагов и 8 env-переменных вычищены
- ✅ 3 дубликата слиты (firstRow, select-конст, /form)
- ✅ Все проверки зелёные: типы, линт, тесты 1054, сборка
- ✅ Поведение сохранено, БД не трогали (реф подтверждён)
- ⏸️ Батчи 4–6 отданы в трек component-dedup (чтобы не столкнуться)
- ⏸️ WIP-заготовки в карантине до 2026-10-01
