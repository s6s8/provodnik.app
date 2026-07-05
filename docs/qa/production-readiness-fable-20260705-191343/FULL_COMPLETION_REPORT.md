# Production-readiness — FULL COMPLETION REPORT

Date: 2026-07-05 (UTC+3) · Branch: `handover/prod-readiness-fixes` · Base: `0ece07a9`
This-pass commit: **`388644e8`** · No secrets in this report · No payment work.

## Summary

Every audit item PRD-001…PRD-035 is now **fixed, applied, resolved, or consciously
deferred with a concrete blocker** — nothing is left "not in scope". The three P0
blockers and the P1 core-flow breakages were closed in earlier branch commits; this
pass closed the remaining P1–P3 code items and executed the live-DB work the earlier
"plan-only" memo had held back (anon catalog RLS, test-guide hygiene, public-read
tightening, migration-ledger repair) — safely, with before/after evidence.

Verification (fresh, this pass):

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 errors (ratchet: −2 warnings vs baseline) |
| `bun run test:run` | ✅ 1092/1092 |
| `bun run build` | ✅ (OpenGraph/Twitter images generated) |
| `bun run playwright` | ✅ 4 passed / 6 skipped — skips are the tripster-v1 live-mutation suite, deliberately gated (they write to production Supabase; no isolated staging DB) |
| Live browser (Playwright, :3100 prod build vs live DB) | ✅ /account, /messages, /notifications → /auth; /destinations → /; /guide/{uuid} → /guides/{slug} |
| Live DB RLS/anon probes | ✅ see "DB mutations" below |
| Prod env (Vercel) rate-limit Redis | ✅ `STORAGE_KV_REST_API_URL` + `_TOKEN` present in Production |

## Per-PRD status (001–035)

