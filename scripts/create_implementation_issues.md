# Issue bodies for IMPLEMENTATION.md tasks

Reference: `IMPLEMENTATION.md` in the app repo (s6s8/provodnik.app).

**Created in s6s8/provodnik.app-Tasks (2026-03-15):** issues #2–#18. Body text is in `scripts/issue_bodies/01.txt` … `17.txt`.

---

## Issue 1: [Phase 0] Architecture alignment — homepage, route groups, data mapping

**Body:**

Align repo structure and docs with the request-first product model.

- [ ] Decide and apply: keep `src/features/homepage` or rename to `src/features/home`; update `docs/architecture/module-map.md` and any references.
- [ ] Document current route groups: `(home)`, `(site)`, `(protected)`; remove or update references to `(public)` in docs.
- [ ] Define and document shared mapping: traveler request ↔ open request ↔ guide inbox item (one request, multiple views). Add to IMPLEMENTATION.md or an ADR.
- [ ] Define data shapes for destinations (aggregation by city/region) and negotiations (offer/counter timeline); add `src/data/destinations` and `src/data/negotiations` contracts or stubs.

Acceptance: Naming is consistent, route-group reality is documented, request/open-group/offer mapping is clear, destination and negotiation shapes are defined. No breaking changes to existing routes.

Ref: IMPLEMENTATION.md §17 Phase 0, §15.3, §18.

---

## Issue 2: [Phase 1] Dark public marketplace shell

**Body:**

Introduce a dark, glass-style public shell for all `(site)` pages so they match the homepage visual language.

- [ ] Redesign `src/app/(site)/layout.tsx`: dark background, glass-style header/nav, large content width.
- [ ] Add or adapt a shared public header (e.g. `PublicMarketplaceHeader` or update `SiteHeader`) for dark theme: glassmorphism, nav items (Destinations, Requests, Guides, Experiences, Profile), search or CTA.
- [ ] Ensure inner pages (listings, guides, auth, trust, policies) render inside this shell without breaking.
- [ ] Do not change `src/components/ui/*` primitives; use composition and layout only.

Acceptance: All public inner routes use the same dark shell. Visual family matches homepage (dark, glass, rounded). Shell works without Supabase.

Ref: IMPLEMENTATION.md §7, §8.1, §16.2.

---

## Issue 3: [Phase 1] Dark protected workspace shell

**Body:**

Evolve the protected layout so traveler, guide, and admin areas use a dark premium workspace shell.

- [ ] Update `src/app/(protected)/layout.tsx`: dark background, clear workspace nav, compact but premium controls.
- [ ] Ensure `WorkspaceRoleNav` and any role-specific chrome work in the new shell.
- [ ] Keep operator clarity for admin; avoid decorative clutter.

Acceptance: Protected routes (traveler, guide, admin, notifications) share a consistent dark workspace shell. Role switching and navigation remain clear.

Ref: IMPLEMENTATION.md §8.1, §16.3.

---

## Issue 4: [Phase 1] Shared marketplace components

**Body:**

Extract or promote reusable marketplace UI blocks so public and protected pages can share them.

- [ ] Add shared components (e.g. under `src/features/.../shared` or a dedicated shared-marketplace area) for: `GlassFilterBar`, `RequestMarketplaceCard`, `RequestSummaryPanel`, `GroupProgressPanel`, `ParticipantAvatarCluster`, `OfferMarketplaceCard`, `DestinationHero`, `DestinationSection`, `StatusPillGroup`. Implement only those needed for Phase 2.
- [ ] Use existing primitives from `src/components/ui` and `src/components/shared`; do not duplicate.
- [ ] Document where each component lives and who consumes it.

Acceptance: At least the components required for `/requests` and `/requests/[requestId]` exist and are reusable. No new one-off page-only blobs for request/offer cards.

Ref: IMPLEMENTATION.md §14, §17 Phase 1.

---

## Issue 5: [Phase 2] Public Requests marketplace page (/requests)

**Body:**

Build the public demand board at `/requests`.

- [ ] Add route: `src/app/(site)/requests/page.tsx`.
- [ ] Implement public request board UI: dark shell, glass filter bar (city, date, budget, group size), dense grid of request cards.
- [ ] Each card: destination image, city, date, participants joined, target group size, estimated price per person, “Join group” / “View” CTA. Reuse or adapt data from `open-requests` seed/local-store.
- [ ] Link cards to `/requests/[requestId]`. Optional: URL-driven filters (query params).
- [ ] Reuse shared marketplace components where applicable.

