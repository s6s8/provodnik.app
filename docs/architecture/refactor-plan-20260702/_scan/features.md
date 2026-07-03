# Feature & Component Scan — 2026-07-02

Scope: read-only inventory of `src/features/` (20 modules) and `src/components/` (11 groups) for the refactor plan.
Intended feature standard: `actions/ components/ hooks/ types.ts validation.ts`.

## 1. Feature table

| Feature | Files | Follows standard? | Server actions | Purpose (1-line) |
|---|---|---|---|---|
| admin | 11 | partial (actions/ components/ types/, no hooks/validation) | 2 | Admin console: users, guides, listings, disputes, audit moderation |
| auth | 7 | partial (actions/ components/ tests/, stray `guide-type.ts`) | 1 | Sign-in / password flows, auth entry screen |
| bookings | 13 | NO — action files at root (`booking-actions.ts`, `payment-agreement-actions.ts`) alongside `actions/` | 3 | Booking lifecycle: detail screen, form tabs, ticket, cancel |
| destinations | 7 | NO — only `components/` | 0 | Destination landing/grid pages ((site)/destinations) |
| disputes | 9 | partial — `actions/` + stray root `dispute-message-actions.ts` | 4 | Dispute case threads & resolution |
| favorites | 3 | minimal — `actions/ components/` | 1 | Saved/favorited guides/listings |
| guide | 64 | largest; `actions/ components/ types/ utils/` but many root action+test files | 6 | Guide-side app: birjha/requests inbox, bids, excursions, verification, portfolio, calendar, public profile |
| homepage | 7 | NO — `components/ lib/` (AI experiment) | 0 | Conversational/AI hero request flow — used ONLY on `/ai` route |
| homepage-classic | 7 | NO — only `components/` | 0 | Classic request-form homepage shell — the LIVE home `(home)/page.tsx` |
| listings | 4 | NO — only `components/` | 0 | Listing browse pages ((site)/listings) |
| messaging | 12 | YES-ish — `actions/ components/ hooks/` (no types/validation) | 1 | Message threads / inbox |
| notifications | 5 | NO — only `components/` | 0 | Notification center screen |
| partner | 3 | minimal — `actions/ components/` | 1 | API tokens + payouts ledger; rendered inside `/referrals` page |
| profile | 25 | partial — `actions/ components/ validation/` + stray root action files | 5 | Account settings & user profile management |
| quality | 1 | NO — single component, no actions | 0 | `marketplace-quality-card.tsx` — UNREFERENCED (dead) |
| referrals | 3 | minimal — `actions/ components/` | 1 | Referral code + bonus ledger; rendered inside `/referrals` page |
| requests | 17 | NO — many root action+test files alongside `components/` | 4 | Traveler request creation, public marketplace, request detail, join/offer |
| reviews | 11 | partial — `actions/ components/` | 2 | Booking reviews |
| shared | 1 | minimal — `components/` only | 0 | Cross-feature shared components (nearly empty) |
| traveler | 27 | partial — `actions/ components/` (nested by domain) | 1 | Traveler cabinet: requests, offers, trip-card, reviews, empty state |

Note: server actions use the `"use server"` directive (50 files project-wide); the `types.ts`/`validation.ts` file convention is inconsistently applied — most features use `types/` dirs, `validation/` dirs, or stray root `*-actions.ts` files instead.

## 2. Duplication & dead-code candidates (with evidence)

