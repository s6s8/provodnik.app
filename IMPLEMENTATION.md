# IMPLEMENTATION.md

## 1. Purpose

This document is the execution blueprint for taking the current `Provodnik` baseline and turning it into a coherent, request-first marketplace across all major public and protected pages.

It covers:

- where the project stands now;
- what already exists and should be reused;
- what is missing relative to the intended product;
- how the design language should work;
- which routes, features, and data contracts must be added or reshaped;
- a page-by-page implementation plan;
- a phased delivery sequence that respects the current repo structure and MVP constraints.

This is not a generic brainstorm. It is meant to be used as a build plan.

## 1.1 Planning source of truth

`IMPLEMENTATION.md` is the single source of truth for execution planning in this repo.

That means:

- if planning docs disagree, follow `IMPLEMENTATION.md`;
- GitHub issues should be derived from this document, not compete with it;
- local helper files such as `scripts/AGENT_TODO.md` and `scripts/open-issues.md` are operational mirrors only;
- workflow docs should explain how to execute the plan, not redefine the plan.

Practical hierarchy:

1. `IMPLEMENTATION.md` = product and execution plan
2. `s6s8/provodnik.app-Tasks` issues = live task records derived from the plan
3. GitHub Project = status board for those issues
4. local `scripts/*issues*` files = cached helpers and convenience views

---

## 2. Product Definition

`Provodnik` is a request-first marketplace for tours and excursions.

The core object is not the listing. The core object is the traveler request:

- destination;
- date or date range;
- participants;
- budget;
- group preference;
- openness to join others;
- openness to guide alternatives.

The core loop is:

1. traveler creates a request;
2. other travelers join the group;
3. guides send structured offers;
4. travelers and guide negotiate;
5. booking is confirmed.

Listings still matter, but primarily for:

- trust;
- discovery;
- SEO;
- guide credibility;
- inspiration before request creation.

The platform should feel like a travel marketplace with real supply and real demand, not like a static catalog.

---

## 3. Source Material Used

This plan is based on:

- `MVP.md`
- `PRD.md`
- `README.md`
- `docs/architecture/module-map.md`
- `design/IMPLEMENTATION-GUIDE.md`
- `design/STAKEHOLDER-FEEDBACK.md`
- `design/LAYOUT.md`
- `docs/design/HOMEPLAN.md`
- the current homepage in `src/features/homepage/components/homepage-shell.tsx`
- the current route and feature implementation under `src/app`, `src/features`, and `src/data`
- reference visuals in:
  - `public/image.png`
  - `tmp/hf_20260313_095227_506f3fef-e3c4-4904-9a74-3dad988a3e8a.jpeg`
  - `tmp/hf_20260313_095444_da5b9215-f3af-4a58-875a-dedce224bdac.jpeg`
  - `tmp/hf_20260313_095715_9a6245aa-1a97-4aa2-aa9e-415b80622ce0.jpeg`
  - `tmp/hf_20260313_100221_126a8396-f9c7-41f4-9525-242eeca935f8.jpeg`
  - `tmp/hf_20260313_100549_7b05da36-1b69-4c59-b444-4fddd562f2d5.jpeg`
  - `tmp/hf_20260313_100739_f5db2d28-ba60-4afd-a9b9-7ee1a3e65743.jpeg`
  - `tmp/hf_20260313_100957_521beff0-b01d-44a7-a306-07cf0ad055c2.jpeg`
  - `tmp/hf_20260313_101541_9353db8a-6c30-4385-a1fa-15afcf069714.jpeg`
  - `tmp/hf_20260313_101617_54eb8f38-19dd-4d31-8d05-44d0ae9297cf.png`
  - `tmp/hf_20260313_101617_cefab80b-794a-459e-93fe-28387a35ccca.png`

Important interpretation:

- the image refs show presentation mockups inside tablet frames;
- the actual site should not literally reproduce the device frame;
- the implementation should translate the underlying visual system into a responsive web UI.

Additional execution note:

- when the design docs above are more specific than older helper files or stale issue text, update those helper artifacts to match the design docs before delegating implementation.

---

## 4. Current State Audit

### 4.1 Route groups in the app

Current route groups:

