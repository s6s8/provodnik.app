# APP_INVENTORY.md — Provodnik whole-app inventory

Scan date: 2026-07-03 · Base: `main @ 28b92058` · Read-only.
Stack: Next.js 16 (App Router, `proxy.ts`), React 19, TS, Supabase (PG17 + RLS), TanStack Query,
RHF + Zod, Tailwind v4 + shadcn/ui, bun. **758 `.ts(x)` files** in `src`.

Source detail for each section lives under `_scan/` (`routes.md`, `data-layer.md`, `supabase.md`,
`features.md`, `tests-actions.md`, `garbage.md`).

---

## 1. Route inventory (66 routes: 61 pages + 5 route handlers)

By audience — full table in `_scan/routes.md`.

| Audience | Count | Routes (abridged) |
|---|---|---|
| **Public discovery** | 21 | `/`, `/ai`, `/form`(redirect), `/guides`, `/guides/[slug]`, `/guide/[id]`(redirect), `/destinations(+/[slug])`, `/listings(+/[id])`, `/requests(+/[requestId])`, `/become-a-guide`, `/for-business`, `/how-it-works`, `/help`, `/trust`, `/policies/*` |
| **Auth** | 3p+1r | `/auth`, `/auth/forgot-password`, `/auth/update-password`, `/auth/confirm`(route) |
| **Traveler** | 8 | `/trips`, `/bookings/[id](+/dispute,/review)`, `/disputes/[id]`, `/favorites`, `/referrals`, `/listings/[id]/book` |
| **Guide** | 10 | `/guide`, `/guide/bookings(+/[id])`, `/guide/calendar`, `/guide/inbox`, `/guide/listings`, `/guide/profile`, `/guide/reviews`, `/guide/settings/contact-visibility`, `/guide/stats` |
| **Admin** | 12 | `/admin(+/dashboard,/audit,/bookings,/disputes(+/[caseId]),/guides(+/[id]),/listings,/moderation,/users(+/[id]))` |
| **Shared domain** | 5 | `/account(+/notifications=404 stub)`, `/messages(+/[threadId])`, `/notifications` |
| **API** | 5 | `/api/auth/signout`, `/api/messages/threads(+/[threadId])`, `/api/messages/unread-count`, `/api/requests/parse`(no-auth LLM) |
| **Dev/demo** | 2 | `/dev/req-cards`, `/dev/guide-templates-wireframe` (gated only by `NODE_ENV==="production"`) |

## 2. Access-control model (two app-layer layers + RLS)

1. **Edge `proxy.ts`** (matcher = all non-static): `getRequiredRoleForPathname` maps **only**
   `/guide`,`/trips`,`/bookings`,`/admin` → role; verifies `auth.getUser()`, canonical `profiles.role`,
   `account_status==='active'`, strict `roleHasAccess`. **Admin is allow-through** (returns `next()` and
   defers to layout). Other paths get session-refresh only.
2. **Server layouts** re-check via `readAuthContextFromServer`: `trips`→traveler, `guide`→guide,
   `admin`→admin (renders inline "access denied", no redirect). Base `(protected)/layout.tsx` checks
   **only** account-suspension, **not** authentication.
3. **RLS** is the real DB boundary for traveler/guide data. **Admin uses a service-role client that
   bypasses RLS** — so admin authz is app-layer-only, with no DB backstop.

Role is derived DB-side from `public.profiles` (role + `account_status`) via `SECURITY DEFINER` helpers;
the JWT `app_metadata.role` claim is a mirror injected by `custom_access_token_hook` and is **not** trusted
by policies. Demo mode (`DEMO_SESSION_COOKIE`) supplies a role only when Supabase env is absent.

## 3. Feature modules (20) — `src/features/`

