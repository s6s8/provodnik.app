# NEXT_PLAN.md — Provodnik: Phase 8 to Launch

> STATUS (2026-04-06): Phase 8 COMPLETE. Phase 10.1 COMPLETE. Site live at provodnik.app.
> Post-audit polish COMPLETE: nav links (Туры/Запросы), account indicator, logout fix, footer links, DB seed.
> B1 (forgot password) DEFERRED by user until Resend SMTP configured.
> Next: Phase 12 — itinerary segments, analytics, payment groundwork.

> Generated: 2026-04-06
> Based on: full codebase audit (AUDIT-REPORT.md), AUDIT-FIX-PLAN.md, PLAN.md phases 0–7,
> STAKEHOLDER-FEEDBACK.md (7 changes), ERRORS.md (ERR-001–007), research on Supabase auth
> patterns and Next.js metadata API.
> Status of phases 0–7: scaffolded and committed, but 15 post-audit findings remain open.

---

## Executive Summary

Phases 0–7 are committed. The app compiles and routes are functional. However, a full CDP-based
audit on 2026-04-06 found 15 issues: 3 critical (including a security access-control bypass),
6 major UX gaps, and 6 minor polish items. None were caught because phases were marked complete
on commit, not on verified walkthrough.

Phase 7's non-code launch tasks (domain, DNS, SSL, backups, real guides) are also outstanding.

**The path to soft launch is: Phase 8 (audit fixes) → Phase 9 (launch infra ops) → Phase 10
(stakeholder feature catch-up) → Phase 11 (soft launch). Estimated: 4–5 days.**

---

## Phase 8 — Audit Fixes
> Execute AUDIT-FIX-PLAN.md in dependency/journey order.
> Run `bun run build && bun run typecheck` after every batch. Run CDP walkthrough after batch 5.

### Batch 1 — Security & Quick Wins (PARALLEL, ~1 hour)

**8.A1 — Remove demo debug bar from production** ← DO FIRST, SECURITY
- File: `src/components/shared/workspace-role-nav.tsx`
- Fix: Wrap demo controls block in `{process.env.NODE_ENV !== 'production' && (...)}`
- Verification: `bun run build`, confirm bundle has no signInAs references in prod output
- ERRORS.md ref: ERR-002

**8.A2 — Fix Kazan + Nizhny Novgorod destination images**
- File: `supabase/migrations/20260401000002_seed.sql`
- Fix: Replace hero_image_url for kazan-tatarstan and nizhny-novgorod with correct Russian city photos
- Verification: `bun run db:reset`, navigate to /destinations/kazan-tatarstan, confirm Kazan Kremlin
- ERRORS.md ref: ERR-003

**8.C1 — Fix auth empty-field validation (browser tooltip → styled error)**
- File: `src/features/auth/components/auth-entry-screen.tsx`
- Fix: Remove `required` HTML attributes from all Input elements (lines ~310, 330, 351)
- Verification: Clear fields, click Войти, see red styled error box, not browser tooltip
- ERRORS.md ref: ERR-006

---

### Batch 2 — Data Query Fixes (PARALLEL, ~2 hours)

**8.A3 — Fix destination tour count + query mismatch**
- Files:
  - `src/data/supabase/queries.ts` fn `getListingsByDestination`
  - `src/features/destinations/components/destination-detail-screen.tsx`
- Fix 1: Resolve slug → destination record first, then query listings by `destination.name`/`destination.region`
- Fix 2: Derive `listingCount` from `listings.length` (prefer live count over static column)
- Verification: /destinations/kazan-tatarstan shows matching stat + real tour cards
- ERRORS.md ref: ERR-001, ERR-005

**8.B6 — Fix listing-specific hero images**
- Files:
  - New migration: add `image_url TEXT` column to `listings` table
  - `supabase/migrations/20260401000002_seed.sql`: populate image_url per listing with destination-appropriate photos
  - `src/data/supabase/queries.ts` fn `mapListingRow`: read `image_url` first, fall back to existing logic
- Verification: /listings — each card shows distinct destination-appropriate image
- ERRORS.md ref: ERR-004

---

### Batch 3 — Derived Fix (AFTER Batch 2, ~30 min)

**8.B5 — Fix destination budget showing "—"**
- File: `src/features/destinations/components/destination-detail-screen.tsx`
- Root cause: minPrice computed from listings.map, but listings were always empty (fixed in A3)
- Additional fix: Add defensive fallback — if listings still empty but listingCount > 0, show "Скоро"
- Verification: /destinations/moscow shows ruble budget amount

