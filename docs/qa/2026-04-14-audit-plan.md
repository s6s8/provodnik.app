# Provodnik Pre-Launch QA — Master Execution Plan
> **Last updated:** 2026-04-14
> **Status:** IN PROGRESS
> **Resume from:** top of first unchecked item

---

## TRACK A — Page Audit + TRACK B — End-to-End Workflow
> Both tracks interleaved. Track B drives the session state (who is logged in).
> Fix protocol: P0/P1 found → plan → cursor-agent → push → resume.
> All findings → `docs/qa/2026-04-14-audit-findings.md`
> All walkthrough steps → `docs/qa/2026-04-14-walkthrough.md`

---

## PHASE 0 — Setup

- [ ] 0.1 Open Chrome DevTools MCP, navigate to `https://provodnik.app`
- [ ] 0.2 Take baseline screenshot of homepage
- [ ] 0.3 Confirm site loads (no 500, no blank page)
- [ ] 0.4 Check browser console for baseline errors

---

## PHASE 1 — Anonymous Audit (Track A Session 1)

### Homepage `/`
- [ ] 1.1 Headline renders (demand-first copy)
- [ ] 1.2 "Создать запрос" CTA → `/traveler/requests/new` (should redirect to auth)
- [ ] 1.3 0% commission trust tile visible
- [ ] 1.4 Guide acquisition CTA → `/auth/signup`
- [ ] 1.5 Destinations strip renders with images
- [ ] 1.6 Listings strip renders with cards
- [ ] 1.7 How-it-works section visible
- [ ] 1.8 Mobile layout (375px): no overflow, hamburger visible

### Header (check on every public page)
- [ ] 1.9 Logo → `/`
- [ ] 1.10 "Как это работает" → `/how-it-works`
- [ ] 1.11 "Стать гидом" → `/for-guides` or `/auth/signup`
- [ ] 1.12 "Создать запрос" → auth redirect
- [ ] 1.13 Mobile hamburger → drawer opens with all nav items

### Footer (check on homepage)
- [ ] 1.14 All footer links resolve (no 404)
- [ ] 1.15 Policy/legal links present

### `/how-it-works`
- [ ] 1.16 Page renders
- [ ] 1.17 Traveler 3-step flow visible
- [ ] 1.18 Group pricing section visible
- [ ] 1.19 Guide 3-step flow visible
- [ ] 1.20 5 FAQ items render and expand

### `/for-guides`
- [ ] 1.21 Page renders
- [ ] 1.22 Commission comparison table (vs Tripster/Airbnb)
- [ ] 1.23 CTA to register as guide

### `/destinations`
- [ ] 1.24 Grid renders
- [ ] 1.25 City images load
- [ ] 1.26 Click → destination detail works

### `/destinations/[slug]` (Moscow)
- [ ] 1.27 Hero image loads
- [ ] 1.28 Category pill filter strip renders and filters
- [ ] 1.29 Format dropdown (private/group) works
- [ ] 1.30 Listing cards render with chips
- [ ] 1.31 Guide cards section renders
- [ ] 1.32 Price/budget shows (not "—")

### `/listings`
- [ ] 1.33 Grid renders
- [ ] 1.34 Search input syncs to `?q=` URL param
- [ ] 1.35 Cards have format + duration chips
- [ ] 1.36 Rating shows
- [ ] 1.37 Price formatted with ₽

### `/listings/[slug]`
- [ ] 1.38 Gallery renders
- [ ] 1.39 "Включено" and "Не включено" split cards
- [ ] 1.40 Itinerary section (no fake hardcoded content)
- [ ] 1.41 Guide info panel
- [ ] 1.42 Bid-first CTA: "Запросить у этого гида" → auth redirect
- [ ] 1.43 No "Забронировать тур" broken button

### `/requests` (public open feed)
- [ ] 1.44 Page renders
- [ ] 1.45 Unauthenticated: sees "Войти чтобы присоединиться"
- [ ] 1.46 Request cards show: city, dates, group size, interests chips

### `/guides`
- [ ] 1.47 Guide cards render with avatar/name/rating

### `/auth`
- [ ] 1.48 Login form renders
- [ ] 1.49 Forgot password link visible
- [ ] 1.50 No browser-native validation tooltips (no `required` attributes firing)
- [ ] 1.51 Submit empty → styled error message shown

### `/auth/signup`
- [ ] 1.52 Signup form renders
- [ ] 1.53 Role selection visible (traveler/guide)

---

## PHASE 2 — Register Maxim (Guide) + Guide Onboarding

