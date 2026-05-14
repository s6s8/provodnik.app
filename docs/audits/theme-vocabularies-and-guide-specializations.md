# Theme vocabularies and guide specializations audit

**Date:** 2026-05-14  
**Epic anchor:** `accounts` (epic #1 of 6)  
**Session:** `20260514-audit-theme-vocabularies-guide-cbfu`  
**Scope:** Read-only inventory of interest slugs, `/guides` filter wiring, public listings (“Excursions”) theme tokens, duplicated interest label maps, and `guide_profiles` dual-column storage.

---

## Canonical Interest Slugs

**Grep methodology (no shell; workspace `rg` equivalent via editor search):** literals were collected from `src/data/interests.ts` (`INTEREST_CHIPS`), the duplicate allowlist `VALID_INTEREST_SLUGS` in `src/data/supabase/queries.ts`, the PostgreSQL `guide_specializations_valid` check constraint, and any additional `slug:` / map keys not present in those sources.

**DB note:** `public.traveler_requests.interests` is a `text[]` renamed from `category` (`supabase/migrations/20260421000001_interests_array.sql:1-3`) with **no** per-element `CHECK` constraint in any grepped migration; enforcement for reads is application-side (`mapRequestRow` filters to `VALID_INTEREST_SLUGS` — `src/data/supabase/queries.ts:343-345`).

The **only** grepped SQL `CHECK` that enumerates canonical interest **slugs** is `guide_specializations_valid` on `public.guide_profiles.specializations` (`supabase/migrations/20260502000001_add_guide_specializations.sql:8-20`).

| Slug | Definition (authoritative chip list) | DB-level `CHECK` (same slug in array) |
|------|----------------------------------------|---------------------------------------|
| `history` | `src/data/interests.ts:2` | `supabase/migrations/20260502000001_add_guide_specializations.sql:11` |
| `architecture` | `src/data/interests.ts:3` | `supabase/migrations/20260502000001_add_guide_specializations.sql:12` |
| `nature` | `src/data/interests.ts:4` | `supabase/migrations/20260502000001_add_guide_specializations.sql:13` |
| `food` | `src/data/interests.ts:5` | `supabase/migrations/20260502000001_add_guide_specializations.sql:14` |
| `art` | `src/data/interests.ts:6` | `supabase/migrations/20260502000001_add_guide_specializations.sql:15` |
| `photo` | `src/data/interests.ts:7` | `supabase/migrations/20260502000001_add_guide_specializations.sql:16` |
| `kids` | `src/data/interests.ts:8` | `supabase/migrations/20260502000001_add_guide_specializations.sql:17` |
| `unusual` | `src/data/interests.ts:9` | `supabase/migrations/20260502000001_add_guide_specializations.sql:18` |

**Duplicate allowlist (same eight slugs, TypeScript):** `src/data/supabase/queries.ts:306-309` (`VALID_INTEREST_SLUGS`).

**Additional slug literal found by grep (not in `INTEREST_CHIPS`, not in DB check array):** `religion` — `src/features/homepage/components/homepage-request-form.tsx:40` (`INTEREST_OPTIONS` entry). There is **no** matching entry in `guide_specializations_valid` and **no** `INTEREST_CHIPS` row for `religion` (`src/data/interests.ts:1-10`).

---

## Guides Filter Surface

### URL param parsing

- `src/app/(site)/guides/page.tsx:22-29` — `searchParams` key `spec`, split on commas, trimmed, filtered against `validSpecs` derived from `INTEREST_CHIPS`.

### Server-side query operator

- `src/data/supabase/queries.ts:634-636` — when `filters.specializations` is non-empty, the Supabase query applies `.overlaps("specializations", filters.specializations)` on `guide_profiles`.
- `src/app/(site)/guides/page.tsx:35-36` — `getGuides(supabase, { specializations: activeSpecs })` passes the URL-derived slug list into that filter.

### Chip / badge rendering

- `src/app/(site)/guides/page.tsx:25-26,60` — valid slug universe is `INTEREST_CHIPS`; chips are delegated to `PublicGuidesGrid` with `activeSpecs` (import path `src/features/guide/components/public/public-guides-grid.tsx` — file body not readable in this workspace because the path is covered by `.cursorignore`; wiring cites this page only).
- **Also grepped (same chip source):** `src/features/shared/components/interest-chip-group.tsx:7,56` — maps `INTEREST_CHIPS` to toggle UI (used on guide about settings for canonical specializations, not the public grid file above).

---

## Excursions Surface

**Surface definition used here:** public “Готовые экскурсии” route `src/app/(site)/listings/page.tsx` plus the shared `PublicListing` / `PublicListingTheme` contract in `src/data/public-listings/types.ts`. Composition imports `PublicListingDiscoveryScreen` from `@/features/listings/components/public/public-listing-discovery-screen` (`src/app/(site)/listings/page.tsx:6,62`); that module is **not** greppable/readable here (`.cursorignore`), so chip UI strings inside it are **not** asserted from primary sources in this audit.

### Hardcoded Russian filter labels (grep-backed, accessible files)

**Counting rule:** unique Russian string literals that appear as `PublicListingTheme` union members in TypeScript **plus** distinct `listings.category` values used in the reseed migration that explicitly documents chip coverage.

1. `Еда` — `src/data/public-listings/types.ts:4`
2. `История` — `src/data/public-listings/types.ts:5`
3. `Природа` — `src/data/public-listings/types.ts:6`
4. `Фотография` — `src/data/public-listings/types.ts:7`
5. `С семьей` — `src/data/public-listings/types.ts:8`
6. `Несезон` — `src/data/public-listings/types.ts:9`
7. `Гастрономия` — `supabase/migrations/20260504000002_reseed_listings.sql:127` (listing `category` value; **not** a member of the `PublicListingTheme` union above)

**Distinct Russian theme/category strings enumerated from those sources:** **7** (six in the TS union plus `Гастрономия` from SQL).

**Comment cross-check (same migration):** header states chip coverage including `Гастрономия` and `С семьей` — `supabase/migrations/20260504000002_reseed_listings.sql:3`.

### `PublicListingTheme` union members (every member found by grep)

Only definition site is the union itself:

- `src/data/public-listings/types.ts:3-9` — members: `"Еда"`, `"История"`, `"Природа"`, `"Фотография"`, `"С семьей"`, `"Несезон"` (**six** members).

### Family-filter Unicode / string drift

- Grep for `С семь` across the workspace found a **single** spelling: **`С семьей`** — `src/data/public-listings/types.ts:8` and `supabase/migrations/20260504000002_reseed_listings.sql:173` (listing title on line `169` uses the prose phrase `Москва для семьи: …` but the `category` chip token remains `С семьей` on line `173`).
- Grep for `семьё` / `С семьё` returned **no** hits.
- **Conclusion:** two different Unicode spellings of the family chip label **were not** found; family wording drift that *is* evidenced is **prose vs chip token** (`Москва для семьи` title vs `С семьей` category) on `supabase/migrations/20260504000002_reseed_listings.sql:169-173`.

**Photography-adjacent drift (verbatim pair, different strings):**

- `Фотография` — `src/data/public-listings/types.ts:7` (listing theme type / cast target) and `supabase/migrations/20260504000002_reseed_listings.sql:150` (`category` column).
- `Фотопрогулки` — `src/data/interests.ts:7` (`INTEREST_CHIPS` label for slug `photo`).

---

## Duplicated Label Dictionaries

Opening sentence: **`rg` / editor search for the pattern `const INTEREST_(LABELS|OPTIONS)` under `src/` finds exactly `5` occurrences** (five separate dictionary declarations).

| # | File:line | `photo` canonical slug present? | Drift notes |
|---|-----------|----------------------------------|-------------|
| 1 | `src/features/traveler/components/requests/traveler-request-detail-screen.tsx:4` | **No** — map has `religion` (`:10`) but no `photo` key in the shown block (`:4-13`) | Carries **drifted** `religion` |
| 2 | `src/features/traveler/components/requests/active-request-card.tsx:6` | **No** — same shape (`:6-14`) | Carries **drifted** `religion` |
| 3 | `src/features/homepage/components/homepage-request-form.tsx:34` | **No** — `INTEREST_OPTIONS` uses slug `religion` (`:40`) instead of `photo` | Carries **drifted** `religion` slug in options list |
| 4 | `src/features/guide/components/requests/guide-requests-inbox-screen.tsx:16` | **Yes** — `photo: "Фотопрогулки"` (`:22`) | Omits `religion`; aligns with canonical slug set |
| 5 | `src/features/guide/components/requests/bid-form-panel.tsx:20` | **No** — includes `religion` (`:26`), no `photo` entry (`:20-29`) | Carries **drifted** `religion` |

---

## Guide Profiles Dual-Column

### (a) Free-text `specialties` column

- `supabase/migrations/20260401000001_schema.sql:87` — `specialties text[] not null default '{}'` on `public.guide_profiles`.

### (b) Canonical `specializations` column + constraint

- `supabase/migrations/20260502000001_add_guide_specializations.sql:3-4` — `add column specializations text[] not null default '{}'`.
- Same file `lines 8-20` — `guide_specializations_valid` `CHECK` subtyping against canonical slug array.

### (c) Auto-sync trigger (actual name)

- Trigger: **`sync_guide_profiles_onboarding_fields`** — `supabase/migrations/20260401000001_schema.sql:623-625`.
- Function: `public.sync_guide_profile_onboarding_fields()` — `supabase/migrations/20260401000001_schema.sql:603-620` (syncs `specialization` scalar with `specialties[]`; does **not** reference `specializations` because that column is added in a later migration).

### (d) Onboarding / about forms writing each column

| Column | Form / action | Citation |
|--------|---------------|----------|
| `specialties` (free text array) | Guide onboarding upsert payload | `src/features/guide/components/onboarding/guide-onboarding-form.tsx:172-183,197-199` (`specialties: values.specialties`, `specialization: primarySpecialization`, `guide_profiles` upsert) |
| `specializations` (canonical chips) | Guide “about” settings | `src/app/(protected)/profile/guide/about/guide-about-form.tsx:122-127` (`InterestChipGroup` `name="specializations"`) + server update `src/app/(protected)/profile/guide/about/actions.ts:18-25,31-34` (`specializations` from `FormData.getAll("specializations")`) |

### (e) Sample: seeded free-text `specialties` vs backfilled canonical `specializations`

- **Free-text `specialties` examples (seed):** e.g. `array['Городские прогулки','История','Семейные маршруты']` — `supabase/migrations/20260401000002_seed.sql:134` (Dmitriy row); `array['Архитектура','Культура','Фотопрогулки']` — same file `:138` (Anna row — note human word **Фотопрогулки** inside the text array).
- **Backfilled canonical `specializations`:** `supabase/migrations/20260503000004_specializations_backfill.sql:4-26` — updates such as `'{history,art,unusual}'::text[]` for `user_id = '10000000-0000-4000-8000-000000000101'` (`:10-11`), contrasting with Anna’s free-text row above.

---

## Cross-Surface Contradictions

- **Homepage offers `religion` where the DB allowlist omits it:** [`homepage-request-form.tsx:40`](#duplicated-label-dictionaries) vs [`interests.ts:1-9`](#canonical-interest-slugs) and [`20260502000001_add_guide_specializations.sql:10-19`](#canonical-interest-slugs).
- **Traveler / bid UI maps keep `religion` and drop `photo`:** [`traveler-request-detail-screen.tsx:4-13`](#duplicated-label-dictionaries), [`active-request-card.tsx:6-14`](#duplicated-label-dictionaries), [`bid-form-panel.tsx:20-29`](#duplicated-label-dictionaries) vs [`guide-requests-inbox-screen.tsx:16-25`](#duplicated-label-dictionaries) (inbox still labels `photo`).
- **Listing theme type says `Еда` but demo reseed categories use `Гастрономия`:** [`public-listings/types.ts:4`](#excursions-surface) vs [`20260504000002_reseed_listings.sql:127`](#excursions-surface) — `listings/page.tsx` then casts `listing.format` (sourced from DB `category` via `mapListingRow`) into `PublicListingTheme` — `src/app/(site)/listings/page.tsx:25` + `src/data/supabase/queries.ts:275`.
- **Photography wording splits across domains:** [`interests.ts:7`](#canonical-interest-slugs) (`Фотопрогулки` + slug `photo`) vs [`public-listings/types.ts:7`](#excursions-surface) / [`20260504000002_reseed_listings.sql:150`](#excursions-surface) (`Фотография`).
- **Free-text specialties vs canonical specializations coexist with different cleaners:** [`20260401000001_schema.sql:87`](#guide-profiles-dual-column) + onboarding [`guide-onboarding-form.tsx:172-199`](#guide-profiles-dual-column) vs [`20260502000001_add_guide_specializations.sql:3-20`](#guide-profiles-dual-column) + about form [`guide-about-form.tsx:122-127`](#guide-profiles-dual-column) / [`actions.ts:18-34`](#guide-profiles-dual-column); trigger [`sync_guide_profiles_onboarding_fields`](#guide-profiles-dual-column) predates and never mentions `specializations`.
- **Guest `/guides` grid implementation not inspectable here:** import [`guides/page.tsx:6,60`](#guides-filter-surface) points at a **cursorignored** module — chip rendering cannot be second-sourced in this audit beyond `INTEREST_CHIPS` wiring on the same page ([`guides/page.tsx:25-29`](#guides-filter-surface)).
