# Tripster → Provodnik Replication Plan

_Written 2026-04-11 after mapping Tripster's guide side (01), editor schema (02), and traveler side (03). This plan anchors everything to the current Provodnik app state (see gap analysis at the end) and explicitly designs in the bid/request distinction from day one._

> **⚠️ 2026-04-12 corrections from `07-gap-closure.md`** — apply these before executing §P0:
>
> 1. **exp_type enum** in §P0-A: use `photosession` not `photoshoot`.
> 2. **Legal-status enum** in §P0-A and any guide-profile migration: `('self_employed', 'individual', 'company')`. NOT `individual_entrepreneur` / `llc`.
> 3. **Profile guide URLs**: `/profile/guide/legal-information/` and `/profile/guide/license/` (singular). Any reference to `/legal/` or `/licenses/` is wrong — those 404.
> 4. **Transfer editor branching** in §P0-B: transfer DOES show `Темы` sub-step AND uses the `individualSchedule` weekly template (same as excursion). The earlier "on-demand only" rule is wrong.
> 5. **quest** description has 6 sub-steps — mirror excursion but drop `Факты и детали`. **photosession** description has 4 sub-steps (Название / Маршрут / Темы / Орг. детали).
> 6. **No header notifications bell** in §P1-G — Tripster doesn't have one. Model is inline nav-link badges + 3D preference matrix + external channels only.
> 7. **No header locale switcher** — currency/language is per-account at `/profile/personal/`. v1 can hardcode RUB.
> 8. **Rejection surfacing** is catalog-card-only — add `moderation_status` + `moderation_reason` to `listings`, no in-editor banner required.
> 9. **Review replies are moderated** — add `review_replies` table with `moderation_status`, submit button text "Отправить на проверку".
> 10. **4-axis ratings** — add `rating_material / rating_engagement / rating_knowledge / rating_route` on both `listings` (averages) and `reviews` (per-review scores) at DB level. UI can stay single-axis for v1.
> 11. **Licenses are many-to-many with listings** via a scope input ("Все предложения" | listing_id[]). Add `listing_licenses(listing_id, license_id)` join table.
> 12. **Help center**: one flat `help_articles(id, section_slug, anchor, title, body_md, order)` table, single-page FAQ with anchor deep-links.
> 13. **ADRs 022–027** appended in `07-gap-closure.md §11.5`.

## V1 scope decisions (locked 2026-04-11)

The user answered five framing questions before execution. These decisions **override** anything below that contradicts them:

1. **No payment integration in v1.** P0-F is deleted. No CloudPayments, no Stripe, no Yookassa. Money is out of scope.
2. **No deposits.** P0-G (deposit-linked PII gate) is deleted. Replaced with a bid-linked PII gate: contact info unlocks when the traveler accepts a guide's offer (§P0-G′ below).
3. **Bid-first workflow — every booking requires guide confirmation.** Instant-book is deferred. Excursions and tours both flow through request → offer → accept → booking. Instant-book eligibility gating is dropped for v1.
4. **No cancellation flow.** Once a booking row exists, it only progresses forward. `cancelled` stays as a terminal DB state for admin dispute resolution, but no user-facing cancel button. State-machine edges to `cancelled` land in P1 or later.
5. **0% commission.** No commission field, no commission math, no commission reporting. Track gross order value only. `total_commission_rate` becomes a platform config set to 0; all code paths that reference it short-circuit.

Net effect: v1 is a **pure matching marketplace**. Guides post listings + accept requests + send bids; travelers browse + request + accept bids; the platform hosts the catalog and the negotiation thread. No money moves through it. That's simpler than Tripster in every money dimension and richer in the negotiation dimension. Both are good.

## The one-paragraph thesis

Provodnik's **negotiation backbone is already in place**: `traveler_requests` + `guide_offers` + `conversation_threads` (with `subject_type ∈ {request, offer, booking, dispute}`). That's rarer than it sounds — it's exactly the thing Tripster does NOT have. Tripster only has paid bookings on pre-priced listings; their "Задать вопрос" inquiry flow is a weak bolt-on inside the booking MFE.