### B1: Register Maxim
- [ ] 2.1 Navigate to `/auth/signup`
- [ ] 2.2 Register: `maxim.guide@testprov.ru` / password: `TestPass123!` / role: guide
- [ ] 2.3 Confirm email (check Supabase Inbucket or skip if auto-confirm)
- [ ] 2.4 Land on guide dashboard — screenshot
- [ ] 2.5 Guide nav visible: Входящие / Заказы / Предложения / Календарь / Статистика
- [ ] 2.6 KPI strip visible above dashboard

### B2: Maxim creates listing
- [ ] 2.7 Navigate to `/guide/listings/new`
- [ ] 2.8 Fill: Title "Обзорная экскурсия по Москве", type=Экскурсия, city=Москва, duration=3h, price=2500₽/person
- [ ] 2.9 Fill description, inclusions, at least 1 itinerary step
- [ ] 2.10 Submit listing → listing created → appears in `/guide/listings`
- [ ] 2.11 Screenshot listing card with status badge

---

## PHASE 3 — Guide Pages Audit (Track A Session 3, as Maxim)

- [ ] 3.1 `/guide/dashboard` — tiles, KPI strip, quick actions
- [ ] 3.2 `/guide/inbox` — 3 tabs render, counts correct
- [ ] 3.3 `/guide/orders` — 7 tabs, По событиям / По заказам toggle
- [ ] 3.4 `/guide/listings` — filter tabs (Все/Экскурсии/Туры/Трансферы), Maxim's listing appears
- [ ] 3.5 `/guide/listings/new` — stepper renders all sections
- [ ] 3.6 `/guide/calendar` — month grid, click day → side panel, 30-min slots, block slot button
- [ ] 3.7 `/guide/stats` — page renders
- [ ] 3.8 `/guide/verification` — stepper matches DB status
- [ ] 3.9 `/profile/guide/about` — bio form, save works, persists on revisit
- [ ] 3.10 `/guide/notifications` — matrix: role tabs × 6 events × 3 channels
- [ ] 3.11 KPI strip present on EVERY guide route (verify all 5)
- [ ] 3.12 Mobile: hamburger works, KPI strip scrolls

---

## PHASE 4 — Register Anna (Traveler) + Create Request

### B3: Register Anna
- [ ] 4.1 Navigate to `/auth/signup`
- [ ] 4.2 Register: `anna.traveler@testprov.ru` / `TestPass123!` / role: traveler
- [ ] 4.3 Land on traveler dashboard — screenshot
- [ ] 4.4 Traveler nav visible: 5 items
- [ ] 4.5 Mobile tabs visible

### B4: Anna creates request
- [ ] 4.6 Navigate to `/traveler/requests/new`
- [ ] 4.7 Step 1: destination=Москва, dates=next weekend (2 days)
- [ ] 4.8 Step 2: group size=3, interests=История+Архитектура
- [ ] 4.9 Step 3: description="Хочу узнать историю Москвы, побывать в Кремле и на Красной площади"
- [ ] 4.10 Submit → redirected to `/traveler/requests/[id]`
- [ ] 4.11 Request visible in My Requests list
- [ ] 4.12 Screenshot request detail page

---

## PHASE 5 — Traveler Pages Audit (Track A Session 2, as Anna)

- [ ] 5.1 `/traveler/dashboard` — tiles, quick actions
- [ ] 5.2 `/traveler/requests` — Anna's request listed, status badge correct
- [ ] 5.3 `/traveler/requests/[id]` — request detail, "bid comparison" area (empty now)
- [ ] 5.4 `/traveler/bookings` — empty, no error
- [ ] 5.5 `/traveler/open-requests` — Anna's own request appears, other requests visible
- [ ] 5.6 `/traveler/favorites` — empty, no error
- [ ] 5.7 `/traveler/notifications` — list (may be empty)
- [ ] 5.8 `/messages` — thread exists for Anna's request, system event `request_created` visible

---

## PHASE 6 — Maxim Submits Bid

### B5: Maxim bids on Anna's request
- [ ] 6.1 Login as Maxim
- [ ] 6.2 Navigate to `/guide/inbox`
- [ ] 6.3 Anna's request appears in "Без предложения" tab
- [ ] 6.4 Click "Предложить цену" → BidFormPanel opens inline (not page nav)
- [ ] 6.5 Fill: price=7500₽ (for group of 3), proposed date=same as Anna's dates, note="Проведу авторскую экскурсию с посещением закрытых залов"
- [ ] 6.6 Submit bid → panel closes, request moves to "С предложением" tab
- [ ] 6.7 Screenshot Maxim's inbox after bid submitted
- [ ] 6.8 Login as Anna → check `/traveler/requests/[id]` → Maxim's bid card appears
- [ ] 6.9 Screenshot bid card (guide name, rating, price, proposed date, note, "Принять" button)
- [ ] 6.10 Check Anna's notifications → bid_submitted event visible
- [ ] 6.11 Check thread → `bid_submitted` system event with bold field diffs