Acceptance: `/requests` renders a request-first marketplace view. Cards match IMPLEMENTATION.md §13.2. Works with seeded/demo data. No Supabase required for basic view.

Ref: IMPLEMENTATION.md §13.2, §18.

---

## Issue 6: [Phase 2] Public Request detail page (/requests/[requestId])

**Body:**

Build the central marketplace page for a single request at `/requests/[requestId]`.

- [ ] Add route: `src/app/(site)/requests/[requestId]/page.tsx`.
- [ ] Layout: destination hero, request summary, group progress, participant avatars/roster preview, budget and estimated price, side action rail (Join group, estimated price if you join).
- [ ] Section: guide offers list with offer cards (guide, price, Accept / Propose counter). Reuse or adapt traveler request detail and guide offer shapes.
- [ ] Ensure one source of truth for request + open group + offers (use existing data layer; document mapping if not already done in Phase 0).
- [ ] Logged-in vs anonymous: join/counter may require auth; page is still viewable by all.

Acceptance: Request detail is the clear center of negotiation and group formation. Matches IMPLEMENTATION.md §13.3. Works with seeded/demo data.

Ref: IMPLEMENTATION.md §13.3, §18.

---

## Issue 7: [Phase 2] Public Create request page (/requests/new)

**Body:**

Add a public request-creation flow at `/requests/new`.

- [ ] Add route: `src/app/(site)/requests/new/page.tsx`.
- [ ] Reuse existing request form logic from `src/features/traveler/components/request-create/`; wrap in dark glass form card and public-safe copy.
- [ ] Add live preview card (how the request will appear on the marketplace). On submit: create request (local-store or Supabase), redirect to `/requests/[requestId]` or `/requests`.
- [ ] Optional: auth gate for creation; page still explains the flow when not logged in.

Acceptance: Users can create a request from a public URL. Form and preview match IMPLEMENTATION.md §13.4. Success path enters marketplace flow.

Ref: IMPLEMENTATION.md §13.4, §18.

---

## Issue 8: [Phase 2] Destination page (/destinations/[slug])

**Body:**

Add destination pages that combine inspiration and live demand.

- [ ] Add route: `src/app/(site)/destinations/[slug]/page.tsx`.
- [ ] Add data: `src/data/destinations` (aggregation by city/region; seed or derive from existing listings/open-requests).
- [ ] Page structure: destination hero, short copy, “Open groups in this city”, “Popular tours”, “Guides in this city”, Create request CTA. Reuse listing cards, open-request cards, guide summary blocks.
- [ ] Slug can be city or region (e.g. `barcelona`, `spb`). Define slug set in seed or config.

Acceptance: `/destinations/[slug]` shows open groups, popular tours, and guides. Connects discovery to request-first flow. Ref: IMPLEMENTATION.md §13.5, §18.

---

## Issue 9: [Phase 2] Homepage request-first CTAs and flow

**Body:**

Refactor the homepage so the request-first model and three entry points are explicit.

- [ ] Add or emphasize three action cards: Find a group → `/requests`, Create a request → `/requests/new`, Explore destinations → `/listings` or `/destinations/...`.
- [ ] Add open groups preview (e.g. first N from open-requests) and link to `/requests`.
- [ ] Add popular destinations and link to `/destinations/[slug]` or `/listings`.
- [ ] Keep existing hero, nav, and bento; do not remove listing-based discovery, but make request-first paths primary.

Acceptance: A first-time user understands “find group / create request / explore” and can reach the requests marketplace and destination pages from home. Ref: IMPLEMENTATION.md §13.1.

---

## Issue 10: [Phase 3] Redesign Listings discovery and detail

**Body:**

Align listings pages with the dark marketplace shell and request-first cross-links.

- [ ] Redesign `/listings` (discovery): same dark shell, glass filter bar, dense card grid; add links to “Open requests in this city” and “Create request”.
- [ ] Redesign `/listings/[slug]` (detail): keep description, guide, reviews, price; strengthen primary CTAs: “Create request for this tour”, “Join existing group”, “Requests in this city”. Optionally show related open groups.
- [ ] Reuse existing listing data and components; change layout and chrome, not data contracts.

Acceptance: Listings feel part of the same product family as home and requests. Listing detail supports the request-first loop. Ref: IMPLEMENTATION.md §13.6, §13.7.

---

## Issue 11: [Phase 3] Redesign Guide profile and align Trust/Auth/policies

**Body:**