So Provodnik should NOT replicate Tripster wholesale. It should replicate **the listing depth, schedule/availability, editor UX, deposit-only payment, calendar, and order-thread polish** from Tripster — and keep the bid/request flow as the native primary path, with pre-priced instant-book as a secondary path that maps to a one-step bid acceptance. Tours and excursions are both listings that accept bids; excursions additionally accept instant bookings.

Everything below follows from that thesis.

## Feature matrix — Tripster × Provodnik × gap

| # | Tripster feature | Provodnik today | Gap | Priority |
|---|---|---|---|---|
| 1 | 8 listing types + 2 formats + per-type branching editor | Flat single form at `src/app/(protected)/guide/listings/new/page.tsx` | Big — needs multi-step editor with Vue-router-style guards | **P0** |
| 2 | Rich listing schema (~15 extra columns) | Basic schema, ~8 core columns present | Big — see §2 migration | **P0** |
| 3 | Weekly recurring schedule + one-off extra slots | No availability table at all | Big — new table + UI | **P0** |
| 4 | Per-listing calendar editor for the guide | No calendar page | Big — `/guide/calendar` | **P1** |
| 5 | Rich booking state machine (draft → awaiting-confirm → awaiting-payment → confirmed → completed) | DB has 7 states, code enforces 5 (mismatch documented in ADR-008) | Medium — reconcile | **P0** |
| 6 | Per-order chat thread with system events inline | Already present: `conversation_threads` + messages | Small — add system-event row type | **P0** (polish) |
| 7 | ~~Deposit-only payment~~ | ~~Zero payment integration~~ | **Out of scope for v1 per user decision (2026-04-11)** | ~~P0~~ **deferred** |
| 8 | PII gate (meeting point, guide contacts) | No gate | Medium — tied to bid acceptance, not deposit | **P0** |
| 9 | Listing detail page with booking-conditions block | Partial | Medium — add conditions block | **P0** |
| 10 | Destination (city) page with filter chips | Minimal grid, no filters | Medium — add filter chips | **P0** |
| 11 | Inquiry-vs-booking dual path | Already present as requests + offers | Small — UX alignment | **P0** (map it) |
| 12 | Guide KPI strip (response / confirmation / payment / conversion rates) | No strip | Medium — new SQL views | **P1** |
| 13 | Promotion as paid-commission-uplift | None | Big | **P2** (v2) |
| 14 | Guide verification stepper UI | Form exists, no stepper | Small — pure UI | **P1** |
| 15 | Seasonal price adjustment rules (date range + weekday mask + delta) | None | Medium | **P1** |
| 16 | Tier-based tariffs (adult/child/student rows) | None | Small — new table | **P1** |
| 17 | Single-user-dual-role model | Already works | — | done |
| 18 | Guide public profile (`/guide/{id}`) marketing layout | Exists | Small — style polish | **P1** |
| 19 | Order cross-sell rails (similar/same-guide) | None | Small | **P2** |
| 20 | Support sidebar inside order detail | None | Small | **P1** |

## Listing-type taxonomy for Provodnik

Drop Tripster's 8 types down to 3 that match our positioning, and remap Tripster codes to ours. Each type defines which editor sections render and whether instant-book is eligible.

| Provodnik type | Maps from Tripster | Accepts bids? | Instant-book? | Multi-day? |
|---|---|---|---|---|
| `excursion` | `experience` + `waterwalk` + `masterclass` + `photoshoot` + `quest` | ✓ | ✓ | ✗ |
| `tour` | `MULTIDAY_TOUR` + `activity` (multi-day activity) | ✓ | ✗ | ✓ |
| `transfer` | `transfer` | ✓ | ✓ | ✗ |

Format is orthogonal: `individual | group`, matching Tripster.

The editor section visibility rule: `tour` hides the weekly-schedule and event-span sections (multi-day tours run as one-off events), shows "Videos" and "Itinerary days" instead.

## P0 work (v1 replication batch)

Ordered by dependency — earlier items unblock later ones.

### P0-A. Schema expansion migration
One migration, `20260412000001_listings_tripster_schema.sql`. Adds the following columns to `listings`:

- `listing_type` text CHECK IN ('excursion','tour','transfer') — defaults existing rows to 'excursion'
- `format` text CHECK IN ('individual','group')
- `movement_type` text[] — array because a single tour can be "walk + bus"
- `languages` text[] — already on guide_profiles; duplicate at listing level for filtering
- `children_allowed_age` smallint (0=none, 1=any, 2=3+, 3=6+, 4=10+, 5=14+)
- `max_persons` smallint
- `pricing_model` text CHECK IN ('per_group','per_person')
- `instant_booking` boolean default false
- `close_registration_before_minutes` integer default 120
- `event_span_minutes` integer default 0
- `meeting_point_text` text
- `meeting_point_approx_text` text
- `meeting_point_location` geography(Point, 4326) — pin on map
- `meeting_point_hidden_until_deposit` boolean default true — the PII gate
- `are_photos_legal` boolean default false
- `org_details` text (cost/equipment/meals/restrictions/transport block)
- `idea`, `route`, `theme`, `facts`, `audience` text — matches Tripster's description subfields

Four new side tables:

- `listing_schedule` — weekly template rows (`listing_id`, `weekday smallint 0-6`, `from_time time`, `to_time time`)
- `listing_schedule_extras` — one-off overrides (`listing_id`, `date`, `from_time`, `to_time`, `action text CHECK IN ('open','close')`)
- `listing_tariffs` — tier rows (`listing_id`, `name`, `price_minor`, `order smallint`)
- `listing_price_adjustments` — seasonal rules (`listing_id`, `date_start`, `date_end`, `weekday_mask smallint`, `action text`, `percent smallint`)

**Tour-specific additions (new from sweep):**

- On `listings`: `difficulty_level text CHECK IN ('easy','medium','hard','extreme') NULL`, `included text[] DEFAULT '{}'`, `not_included text[] DEFAULT '{}'`, `accommodation jsonb NULL`, `deposit_rate numeric(4,3) DEFAULT 0` (0 in v1; per-listing override when v2 enables payments — Tripster stores 15% on tours vs 25% on excursions, not a global config)
- On `listings` (transfer-only): `pickup_point_text`, `dropoff_point_text`, `vehicle_type`, `baggage_allowance`
- On `guide_profiles`: `is_tour_operator boolean DEFAULT false`, `tour_operator_registry_number text NULL`
- New table `listing_days(listing_id, day_number smallint, title, body, date_override date NULL, PK listing_id+day_number)` — per-day itinerary
- New table `listing_meals(listing_id, day_number, meal_type CHECK IN ('breakfast','lunch','dinner'), status CHECK IN ('included','paid_extra','not_included'), note, PK listing_id+day_number+meal_type)`
- New table `listing_tour_departures(id, listing_id, start_date, end_date, price_minor, currency, max_persons, status)` — fixed date-range seats for tours; replaces weekly schedule for `listing_type = tour`

**Schedule source-of-truth rule:** `excursion` and `transfer` use `listing_schedule` + `listing_schedule_extras`. `tour` uses `listing_tour_departures` exclusively. The editor branches on `listing_type` at mount; the availability-check SQL function branches on type too.

**Gate:** must run before any P0-B, P0-C work. Single worktree, orchestrator dispatches via `cursor-dispatch.mjs`. Touch only SQL + `src/lib/supabase/types.ts` regen.

### P0-B. Listing editor rewrite with sidebar stepper
Replace `guide-listing-create-screen.tsx` with a multi-step editor at `src/app/(protected)/guide/listings/[id]/edit/` (the create path becomes a draft-insertion-then-redirect, same as Tripster).

Sidebar sections (Vue-router guard equivalent in Next.js: a layout with a per-step completeness check):
1. Type + Format
2. Description (Title, Idea, Route, Theme, Org details, Facts, Audience)
3. Photos
4. Meeting point + city
5. How it's conducted (duration, languages, movement, children, max)
6. Schedule (weekly template + extras)
7. Order config (cutoff, event span, instant-book)
8. Pricing (model, base price, tariffs, discount, adjustments)

Each section validates before allowing next-section navigation. Draft persists on every blur. Mandatory-step gate matches Tripster exactly (§2 takeaway 2 from `02-editor-schema.md`).