---

### Batch 4 — Auth Flows (PARALLEL, ~2 hours)

**8.B1 — Add forgot password flow**
- Context: Supabase `resetPasswordForEmail(email, { redirectTo })` + `verifyOtp({ type: 'recovery', token_hash })` + `updateUser({ password })`
- Files:
  - Modify: `src/features/auth/components/auth-entry-screen.tsx` — add "Забыли пароль?" link below password field (sign-in mode only)
  - New: `src/app/(auth)/auth/forgot-password/page.tsx` — email input, calls `resetPasswordForEmail`
  - New: `src/app/(auth)/auth/update-password/page.tsx` — new password input, calls `updateUser`
  - The `/auth/confirm` callback route (already exists from Phase 1) handles token_hash exchange
- Infra dependency: redirectTo URL must be whitelisted in Supabase Dashboard → Auth → URL Configuration.
  In dev, use `http://localhost:3000`. In prod, use `https://provodnik.app`.
- Glass card styling: reuse existing auth card pattern
- Verification: Full flow — click link → enter email → check Inbucket → click reset link → set new password → login works

**8.B2 — Add page-specific titles to all protected routes**
- Context: Root layout already exports `title: { template: "%s — Provodnik", default: "Provodnik" }`.
  Any Server Component page.tsx can export `export const metadata: Metadata = { title: "..." }`.
  Client Component pages must export metadata from their page.tsx wrapper (which is always a Server Component).
- Files: All page.tsx files under `src/app/(protected)/` (~20 files)
- Russian titles to use:
  - /traveler/dashboard → "Личный кабинет"
  - /traveler/requests → "Мои запросы"
  - /traveler/requests/new → "Новый запрос"
  - /traveler/bookings → "Мои поездки"
  - /traveler/open-requests → "Открытые группы"
  - /traveler/favorites → "Избранное"
  - /guide/dashboard → "Кабинет гида"
  - /guide/listings → "Мои туры"
  - /guide/listings/new → "Новый тур"
  - /guide/requests → "Входящие запросы"
  - /guide/bookings → "Бронирования"
  - /guide/verification → "Верификация"
  - /admin/dashboard → "Панель оператора"
  - /admin/guides → "Проверка гидов"
  - /admin/listings → "Модерация туров"
  - /admin/disputes → "Споры"
  - /messages → "Сообщения"
  - /notifications → "Уведомления"
- Verification: Check browser tab title on each protected page

---

### Batch 5 — Dashboard Builds (PARALLEL then SEQUENTIAL, ~3 hours)

**8.B3 — Build real traveler dashboard** (run first)
- File: `src/app/(protected)/traveler/dashboard/page.tsx` (currently redirects)
- Fix: Replace redirect with a Server Component that:
  1. Fetches: active request count, booking count, favorites count, recent request titles
  2. Renders: 3 stat cards (glass-card pattern) + quick-action links + recent activity list
  3. Pattern: match existing glass-card and stats row patterns from admin dashboard
- Stat queries: reuse existing TanStack Query hooks if available, else add to queries.ts
- Verification: /traveler/dashboard shows real data cards, no redirect

**8.C3 — Fix guide seed account listings** (parallel with B3)
- File: `supabase/migrations/20260401000002_seed.sql`
- Fix: Add 2 seed listings with `guide_id = '30000000-0000-4000-8000-000000000001'`
- Verification: Login as guide@provodnik.test → /guide/listings shows 2 tour cards
- ERRORS.md ref: ERR-007

**8.B4 — Build real guide dashboard** (AFTER B3 — follow same pattern)
- Files:
  - Move form content from `src/app/(protected)/guide/dashboard/page.tsx` → new `src/app/(protected)/guide/settings/page.tsx`
  - Build new `src/app/(protected)/guide/dashboard/page.tsx` as Server Component with:
    1. Stats: listing count, incoming request count, pending booking count, average rating
    2. Quick actions: "Добавить тур", "Смотреть запросы"
    3. Onboarding redirect: if guide verification_status !== 'approved', show onboarding banner
  - Update navigation: add "Настройки" link pointing to /guide/settings
- Verification: Login as verified guide → see stats. Login as new guide → see onboarding banner.

---

### Batch 6 — Admin fix + Seed Quality (PARALLEL, ~1 hour)