- [ ] Redesign `/guides/[slug]`: dark shell, tours grid, “Active offers to groups” section, cities served. Keep trust markers and reviews. Link to requests/destinations where relevant.
- [ ] Align `/trust`, `/auth`, and policy pages (`/policies/cancellation`, `/policies/refunds`) with the dark public shell; improve readability and navigation, no functional regression.

Acceptance: Guide profile is both trust page and supply-side entry. Trust and policy pages match dark shell. Ref: IMPLEMENTATION.md §13.8, §13.23.

---

## Issue 12: [Phase 4] Traveler dashboard (real /traveler overview)

**Body:**

Replace the redirect at `/traveler` with a real dashboard.

- [ ] Implement `/traveler` overview: summary rail or hero, tabs or sections for My requests, Groups joined, Offers, Bookings. Use compact image-led cards; link to existing traveler sub-routes.
- [ ] Reuse existing traveler screens; do not duplicate their logic. Dashboard is composition + navigation.
- [ ] Show negotiation/booking status where useful (badges, counts).

Acceptance: `/traveler` is the traveler control center. User sees current activity at a glance. Ref: IMPLEMENTATION.md §13.9, §18.

---

## Issue 13: [Phase 4] Traveler workspace visual alignment

**Body:**

Align traveler sub-pages with the dark protected shell and cross-linking.

- [ ] Apply dark workspace shell to `/traveler/requests`, `/traveler/open-requests`, `/traveler/bookings`, `/traveler/favorites`, and detail/review pages.
- [ ] Add cross-links: from “My requests” to public `/requests`; from booking/request cards to public request or listing where relevant.
- [ ] Improve offer counts, next actions, and joined-state visibility on request and open-request lists.

Acceptance: All traveler pages share the same shell and feel connected to the public marketplace. Ref: IMPLEMENTATION.md §13.10–13.13.

---

## Issue 14: [Phase 5] Guide dashboard (real /guide overview)

**Body:**

Make `/guide` a real role home instead of only onboarding.

- [ ] Implement guide overview: summary (incoming requests, active offers, accepted bookings, listing quality); links to Listings, Requests, Bookings. If onboarding incomplete, show onboarding status and CTA.
- [ ] Reuse existing guide screens; dashboard is composition + navigation.
- [ ] Optional: conditional landing — if profile incomplete, keep onboarding as primary; else show dashboard first.

Acceptance: `/guide` is the guide operational home. Ref: IMPLEMENTATION.md §13.14, §18.

---

## Issue 15: [Phase 5] Guide workspace alignment

**Body:**

Align guide inbox, offer creation, listings, and bookings with the dark shell and shared marketplace state.

- [ ] Apply dark workspace shell to `/guide/requests`, `/guide/requests/[requestId]`, `/guide/listings`, `/guide/bookings` and detail.
- [ ] In request detail: keep offer constructor; improve preview of what traveler sees; align with shared request/offer state. Ensure submitted offers appear on public request detail where applicable.
- [ ] Improve visibility of demand and negotiation (e.g. offer status, expiry) in guide inbox and detail.

Acceptance: Guide workspace is visually consistent and connected to the same request/offer/booking flow as traveler and public. Ref: IMPLEMENTATION.md §13.15–13.18.

---

## Issue 16: [Phase 6] Admin overview and visual alignment

**Body:**

- [ ] Optionally turn `/admin` into an overview page with links to Guide review, Listings moderation, Disputes, and any marketplace health signals. If keeping current behavior, add at least a short nav or summary.
- [ ] Align admin moderation and disputes pages with the dark workspace shell. Preserve operator clarity and audibility; avoid decorative clutter.
- [ ] Ensure request, offer, booking, and dispute entities are clearly connected in admin views (e.g. links, IDs, status).

Acceptance: Admin has a clear entry point and consistent shell. Moderation and disputes remain usable and auditable. Ref: IMPLEMENTATION.md §13.19–13.21, §17 Phase 6.

---

## Issue 17: [Phase 7] Integration and polish

**Body:**

- [ ] Unify state transitions: same request/offer/booking states read consistently across public, traveler, and guide views.
- [ ] Add or refine empty states and loading states on core routes (requests, request detail, destinations, traveler/guide dashboards).
- [ ] Verify mobile behavior on core routes (home, requests, request detail, create request, traveler/guide roots).
- [ ] Run `bun run lint` and `bun run typecheck`; fix any regressions. Optionally run `bun run build` and fix route or config issues.

Acceptance: No broken flows across roles. Core routes are usable on mobile. Lint and typecheck pass. Ref: IMPLEMENTATION.md §17 Phase 7, §21.
