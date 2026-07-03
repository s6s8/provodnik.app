# Data-layer drift scan — 2026-07-02

Convention (docs/architecture/feature-structure.md): ALL Supabase I/O in `src/lib/supabase/<domain>.ts`
(server). `src/data/` = static constants/types/zod ONLY. Dep direction `app → features → {lib,data,components}`;
`lib`/`data` must not import `features` (eslint `no-restricted-imports`, enforced). Doc explicitly ACK's that
some `src/data/*` I/O modules survive pre-refactor and are migrated "incrementally as next touched".

## (a) I/O modules — correct-vs-actual layer

| Module | from | rpc | client-create | Kind | Actual layer | Correct layer |
|---|---|---|---|---|---|---|
| lib/supabase/admin-users.ts | 10 | 0 | 0 | service | lib/supabase | OK |
| lib/supabase/bookings.ts | 9 | 0 | 5 | service | lib/supabase | OK |
| lib/supabase/conversations.ts | 13 | 0 | 13 | service | lib/supabase | OK |
| lib/supabase/disputes.ts | 12 | 0 | 2 | service | lib/supabase | OK |
| lib/supabase/listings.ts | 7 | 0 | 9 | service | lib/supabase | OK |
| lib/supabase/moderation.ts | 35 | 0 | 2 | service | lib/supabase | OK |
| lib/supabase/offers.ts | 5 | 0 | 7 | service | lib/supabase | OK |
| lib/supabase/payment-agreements.ts | 3 | 0 | 4 | service | lib/supabase | OK |
| lib/supabase/qa-threads.ts | 3 | 1 | 4 | service | lib/supabase | OK |
| lib/supabase/request-members.ts | 5 | 0 | 5 | service | lib/supabase | OK |
| lib/supabase/requests.ts | 3 | 0 | 5 | service | lib/supabase | OK |
| lib/supabase/requests-public.ts | 0 | 1 | 0 | service (rpc) | lib/supabase | OK |
| lib/supabase/reviews.ts | 7 | 0 | 3 | service | lib/supabase | OK |
| lib/supabase/traveler-requests.ts | 8 | 2 | 4 | service | lib/supabase | OK |
| lib/supabase/client.ts | 0 | 0 | 3 | client (browser) | lib/supabase | OK (infra) |
| lib/supabase/server.ts | 0 | 0 | 3 | client (server) | lib/supabase | OK (infra) |
| lib/supabase/middleware.ts | 0 | 0 | 3 | middleware | lib/supabase | OK (infra) |
| lib/supabase/admin.ts | 0 | 0 | 0 | service-role helper | lib/supabase | OK (infra) |
| lib/supabase/types.ts / qa-threads-types.ts / listing-schema.ts / database.types.ts | 0 | 0 | 0 | types/schema | lib/supabase | OK |
| **data/supabase/queries.ts** | **35** | **2** | 0 (takes client arg) | **service (barrel)** | **data/** | lib/supabase |
| **data/supabase/queries/core.ts** | **4** | 0 | 0 | **service** | **data/** | lib/supabase |
| **data/guide-assets/supabase-client.ts** | **11** | 0 | 2 (browser) | **service (client)** | **data/** | lib/supabase |
| **data/guide-templates/supabase-client.ts** | **8** | 0 | 2 (browser) | **service (client, 'use client', 3 writes)** | **data/** | lib/supabase |
| **data/reviews/supabase.ts** | **5** | 0 | 4 | **service** | **data/** | lib/supabase |
| **data/guide-offer/supabase.ts** | **2** | 0 | 3 | **service** | **data/** | lib/supabase |
| **data/notifications/supabase.ts** | **2** | 0 | 3 | **service** | **data/** | lib/supabase |
| **data/marketplace-events/client.ts** | 0 | **1** | 2 (server action) | **service (rpc)** | **data/** | lib/supabase |

I/O living in `lib/` but OUTSIDE `lib/supabase/` (also technically off-convention, lower severity — infra layer):
lib/notifications/create-notification.ts, lib/notifications/triggers.ts, lib/bookings/state-machine.ts,
lib/auth/{server-auth,viewer-role-for-booking,viewer-role-for-request}.ts, lib/storage/{upload,client-upload}.ts,
lib/profile/load-traveler-profile.ts, lib/email/send-notification-email.ts, lib/analytics/marketplace-events.ts,
lib/city-image.ts.

## (b) Layering violations (paths)

I/O-in-src/data (8 offender files — the primary violation of "data = static only"):
- src/data/supabase/queries.ts  (35 .from + 2 .rpc — largest single offender)
- src/data/supabase/queries/core.ts  (4 .from)
- src/data/guide-assets/supabase-client.ts  (11 .from, browser client)
- src/data/guide-templates/supabase-client.ts  (8 .from, 'use client', 3 direct writes — client-side writes)
- src/data/reviews/supabase.ts  (5 .from)
- src/data/guide-offer/supabase.ts  (2 .from)
- src/data/notifications/supabase.ts  (2 .from)
- src/data/marketplace-events/client.ts  (1 .rpc, "use server" server action)

Note: eslint boundary rule (eslint.config.mjs L29-37) only blocks `lib`/`data` importing `@/features/*`.
There is NO lint rule forbidding `.from()` / `createSupabaseServerClient` inside `src/data/**`, so this
drift is un-enforced. No `data → features` import violations were found (that rule holds).

## (c) Duplication — same domain served from multiple layers

- reviews (TRIPLE): src/data/reviews/{supabase.ts,schema.ts,types.ts} + src/lib/reviews/state-machine.ts + src/lib/supabase/reviews.ts. Plus features/reviews (10 .from) does its own table access.
- notifications (TRIPLE): src/data/notifications/{supabase.ts,demo.ts,types.ts} + src/lib/notifications/{create-notification.ts,triggers.ts} + features/notifications (7 .from, client writes).
- bookings: src/lib/supabase/bookings.ts + src/lib/bookings/state-machine.ts + src/data/{guide-booking,traveler-booking}/types.ts + features/bookings (5 .from).
- requests / traveler-requests: src/lib/supabase/{requests.ts,requests-public.ts,traveler-requests.ts,request-members.ts} + src/lib/requests/state-machine.ts + src/data/{traveler-request,open-requests}/types.ts + features/requests (18 .from).
- guide-offer: src/data/guide-offer/supabase.ts + src/lib/supabase/offers.ts.
- guide catalog/assets/templates: src/data/guide-assets + src/data/guide-templates + heavy features/guide access (38 .from).
- marketplace-events: src/data/marketplace-events/client.ts + src/lib/analytics/marketplace-events.ts.
- disputes / admin-users: src/data/{disputes,admin-users}/* (types+guards+schema) alongside src/lib/supabase/{disputes,admin-users}.ts (types side is arguably OK; listed for awareness).
- Third data location: src/lib/data/countries.ts (static, 0 I/O) — a stray static-data file under lib/ that duplicates the *purpose* of src/data/. Belongs in src/data/.

## (d) Direct table access OUTSIDE lib/supabase (real `.from('table')`, non-test)

By area (occurrences):
- app/(protected): 54   [guide 26, admin 15, referrals 5, messages 5, profile 3, listings 2, disputes 2, bookings 2, account 2]
- features/guide: 38
- data/supabase: 37   (the queries barrel)
- app/(site): 22   [requests 11, listings 10, guides/destinations/help/guide ~1-3]
- features/profile: 21
- features/requests: 18
- lib/notifications: 15
- data/guide-assets: 11
- features/reviews: 10
- features/disputes: 8 ; data/guide-templates: 8
- features/notifications: 7
- features/referrals 6, features/messaging 6, features/favorites 6, features/admin 6
- lib/auth 5, features/bookings 5
- data/reviews 4
- lib/bookings 3, features/auth 3
- lib/profile 2, lib/email 2, data/notifications 2, data/guide-offer 2
- singletons: proxy.ts (profiles), app/sitemap.ts (4: listings/destinations/guide_profiles/traveler_requests), lib/storage, lib/analytics, features/partner, features/listings, app/api/messages
- components/: NONE (only Array.from false-positives)

App-layer filtering that should be RLS/RPC: app/(protected)/guide (26) and app/(protected)/admin (15)
build queries with app-side `.eq(...)` scoping directly in route files — highest-risk spots to push into
RLS policies / RPC or into lib/supabase services. Same for app/(site)/requests (11) and app/(site)/listings (10)
doing public filtering inline.

Client-side ('use client') direct table access files (browser trust boundary):
- data/guide-templates/supabase-client.ts — 3 writes (insert/update/delete) from the browser  ← worst
- features/notifications/components/notification-center-screen.tsx — 3 writes
- features/notifications/components/NotificationBell.tsx — 2 writes
- features/guide/components/portfolio/guide-portfolio-screen.tsx — 1 write
- plus read-only client .from() in features/guide (excursions, use-guide-catalog, requests-inbox, document-upload), features/auth, features/requests, features/messaging (chat-window).

## (e) Rough counts

- Total real table `.from('...')` (non-test): 430
  - inside src/lib/supabase: 119 (28%)
  - OUTSIDE src/lib/supabase: 311 (72%)
- `.rpc()` (non-test): 14 total — lib/supabase 3, data/supabase 1, data/marketplace-events 1, features (reviews/messaging/disputes) 3, app 2, others.
- I/O-in-src/data offender files: 8.
- I/O-in-lib-outside-supabase files: ~11.
- Client-side files with direct table writes: 4 (7 write ops).
- Domains duplicated across ≥2 layers: ~9 (reviews, notifications, bookings, requests, offers/guide-offer, guide-catalog, marketplace-events, disputes, admin-users) + stray lib/data/countries.ts.
- eslint enforcement present for `data/lib → features` import ban ONLY; NO rule bans `.from()`/server-client in src/data.