### homepage vs homepage-classic
- **homepage-classic = LIVE.** `src/app/(home)/page.tsx` imports `HomePageShell2Classic` from `@/features/homepage-classic`.
- **homepage = experimental/AI**, referenced only by `src/app/(home)/ai/page.tsx` (`HeroConversation`) and `src/app/api/requests/parse/route.ts` (`lib/extraction`, `lib/openrouter`).
- homepage-classic IS referenced (home + `homepage`'s hero-conversation imports `HomepageAuthGate` from it). Cross-naming: `homepage` depends on `homepage-classic` — the two are entangled, not cleanly separable. Candidate to consolidate into one `homepage` feature with `/ai` as a variant.

### (home)/ai and (home)/form
- `(home)/ai/page.tsx` — live experimental AI hero route (uses `features/homepage`). Still wired.
- `(home)/form/page.tsx` — **just `permanentRedirect("/")`**; a legacy stub, safe to remove after confirming no inbound links.

### partner / for-business / quality / referrals
- **partner** — live but mislocated: `ApiTokenManager` + `PayoutsLedger` are rendered by `src/app/(protected)/referrals/page.tsx` (not a `/partner` route). Product-wise this is B2B/partner surface bolted onto the referrals page.
- **for-business** — `(site)/for-business/page.tsx` is a static marketing page (corporate excursions); copy states most B2B features are "not supported yet" (speculative/roadmap page, no feature module behind it).
- **quality** — `features/quality/marketplace-quality-card.tsx` is **DEAD**: only self-reference, zero importers.
- **referrals** — live, rendered inside `/referrals` page alongside partner components.

### features/<x> vs components/<x> overlap
- **bookings**: `features/bookings` (screens/forms/actions) vs `components/bookings/booking-status-badge.tsx` (single shared badge) — thin split, acceptable.
- **guide**: `features/guide` (large app) vs `components/guide/ContactVisibilityChip.tsx` (one chip) — thin split.
- **traveler**: `features/traveler` (live cabinet) vs `components/traveler/{ListingCard,ListingGrid,FilterBar}` — **the components/traveler cluster is DEAD**: `ListingGrid` imports `ListingCard`, but nothing outside `components/traveler/` imports any of them.

### Card component sprawl (cards vs discovery vs listing-detail vs traveler)
- `components/cards/{guide-card,listing-card,request-card}.tsx` — **ALL DEAD**: 0 imports anywhere in `src`.
- `components/discovery/` — only `DestinationCard` and `NewGuideFrame` are used externally; `FilterBar, IdentityRevealCard, SearchInput, StatStrip, TrustRibbon` have **0 external imports (dead)**.
- `components/listing-detail/` — active (used by `ExcursionShapeDetail`/`TourShapeDetail`), contains its own `GuideCard.tsx` (another guide-card variant).
- Net: at least 3–4 competing "card" implementations (cards/, discovery/, listing-detail/GuideCard, features/traveler/trip-card, features/traveler/requests/offer-card), most of the standalone `cards/` set unused.

## 3. Biggest components (god components >300 lines)

| Lines | File |
|---|---|
| 1013 | src/features/requests/components/request-detail-screen.tsx |
| 984 | src/features/bookings/components/booking-detail-screen.tsx |
| 639 | src/features/guide/components/requests/bid-form-panel.tsx |
| 593 | src/features/guide/components/excursions/guide-excursions-screen.tsx |
| 520 | src/features/requests/components/public-requests-marketplace-screen.tsx |
| 494 | src/app/(protected)/admin/guides/[id]/page.tsx |
| 492 | src/app/(protected)/admin/users/_components/users-console.tsx |
| 455 | src/features/auth/components/auth-entry-screen.tsx |
| 451 | src/features/guide/components/requests/guide-requests-inbox-screen.tsx |
| 451 | src/app/(protected)/guide/profile/page.tsx |
| 445 | src/app/(site)/requests/[requestId]/page.tsx |
| 436 | src/features/traveler/components/requests/offer-card.tsx |
| 425 | src/features/notifications/components/notification-center-screen.tsx |
| 405 | src/features/homepage-classic/components/homepage-request-form-classic.tsx |
| 376 | src/features/traveler/components/trip-card/trip-card.tsx |
| 371 | src/features/bookings/components/BookingFormTabs.tsx |
| 337 | src/features/guide/components/verification/document-upload-card.tsx |
| 333 | src/features/guide/components/public/guide-profile-screen.tsx |
| 320 | src/components/shared/site-header.tsx |

(test files excluded from god-component judgement.)

## 4. Cross-feature imports (architecture violations bypassing shared)

Features should talk via `features/shared`; observed direct feature→feature imports:
- `requests → guide` (11 imports) — heaviest coupling.
- `traveler → requests` (4).
- `homepage → homepage-classic` (2) — entangled homepage variants.
- `homepage-classic → requests` (1), `homepage-classic → auth` (1).
- `destinations → guide` (1).

`features/shared` holds only one component, so it is not functioning as the intended integration layer.

## 5. Terminology / product-copy drift

Mixed domain nouns across routes, components, and RU copy (file-count where term appears in .tsx):
- **Guide**: `гид`/`guide` (136 files) vs brand term `проводник`/Provodnik (12 files) — brand noun barely used in UI; product is "Проводник" but code/UI says "гид".
- **Listing/tour/excursion**: `listing` (87) vs `tour` (43) / `тур` (41) vs `excursion` (15) / `экскурс` (52) — four competing nouns for the same sellable unit. Routes use `/listings` while UI copy and `listing-detail` split into `TourShapeDetail` vs `ExcursionShapeDetail`.
- **Request/trip/заявка/поездка**: `request` (96) vs `trip` (51) vs `заявк` (24) vs `поездк` (44). Routes are inconsistent: `/requests` (public) and `/trips` (traveler cabinet) both refer to the same request concept; `features/traveler` uses `trip-card` while `features/requests` uses `request-*`.
- **Offer/bid/отклик/ставка**: `offer` (45) vs `отклик` (14) vs `bid` (13). Guide side says `bid-form-panel`/`birjha` (биржа, 1) while traveler side says `offer-card`.
- Route-noun mismatch: `/guides` (site) vs `/guide` (protected app) vs `/become-a-guide`; `/requests` vs `/trips`.

Recommended glossary decisions before refactor: guide vs проводник; the sellable unit (listing/tour/excursion); the demand unit (request/trip/заявка); the guide response (offer/bid/отклик).