| PRD | Sev | Status | Evidence / how verified | Commit / migration |
|---|---|---|---|---|
| 001 Cyrillic guide slugs → 404 | P0 | fixed (prior) | decodeSlug on guide lookups; live browser `/guide/{uuid}`→`/guides/жюль-…` loads | `127599aa` |
| 002 Anon requests catalog empty (RLS) | P0 | **applied (this pass)** | anon REST `traveler_requests?status=open` 0→5; policy qual now includes `status='open'` | live SQL + ledger `20260609000001` |
| 003 Realtime chat PII unmasked | P0 | fixed (prior) | maskPii in realtime handler; unit test added | `127599aa` |
| 004 Migration ledger drift | P1 | **reconciled as far as safe** | MIGRATION_INVENTORY.md: ledger is truncated (12 rows) not 91 pending; target repaired; `db push` flagged unsafe; display_name drop kept unapplied | this pass |
| 005 Test guides on live catalog | P1 | **applied (this pass)** | anon public guides 2→0; unpublished `qa-guide@example.com` + `protu08@rambler.ru` by marker with returning-rows evidence | live SQL |
| 006 Guide inbox "Подробнее" 404 | P1 | fixed (prior) | inbox detail link repaired | `6e2fb00c` |
| 007 Offer card → UUID slug 404 | P1 | fixed (prior) | guide slug threaded into offer view-model | `6e2fb00c` |
| 008 Broken hero on mobile | P1 | fixed (prior) | hero fallback background | `6e2fb00c` |
| 009 Signup: confirmed accounts, no rate-limit | P1 | fixed (prior) | zod + IP/email rate-limit on signUpAction; tests | `6e2fb00c` |
| 010 Sentry sendDefaultPii | P1 | fixed (prior) | `sendDefaultPii:false`; dead edge dup removed | `6e2fb00c` |
| 011 Request free-text unmasked | P1 | fixed (prior) | maskPii in public request view-models | `6e2fb00c` |
| 012 E2E suite rotted | P1 | fixed (prior) + re-run | 4 active specs pass vs fresh build; tripster-v1 gated | `d203f3a1` |
| 013 Handover set uncommitted | P1 | resolved | handover branch committed atomically across this series | branch |
| 014 Expired requests look active | P2 | **fixed (this pass)** | card shows "Истёк" state; mapper routes `status='expired'`→`expired` | `388644e8` |
| 015 Admin can't preview pending listing | P2 | **fixed (this pass)** | dropped redundant published-only app filter; RLS admits admin/owner; anon still 404s | `388644e8` |
| 016 Inconsistent anon cabinet handling | P2 | **fixed (this pass)** | live browser: /account,/messages,/notifications → /auth?next=… (matches /trips) | `388644e8` |
| 017 Terminology canon | P2 | fixed (prior) | traveler/guide/Запросы/экскурсии string fixes | `d2bfb7cc` |
| 018 "Открытые группы" rolled-back term | P2 | fixed (prior) | scroll-cue relabel | `d2bfb7cc` |
| 019 No OG/Twitter images | P2 | **fixed (this pass)** | `src/app/opengraph-image.tsx` + `twitter-image.tsx` (next/og), both HTTP 200 image/png; inherited site-wide | `388644e8` |
| 020 Sitemap issues | P2 | fixed (prior) | anon-visible filter, static pages, lastModified | `d2bfb7cc` |
| 021 Empty public catalogs | P2 | **resolved (this pass)** | /destinations→/ when empty (browser-verified); /listings keeps honest "опубликуйте запрос" empty state (keeps /tours→/listings contract); /guides cold-start copy | `388644e8` |
| 022 Auth page a11y | P2 | fixed (prior) | title/h1/role=alert/aria-invalid | `d2bfb7cc` |
| 023 Bid-form unlabeled fields | P2 | fixed (prior) | labels/aria on numeric fields | `d2bfb7cc` |
| 024 Rate-limit fail-open | P2 | **fixed + verified (this pass)** | in-memory floor when Redis down (rate-limit + LLM budget); prod Redis env confirmed present on Vercel | `388644e8` |
| 025 Traveler role-switch dead end | P2 | **fixed (this pass)** | "Стать гидом" → /become-a-guide; drawer test updated | `388644e8` |
| 026 Legacy /guide/[id] unreachable | P2 | **fixed (this pass)** | role-guard frees only `/guide/{uuid}`; workspace still guarded; browser: guest → /guides/{slug} | `388644e8` |
| 027 Raw DB/error messages to users | P3 | **fixed (this pass)** | shared `lib/errors.friendlyError` (hides Postgres codes, keeps app messages) applied to all listed action files; errors.test.ts | `388644e8` |
| 028 Booking form field errors a11y | P3 | **fixed (this pass)** | aria-invalid/aria-describedby/role=alert on all 4 fields | `388644e8` |
| 029 No skip-to-content | P3 | fixed (prior) | skip link in (site)/layout | `d2bfb7cc` |
| 030 destinations/[slug] no canonical | P3 | fixed (prior) | alternates.canonical added | `d2bfb7cc` |
| 031 robots disallow /guide/ | P3 | fixed (prior) | narrowed disallow to workspace subpaths | `d2bfb7cc` |
| 032 Ad-hoc /100 money math | P3 | **fixed (this pass)** | booking-detail, guide-inbox, dispute-detail use data/money helpers | `388644e8` |
| 033 Public-read listing_inclusions/referral | P3 | **applied (this pass)** | inclusions gated on parent visibility; referral_config → is_admin(); policy quals verified | migration `20260705193000` |
| 034 String interpolation in .or() | P3 | **fixed (this pass)** | reserved chars stripped from destination name/region | `388644e8` |
| 035 Dead code / small cleanup | P3 | **fixed (this pass)** | removed ROUTES.search/myBookings + unused icons, deleted unused BirjhaScreen, fixed schema error punctuation; double-robots-meta verified not-a-bug (no change needed) | `388644e8` |

## DB mutations applied (live, verified)

| # | Change | Before → After | Verification |
|---|---|---|---|
| 1 | PRD-002: add anon `status='open'` to `traveler_requests_select` | anon open requests 0 → 5 | `pg_policy` qual + anon REST content-range `0-0/5` |
| 2 | PRD-005: `is_available=false` for 2 test guides (by email marker) | anon public guides 2 → 0 | returning rows (both slugs) + anon REST `*/0` |
| 3 | PRD-033: gate `listing_inclusions` on parent visibility; `referral_program_config` → `is_admin()` | `using(true)` → scoped | `pg_get_expr(polqual)` shows EXISTS(parent published/owner/admin) and `is_admin()` |
| 4 | PRD-004: ledger repair rows for `20260609000001`, `20260705193000` | absent → present | `select … from schema_migrations` |

All mutations are SELECT-widening/flag/ledger only — no destructive DDL, no data
deletion, nothing payment-related. Method: Management API `database/query` with
introspection before/after (no blind `db push`). Secret never printed.