| Feature | Files | Standard? | Actions | Purpose |
|---|---|---|---|---|
| guide | 64 | partial (root action/test sprawl) | 6 | Guide app: inbox/bids, excursions, verification, portfolio, calendar, public profile |
| traveler | 27 | partial | 1 | Traveler cabinet: requests, offers, trip-card, reviews |
| profile | 25 | partial (+stray root actions) | 5 | Account settings & profile |
| requests | 17 | NO (root action/test sprawl) | 4 | Request create, public marketplace, detail, join/offer |
| bookings | 13 | NO (root+`actions/` mix) | 3 | Booking lifecycle |
| messaging | 12 | closest to standard | 1 | Threads / inbox |
| admin | 11 | partial | 2 | Admin console |
| reviews | 11 | partial | 2 | Booking reviews |
| disputes | 9 | partial (+stray root action) | 4 | Dispute threads |
| auth | 7 | partial (stray `guide-type.ts`) | 1 | Sign-in / password |
| destinations | 7 | NO (`components/` only) | 0 | Destination pages |
| homepage | 7 | NO | 0 | **AI experiment** — only on `/ai` |
| homepage-classic | 7 | NO | 0 | **LIVE home** `(home)/page.tsx` |
| notifications | 5 | NO (`components/` only) | 0 | Notification center |
| listings | 4 | NO (`components/` only) | 0 | Listing browse |
| favorites | 3 | minimal | 1 | Saved items |
| partner | 3 | minimal | 1 | API tokens + payouts — **rendered inside `/referrals`** |
| referrals | 3 | minimal | 1 | Referral ledger |
| shared | 1 | — | 0 | **Nearly empty** — not functioning as integration layer |
| quality | 1 | — | 0 | `marketplace-quality-card.tsx` — **DEAD (0 importers)** |

## 4. Data / service layer — three competing conventions (core drift)

Intended (`feature-structure.md`): **all** Supabase I/O in `src/lib/supabase/<domain>.ts`; `src/data/`
static-only; typed client in. Reality:

- **`.from('table')` usage: 430 total; only 119 (28%) inside `src/lib/supabase`.** 311 (72%) are elsewhere.
- **8 I/O modules mislocated in `src/data/`** (should be static-only): `data/supabase/queries.ts`
  (35 `.from` + 2 `.rpc` — the biggest single leak), `data/supabase/queries/core.ts`,
  `data/guide-assets/supabase-client.ts` (browser), `data/guide-templates/supabase-client.ts`
  (`'use client'` + **3 browser writes**), `data/reviews/supabase.ts`, `data/guide-offer/supabase.ts`,
  `data/notifications/supabase.ts`, `data/marketplace-events/client.ts`.
- **`src/lib/data/countries.ts`** — a third static location (belongs in `src/data/`).
- **Triple-layered domains:** reviews (`data/reviews/supabase.ts` + `lib/reviews/state-machine.ts` +
  `lib/supabase/reviews.ts`); notifications (`data/notifications/supabase.ts` +
  `lib/notifications/{create-notification,triggers}.ts`); requests (`lib/supabase/{requests,requests-public,
  traveler-requests,request-members}.ts` + `lib/requests/state-machine.ts` + `data/{traveler-request,open-requests}`).
- **App-layer scoping that belongs in RLS/RPC:** inline `.eq(...)` in `app/(protected)/guide` (26) and
  `/admin` (15).
- **No lint gate:** eslint only bans `data|lib → features` imports; nothing forbids `.from()` /
  `createSupabaseServerClient` inside `src/data/**`, so the drift is silently ungated.
- **Naming drift code↔schema:** code says `open-requests`/`offers`/`negotiations`; schema says
  `traveler_requests`/`guide_offers` and has **no** `negotiations` table (negotiation = offer status +
  `payment_agreements`).

## 5. Backend / Supabase

- **4 forward migrations** (all 2026-07-02): one 6218-line squashed baseline + 3 hardening/backfill.
  Pre-squash history archived (2026-04-13 → 06-23). `YYYYMMDDHHMMSS_snake_case.sql`, PG17.
- **58 public tables (+~11 views).** Request-first cluster: `traveler_requests → guide_offers → bookings
  → reviews/disputes`, `open_request_members` (group joins), `conversation_threads/messages` (chat),
  ~14 `listing_*` child tables, moderation/notification/referral clusters.
- **RLS: all 58 tables enabled, 177 policies, no `FORCE RLS`.** Role from `profiles` via SECURITY DEFINER
  helpers; policies trust the table, not the JWT claim.