**8.Admin fix — Локализовать статус "Guide" в таблице гидов**
- File: `src/app/(protected)/admin/guides/page.tsx` or its data layer
- Fix: Status column shows "Guide" in English — translate to "Гид" or role-appropriate Russian label
- Verification: /admin/guides table shows Russian status labels

**8.C2 — Add more guide seed data**
- File: `supabase/migrations/20260401000002_seed.sql`
- Fix: Add 4–6 more seed guide profiles with distinct specialties and regions
- Also: Add "Стать гидом" CTA banner at bottom of /guides index page
- Verification: /guides shows 8–10 cards + CTA

**8.C4 — Improve request detail seed content**
- File: `supabase/migrations/20260401000002_seed.sql`
- Fix: Expand `notes` and `format_preference` for traveler requests with 2–3 sentence descriptions
- Verification: /requests/[id] shows rich "О маршруте" content

---

### Batch 7 — Navigation & Polish (SEQUENTIAL, ~1.5 hours)

**8.C6 — Add breadcrumbs to protected pages**
- Files:
  - New: `src/components/shared/breadcrumbs.tsx` — Server Component, maps pathname segments to Russian labels
  - Modify: `src/app/(protected)/layout.tsx` — render Breadcrumbs between nav and main content
- Russian segment map: traveler→"Путешественник", guide→"Гид", admin→"Оператор", requests→"Запросы", listings→"Туры", bookings→"Поездки", favorites→"Избранное", verification→"Верификация", settings→"Настройки", messages→"Сообщения", notifications→"Уведомления"
- Verification: /traveler/requests shows "Путешественник / Запросы" breadcrumb

**8.C5 — Content density pass (after all above)**
- Meta-issue: largely resolved by B3, B4, C2, C3, C4
- Any remaining empty states: add contextual onboarding tips
- Verification: All protected pages feel populated and purposeful

---

## Phase 9 — Launch Infrastructure (Ops Tasks — Human Operator Required)
> These are NOT code tasks. They require login access to Vercel, Supabase, and DNS provider.
> Track as a checklist; do not assign to Codex agents.