- `src/app/(home)` for the landing page at `/`
- `src/app/(site)` for public inner pages
- `src/app/(protected)` for traveler, guide, admin, and notifications
- `src/app/(reference)` for non-product reference pages

### 4.2 Public pages already implemented

Existing public routes:

- `/`
- `/listings`
- `/listings/[slug]`
- `/guides/[slug]`
- `/auth`
- `/trust`
- `/policies/cancellation`
- `/policies/refunds`

State:

- `Home` already uses a dark cinematic visual language and is the closest implemented match to the target direction.
- `Listings` and `Listing detail` are real enough as seeded public browsing surfaces.
- `Guide profile` exists and already supports trust markers and reviews.
- `Auth`, `Trust`, and policy pages exist, but they belong to an older public-shell system and do not yet participate in the same strong request-first visual narrative.

### 4.3 Traveler area already implemented

Existing traveler routes:

- `/traveler`
- `/traveler/requests`
- `/traveler/requests/new`
- `/traveler/requests/[requestId]`
- `/traveler/open-requests`
- `/traveler/open-requests/[openRequestId]`
- `/traveler/bookings`
- `/traveler/bookings/[bookingId]`
- `/traveler/bookings/[bookingId]/review`
- `/traveler/favorites`

State:

- request creation exists;
- request detail exists;
- open-group browsing and joining exists;
- bookings and reviews exist;
- favorites exist.

The traveler area is the most complete product surface today.

### 4.4 Guide area already implemented

Existing guide routes:

- `/guide`
- `/guide/listings`
- `/guide/requests`
- `/guide/requests/[requestId]`
- `/guide/bookings`
- `/guide/bookings/[bookingId]`

State:

- onboarding exists;
- listings manager exists;
- request inbox and offer drafting exist;
- booking views exist.

But much of it still depends on seeded or demo-mode data rather than one live marketplace flow.

### 4.5 Admin and operations already implemented

Existing admin routes:

- `/admin`
- `/admin/listings`
- `/admin/disputes`
- `/admin/disputes/[caseId]`

Shared protected route:

- `/notifications`

State:

- admin review and moderation tooling is already fairly substantial;
- disputes tooling exists;
- operator-facing clarity is stronger than traveler-facing cohesion.

### 4.6 Existing implementation patterns

The project already uses a consistent fallback model:

- `schema`
- `types`
- `seed`
- `local-store`
- `supabase-client` or `supabase`

That pattern exists across:

- traveler requests;
- open requests;
- reviews;
- favorites;
- notifications;
- bookings;
- admin moderation.

This is good and should continue.

### 4.7 Current mismatches and drift

Important mismatches:

- the product vision is request-first, but the public IA still feels listing-first;
- the dark cinematic design exists mainly on `/`, while much of the rest of the public shell is still warm/light editorial;
- request marketplace surfaces exist mostly inside traveler space instead of as public market surfaces;
- `docs/architecture/module-map.md` points to `src/features/home`, but the active homepage route uses `src/features/homepage`;
- route groups in code are `(home)` and `(site)`, while some older docs talk about `(public)`.

---

## 5. What Exists vs What Is Missing

### 5.1 What already exists and should be reused

Reuse aggressively:

- `src/features/homepage/components/homepage-shell.tsx`
- `src/features/listings/components/public/*`
- `src/features/guide/components/public/*`
- `src/features/reviews/components/public/public-reviews-section.tsx`
- `src/features/quality/components/marketplace-quality-card.tsx`
- `src/features/traveler/components/request-create/*`
- `src/features/traveler/components/requests/*`
- `src/features/traveler/components/open-requests/*`
- `src/features/traveler/components/bookings/*`
- `src/features/traveler/components/favorites/*`
- `src/features/guide/components/requests/*`
- `src/features/guide/components/listings/*`
- `src/features/guide/components/bookings/*`
- `src/features/admin/components/*`
- `src/components/shared/*`
- `src/components/ui/*`
- `src/data/*`

### 5.2 What is still missing

Missing product surfaces or gaps:

- a public requests marketplace at `/requests`;
- a public request detail page at `/requests/[requestId]`;
- a public request creation page at `/requests/new`;
- a destination page at `/destinations/[slug]`;
- a unified traveler dashboard page rather than a redirect to requests;
- a stronger guide dashboard landing page instead of going straight into onboarding;
- a coherent dark premium design system across public and protected surfaces;
- a real shared negotiation model between traveler request detail and guide offer detail;
- a consistent request-first cross-linking strategy between:
  - home;
  - requests;
  - listings;
  - guides;
  - destinations;
  - dashboards.

---

## 6. Product and UX Principles

Implementation must respect the documented constraints:

- request-first, but not request-only;
- mobile-first;
- trust before growth;
- structured negotiation, not chaotic bargaining;
- no live payment processor required for MVP;
- shell must work without Supabase env;
- do not overbuild nationwide breadth before the core loop is coherent.

UX principles for the product:

- every page should make the core marketplace legible in seconds;
- every major public page should lead to one of three actions:
  - join a group;
  - create a request;
  - review a guide or listing;
- every protected page should reduce operational ambiguity;
- every negotiation surface should expose state clearly;
- every booking surface should expose trust, status, and next steps clearly.

---

## 7. Target Visual Language

### 7.1 Design translation from references

The references consistently imply:

- dark cinematic background photography;
- translucent glass navigation and control bars;
- rounded XXL cards;
- dense layouts with minimal empty space;
- strong contrast between photography and soft glass overlays;
- premium but usable interface polish;
- travel-product feel, not fintech feel;
- presentation-grade composition, but still believable as product UI.

### 7.2 Visual rules for the production site

Use these rules across new and redesigned pages:

- dark shell as the default for core marketplace surfaces;
- large photographic hero or sectional image anchors;
- soft glass panels with blurred translucent fills;
- rounded corners in the `20px to 32px` range;
- strong hierarchy with oversized headings and compressed support text;
- compact but readable card density;
- minimal dead whitespace;
- large image-first cards rather than text-heavy white panels;
- soft shadow and glow, never harsh neon;
- call-to-action buttons that feel tactile but restrained.

### 7.3 What to preserve from the current homepage

Preserve and reuse:

- Manrope-driven sans feel;
- dark editorial hero;
- glass pill navigation;
- dense bento card composition;
- full-bleed travel imagery;
- rounded media cards with overlay text.

### 7.4 What not to copy literally from the references

Do not implement literally:

- tablet bezels around every page;
- slide-deck framing as app chrome;
- nonfunctional decorative charts or step cards that do not map to real routes.

Instead:

- translate those into real page sections and actual components.

---

## 8. Design System Decisions

### 8.1 Shells

There should be three shell styles:

1. `Home shell`
   - full-bleed;
   - cinematic;
   - editorial;
   - minimal chrome.

2. `Public marketplace shell`
   - dark;
   - glass nav/header;
   - large content width;
   - suitable for requests, destinations, listing detail, guide profile.

3. `Protected workspace shell`
   - still dark premium;
   - more operational;
   - denser controls;
   - stronger layout rails and tabs.

### 8.2 Shared layout patterns

Shared patterns to build once and reuse:

- floating top nav;
- hero with search or filter rail;
- glass filter bar;
- image-led marketplace card;
- request card;
- offer card;
- avatar cluster;
- group progress card;
- side action rail;
- tab rail;
- summary stat cards;
- trust marker row;
- booking timeline;
- empty state with single primary CTA.

### 8.3 Typography

Use a consistent split:

- sans for almost everything;
- serif only if intentionally used for editorial accents, not for operational pages;
- large hero headlines;
- short paragraphs;
- tight support copy.

### 8.4 Density

The refs are dense. The production UI should be dense too, but:

- not cramped;
- not dashboard-spam;
- not generic card grids with large gaps.

---

## 9. Architecture Rules for Implementation

Respect these boundaries:

- keep routing in `src/app`;
- keep page-specific logic inside feature modules;
- do not put feature logic into `src/components/ui`;
- use `src/data` for contracts, seeds, local stores, and Supabase access;
- prefer shared abstractions over cross-feature imports.

Recommended structural adjustment:

- keep `src/features/homepage` if it is already active, or rename it to `src/features/home`;
- but do not leave naming drift unresolved.

Decision:

- the implementation should standardize the active homepage feature area and update docs accordingly.

---

## 10. Domain Model to Standardize