**Split into 3 cursor-agent prompts:** (a) the layout + guard + draft lifecycle, (b) sections 1–4 + photo upload, (c) sections 5–8 including the schedule calendar and pricing rules UI. Each under 8k tokens. Dispatched sequentially after P0-A merges.

**Type-branching rules (new from sweep — see `06-listing-type-matrix.md`):**
- One `ListingEditor` shell with a `SECTIONS_BY_TYPE` map, not three separate editors
- `excursion` uses the 8-section Tripster flow as-is
- `tour` hides: Route narrative, Theme, Weekly schedule, Event span, Instant-book, Tariffs, Movement type. Shows: **Itinerary days**, **Accommodation**, **Meals grid**, **Difficulty level**, **Included / Not included**, **Videos**, **Fixed date-range departures** (not weekly template). Pricing defaults to `per_person`.
- `transfer` hides: Route, Theme, Facts, Audience, Tariffs, Difficulty, Itinerary, Accommodation, Meals. Shows: Pickup point + drop-off point (two map pins), Vehicle type, Capacity, Baggage allowance.
- Tour publishing is gated on `guide_profiles.is_tour_operator = true` when the tour crosses an overnight — Russian federal law requires tour operators to be in the реестр туроператоров.
- Section visibility computed in the layout; guard redirects to first incomplete visible section on mount.

### P0-C. Booking state machine reconciliation
ADR-008 explicitly left `awaiting_guide_confirmation → pending` as a boundary translation. Fix it now. The v1 forward-only edges:

```
awaiting_guide_confirmation → confirmed → completed
```

That's it. No cancel edges for user actions (per scope decision 4), no `no_show` auto-transition, no `pending` state on the user path — bookings are created directly in `awaiting_guide_confirmation` when a traveler accepts a bid. `pending`, `cancelled`, `disputed`, `no_show` remain in the DB enum for future use and for admin-only dispute resolution, but no UI surfaces them in v1.

- Widen `BookingStatus` in `src/lib/bookings/state-machine.ts` to the full DB enum
- Update the locking unit test
- Delete the `awaiting_guide_confirmation → pending` translation at the boundary (ADR-008 is superseded)
- Server action `confirmBookingAction` transitions `awaiting_guide_confirmation → confirmed` directly

### P0-D. Listing detail polish — booking conditions block
Add a fixed-position booking-conditions block on the listing detail page showing (v1 copy):
- "Свяжитесь с гидом через запрос — он пришлёт предложение с ценой и деталями"
- "Оплата напрямую гиду при встрече" (flat — no deposit, no commission to explain)
- "После принятия предложения контакты гида станут доступны"
- "Организатор прошёл верификацию" (driven by `guide_verification_status = 'approved'`)
- "За группу, 1–{max_persons} человек" or "За человека" (driven by `pricing_model`)

All copy keyed on listing fields, no hardcoding. Mirrors `experience/22051/` capture in §03 — just swapped for the v1 money model (off-platform) and the bid-first path.

### P0-E. Request form + offer thread polish
There is no paid booking form in v1 — every transaction flows through request → offer → accept. Replace the old "book now" flow with a request-creation form at `/listings/{id}/request` containing: preferred dates (range) → time preference (morning/afternoon/evening/any) → participants → traveler info → "Задать вопрос или запросить предложение". Submit creates a `traveler_requests` row AND a `conversation_threads` row (subject_type=request) AND appends a `request_created` system event. Redirects to `/requests/{id}`.

The request thread surfaces N guide offers as cards at the top of the thread. Each offer card shows: price, proposed date/time, guide note, "Принять" button. Accepting an offer:
1. Transitions the offer row to `accepted`
2. Creates a `bookings` row in `awaiting_guide_confirmation`
3. Creates a new `conversation_threads` row bound to the booking (same participants)
4. Appends `bid_accepted` system event to the request thread
5. Appends `booking_created` system event to the booking thread
6. Unlocks guide contact info on the booking page (§P0-G′)
7. Redirects to `/bookings/{id}`

