# DECISIONS.md — Architecture Decision Records

_Append-only. Format: ADR-NNN_

---

### ADR-001: Traveler dashboard as server component (B3)
- **Context:** Traveler dashboard was a simple redirect to /traveler/requests. Audit requires real content.
- **Decision:** Implement as a Next.js Server Component that fetches summary stats (request count, booking count, favorite count) + renders stat cards + quick-action links. No client-side state needed for static counts.
- **Alternatives Considered:** (A) Keep redirect, update nav — too minimal, doesn't fix the audit finding. (B) Client component with useEffect — unnecessary for static counts.
- **Consequences:** Server component renders counts on every page load. Acceptable for dashboard stats. No stale data risk.
- **Date:** 2026-04-06

### ADR-002: Guide dashboard refactor strategy (B4)
- **Context:** Guide dashboard currently renders GuideOnboardingScreen (form). This is wrong — it should show a stats dashboard. Onboarding should be its own page.
- **Decision:** (1) Move onboarding form to /guide/settings. (2) Guide dashboard page checks auth.role === 'guide' and renders guide-specific stats. (3) Unverified guides (verification_status !== 'approved') see an "Account pending" state with link to verification page.
- **Alternatives Considered:** (A) Keep onboarding on dashboard for new guides — confusing for verified guides. (B) Redirect to /guide/verification always — breaks verified guides.
- **Consequences:** Need new GuideDashboardScreen component and to create /guide/settings page.
- **Date:** 2026-04-06

### ADR-003: Listing image_url as dedicated column (B6)
- **Context:** Current approach stores image URL inside description text as JSON, always falls back to mountain photo.
- **Decision:** Add `image_url text` column to listings table via new migration. Update mapListingRow to read image_url first, fall back to parseImageFromJson for backwards compatibility, then fallbackHeroImage.
- **Alternatives Considered:** (A) Add JSON to description field — hacky, wrong separation of concerns. (B) Use category-based fallback images — doesn't fix individual listing accuracy.
- **Consequences:** Migration required (20260406000001_listings_image_url.sql). Seed data must be updated with correct image URLs.
- **Date:** 2026-04-06

### ADR-004: All seed changes in one worktree
- **Context:** Multiple tasks (A2, B6-seed, C2, C3, C4) modify the same seed.sql file.
- **Decision:** Group all seed.sql changes in a single worktree (fix/seed) to avoid merge conflicts.
- **Consequences:** Seed worktree must merge before the query code worktree (fix/a3-query) since B6 code reads the new image_url column that migration creates.
- **Date:** 2026-04-06

### ADR-005: Defer forgot-password (B1) to post-launch
- **Context:** Phase 8 audit found no forgot-password flow. Requires Supabase Custom SMTP config (Resend) to work in production. Code is straightforward but has an infra dependency.
- **Decision:** Explicitly deferred per user instruction. Will implement post-launch when Resend is connected to Supabase Custom SMTP in dashboard.
- **Alternatives Considered:** Implement now but email silently fails in prod (confusing UX).
- **Consequences:** Users who forget passwords must contact support until B1 ships.
- **Date:** 2026-04-06

### ADR-006: Phase 10.1 — Guides section on destination pages
- **Context:** GG stakeholder Change 6 — destination pages should show "Гиды в этом городе". Was deferred from Phase 5, now scheduled as Phase 10.1.
- **Decision:** Implement as a server-side fetched section at bottom of destination-detail-screen. Query guide_profiles filtered by verification_status='approved' AND region match. Limit 6 cards.
- **Alternatives Considered:** Client-side fetch with TanStack Query (unnecessary for static data). Separate /destinations/[slug]/guides route (over-engineered).
- **Consequences:** Destination pages now surface local guides — key for marketplace discovery.
- **Date:** 2026-04-06