---

## PHASE 7 — Boris Joins Anna's Group

### B6: Register Boris + join
- [ ] 7.1 Register: `boris.traveler@testprov.ru` / `TestPass123!` / role: traveler
- [ ] 7.2 Navigate to `/traveler/open-requests`
- [ ] 7.3 Anna's request visible in feed
- [ ] 7.4 Group size shown as 1 (just Anna)
- [ ] 7.5 Click "Присоединиться к группе"
- [ ] 7.6 Confirmation shown, group count → 2
- [ ] 7.7 Screenshot Boris's view after joining
- [ ] 7.8 Login as Anna → check thread → `participant_joined` system event visible
- [ ] 7.9 Check Maxim's bid card: per-person price updates (if pricing_model=per_group)

---

## PHASE 8 — Vera Joins Anna's Group

### B7: Register Vera + join
- [ ] 8.1 Register: `vera.traveler@testprov.ru` / `TestPass123!` / role: traveler
- [ ] 8.2 Navigate to `/traveler/open-requests`
- [ ] 8.3 Anna's request visible, group size = 2
- [ ] 8.4 Click "Присоединиться к группе"
- [ ] 8.5 Group count → 3
- [ ] 8.6 Screenshot Vera's view after joining
- [ ] 8.7 Login as Anna → second `participant_joined` event in thread

---

## PHASE 9 — Anna Accepts Maxim's Bid

### B8: Bid acceptance
- [ ] 9.1 Login as Anna
- [ ] 9.2 Navigate to `/traveler/requests/[id]`
- [ ] 9.3 Maxim's bid card visible with "Принять предложение" button
- [ ] 9.4 Click "Принять предложение"
- [ ] 9.5 Verify: redirect to `/traveler/bookings/[id]` (new booking)
- [ ] 9.6 Verify booking status: `awaiting_guide_confirmation`
- [ ] 9.7 Heading on booking page maps to status correctly
- [ ] 9.8 Check thread on original request → `bid_accepted` system event
- [ ] 9.9 New booking thread created → `booking_created` system event
- [ ] 9.10 Other bids (none in this case) show as declined
- [ ] 9.11 Screenshot booking page (Anna's view)

---

## PHASE 10 — Maxim Confirms Booking

### B9: Guide confirms
- [ ] 10.1 Login as Maxim
- [ ] 10.2 Navigate to `/guide/orders`
- [ ] 10.3 Anna's booking appears in "Ждут подтверждения" tab
- [ ] 10.4 Order card shows: Anna's name, listing title, date, 3 participants, price, status badge
- [ ] 10.5 "Подтвердить" button visible
- [ ] 10.6 Click "Подтвердить"
- [ ] 10.7 Booking status → `confirmed`
- [ ] 10.8 Booking moves to "Забронированы" tab
- [ ] 10.9 `booking_confirmed` system event in booking thread
- [ ] 10.10 Screenshot Maxim's orders after confirm

---

## PHASE 11 — Anna Opens Booking Ticket + Contact Unlock

### B10: Final traveler experience
- [ ] 11.1 Login as Anna
- [ ] 11.2 Navigate to `/traveler/bookings/[id]`
- [ ] 11.3 Heading now shows "Бронирование подтверждено"
- [ ] 11.4 Support sidebar visible
- [ ] 11.5 "Открыть билет" button → booking ticket modal opens
- [ ] 11.6 Ticket shows: guide name, listing title, date, participants, price, status
- [ ] 11.7 Guide contact info is unlocked (phone/email visible)
- [ ] 11.8 Screenshot booking ticket modal
- [ ] 11.9 Screenshot contact unlock reveal
- [ ] 11.10 Check booking thread → all system events in order:
  - `request_created` → `bid_submitted` → `participant_joined` ×2 → `bid_accepted` → `booking_created` → `booking_confirmed`

---

## PHASE 12 — Fix Loop

> Populated during execution as issues are found.
> Format: issue description → fix dispatched → commit hash → verified

- [ ] 12.1 All P0 issues resolved
- [ ] 12.2 All P1 issues resolved
- [ ] 12.3 Final Vercel deploy green
- [ ] 12.4 Re-verify fixed pages

---

## PHASE 13 — Documentation

- [ ] 13.1 Write `docs/qa/2026-04-14-audit-findings.md` — all bugs with severity
- [ ] 13.2 Write `docs/qa/2026-04-14-walkthrough.md` — presentation-ready user journey
- [ ] 13.3 Commit both docs to outer workspace
- [ ] 13.4 Send Telegram summary

---

## ISSUES LOG (populated during execution)

| # | Severity | Route | Role | Description | Status |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

---

## DECISIONS LOG (autonomous decisions made during execution)

| # | Decision | Reasoning |
|---|---|---|
| — | — | — |