These are the core objects the app should standardize around.

### 10.1 Request

Core fields:

- id
- destination
- region
- dates
- participants
- target group size
- budget
- category
- group mode
- openness to joining others
- openness to guide alternatives
- notes
- status

### 10.2 Open Group

Represents joinable demand:

- request id
- current participants
- target participants
- roster
- visibility
- estimated current price per person
- estimated target price per person
- joinability state

### 10.3 Offer

Structured guide response:

- guide id
- request id
- total price
- estimated per-person price
- capacity
- inclusions
- exclusions
- timing summary
- expiry
- message
- status

### 10.4 Negotiation

Needs to exist conceptually even if implemented minimally at first:

- initial traveler target
- guide offer
- traveler counter
- guide counter
- accepted value
- declined value
- timeline

### 10.5 Listing

Listing remains a public trust and discovery object:

- guide id
- title
- route summary
- region
- city
- duration
- group availability
- private availability
- price from
- media
- reviews

### 10.6 Destination

New page-level aggregation object:

- destination slug
- hero media
- summary copy
- popular listings
- open groups
- active guides
- filters

### 10.7 Booking

Reservation object:

- linked listing or accepted offer
- traveler(s)
- guide
- itinerary summary
- payment expectation
- cancellation terms
- status timeline

---

## 11. Target Route Map

### 11.1 Public routes

Keep:

- `/`
- `/listings`
- `/listings/[slug]`
- `/guides/[slug]`
- `/auth`
- `/trust`
- `/policies/cancellation`
- `/policies/refunds`

Add:

- `/requests`
- `/requests/[requestId]`
- `/destinations/[slug]`

### 11.2 Traveler routes

Keep:

- `/traveler`
- `/traveler/requests`
- `/traveler/requests/new`
- `/traveler/requests/[requestId]`
- `/traveler/open-requests`
- `/traveler/open-requests/[openRequestId]`
- `/traveler/bookings`
- `/traveler/bookings/[bookingId]`
- `/traveler/bookings/[bookingId]/review`
- `/traveler/favorites`

Add or redesign:

- `/traveler` should become a real overview dashboard instead of only redirecting

### 11.3 Guide routes

Keep:

- `/guide`
- `/guide/listings`
- `/guide/requests`
- `/guide/requests/[requestId]`
- `/guide/bookings`
- `/guide/bookings/[bookingId]`

Redesign:

- `/guide` should become a real guide dashboard or role home, not only onboarding

### 11.4 Admin routes

Keep:

- `/admin`
- `/admin/listings`
- `/admin/disputes`
- `/admin/disputes/[caseId]`

No new admin route is required immediately, but visual and data consistency should improve.

---

## 12. Recommended Feature Areas

Recommended top-level feature organization after implementation:

- `src/features/homepage` or `src/features/home`
- `src/features/requests/public`
- `src/features/requests/shared`
- `src/features/destinations`
- `src/features/listings/public`
- `src/features/guide/public`
- `src/features/traveler`
- `src/features/guide`
- `src/features/admin`
- `src/features/notifications`
- `src/features/shared-marketplace` or `src/features/shared`

Recommended new data areas:

- `src/data/destinations`
- `src/data/negotiations`

Possible consolidation later:

- traveler request and open request data may eventually want one shared marketplace request surface with multiple projections.

---

## 13. Page-by-Page Implementation Plan

### 13.1 Home Page `/`

Purpose:

- explain the product immediately;
- show the request-first model;
- expose the three core entry points.

Current state:

- visually strong;
- dark cinematic;
- still more listing and discovery oriented than request-first.

Target structure:

- hero image and headline;
- top nav;
- main search or quick action rail;
- three action cards:
  - find a group;
  - create a request;
  - explore destinations;
- open groups preview;
- popular destinations;
- featured guides or offers;
- how it works;
- trust layer.

Reuse:

- current homepage shell;
- bento cards;
- seed listing and guide media patterns.

Add:

- explicit request-first CTA grouping;
- live previews for requests and open groups;
- link paths to `/requests`, `/requests/new`, `/destinations/[slug]`.

Acceptance criteria:

- a user understands the product in under five seconds;
- the three primary actions are obvious;
- open-group demand is visible on the page;
- the page visually sets the standard for the rest of the site.

