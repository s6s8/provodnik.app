# Provodnik.app — Audit Fix Plan

**Date:** 2026-04-06
**Source:** AUDIT-REPORT.md (15 findings: 3 critical, 6 major, 5 minor)

---

## Phase A: Critical Fixes (Must Do Before Launch)

### A1. Remove dev debug bar from production (Finding #1)
- **Complexity:** S
- **Files:** `src/components/shared/workspace-role-nav.tsx`, `src/app/(protected)/layout.tsx`
- **Root cause:** `WorkspaceRoleNav` unconditionally renders a "Локальный демо-режим" section with role-switching buttons that call `signInAs()` — writing a demo session cookie that grants role access to ALL authenticated users.
- **Fix:** Wrap demo controls block in `if (process.env.NODE_ENV !== 'production')` guard. The role navigation tabs should remain but should only navigate to the user's own role workspace in production.
- **Verification:** `bun run build`, confirm demo controls absent from production bundle.

### A2. Fix Kazan destination hero image (Finding #2)
- **Complexity:** S
- **File:** `supabase/migrations/20260401000002_seed.sql` (line ~251)
- **Root cause:** Kazan row uses `hero_image_url` = Dubai skyline photo (`unsplash/photo-1512453979798-5ea266f8880c`). Same wrong URL used for Nizhny Novgorod.
- **Fix:** Replace Kazan URL with actual Kazan image (e.g. Kazan Kremlin). Replace Nizhny URL with genuine Nizhny image. Run `bun run db:reset`.
- **Verification:** Navigate to `/destinations/kazan-tatarstan`, confirm correct hero.

### A3. Fix destination tour count mismatch (Finding #3)
- **Complexity:** M
- **Files:** `src/data/supabase/queries.ts` (fn `getListingsByDestination`), `src/features/destinations/components/destination-detail-screen.tsx`
- **Root cause (two bugs):**
  1. Stats row reads `listingCount` from static `listing_count` column seeded as "2" for Kazan
  2. Tours section queries `listings` with slug-based `.or('city.ilike...region.ilike...')` — but slug `kazan-tatarstan` doesn't match city `Казань` or region `Татарстан`. Returns 0 results, shows "скоро появятся".
- **Fix:**
  1. Fix `getListingsByDestination` to look up destination by slug first, then query listings by the destination's `name`/`region` values
  2. In `destination-detail-screen.tsx`, derive `listingCount` from `listings.length` instead of static column
- **Depends on:** A2 (clean seed data)
- **Verification:** `/destinations/kazan-tatarstan` shows matching count and actual tour cards.

---

## Phase B: Major UX Fixes (Should Do Before Launch)

### B1. Add forgot password flow (Finding #4)
- **Complexity:** M
- **Files:**
  - Modify: `src/features/auth/components/auth-entry-screen.tsx`
  - New: `src/features/auth/components/forgot-password-screen.tsx`
  - New: `src/app/(auth)/auth/reset-password/page.tsx`
  - New: `src/app/(auth)/auth/update-password/page.tsx`
- **Fix:**
  1. Add "Забыли пароль?" link below password field when in sign-in mode
  2. Create reset page with email input calling `supabase.auth.resetPasswordForEmail()`
  3. Create update-password page that reads token from URL, calls `supabase.auth.updateUser({ password })`
  4. Reuse glass-morphism card styling
- **Verification:** Full flow: click link -> enter email -> check Inbucket -> click reset link -> set new password -> login works.

### B2. Add page-specific titles to protected routes (Finding #5)
- **Complexity:** S
- **Files:** All `page.tsx` files under `src/app/(protected)/` (~20 files)
- **Root cause:** Root layout sets `title.template: "%s — Provodnik"` but protected pages lack `metadata` exports, falling through to `title.default`.
- **Fix:** Add `export const metadata: Metadata = { title: "Мои запросы" }` (Russian) to each page. Template composes automatically.
- **Verification:** Check browser tab title on each protected page.

### B3. Build real traveler dashboard (Finding #6)
- **Complexity:** M
- **File:** `src/app/(protected)/traveler/dashboard/page.tsx` (currently redirects to `/traveler/requests`)
- **Fix (Option A — recommended):** Replace redirect with a server component that fetches summary counts (active requests, bookings, favorites) and displays stat cards + quick-action links using glass-card pattern.
- **Fix (Option B — quicker):** Keep redirect, update nav to point to `/traveler/requests` directly.
- **Verification:** Navigate to `/traveler/dashboard`, see real content.

### B4. Rename/redesign guide dashboard (Finding #7)
- **Complexity:** L
- **Files:**
  - Move: `src/app/(protected)/guide/dashboard/page.tsx` content -> `src/app/(protected)/guide/settings/page.tsx`
  - New: `src/features/guide/components/dashboard/guide-dashboard-screen.tsx`
- **Fix:**
  1. Move onboarding form to `/guide/settings` or `/guide/onboarding`
  2. Build real guide dashboard with stats: listing count, active requests, bookings, recent activity
  3. Redirect unverified guides from dashboard to onboarding