The thread component needs a system-event row type. Current `messages` table has `body text` and `author_id`. Add a nullable `system_event_type text` column (values: `request_created | bid_submitted | bid_accepted | guide_amended | booking_created | guide_confirmed | booking_completed`) plus a JSON `system_event_payload jsonb` for field-level diffs like Tripster's "**Стоимость:** 1500 ₽" strong-highlight. The thread component renders system events as a distinct row type with inline strong diffs. Same component powers request threads, booking threads, and (future) dispute threads.

### P0-F. ~~Payment integration~~ — **DELETED per v1 scope decision 1**
No payment provider integration in v1. The `payments` table is not created. The `deposit_minor` / `remainder_minor` fields already present on `bookings` stay nullable and unused. Re-enable in a future milestone when we layer money on top.

### P0-G′. PII gate tied to bid acceptance (replaces deposit-linked P0-G)
The PII gate mirrors Tripster's intent — prevent off-platform routing before a deal is struck — but reads from the bid state instead of the payment state.

Rule:
- On a **request** page (`/requests/{id}`) the traveler sees the listing city, general meeting-point description (`meeting_point_approx_text`), and the guide's display name + avatar + rating. NO phone, NO email, NO exact address, NO `meeting_point_text`, NO `meeting_point_location` pin.
- The moment the traveler **accepts** any offer on that request, the matching guide's contacts and the exact meeting point unlock in the newly-created booking row. Contacts on all other (rejected) offers' guides stay hidden forever.
- The guide symmetrically sees a reduced traveler profile (first name + last initial + avatar) until they win the bid. After acceptance, the traveler's phone + email surface in the booking detail.
- On a direct request thread with only one guide (no bid yet), contacts stay hidden until a bid is sent AND accepted.

Implementation:
- A `contacts_visible_on_booking(booking_id uuid, user_id uuid)` SQL function returns bool — `true` iff the booking status is at least `awaiting_guide_confirmation` AND `user_id` is either the booking's traveler or the booking's guide.
- UI layer calls the function; RLS policies on `guide_profiles.phone`, `guide_profiles.email`, `listings.meeting_point_text`, `listings.meeting_point_location` gate reads on it.
- Copy: _"Контакты гида и точное место встречи откроются после принятия предложения."_

This is cleaner than the Tripster rule because there's only one trigger event (bid accepted) instead of two (booking created → deposit captured).

### P0-H. Destination page filter strip
The destination page at `src/app/(site)/destinations/[slug]/page.tsx` renders a grid today. Add a filter-chip row above it wired to URL searchParams (matches Wave D pattern from MEMORY.md):
- Формат (individual/group)
- Способ передвижения (multi-select dropdown)
- Цена (range slider)
- Длительность (min-max)
- Рубрики (category chips)

Filtering runs server-side via a new `list_destination_listings(city_slug text, filters jsonb)` SQL function. Listing card anatomy already matches Tripster's (rating, duration chip, movement chip, format chip) per the §03 capture — verify and align any missing chip.

### P0-I. Bid/request flow alignment — primary and only booking path in v1
The existing request + offer code already maps cleanly. In v1 this is the **only** path to a booking (no instant-book variant, per scope decision 3). Work:

- Rename UI strings to conversational Russian: "guide_offer" → "Предложение гида", "traveler_request" → "Запрос путешественника", "offer accepted" → "Предложение принято — гид должен подтвердить встречу"
- When a traveler creates a request → append `request_created` system event to the new request thread
- When a guide submits an offer → append `bid_submitted` system event with `{price, proposed_start_at, duration, participants, note}` payload
- When a guide amends an offer → append `guide_amended` with a field-diff payload (mirrors Tripster's **Стоимость:** strong highlight)
- When a traveler accepts an offer → everything in §P0-E acceptance sequence fires
- When the guide taps "Подтвердить" on the resulting booking → transitions to `confirmed` + appends `guide_confirmed` system event to the booking thread
- The `/requests/{id}` traveler view and `/guide/requests/{id}` guide view both use the same thread component as bookings; the only difference is that a request has N pending offers surfaced as cards at the top of the thread, a booking has 0 offers and a single "Подтвердить встречу" CTA visible only to the guide until pressed

Tours work identically to excursions on this path — the only difference is that the editor surfaces different sections for tours (multi-day itinerary instead of weekly schedule), and the request form captures a date range instead of a single date. The bid/accept/confirm backbone is the same.

## P1 work (polish batch, post-v1)

### P1-A. Guide calendar surface
New page `/guide/calendar`. Month grid pulling from `listing_schedule` merged with `bookings` + `listing_schedule_extras`. Two actions per day: "Закрыть время" (single slot) / "Закрыть день" (all slots). Filter by listing. Exact Tripster layout.

### P1-B. Guide KPI strip + stats dashboard
Persistent strip above every `/guide/*` route. Six metrics, lifetime:
- Response time (median minutes between traveler message and guide reply, measured on `messages` created_at diffs)
- Confirmation rate (% of bookings moving `awaiting_guide_confirmation → confirmed`)
- Payment rate (% of confirmed bookings with captured deposit) — drops from v1 display since v1 has no payment; swap for "Повторные клиенты"
- Conversion (% of requests that become bookings)
- Total orders
- Total earned (sum of `bookings.subtotal_minor` on completed)

Three SQL views + one server component. KPI strip becomes the guide-shell layout's top block.

**Charts: do not build in React.** Tripster outsources the orders-over-time chart to Yandex DataLens (iframe with `?guide_id={id}` query param). Follow the same pattern: log events to a reporting schema (`reporting.orders_daily`, etc.) and embed a Metabase / Superset / DataLens dashboard instead of building charts in-house. Saves weeks. Keep the KPI tiles native React (they're trivial), outsource everything with an axis.

### P1-C. Verification stepper UI
Pure UI task per ADR-009. Use the real DB enum (`draft | submitted | approved | rejected`). Three-dot stepper above the verification form. No new statuses.

### P1-D. Tariffs + discounts + price adjustments UI
The schema lands in P0-A but the editor UI for tariff rows, discount config, and price-adjustment rules lives here. Section 8 of the editor stepper.

### P1-E. Support sidebar on every order detail
Copy Tripster's "Поддержка" block. Working hours, order number for copy-paste, Telegram/email/phone channels. Cheap, high-value.

### P1-F. Guide public profile polish
Marketing-style layout at `/guide/{id}` — bio + photos + languages + offers rail + reviews + "Напишите мне" CTA. Match Tripster's visual register but keep our brand.

**Dual-rating display (new from sweep):** the guide public profile and every listing detail page must surface TWO rating numbers: `listings.average_rating` (per-listing, over that listing's reviews) and `guide_profiles.average_rating` (organizer-level, over all of the guide's listings). Tripster labels them "Рейтинг экскурсии" and "Рейтинг организатора". A new listing with 0 reviews still inherits trust via the organizer rating. Aggregation jobs maintain both independently.

### P1-G. Notification preferences matrix (new from sweep)
`/profile/notifications/` is a 3D matrix — **role × event × channel** — not a flat list. Sub-screen per role (Guide / Traveler / Partner), and inside each: a grid with rows for events (`Новый заказ`, `Новое сообщение`, `Напоминание о предстоящей встрече`, `Изменение статуса`, `Новый отзыв`, `Акции и новости`) and columns for channels (`Telegram`, `СМС`, `Email`, `Push in-app`).

Storage: `notification_preferences jsonb` on `user_profiles`, keyed `{role}.{event_key}.{channel} = bool`. Single server action updates a path. Default all-on for transactional events, all-off for marketing. Telegram channel lights up only when a user has linked their Telegram (`telegram_chat_id IS NOT NULL`).

### P1-H. Favorites (new from sweep)
`listing_favorites(user_id, listing_id, created_at)` + heart toggle on listing cards + `/favorites/` grid page. Flat bucket, no folders/lists. Cheap — half a day of work. Empty state: "Добавляйте экскурсии в избранное — мы напомним, когда появятся новые даты."

## P2 work (v2+, explicit parking lot)

- **Promotion / paid commission uplift** — requires reputation floor (conversion ≥60%, rating ≥4.6), per-city scarcity allocator, commission reporting dashboard. Non-trivial. Not v1.
- **Mobile app parity** — Tripster pushes the "download our app" heavily; Provodnik is web-first for now.
- **Cross-sell rails** — "Other listings in {city}" and "Similar listings" carousels on the order detail page. Small but needs similarity/collab-filter data.
- **Partner/travel-agent cabinet** (`/partner-account/`) — this is Tripster's **affiliate/referral** system for bulk partners (travel agents, bloggers, content sites), NOT a guide-payouts dashboard. Per-campaign UTM tracking, referral link builder, creative assets, payout reports. Only matters after real volume.
- **Traveler referral program** (`/bonuses/` in Tripster) — word-of-mouth referrals: 10% off friend's first booking + 10% back to referrer as in-app credit. Separate from the partner cabinet. Dead simple schema (`referrals(referrer_id, referred_id, status, bonus_minor)`) but brings zero benefit without commission economics — park until v2 payments land.
- **Guide knowledge quiz** — Tripster embeds a "Проверьте, как хорошо вы знаете Трипстер" 7-question quiz on the stats page, gamified onboarding that unlocks a profile badge. Cheap win, not essential.
- **Contact-visibility reputation gate for the GUIDE** — Tripster revokes a guide's ability to see traveler contacts on new orders when the guide's conversion rate drops below 60% ("Контакты можно смотреть от 60%"). Acts as a spam filter and a performance lever. In Provodnik this would gate the bid-acceptance PII unlock on a guide-conversion floor. Needs reliable conversion-rate accounting before it can be safely applied — don't ship until P1-B stats views are stable.
- **Tour operator registry enforcement** — the `is_tour_operator` flag lands in P0-A, but the publish-gate logic (block tours that cross an overnight unless the flag is true AND `tour_operator_registry_number` is filled) should land alongside the tour editor branch in P0-B. If we're not shipping tours in v1, park the gate entirely until the tour editor ships.
- **Multilingual editor** — Tripster runs on 5 currencies + 19 languages. We ship RU + EN only in v1.
- **Self-service guide payout history** — Tripster has NO self-service payout surface (accounting handles it out-of-band and guides complain about it). Easy differentiator for Provodnik once commission > 0.
- **Home page editorial rails** — seasonal rail and feature-experience collage need a `homepage_sections` admin table + curation workflow. Not blocking v1 (destinations rail + guides rail + "all tours" CTA is enough to ship).
- **Help center** — Tripster's 6-category help taxonomy (`О проекте / Какие бывают экскурсии / Как заказать / Как задать вопросы гиду / Как происходит оплата / Как отменить`) is a cheap copy. Markdown pages under `src/app/(site)/help/` + a search box. Skip v1; support email is fine.

## Execution order (v1 — post-scope-decisions)

```
Phase 1 (schema unblock)     : P0-A                          → 1 worktree
Phase 2 (state alignment)    : P0-C                          → 1 worktree, after P0-A
Phase 3 (editor rewrite)     : P0-B (×3 prompts, parallel)   → 3 worktrees
Phase 4 (traveler surfaces)  : P0-D + P0-H (parallel)        → 2 worktrees
Phase 5 (request/thread)     : P0-E + P0-G′ (parallel)       → 2 worktrees
Phase 6 (bid alignment)      : P0-I                          → 1 worktree, needs 4+5
Phase 7 (P1 polish)          : P1-A..F parallel pairs        → 3 batches
```

Phases 1–6 are v1. Total scope drops to **~10 cursor-agent prompts across 9 worktrees** (down from 13/11 before the scope decisions — removing payments shaved ~3 prompts). Each phase ends with a checkpoint tag, SOT update, and a Slack dev-note through `slack-devnote.mjs`.

## Decisions captured for DECISIONS.md (to append after review)

- **ADR-012:** v1 ships with no payment integration and 0% commission. Money is out of scope; marketplace value is pure matching. Rationale: user decision 2026-04-11; lets v1 ship faster and validates bid/request flow without the infrastructure lift. Revisit when traction demands it.
- **ADR-013:** Request → offer → accept → booking is the ONLY v1 booking path. No instant-book variant for any listing type. Rationale: user decision — every booking requires guide confirmation because this is a bid marketplace. Preserves Provodnik's differentiator.
- **ADR-014:** Listing type taxonomy fixed at `excursion | tour | transfer`. Format orthogonal at `individual | group`. Rationale: covers 95% of content without Tripster's 8-way split; keeps editor branching manageable.
- **ADR-015:** Single `conversation_threads` component renders both request threads and booking threads. System events stored as a new row type on `messages` with `system_event_type` + `system_event_payload`. Rationale: existing thread plumbing already has `subject_type`; Tripster proves the model works.
- **ADR-016:** PII gate on guide contacts and exact meeting point is triggered by **bid acceptance**, not by payment. Contacts unlock on `awaiting_guide_confirmation` booking status. Rationale: v1 has no payment signal; bid acceptance is the strongest available commitment event.
- **ADR-017:** v1 has no user-facing cancellation. `cancelled`, `disputed`, `no_show`, `pending` remain in the DB enum for admin-only paths. Forward-only state machine: `awaiting_guide_confirmation → confirmed → completed`. Rationale: user decision — simplifies v1, reopens later if needed.
- **ADR-018** _(new from sweep):_ Charts are embedded from a BI tool (Metabase / DataLens / Superset), not built in React. Only native KPI tiles are built in-app. Rationale: Tripster outsources the same way (DataLens iframe); saves weeks of charting work; lets product iterate on dashboards without code pushes.
- **ADR-019** _(new from sweep):_ Dual rating display (listing rating + organizer rating) on listing detail and guide profile. Both are maintained independently by aggregation jobs. Rationale: new listings inherit trust from the guide's overall reputation via the organizer rating; Tripster uses this to good effect.
- **ADR-020** _(new from sweep):_ Notification preferences are a 3D tensor `role × event × channel`, stored as `notification_preferences jsonb` keyed by path. Not a flat list. Rationale: single-user-dual-role architecture needs per-role preferences (a guide wants different notifications than a traveler using the same account).
- **ADR-021** _(new from sweep):_ Tours use `listing_tour_departures` (fixed date-range seats), excursions and transfers use `listing_schedule` (weekly template). They do NOT share storage. The editor and the availability-check function branch on `listing_type`. Rationale: multi-day tours have fundamentally different availability semantics (one-off departures with seasonal pricing) and forcing them into a weekly template creates unsolvable edge cases.

## Current-state reference (snapshot, 2026-04-11)

From the parallel scan of the Provodnik app:

- Latest migration: `20260406000001_listings_image_url.sql`
- Request + offer flow already exists. Tables: `traveler_requests`, `guide_offers`. Offer statuses: `pending | accepted | declined | expired | withdrawn`.
- Messaging thread infra already exists. Table: `conversation_threads` with `subject_type ∈ {request, offer, booking, dispute}`. Messages, participants present.
- Booking state machine mismatch (ADR-008): DB enum has 7 values, code enforces 5. P0-C resolves this.
- Guide verification status enum: `draft | submitted | approved | rejected`. Verification form exists at `src/app/(protected)/guide/verification/page.tsx`. No stepper.
- Listing editor: single flat form at `src/app/(protected)/guide/listings/new/page.tsx`. Needs the multi-step rewrite.
- Listing schema: basic (price_from_minor, max_group_size, category, duration_minutes, region, instant_book, meeting_point, inclusions, exclusions, cancellation_policy_key). Missing ~15 Tripster fields listed in P0-A.
- Destination page: renders at `src/app/(site)/destinations/[slug]/page.tsx`, grid + hero, no filter chips.
- Guide bookings page: `src/app/(protected)/guide/bookings/page.tsx` via `GuideBookingsScreen`. Segmentation via tabs confirmed in Wave D memory.
- Zero payment integration in the codebase. `src/lib/payments` does not exist. No Stripe/Yookassa/CloudPayments references.

## Open questions — all resolved 2026-04-11

All five framing questions answered by the user. Answers are captured in §"V1 scope decisions" at the top of this document and in ADR-012 through ADR-017. **Phase 1 is unblocked and can dispatch immediately.**