### 13.2 Requests Marketplace `/requests`

Purpose:

- public demand board;
- core marketplace surface.

Current state:

- a similar experience exists in `/traveler/open-requests`, but it is protected and traveler-framed.

Target structure:

- dark hero or compact intro;
- glass filter/search bar;
- dense request card grid;
- sort options;
- join group CTA;
- request detail CTA.

Card fields:

- destination image;
- city;
- date;
- joined count;
- target group size;
- estimated price per person;
- quick join state;
- avatar cluster;
- status.

Reuse:

- traveler open-requests list/detail logic;
- open-request seed and local-store;
- existing badge/button/card primitives.

New pieces:

- public request card component;
- public filter rail;
- public request board screen;
- optional URL-driven filters.

Acceptance criteria:

- it feels like a live demand marketplace;
- users can scan and compare demand quickly;
- it visually matches the homepage language.

### 13.3 Request Detail `/requests/[requestId]`

Purpose:

- the central marketplace transaction page.

Current state:

- traveler request detail exists;
- traveler open-request detail exists;
- guide request detail exists.

Target structure:

- destination hero;
- request summary;
- group progress;
- participant avatars or roster preview;
- budget and estimated price impact;
- side action rail;
- guide offers list;
- negotiation activity;
- timeline.

Reuse:

- `traveler-request-detail-screen`
- `traveler-open-request-detail-screen`
- guide offer shapes and form ideas from `guide-request-detail-screen`

New pieces:

- public request detail composition layer;
- shared negotiation card;
- clearer offer comparison pattern;
- state mapping between request, open group, and offer timeline.

Acceptance criteria:

- a traveler can understand the request, group state, and offers from one page;
- guide offers feel structured, not ad hoc;
- the page looks like the marketplace center of gravity.

### 13.4 Create Request `/requests/new`
### 13.4 Traveler Create Request `/traveler/requests/new`

Purpose:

- generate new marketplace demand from the protected traveler workspace.

Current state:

- `traveler-request-create-form` already exists and is the baseline.

Target structure:

- dark glass layout aligned with the new traveler workspace;
- request form on one side;
- live marketplace-style preview card;
- support for city plus region context, date range, target group size, and public/open-group settings;
- success state that leads into the request detail and public marketplace flow.

Reuse:

- existing request form;
- existing validation and submit logic.

Enhance:

- align styling with `design/IMPLEMENTATION-GUIDE.md`;
- add preview treatment that matches the request cards used publicly;
- support price-scenario-ready request output and public-group visibility.

Acceptance criteria:

- the traveler can create a request that clearly becomes a public market object;
- the page matches the dark premium design system;
- success state cleanly enters the request and group flow.

### 13.5 Destination Page `/destinations/[slug]`

Purpose:

- connect inspiration and live marketplace activity.

Current state:

- does not exist.

Target structure:

- destination hero;
- summary copy;
- open groups in this city;
- popular tours;
- local guides;
- create request CTA;
- secondary filters.

Reuse:

- public listing cards;
- open-request cards;
- guide summary blocks;
- seed listing and guide data patterns.

New pieces:

- destination data contract;
- destination aggregate screen;
- destination hero and segmented content layout.

Acceptance criteria:

- a user can browse one destination and see supply plus demand together;
- destination page becomes the bridge between travel inspiration and request-first mechanics.

### 13.6 Listings Discovery `/listings`

Purpose:

- listing-based discovery and trust.

Current state:

- already exists and is usable.

Required changes:

- align more closely with the dark premium marketplace shell;
- better connect to requests and open groups;
- add cross-links to:
  - related requests;
  - create request;
  - destination page.

Acceptance criteria:

- listings page feels like part of the same product family as home and requests;
- catalog no longer feels detached from request-first behavior.

### 13.7 Listing Detail `/listings/[slug]`

Purpose:

- explain one tour clearly and build confidence.

Current state:

- strong baseline already exists.

Required changes:

- preserve current useful content blocks;
- redesign shell and hierarchy toward the new visual system;
- strengthen primary actions:
  - create request for this tour;
  - join existing group;
  - explore requests in this city.

Optional additions:

- related open groups;
- related requests;
- city cross-links.

Acceptance criteria:

- listing detail supports the request-first loop instead of competing with it.

### 13.8 Guide Profile `/guides/[slug]`

Purpose:

- trust, credibility, and supply exploration.

Current state:

- public guide profile exists and is already fairly good.

Required changes:

- align shell with premium dark system;
- show tours more visually;
- connect the guide to live demand:
  - active offers to groups;
  - cities served;
  - related requests or open groups.

Acceptance criteria:

- guide profile becomes both trust page and supply-side entry to the marketplace.

### 13.9 Traveler Dashboard `/traveler`

Purpose:

- the user control center.

Current state:

- route only redirects to `/traveler/requests`.

Target structure:

- overview hero or summary rail;
- tabs or sections for:
  - my requests;
  - groups joined;
  - offers;
  - bookings;
- compact image-led cards;
- visible negotiation status.

Reuse:

- existing traveler screens and cards;
- booking and request status badges.

Implementation approach:

- do not throw away the existing traveler pages;
- build `/traveler` as a compositional overview that links into them.

Acceptance criteria:

- traveler root is a real dashboard;
- the user can understand current activity from one screen.

### 13.10 Traveler Request Workspace `/traveler/requests`

Purpose:

- manage owned requests.

Current state:

- exists and works.

Required changes:

- visual alignment with dark workspace style;
- clearer relationship to public requests marketplace;
- better surfaced offer counts and next actions.

### 13.11 Traveler Open Groups `/traveler/open-requests`

Purpose:

- operational view of joined and available groups for the traveler.

Current state:

- exists and works.

Required changes:

- keep as personal workspace mirror of public requests board;
- improve joined-state visibility and group outcomes.

### 13.12 Traveler Bookings `/traveler/bookings` and detail/review pages

Purpose:

- manage confirmed commerce.

Current state:

- exists and works in baseline form.

Required changes:

- maintain current booking detail and review flow;
- align visuals with protected dark shell;
- strengthen timeline, trust, and support blocks.

### 13.13 Traveler Favorites `/traveler/favorites`

Purpose:

- saved supply and inspiration.

Current state:

- exists.

Required changes:

- visually align with other traveler pages;
- add request-first CTAs from saved listings.

### 13.14 Guide Dashboard `/guide`

Purpose:

- guide operational home.

Current state:

- root goes directly to onboarding.

Target structure:

- top summary:
  - incoming requests;
  - active offers;
  - accepted bookings;
  - listing quality;
- sections linking to listings, requests, bookings, onboarding status.

Implementation approach:

- if onboarding incomplete, keep onboarding prominent;
- if onboarding complete, show dashboard first with onboarding status card.

Acceptance criteria:

- guide root becomes a real role home, not only a form entry point.

### 13.15 Guide Requests Inbox `/guide/requests`

Purpose:

- process incoming demand.

Current state:

- seeded inbox exists.

Required changes:

- visually align with the dark workspace system;
- eventually unify request source with public/traveler request objects;
- support real offer status and expiry states.

### 13.16 Guide Request Detail `/guide/requests/[requestId]`

Purpose:

- construct a structured offer.

Current state:

- good form baseline exists.

Required changes:

- preserve the offer constructor;
- align the UI with the premium glass aesthetic;
- connect submitted offers to shared request detail and traveler views;
- add clearer preview of what the traveler will see.

### 13.17 Guide Listings `/guide/listings`

Purpose:

- manage guide supply.

Current state:

- substantial manager exists with Supabase fallback behavior.

Required changes:

- mostly visual and integration polish;
- keep current data behavior;
- improve fit with marketplace-wide design system.

### 13.18 Guide Bookings `/guide/bookings` and detail

Purpose:

- guide-side booking operations.

Current state:

- exists.

Required changes:

- visual polish;
- tighter status, action, and traveler context.

### 13.19 Admin Root `/admin`

Purpose:

- operator landing page.

Current state:

- directly shows guide review queue.

Recommended change:

- keep existing queue, but eventually turn `/admin` into an overview page that links to:
  - guide review;
  - listings moderation;
  - disputes;
  - marketplace health signals.

### 13.20 Admin Listing Moderation `/admin/listings`

Purpose:

- supply quality control.

Current state:

- strong baseline exists.

Required changes:

- mostly styling and consistency;
- do not sacrifice operator clarity for decorative polish.

### 13.21 Admin Disputes `/admin/disputes` and detail

Purpose:

- trust operations and resolution.

Current state:

- exists.

Required changes:

- visual consistency;
- stronger alignment with booking/request entities.

### 13.22 Notifications `/notifications`

Purpose:

- role-neutral marketplace alerts.

Current state:

- exists.

Required changes:

- align with dark protected shell;
- ensure message categories map clearly to:
  - request activity;
  - offer activity;
  - booking activity;
  - admin/support events.

### 13.23 Auth, Trust, and Policies

Purpose:

- support trust and conversion.

Current state:

- pages exist but feel less integrated into the new visual direction.

Required changes:

- align them with the dark public shell, but keep readability high;
- trust page should directly explain:
  - verified guides;
  - structured negotiation;
  - booking confirmation;
  - policy-backed support.

---

## 14. Shared Components To Build or Promote

Build reusable marketplace blocks rather than repeating page-local markup.

Recommended shared components:

- `PublicMarketplaceHeader`
- `GlassFilterBar`
- `RequestMarketplaceCard`
- `RequestHero`
- `RequestSummaryPanel`
- `GroupProgressPanel`
- `ParticipantAvatarCluster`
- `OfferMarketplaceCard`
- `NegotiationTimeline`
- `DestinationHero`
- `DestinationSection`
- `GuideCompactCard`
- `GuideOfferStrip`
- `WorkspaceSectionHeader`
- `MarketplaceTabs`
- `StatusPillGroup`
- `BookingTimelineCard`

Where they should live:

- public/shared route components under a feature-level shared area, not in `src/components/ui`.

---

## 15. Data Layer Plan

### 15.1 Keep the current dual-mode strategy

Continue supporting:

- seeded/demo mode;
- local persistence mode;
- Supabase-backed mode.

This is a strength of the current repo and makes UI development fast.

### 15.2 Add missing data surfaces

Add new data areas only where required:

- `src/data/destinations`
- `src/data/negotiations`

Likely responsibilities:

- destination aggregation by city/region;
- negotiation event history and shared offer state.

### 15.3 Unify marketplace request projections

The current project has:

- traveler request records;
- open request records;
- guide request inbox items.

These need a documented shared mapping so that:

- one request can appear on public marketplace pages;
- the same request can appear in traveler ownership views;
- the same request can appear in guide inbox views;
- the same request can become a booking.

---

## 16. Layout and Routing Strategy

### 16.1 Keep route-group intent

Recommended route-group intent:

- `(home)` stays dedicated to `/`
- `(site)` becomes the public marketplace shell
- `(protected)` becomes the dark workspace shell

### 16.2 Public shell strategy

Current public inner shell is lighter and older than the homepage.

Implementation decision:

- redesign `(site)` pages into the same dark product family as the homepage;
- do not force the exact home hero pattern onto every page;
- use a consistent dark shell with glass header and large content frame.

### 16.3 Protected shell strategy

Protected layout should evolve toward:

- dark background;
- clearer workspace navigation;
- compact but premium control surfaces;
- better visual distinction between traveler, guide, and admin tasks.

---

## 17. Phased Delivery Plan

### Phase 0 - Architecture alignment

- decide whether `src/features/homepage` stays or becomes `src/features/home`
- document route-group reality
- define shared request/open-group/offer mapping
- define destination and negotiation data shapes

### Phase 1 - Design foundation

- establish dark public marketplace shell
- establish dark protected workspace shell
- promote shared marketplace components
- update visual tokens only where needed without destabilizing `src/components/ui`

### Phase 2 - Public request-first surfaces

- build `/requests`
- build `/requests/[requestId]`
- build `/destinations/[slug]`
- refactor home to dual-entry architecture with request-first CTA order
- rebuild `/traveler/requests/new` to match the public request card model

### Phase 3 - Public supply refinement

- redesign `/listings`
- redesign `/listings/[slug]`
- redesign `/guides/[slug]`
- align `/trust`, `/auth`, and policy pages with the updated shell

### Phase 4 - Traveler workspace