- **Depends on:** B3 (follow same pattern)
- **Verification:** Login as verified guide -> see stats dashboard. Login as new guide -> see onboarding redirect.

### B5. Fix destination budget display (Finding #8)
- **Complexity:** S
- **Files:** `src/features/destinations/components/destination-detail-screen.tsx` (lines 33-34)
- **Root cause:** `minPrice` computation uses `listings.map(l => l.priceRub)` but `listings` is always empty due to A3 bug.
- **Fix:** Fixing A3 will automatically fix this. Add defensive fallback: if listings empty but `destination.listingCount > 0`, show "Скоро" instead of "—".
- **Depends on:** A3
- **Verification:** Destination page shows ruble amount for budget.

### B6. Use listing-specific hero images (Finding #9)
- **Complexity:** M
- **Files:** `src/data/supabase/queries.ts` (fn `mapListingRow`, `parseImageFromJson`), `supabase/migrations/20260401000002_seed.sql`
- **Root cause:** `mapListingRow` calls `parseImageFromJson(row.description)` which tries to JSON.parse the description text — but seed data has plain Russian text, so it always falls back to generic mountain photo.
- **Fix:**
  1. Add `image_url` column to listings table via new migration, or add Unsplash URLs to seed data in a parseable format
  2. Update `mapListingRow` to read from dedicated image column first, fall back to `parseImageFromJson`
- **Verification:** Listing detail pages show destination-appropriate hero images.

---

## Phase C: Polish (Nice to Have)

### C1. Fix auth empty field validation styling (Finding #10)
- **Complexity:** S
- **File:** `src/features/auth/components/auth-entry-screen.tsx` (lines 310, 330, 351)
- **Fix:** Remove `required` HTML attributes from all `<Input>` elements. The existing `handleSubmit` already validates and shows styled errors.
- **Verification:** Clear fields, click Войти, see styled red error box (not browser tooltip).

### C2. Add more guide seed data (Finding #11)
- **Complexity:** M
- **Files:** `supabase/migrations/20260401000002_seed.sql`, `src/app/(site)/guides/page.tsx`
- **Fix:** Add 4-6 more seed guide profiles. Add "Стать гидом" CTA banner at bottom of guides index.
- **Verification:** `/guides` shows 8-10 cards + CTA.

### C3. Fix guide listings empty state for seed account (Finding #12)
- **Complexity:** S
- **File:** `supabase/migrations/20260401000002_seed.sql`
- **Root cause:** `guide@provodnik.test` has ID `30000000-...01` but seed listings belong to different guide IDs (`10000000-...101`, `10000000-...102`).
- **Fix:** Add 1-2 seed listings with `guide_id = '30000000-0000-4000-8000-000000000001'`.
- **Verification:** Login as guide, see listings on `/guide/listings`.

### C4. Improve request detail seed content (Finding #13)
- **Complexity:** S
- **File:** `supabase/migrations/20260401000002_seed.sql`
- **Fix:** Expand `notes` and `format_preference` columns for traveler requests with richer descriptions (2-3 sentences each).

### C5. Increase protected page content density (Finding #14)
- **Complexity:** M (cumulative)
- **Fix:** Meta-issue largely addressed by B3, B4, C2, C3, C4. Add contextual tips/onboarding in empty states.
- **Depends on:** B3, B4, C2, C3, C4

### C6. Add breadcrumbs to protected pages (Finding #15)
- **Complexity:** M
- **Files:** New `src/components/shared/breadcrumbs.tsx`, add to protected layout
- **Fix:** Create server component that maps pathname segments to Russian labels. Render between nav and main content.

---

## Dependency Graph

```
A1 (debug bar)     ─── independent, do first
A2 (Kazan image)   ─── independent, do first
A3 (tour count)    ─── depends on A2
  └─ B5 (budget)   ─── depends on A3
B6 (listing imgs)  ─── independent, parallel with A3
B1 (forgot pw)     ─── independent
B2 (page titles)   ─── independent
B3 (traveler dash) ─── independent
  └─ B4 (guide dash) ── follows B3 pattern
C1 (validation)    ─── independent
C2 (sparse guides) ─── independent
C3 (guide listings)─── independent
C4 (request data)  ─── independent
C5 (sparse pages)  ─── after B3, B4, C2, C3, C4
C6 (breadcrumbs)   ─── independent
```

## Recommended Execution Order

| Batch | Tasks | Can Parallel |
|-------|-------|-------------|
| 1 | A1, A2, C1 | Yes — quick wins |
| 2 | A3, B6 | Yes — query/data fixes |
| 3 | B5 | No — verify after A3 |
| 4 | B1, B2 | Yes — auth + metadata |
| 5 | B3, C3 | Yes — traveler dash + seed fix |
| 6 | B4 | No — follows B3 pattern |
| 7 | C2, C4 | Yes — seed improvements |
| 8 | C6 | No — breadcrumbs |
| 9 | C5 | No — final polish pass |