- [ ] **9.1** Vercel: connect provodnik.app domain → Vercel deployment
- [ ] **9.2** Cloudflare/DNS: point A/CNAME records to Vercel
- [ ] **9.3** SSL: verify auto-provisioned by Vercel (Let's Encrypt); test HTTPS
- [ ] **9.4** Supabase Dashboard → Auth → URL Configuration: add `https://provodnik.app` to allowed redirect URLs
- [ ] **9.5** Supabase Dashboard → Auth → Custom SMTP: connect Resend (API key `RESEND_API_KEY` already in codebase); enables real password reset emails + notification emails
- [ ] **9.6** Vercel Environment Variables: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://provodnik.app`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`
- [ ] **9.7** Supabase: enable daily point-in-time backups (Pro plan required or manual pg_dump cron)
- [ ] **9.8** Sentry: verify DSN is active, create Provodnik project in Sentry dashboard
- [ ] **9.9** Upstash Redis: create production instance, configure rate-limiting env vars

---

## Phase 10 — Stakeholder Feature Catch-up (~1 day code)
> Implements two of GG's requests that were deferred from their original phases.

**10.1 — "Гиды в этом городе" on destination pages** (Stakeholder Change 6)
- Files:
  - New: `src/features/guide/components/public/public-guide-card.tsx` — compact card with avatar, name, rating, specialties, link to profile
  - Modify: `src/features/destinations/components/destination-detail-screen.tsx` — add "Гиды в этом городе" section
  - Modify: `src/data/supabase/queries.ts` — add `getGuidesByDestination(region: string)` query
- Data: filter guide_profiles by region matching destination.region
- Verification: /destinations/moscow shows guide cards for Moscow-based guides

**10.2 — Lighthouse performance audit**
- Run: `npx lighthouse https://provodnik.app --output html --output-path /tmp/lighthouse.html`
- Target: >90 Performance, >90 Accessibility, >90 SEO
- Fix any issues found before opening to public

**10.3 — Mobile QA pass** (Phase 6.11, deferred)
- Test all critical flows on iOS Safari + Android Chrome using Chrome DevTools mobile emulation
- Flows to test: signup, create request, guide onboarding, listing create, booking confirm
- Fix any mobile-specific layout breaks

---

## Phase 11 — Soft Launch

**11.1 — Onboard 3–5 real guides** (7.4)
- Create real Supabase Auth accounts for guides in the launch region
- Complete guide profiles, upload verification docs, approve via admin panel
- Publish 1–2 real listings per guide

**11.2 — Closed beta**
- Invite 10–20 trusted travelers + the 3–5 real guides
- Monitor Sentry for errors
- Monitor realtime behavior (messages, notifications)
- Collect feedback via support email

**11.3 — Post-soft-launch fixes**
- Address any critical bugs from beta
- Before open registration, verify no security regressions

**11.4 — Open registration** (after beta stable for 1 week)

---

## Phase 12 — Post-Launch Product Sprints
> Specifically from GG's stakeholder feedback, not deferred forever.

**12.1 — Itinerary travel segments + transport options** (Stakeholder Change 4)
- Add `travelToNextMinutes`, `travelToNextLabel`, `transportOptions` fields to listing itinerary items
- New migration, updated listing create/edit form, updated listing detail page rendering
- New `ItineraryTravelSegment` component with transport option pills

**12.2 — Analytics** (Phase 6.8)
- Integrate PostHog or Plausible
- Track: page views, request creation, offer submission, booking confirmation, guide onboarding completion

**12.3 — Payment integration groundwork**
- Research: YooKassa / Tinkoff / CloudPayments
- Design escrow model for tour deposits
- No implementation until post-beta signal

---

## Dependency Map

```
8.A1 (security)     ─── MUST BE FIRST, independent
8.A2 (images)       ─── independent
8.C1 (form valid)   ─── independent
      ↓ (all batch 1 complete)
8.A3 (query fix)    ─── independent of batch 1 but must precede B5
8.B6 (listing imgs) ─── independent
      ↓
8.B5 (budget)       ─── after A3
      ↓
8.B1 (forgot pw)    ─── independent, but needs Phase 9.4+9.5 for email delivery
8.B2 (page titles)  ─── independent
      ↓
8.B3 (traveler dash)─── independent
8.C3 (guide seed)   ─── independent
      ↓
8.B4 (guide dash)   ─── AFTER B3 (follow same pattern)
      ↓
8.Admin fix         ─── independent
8.C2 (more guides)  ─── independent
8.C4 (request data) ─── independent
      ↓
8.C6 (breadcrumbs)  ─── independent
      ↓
8.C5 (density)      ─── AFTER all above
      ↓
Phase 9 (infra ops) ─── parallel with code work
      ↓
Phase 10 (features) ─── after Phase 8 complete
      ↓
Phase 11 (launch)   ─── after Phase 9 + 10 complete
```

---

## Estimated Timeline

| Phase | Work Type | Estimate |
|-------|-----------|----------|
| 8: Audit Fixes | Code (7 batches) | 2 days |
| 9: Launch Infra | Ops/config (human) | 1 day |
| 10: Feature catch-up | Code | 1 day |
| 11: Soft launch | Business/beta | ongoing |
| **Total to soft launch** | | **~4–5 days** |

---

## Key Risks

| Risk | Mitigation |
|------|------------|
| A1 debug bar fix accidentally breaks navigation tabs | Keep nav tabs, only strip demo session controls |
| B1 forgot password silently fails in prod | Requires Supabase Custom SMTP config (Phase 9.5) — document dependency clearly |
| B4 guide dashboard agent over-engineers | Provide explicit data spec in prompt (listing count, request count, booking count, rating) |
| Guide dashboard page.tsx is "use client" — can't export metadata | Move client logic to child component, keep page.tsx as Server Component |
| A3 query fix breaks other destination-related queries | Run full build + typecheck + CDP walkthrough after every batch |
| Seed reset wipes test bookings | Use `db:reset` only on local dev. Production seed is applied once at init. |

---

## Research-Backed Implementation Notes

### Forgot Password (B1)
```typescript
// Initiate — server action in forgot-password page
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`
})

// Callback already exists at /auth/confirm/route.ts (from Phase 1)
// verifyOtp({ type: 'recovery', token_hash }) → redirect to /auth/update-password

// Update password page
const { error } = await supabase.auth.updateUser({ password: newPassword })
```
The `/auth/confirm` route from Phase 1 handles all OTP types. Just verify it passes `type` from URL params.

### Page Titles (B2)
```typescript
// In any server-component page.tsx:
export const metadata: Metadata = { title: "Мои запросы" }
// Automatically composes to "Мои запросы — Provodnik" via root layout template
// DO NOT add metadata to pages with "use client" — metadata is ignored in client components
// Instead, metadata goes in the page.tsx (always a server component) not in the feature component it imports
```