- **31 of 46 functions are `SECURITY DEFINER`** (all set `search_path=public`). Write surface incl.
  `accept_offer`, `counter_offer`, `open_dispute`, `submit_review`, `admin_set_account_status`,
  `send_qa_message`, `record_marketplace_event`, `record_request_view` — auth is **in-function only**.
- **State machines:** `offer_status` (10 vals) + `listing_status` (7 vals) have partial trigger guards;
  `booking_status` / `dispute_status` have **no DB-level transition guard**.
- **Storage:** guide-portfolio / avatars / listing-media are world-readable; buckets **not seeded in
  migrations** (publicness is environment-drift-prone; private buckets rely on uid-prefix convention).

## 6. Forms, actions, tests

- **51 `'use server'` files**, colocated per feature/route; no central registry.
- **`ActionResult`/`createAction` adoption ≈ 0%** — the wrapper exists but is used only by its own test.
  Three competing return shapes (`{ok,error}` ~46, `{success,error}` ~26, ad-hoc). Zod schemas are
  canonical in `src/data/*/schema.ts` but many actions redeclare inline (partial duplication).
- **Uploads:** presigned-URL-via-server-action confirmed (`src/lib/storage/upload.ts` +
  `client-upload.ts`, entry `features/guide/verification-actions.ts`).
- **Unit tests:** ~170 vitest files — strong on UI, state machines, most `lib/supabase/*` data modules,
  feature actions. **Untested criticals:** RLS/DB authorization (zero), `admin.ts`/`admin-users.ts`/
  `middleware.ts`/`client.ts`, `qa-threads.ts`/`request-members.ts`/`requests-public.ts`.
- **E2E: effectively zero for the core lifecycle.** `tests/e2e/tripster-v1/01–06` (create→request→offer→
  booking→review→dispute) is entirely `test.skip(!E2E_READY)`, default-off, with spec-rot headers and
  mid-test `test.skip()` → **green-by-construction**. Only `request-first-smoke.spec.ts` asserts. The
  walkthrough suite runs against **prod**, screenshot-first (~6 assertions) — a visual aid, not a gate.

## 7. Ownership boundaries (target)

| Domain | Owns | Should live in |
|---|---|---|
| Discovery (home/guides/destinations/listings/requests public) | Public read surfaces | `features/{homepage,destinations,listings,requests}` + `lib/supabase/{public-guides,public-listings,requests-public}` |
| Auth | login/signup/reset/redirects/roles | `features/auth` + `lib/auth` + `proxy.ts` + RLS role helpers |
| Traveler | requests, offers-view, bookings, reviews, disputes, messages, notifications, favorites/referrals | `features/{traveler,requests,bookings,reviews,disputes,messaging,notifications,favorites,referrals}` |
| Guide | onboarding/verification, profile, inbox/bids, listings, bookings, calendar, reviews, stats, contact-visibility | `features/guide` (decompose) |
| Admin | users, guide verification, listing moderation, disputes, bookings, audit | `features/admin` + `lib/supabase/{admin,admin-users,moderation}` |
| Shared domain engine | request→offer→booking→review→dispute→notifications→messaging | `lib/supabase/*` service layer + SECURITY DEFINER RPCs + state machines |

## 8. Current risk hotspots (ranked — detail in RISK_REGISTER.md)

1. **No refactor safety net** — core lifecycle E2E is skip-by-default; RLS has zero tests.
2. **Data-layer triple-drift** — 72% of table access outside the service layer, 8 mislocated I/O modules,
   triple-layered domains, no lint gate.
3. **Public `traveler_requests` PII exposure** — anon can read all open requests (ids, budget, dates, notes).
4. **Admin authz app-layer-only** — soft proxy + service-role client = no DB backstop.
5. **Client-side direct table writes** (`data/guide-templates/supabase-client.ts` ×3) — trust-boundary risk.
6. **Unauthenticated `/api/requests/parse`** LLM endpoint — cost/DoS surface.
7. **`business_leads` / `WITH CHECK (true)` anon insert** — spam vector.
8. **God components** (request-detail 1013, booking-detail 984, bid-form 639) + dead component clusters.
9. **Terminology drift** — 4 nouns for the sellable unit, request/trip/offer/bid split traveler↔guide.