- build real `/traveler` overview
- align requests, groups, favorites, bookings, and review pages with the new workspace system
- improve cross-linking between public and protected surfaces

### Phase 5 - Guide workspace

- build real `/guide` dashboard
- align guide inbox, offer creation, listings manager, and bookings with the shared marketplace state
- improve supply-side visibility into demand and negotiation

### Phase 6 - Admin and trust operations

- optionally turn `/admin` into a real overview
- align moderation and disputes visually
- ensure request, offer, booking, and dispute entities connect clearly

### Phase 7 - Integration and polish

- unify state transitions across traveler, guide, and public views
- add missing empty states and loading states
- verify mobile behavior on all core routes
- run lint, typecheck, and targeted QA flows

---

## 18. Suggested File and Folder Additions

Expected new route files:

- `src/app/(site)/requests/page.tsx`
- `src/app/(site)/requests/new/page.tsx`
- `src/app/(site)/requests/[requestId]/page.tsx`
- `src/app/(site)/destinations/[slug]/page.tsx`

Expected new feature areas:

- `src/features/requests/public/*`
- `src/features/requests/shared/*`
- `src/features/destinations/*`
- `src/data/destinations/*`
- `src/data/negotiations/*`

Expected route rewrites:

- `src/app/(protected)/traveler/page.tsx`
- `src/app/(protected)/guide/page.tsx`

Likely shell/layout work:

- `src/app/(site)/layout.tsx`
- `src/app/(protected)/layout.tsx`
- `src/components/shared/site-header.tsx`
- possibly new shared marketplace header variants

---

## 19. Execution Notes by Workstream

Foundation:

- route groups
- shells
- shared marketplace components
- homepage and public-shell coherence

Traveler:

- dashboard
- requests
- groups
- bookings
- favorites

Guide:

- role home
- inbox
- offer construction
- listings
- bookings

Admin:

- review queue
- listings moderation
- disputes
- marketplace health visibility

Data:

- request/open-group/offer mapping
- destinations
- negotiations
- shared Supabase contracts where needed

---

## 20. Risks

### Product risks

- over-indexing on beautiful listing pages and underbuilding the request loop;
- building a public request board that is visually strong but disconnected from traveler and guide workflows;
- treating negotiation as copy only rather than as explicit product state.

### Design risks

- reproducing the mockup device frame instead of building a real web UI;
- keeping the current home dark while leaving the rest of the site in a different visual world;
- making operational pages too decorative and hurting clarity.

### Architecture risks

- creating page-local one-off components instead of shared marketplace building blocks;
- duplicating request logic across traveler, public, and guide surfaces;
- mixing feature logic into stable `ui` primitives.

### Scope risks

- trying to add live payments before the request-offer-booking loop is solid;
- trying to solve nationwide scale before a coherent regional wedge experience exists.

---

## 21. Acceptance Checklist

The implementation is in a good state when all of the following are true:

- public and protected shells feel like one product family;
- `/` clearly explains the request-first model;
- `/requests` works as the public marketplace center;
- `/requests/[requestId]` is the clear center of negotiation and group formation;
- `/requests/new` cleanly creates demand;
- `/destinations/[slug]` joins inspiration and demand;
- listings and guide pages feed the request-first loop instead of sitting beside it;
- `/traveler` is a real dashboard;
- `/guide` is a real dashboard;
- admin pages remain clear and auditable;
- request, offer, and booking states read consistently across all roles;
- the app still works without Supabase env;
- lint and typecheck pass after substantive implementation phases.

---

## 22. Immediate Next Moves

Recommended implementation order:

1. align naming and architecture around homepage and public shell;
2. define shared request/open-group/offer mapping;
3. establish globals, dark shell, header, footer, and shared marketplace primitives from the design guide;
4. build public `/requests`;
5. build public `/requests/[requestId]`;
6. build `/destinations/[slug]`;
7. rebuild `/traveler/requests/new` and `/traveler/requests` to the new traveler design spec;
8. harmonize listings, guide profile, trust, auth, and policy pages into the new visual family;
9. redesign `/traveler` and `/guide` roots into dashboards;
10. finish integration and polish.

If this order is followed, the project moves from "many partial surfaces" to "one coherent marketplace."