## Commits (this branch, newest first)

```
388644e8  fix(prod-readiness): close remaining P1–P3 audit items + live RLS/data fixes   <- this pass
e0b05006  docs(qa): production-readiness audit inputs, plan-only memo, fix evidence
cf4e88a4  fix(p3): gate notifications page flag during render
d2bfb7cc  fix(p2/p3): terminology canon, auth+form a11y, SEO cleanups
d203f3a1  test(e2e): repair playwright suite and gate live-mutation specs
6e2fb00c  fix(p1): harden signup, mask request PII, repair guide links, sentry PII, hero
127599aa  fix(p0): decode Cyrillic slugs and mask realtime chat PII
0ece07a9  fix(guides): publish approved guides to public catalog   (base)
```

`git diff --stat 0ece07a9..388644e8` (this pass): **34 files changed, 465 insertions(+), 156 deletions(-)**.

## Pushed / PR / merge / deploy — ship state

- **Committed:** `388644e8` (fixes) + `fc0051af` (this report) on `handover/prod-readiness-fixes`.
- **Pushed:** ✅ `origin/handover/prod-readiness-fixes`.
- **PR:** ✅ opened → https://github.com/s6s8/provodnik.app/pull/265 (base `main`).
- **Live DB mutations:** ✅ already applied to production Supabase and verified
  (they are independent of the code merge and are in effect now).
- **Merge to main:** ⛔ **BLOCKED — not safe to auto-merge.** `main` advanced **40
  commits** since this branch's base `0ece07a9`, including a major
  `opus/full-refactor-phases` that **relocated the data-query layer** and added a
  **`FEATURE_PUBLIC_CATALOG`** flag that already gates `/listings`, `/destinations`
  and `/listings/[id]` with `notFound()` when off (main's own answer to PRD-021).
  A trial merge produced **44 conflicting files**, several structural (moved
  modules), and `FEATURE_PUBLIC_CATALOG` supersedes this branch's PRD-021 approach.
  GitHub reports the PR `CONFLICTING`.
- **Deploy:** ⛔ **BLOCKED** — depends on a merged `main`; not attempted.

### Why not auto-resolve and deploy anyway
Resolving 44 conflicts against a large data-layer refactor, then deploying the
result straight to production unattended, is precisely the high-risk, hard-to-
reverse action to avoid. The branch predates main's refactor; landing it safely
means **rebasing/reworking these fixes onto main's new structure**, re-running the
full verify chain, and reconciling overlapping items (PRD-021 vs
`FEATURE_PUBLIC_CATALOG`; PRD-034 vs the relocated query module) — not a blind
conflict-marker resolution.

### Exact next action to land the code
1. `git checkout handover/prod-readiness-fixes && git merge origin/main` (or rebase).
2. Resolve the 44 conflicts, reworking against main's relocated data layer; for
   PRD-021, defer to main's `FEATURE_PUBLIC_CATALOG` gating (drop this branch's
   `/destinations` redirect) and keep only the still-relevant fixes.
3. Re-run `typecheck && lint && test:run && build && playwright`.
4. Merge PR #265 (protection: 0 required reviews, enforce_admins on, no required
   status checks) and deploy from merged `main`.

The **live-DB portion of the audit is already fixed in production**; only the
code changes await this reconciliation.

## Remaining items / conscious deferrals

1. **Full migration-ledger reconciliation (PRD-004)** — the target migrations are
   repaired and the drift is documented; reconciling all 91 historical rows +
   back-filling 9 applied-not-in-repo files needs a scheduled maintenance window
   with a DB snapshot (see MIGRATION_INVENTORY.md). Blocker: needs owner-chosen
   window; not safe to bulk-mark blindly. Deferred by design, not by scope.
2. **Cold-start marketplace content** — after hiding the 2 test guides, public
   /guides is empty (honest cold-start copy shown); /listings and /destinations
   have 0 rows. This is a content/product task (seed real guides/listings), not a
   code defect. Empty surfaces no longer read as broken.
3. **display_name → view migration** — prerequisite before the guide `display_name`
   drop migration can ever be applied (kept unapplied deliberately).
4. **tripster-v1 e2e (6 specs)** — gated because they mutate the production
   Supabase; unblock with an isolated staging DB.
