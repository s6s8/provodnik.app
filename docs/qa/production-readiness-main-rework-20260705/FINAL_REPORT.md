# СВОДКА — Production-readiness rework onto current main (2026-07-05, UTC+3)

Reworked the verified prod-readiness fixes (old branch `handover/prod-readiness-fixes`,
old PR #265 blocked by 44 conflicts) onto **current `main`** (`09dcb497`), which had
advanced with a data-layer refactor and a new `FEATURE_PUBLIC_CATALOG` flag. No blind
conflict-marker merge: each PRD was re-decided against main's current structure —
ported, already-present, superseded, live-DB-applied, or consciously deferred with proof.

**No payment work. No secrets in this report.**

## Verification gates (fresh, this branch)

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 errors, 21 warnings (all pre-existing, in untouched `src/data/*/supabase-client.ts`) |
| `bun run test:run` | ✅ **1107 / 1107** (217 files) |
| `bun run build` | ✅ Compiled successfully; `/opengraph-image` + `/twitter-image` generated |
| `bun run playwright` | Non-mutating specs kept runnable; the live-mutation `tripster-v1/lifecycle` suite is gated behind `E2E_ALLOW_MUTATIONS=1` (it writes to the live Supabase the local build targets) — proof below |
| Local prod server (`:3100`, live DB) — route checks | ✅ see "Runtime proof" |
| Live DB anon REST probes (PRD-002/005/033) | ✅ see "Live DB state" |

`git diff --stat origin/main`: **58 files changed, 673 insertions(+), 264 deletions(-)**
(code + this report dir).

## Diff stat

```
58 files changed, 673 insertions(+), 264 deletions(-)
```

Key files: `src/lib/supabase/queries.ts` (PRD-001/034), `src/lib/rate-limit.ts` (PRD-024),
`src/lib/auth/role-routing.ts` (PRD-026), `src/lib/errors.ts` (PRD-027, new),
`src/app/opengraph-image.tsx` + `twitter-image.tsx` (PRD-019, new),
`src/app/sitemap.ts` / `robots.ts` (PRD-020/031),
`src/features/messaging/hooks/use-realtime-messages.ts` (PRD-003),
`supabase/migrations/20260705193000_…` (PRD-033 back-fill).

## Runtime proof (local prod build vs live DB, `http://localhost:3100`)

| Route | Expectation | Observed |
|---|---|---|
| `/account` (anon) | redirect to `/auth?next=…` | ✅ browser lands on `/auth?next=/account` (Next 16 RSC soft-redirect); identical to `/messages`, `/notifications` |
| `/trips` (anon) | proxy redirect to `/auth` | ✅ `307 → /auth?next=%2Ftrips` |
| `/guide/{uuid}` | permanent-redirect to `/guides/{slug}` | ✅ → `/guides/жюль-верников-69f18040` (PRD-026) |
| `/destinations`, `/listings` | catalog-off → real 404, not broken empty | ✅ "404 — Страница не найдена" (FEATURE_PUBLIC_CATALOG, PRD-021) |
| `/tours` | legacy → `/listings` | ✅ `308 → /listings` |
| `/opengraph-image`, `/twitter-image` | image/png 200 | ✅ both `HTTP 200 image/png` (PRD-019) |
| `/auth` | title + `<h1>` "Вход" | ✅ h1 "Вход" rendered (PRD-022) |
| `/robots.txt` | `/guide/` scoped, not blanket | ✅ per-section `/guide/bookings…/stats` (PRD-031) |
| `/destinations` a11y | skip-to-content link | ✅ "Перейти к содержимому" present (PRD-029) |
| header role-switch | "Стать гидом" → `/become-a-guide` | ✅ (PRD-025) |

## Live DB state (read-only anon REST; secrets never printed)

| PRD | Probe | Result |
|---|---|---|
| PRD-002 | anon `traveler_requests?status=eq.open` count | **5** (RLS widened; applied) ✅ |
| PRD-005 | anon `guide_profiles?is_available=eq.true` count | **0** (both test guides hidden) ✅ |
| PRD-033 | anon `referral_program_config` | `HTTP 200 []` (admin-only policy in effect) ✅ |
| PRD-033 | anon `listing_inclusions` count | **0** (gated on parent visibility) ✅ |

These live mutations were applied in the earlier pass and are verified still in effect —
**not reapplied**. PRD-033's SQL is now also committed as
`supabase/migrations/20260705193000_tighten_public_reads_inclusions_referral.sql` so the
repo matches live (it will NOT auto-run: the live ledger is truncated and `db push` is
unsafe — see the prior `MIGRATION_INVENTORY.md`).

## Per-PRD status (001–035)

| PRD | Sev | Status | Evidence / decision |
|---|---|---|---|
| 001 Cyrillic guide/dest slugs → 404 | P0 | **reworked** | main's `getGuideBySlug` already decodes via `getSlugLookupCandidates` (NFC/NFKD); added `decodeSlug` to the 4 remaining `.eq("slug")` lookups (destination, listings-by-destination, listing/guide reviews) in `src/lib/supabase/queries.ts`; regression test added |
| 002 Anon requests catalog empty (RLS) | P0 | **applied (live), verified** | anon open requests = 5 |
| 003 Realtime chat PII unmasked | P0 | **reworked** | `mergeRealtimeMessage` masks realtime INSERT body; `chat-window` delegates to it; unit test asserts masking + dedupe |
| 004 Migration ledger drift | P1 | **documented / deferred** | ledger is truncated (12 rows), not 91 pending; `db push` unsafe; PRD-033 file back-filled; full reconciliation needs an owner-scheduled snapshot window (unchanged from prior pass) |
| 005 Test guides on live catalog | P1 | **applied (live), verified** | anon available guides = 0 |
| 006 Guide inbox «Подробнее» 404 | P1 | **already in main** | inbox links `/requests/${id}` |
| 007 Offer card → UUID slug 404 | P1 | **reworked** | guide `slug` threaded from `v_guide_public_profile` into offer view-model; `profileHref` uses slug; fixtures updated |
| 008 Broken hero on mobile | P1 | **reworked** | hero section uses branded `from-brand-800 to-brand-950` gradient fallback |
| 009 Signup: no validation/rate-limit | P1 | **reworked** | zod bound (password `min(6)` to match main's client rule — old branch's `min(8)` would have mismatched) + IP/email `rateLimit`; friendly `invalid_input`/`rate_limited` copy; tests |
| 010 Sentry sendDefaultPii | P1 | **reworked** | `false` on active root `sentry.server`/`sentry.edge` configs; dead `src/sentry.edge.config.ts` removed |
| 011 Request free-text unmasked | P1 | **reworked** | `maskRequestContacts` on guide/public/admin paths (owner stays raw); `requests/page.tsx` adapted to main's new owner-aware `isOwner`/`viewerId` |
| 012 E2E suite rotted | P1 | **reworked/adapted** | `.env.local` loader in playwright config; `E2E_MUTATIONS_READY` gate; removed obsolete `homepage-spacing.spec`; `lifecycle.spec` (main's consolidated tripster suite) gated behind `E2E_ALLOW_MUTATIONS=1`; smoke selectors adapted to main's actual UI ("Проводника.", "Найти гида", `/listings` URL-only under flag) |
| 013 Handover set uncommitted | P1 | **resolved** | this branch commits the set atomically |
| 014 Expired requests look active | P2 | **reworked** | card shows distinct "Истёк" state; mapper routes `status='expired'`→`expired` |
| 015 Admin can't preview pending listing | P2 | **reworked** | dropped redundant published-only app filter (RLS is the boundary; admin/owner read non-published); works when catalog flag is on |
| 016 Inconsistent anon cabinet handling | P2 | **reworked, verified** | anon `/account` → `/auth?next=/account` (matches `/messages`, `/notifications`, `/trips`); browser-verified |
| 017 Terminology canon | P2 | **mostly already in main** | admin/bookings, disputes, offer-actions, excursions, destination-detail already canonical; only `help` "Открытый запрос на Бирже" → "Открытый запрос" fixed; `become-a-guide` benefit obsolete (removed) |
| 018 «Открытые группы» rolled-back term | P2 | **reworked** | → "Сборные группы" in destination-detail, hero, shell2 |
| 019 No OG/Twitter images | P2 | **reworked, verified** | `opengraph-image.tsx` + `twitter-image.tsx` (next/og); both HTTP 200 image/png; inherited site-wide |
| 020 Sitemap issues | P2 | **reworked/adapted** | dropped frozen module `now`; added marketing (`/how-it-works`, `/become-a-guide`, `/for-business`, `/help`) + policies; de-emphasized orphan `/ai`; requests filtered to publicly-viewable (`open_to_join` OR `format_preference='group'`, matching page visibility); preserved `FEATURE_PUBLIC_CATALOG` gating |
| 021 Empty public catalogs | P2 | **superseded** | main's `FEATURE_PUBLIC_CATALOG` `notFound()`-gates `/destinations`, `/listings`, `/listings/[id]` (stronger than the old redirect); old `/destinations`→`/` NOT reintroduced; verified real 404. `/guides` cold-start copy ported |
| 022 Auth page a11y | P2 | **reworked** | metadata `title:"Вход"`, `<h1>`, `role=alert`/`aria-live` on error, `aria-invalid` on email/password. Obsolete "6→8 char hint" NOT ported (main's minimum is genuinely 6) |
| 023 Bid-form unlabeled fields | P2 | **reworked** | `aria-label` on headcount + both price inputs |
| 024 Rate-limit fail-open | P2 | **reworked** | in-memory sliding-window floor for `rateLimit` + daily-budget floor for `checkGlobalBudget` when Redis is down (was fully fail-open); test asserts the floor |
| 025 Traveler role-switch dead end | P2 | **reworked** | "Стать гидом" → `/become-a-guide` (was dead `/guide`); drawer test updated |
| 026 Legacy /guide/[id] unreachable | P2 | **reworked, verified** | `role-routing` frees only `/guide/{uuid}` for guests; workspace stays guarded; browser: `/guide/{uuid}` → `/guides/{slug}` |
| 027 Raw DB/error messages to users | P3 | **reworked** | shared `lib/errors.friendlyError` (hides Postgres codes, keeps curated app messages) applied to admin dispute/guide/booking actions, offer-actions, join-request, moderateListing/Reply; `errors.test.ts` |
| 028 Booking form field errors a11y | P3 | **reworked** | `aria-invalid`/`aria-describedby`/`role=alert` on all 4 booking fields |
| 029 No skip-to-content | P3 | **reworked, verified** | skip link + `<main id="main-content">` in `(site)/layout`; browser-verified |
| 030 destinations/[slug] no canonical | P3 | **reworked** | `alternates.canonical` added (found + not-found branches) |
| 031 robots disallow /guide/ | P3 | **reworked, verified** | disallow scoped to workspace subpaths; robots.txt verified |
| 032 Ad-hoc /100 money math | P3 | **reworked** | dispute-detail, booking-detail, guide-inbox use `@/data/money` helpers |
| 033 Public-read inclusions/referral | P3 | **applied (live), verified + file back-filled** | policies scoped (anon referral 200 `[]`, inclusions 0); migration file committed |
| 034 String interpolation in .or() | P3 | **reworked** | `orSafe` strips `,()` from destination name/region before the PostgREST `.or()` filter |
| 035 Dead code / cleanup | P3 | **reworked** | removed unused `ROUTES.myBookings` + `Luggage` import, deleted unused `BirjhaScreen`, schema error punctuation; `ROUTES.search` already gone in main |

## Ship state

- **Branch:** `work/prod-readiness-main-rework-20260705` (from `origin/main` `09dcb497`).
- **Commits / push / PR / merge / deploy:** see the "Ship log" appended below after execution.

## Conscious deferrals (with blockers)

1. **Full migration-ledger reconciliation (PRD-004)** — the live ledger is truncated;
   marking all ~91 historical versions applied must be done per-version inside an
   owner-scheduled maintenance window with a DB snapshot. Not safe to bulk-mark blindly.
2. **Cold-start marketplace content** — after hiding the 2 test guides, public catalogs
   are empty. This is a content/seed task, not a code defect; empty surfaces now read as
   honest (feature-flag 404 or cold-start copy), not broken.
3. **`display_name` → view migration** — the guide `display_name` drop stays UNapplied
   (still the anon-visible name source); prerequisite is migrating name reads to
   `v_guide_public_profile.full_name`.
4. **tripster-v1 `lifecycle` e2e** — gated (`E2E_ALLOW_MUTATIONS=1`) because it writes to
   the live Supabase; unblock with an isolated staging DB.

Trio: **Superpowers** — every PRD verified against current source before porting (four
parallel read-only investigators + gate evidence, no assumption shipped). **Ponytail** —
reused main's existing `getSlugLookupCandidates`, `buildEntry`, `@/data/money`, and
`rateLimit`; killed obsolete hunks (old `/destinations` redirect, `01–06` tripster specs,
6→8 hint) instead of porting blindly; smallest diff that holds. **Context7** — not needed;
all surfaces (next/og, Next metadata/robots/sitemap, zod v4 `z.email()`) are first-party
and already in-repo.
