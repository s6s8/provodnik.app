# Provodnik — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement phase-by-phase. Each phase is independently deployable. Do not start a phase until the previous phase's CDP verification has passed.

**Goal:** Build Provodnik as a demand-first travel marketplace — travelers post requests, guides bid, travelers join each other's trips — with full Tripster-quality UI/UX across all surfaces.

**Architecture:** Next.js 15 app router, Supabase (postgres + RLS + storage), TypeScript, Tailwind CSS, shadcn/ui. Six independent phases executed sequentially. Each phase has embedded Tripster field specs and explicit CDP acceptance criteria. An agent prompt that lacks Tripster field specs is incomplete — do not dispatch it.

**Tech Stack:** Next.js 15, Supabase, TypeScript, Tailwind CSS, shadcn/ui, Resend, Sentry, Upstash KV, bun

**Research sources (embed relevant sections in every agent prompt):**
- `.claude/research/tripster/00-navigation-map.md`
- `.claude/research/tripster/01-guide-side.md`
- `.claude/research/tripster/02-editor-schema.md`
- `.claude/research/tripster/03-traveler-side.md`
- `.claude/research/tripster/05-management-surfaces.md`
- `.claude/research/tripster/06-listing-type-matrix.md`
- `.claude/research/tripster/07-gap-closure.md`

**Execution rule:** Before marking any phase DONE, run CDP screenshot verification against the acceptance criteria checklist at the end of each phase. "Tests pass" is not done. "CDP confirms every acceptance criterion" is done.

---

## Phase Order and Rationale

| Phase | Name | Why this order |
|---|---|---|
| **1** | Demand-side core | Our differentiator. Without request/bid/join working beautifully we are a worse Tripster. Ships first. |
| **2** | Guide workspace | Guides need a functional workspace to handle incoming requests from phase 1. |
| **3** | Listing editor | Guides must create quality listings for travelers to discover and request against. |
| **4** | Public catalog | Travelers browse listings and destinations before posting or joining a request. |
| **5** | Order surfaces | Thread events, support sidebar, booking ticket — the post-match experience. |
| **6** | Profile & account | Trust signals and settings. Last but visible to all users. |

---

## Phase 1 — Demand-Side Core (THE DIFFERENTIATOR)

**Goal:** Build the complete request → bid → accept → join flow. This is what makes Provodnik different from every other excursion platform. No part of this flow exists on Tripster. Every screen here is Provodnik-original.

**Files to create:**
- `src/app/(site)/requests/page.tsx` — public open requests feed
- `src/app/(site)/requests/[id]/page.tsx` — public request detail with guide bids
- `src/features/requests/components/open-request-card.tsx` — request card for the feed
- `src/features/requests/components/bid-comparison-view.tsx` — traveler compares bids side by side
- `src/features/requests/components/guide-bid-card.tsx` — a single guide bid card
- `src/features/requests/components/join-request-button.tsx` — group join CTA with group size + price recalc
- `src/features/requests/components/request-create-form.tsx` — multi-step request creation

**Files to modify:**
- `src/app/(site)/requests/new/page.tsx` — replace redirect with request-create-form
- `src/app/(protected)/traveler/requests/[id]/page.tsx` — add bid-comparison-view
- `src/app/(protected)/guide/requests/page.tsx` — guide sees incoming requests with bid CTAs
- `src/data/supabase/queries/requests.ts` — add getOpenRequests, getRequestWithBids, joinRequest queries

---

### Task 1.1 — Request creation form

**What:** Multi-step form. Step 1: destination (city autocomplete) + dates (date range picker, min = today). Step 2: group size (1–20) + interests (multi-select chips) + budget range (slider, optional). Step 3: free-text description ("Tell guides what you're looking for"). Submit creates `traveler_requests` row with `is_public = true` + `conversation_threads` row (subject_type='request') + `request_created` system event on the thread.

**Tripster reference (embed in prompt):** From `04-replication-plan.md §P0-E`:
> "Submit creates a traveler_requests row AND a conversation_threads row (subject_type=request) AND appends a request_created system event."

**Files:**
- Create: `src/features/requests/components/request-create-form.tsx`
- Modify: `src/app/(site)/requests/new/page.tsx`
- Modify: `src/app/(protected)/traveler/requests/new/page.tsx`

- [ ] Write test: submitting the form creates `traveler_requests` row with correct fields
- [ ] Run test — expect FAIL
- [ ] Implement `request-create-form.tsx` — 3 steps, validates before advancing, submission calls server action
- [ ] Implement server action `createTravelerRequest` in `src/app/(protected)/traveler/requests/actions.ts`
- [ ] Server action: insert into `traveler_requests`, insert `conversation_threads`, insert `messages` with `system_event_type = 'request_created'`
- [ ] Run tests — expect PASS
- [ ] Run `bun run typecheck` — 0 errors
- [ ] Commit: `feat(requests): multi-step request creation form`

**Acceptance criteria:**
- [ ] 3-step form with progress indicator
- [ ] Destination autocomplete loads from `destinations` table
- [ ] Date range min = today
- [ ] Group size 1–20 with stepper
- [ ] Interests as selectable chips (history / nature / food / architecture / art / sport / kids / photography)
- [ ] Budget range is optional, shows "Не указан" if skipped
- [ ] Submit → row in `traveler_requests` + row in `conversation_threads` + system event message
- [ ] Redirect to `/traveler/requests/[id]` after submit

---

### Task 1.2 — Open requests feed (public)

**What:** Public page at `/requests`. Shows all `traveler_requests` where `is_public = true` and status is `open`. Sorted by created_at desc. Each card shows: destination city, date range, group size, interests chips, "N guides have bid", traveler first name + last initial, time since posted. Logged-in travelers see a "Join this request" button if they haven't already joined.

**Files:**
- Create: `src/app/(site)/requests/page.tsx`
- Create: `src/features/requests/components/open-request-card.tsx`
- Modify: `src/data/supabase/queries/requests.ts` — add `getOpenRequests(filters)`

- [ ] Write test: `getOpenRequests` returns only public + open requests, excludes the logged-in user's own requests
- [ ] Run test — expect FAIL
- [ ] Implement `getOpenRequests` query
- [ ] Implement `open-request-card.tsx` — card anatomy as specified
- [ ] Implement `src/app/(site)/requests/page.tsx` — server component, loads requests, renders grid
- [ ] Add filter chips: destination city dropdown, date range, group size range
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(requests): public open requests feed`

**Acceptance criteria:**
- [ ] Page renders at `/requests` — publicly accessible, no auth required
- [ ] Cards show: city, date range, group size, interests chips, bid count, traveler name (first + last initial), relative time
- [ ] "X гидов предложили" count updates from `guide_offers` count
- [ ] Unauthenticated visitors see "Войти чтобы присоединиться"
- [ ] Authenticated travelers who haven't joined see "Присоединиться к группе"
- [ ] Empty state: "Будьте первым — создайте запрос" with CTA

---

### Task 1.3 — Request detail with bid comparison

**What:** Page at `/requests/[id]` (public, readable by anyone). Shows the full request. If bids exist and requester is logged in, renders `bid-comparison-view` — cards for each bid side by side. Each bid card: guide name + avatar + rating (listing rating + organizer rating both shown), proposed price, proposed date/time, guide note, "Принять предложение" button (requester only), "Подробнее о гиде" link. Group members shown as avatar stack.

**Tripster reference (embed in prompt):** From `04-replication-plan.md §P0-E`:
> "The request thread surfaces N guide offers as cards at the top of the thread. Each offer card shows: price, proposed date/time, guide note, 'Принять' button. Accepting an offer:
> 1. Transitions the offer row to accepted
> 2. Creates a bookings row in awaiting_guide_confirmation
> 3. Creates a new conversation_threads row bound to the booking
> 4. Appends bid_accepted system event to the request thread
> 5. Appends booking_created system event to the booking thread
> 6. Unlocks guide contact info on the booking page
> 7. Redirects to /bookings/[id]"

**Files:**
- Create: `src/app/(site)/requests/[id]/page.tsx`
- Create: `src/features/requests/components/bid-comparison-view.tsx`
- Create: `src/features/requests/components/guide-bid-card.tsx`
- Create: `src/app/(protected)/traveler/requests/[id]/actions.ts` — `acceptBidAction`

- [ ] Write test: `acceptBidAction` creates booking, transitions offer, creates thread, appends system events
- [ ] Run test — expect FAIL
- [ ] Implement `acceptBidAction` server action with full 7-step sequence above
- [ ] Implement `guide-bid-card.tsx` — shows both listing rating + organizer rating (dual rating)
- [ ] Implement `bid-comparison-view.tsx` — responsive grid of bid cards
- [ ] Implement `/requests/[id]/page.tsx` — server component loads request + bids + group members
- [ ] Run tests — expect PASS
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(requests): request detail with bid comparison and accept flow`

**Acceptance criteria:**
- [ ] Page renders publicly at `/requests/[id]`
- [ ] Request details shown: destination, dates, group size, interests, description, requester name
- [ ] Bid cards show: guide name + avatar + BOTH rating numbers (listing + organizer), price, proposed date/time, note
- [ ] "Принять предложение" visible only to the request creator
- [ ] Accepting a bid → booking created → redirect to `/bookings/[id]`
- [ ] Other bids become "Отклонено" after one is accepted
- [ ] Thread section below the bids shows conversation with system events

---

### Task 1.4 — Group join flow

**What:** Any authenticated traveler can join an open request they didn't create. Joining adds them as a participant to the request. The guide whose bid eventually gets accepted will have a group. Price display updates: "4000 ₽ → 2500 ₽/чел при группе 3" shown on the bid card once 2+ travelers have joined.

**Files:**
- Create: `src/features/requests/components/join-request-button.tsx`
- Create: `src/app/(protected)/traveler/requests/[id]/join/route.ts` — server action
- Modify: `src/data/supabase/queries/requests.ts` — `joinOpenRequest(requestId, userId)`

- [ ] Write test: joining adds user to `request_participants`, triggers notification to original requester
- [ ] Run test — expect FAIL
- [ ] Implement `joinOpenRequest` — insert into `request_participants`, append `participant_joined` system event
- [ ] Implement `join-request-button.tsx` — shows current group size + "Присоединиться" / "Вы уже участвуете"
- [ ] Price recalc display: if guide offer has `pricing_model = per_group`, show per-person price at current group size
- [ ] Notification to original requester: "Ещё один путешественник присоединился к вашему запросу"
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(requests): group join flow with price recalculation display`

**Acceptance criteria:**
- [ ] "Присоединиться к группе" button on open request cards and request detail
- [ ] Button disabled if user is already in the group
- [ ] Group member count updates immediately after joining
- [ ] Per-person price recalculates on bid cards: "за группу 4000 ₽ → 2000 ₽/чел при 2 участниках"
- [ ] Original requester gets in-app notification
- [ ] Guide sees updated participant count on their incoming request

---

### Task 1.5 — Guide bid submission UI

**What:** Guide views incoming requests at `/guide/requests`. Each request card has "Отправить предложение" CTA. Clicking opens a bid form: proposed price, proposed date + time, note to traveler. Submit creates `guide_offers` row + appends `bid_submitted` system event to request thread.

**Files:**
- Create: `src/features/guide/components/bid-submission-form.tsx`
- Modify: `src/app/(protected)/guide/requests/page.tsx` — add bid CTA to request cards
- Create: `src/app/(protected)/guide/requests/[id]/actions.ts` — `submitBidAction`

- [ ] Write test: `submitBidAction` creates `guide_offers` row + system event
- [ ] Run test — expect FAIL
- [ ] Implement `submitBidAction`
- [ ] Implement `bid-submission-form.tsx` — price input + date/time picker + note textarea + submit
- [ ] Append `bid_submitted` system event: `{ price, proposed_start_at, note, guide_name }`
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(guide): bid submission form on incoming requests`

**Acceptance criteria:**
- [ ] Guide sees all open requests matching their city/region
- [ ] Each request card shows: traveler name, destination, dates, group size, interests
- [ ] "Отправить предложение" opens inline form (not a page nav)
- [ ] Form: price (number input, ₽), proposed date (date picker), proposed time (time picker), note (textarea, optional)
- [ ] Submit → offer in `guide_offers` + system event in thread + traveler notified

---

## Phase 2 — Guide Workspace

**Goal:** Build the full guide-side management experience matching Tripster's guide chrome exactly: flat 5-item nav with live badge counts, persistent KPI strip above every guide route, full orders inbox with 7 tabs and 2 view modes, listings page with state badges, calendar.

**Tripster reference (embed in every prompt for this phase):** Full content of `.claude/research/tripster/01-guide-side.md`

---

### Task 2.1 — Guide layout: flat nav + KPI strip

**What:** Replace current guide sidebar with Tripster-style flat top nav. 5 items: Статистика / Мои предложения / Заказы (with count badge) / Календарь (with count badge) / Продвижение. KPI strip rendered below nav on every `/guide/*` route. 6 metrics: Отвечаете (response time) / Подтверждаете (confirm rate %) / Конверсия (conversion %) / Всего заказов / Заработали (sum completed bookings). Values computed by SQL views.

**Files:**
- Create: `src/components/guide/guide-top-nav.tsx`
- Create: `src/components/guide/guide-kpi-strip.tsx`
- Modify: `src/app/(protected)/guide/layout.tsx` — inject nav + KPI strip
- Create: `src/data/supabase/queries/guide-kpi.ts` — KPI view queries

SQL views to create (migration):
```sql
CREATE VIEW guide_kpi AS
SELECT
  g.user_id,
  -- Response time: median minutes between request message and guide reply
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (r.first_reply_at - m.created_at)) / 60
  ) AS response_time_minutes,
  -- Confirmation rate
  COUNT(CASE WHEN b.status IN ('confirmed','completed') THEN 1 END)::float /
    NULLIF(COUNT(b.id), 0) * 100 AS confirmation_rate,
  -- Conversion: requests that became bookings
  COUNT(DISTINCT b.id)::float /
    NULLIF(COUNT(DISTINCT tr.id), 0) * 100 AS conversion_rate,
  COUNT(b.id) AS total_orders,
  COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price_minor END), 0) AS total_earned_minor
FROM guide_profiles g
LEFT JOIN guide_offers go ON go.guide_id = g.user_id
LEFT JOIN bookings b ON b.guide_id = g.user_id
LEFT JOIN traveler_requests tr ON tr.id = go.request_id
GROUP BY g.user_id;
```

- [ ] Write migration for `guide_kpi` view
- [ ] Write test: KPI view returns correct metrics for seed guide
- [ ] Run test — expect FAIL
- [ ] Implement migration + view
- [ ] Implement `guide-kpi-strip.tsx` — 6 tiles, loads from `guide_kpi` view, skeletons while loading
- [ ] Implement `guide-top-nav.tsx` — 5 items, badge counts from `guide_orders_pending_count` and `guide_calendar_today_count` queries
- [ ] Modify `guide/layout.tsx` — render nav + KPI strip above `{children}`
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(guide): flat top nav + persistent KPI strip`

**Acceptance criteria (CDP verify):**
- [ ] Every `/guide/*` route shows the 5-item flat nav at the top
- [ ] "Заказы" nav item shows count badge (number of pending orders)
- [ ] KPI strip shows all 6 metrics below nav on every guide route
- [ ] KPI values are real (not hardcoded zeros) — seed guide has orders to produce non-zero values
- [ ] Mobile: nav collapses to hamburger, KPI strip scrolls horizontally

---

### Task 2.2 — Guide orders inbox (7 tabs, 2 view modes)

**What:** Full rewrite of `/guide/orders` (or `/guide/bookings`). 7 filter tabs: В работе / Забронированы / Непрочитанные / Ждут подтверждения / Завершены / Отменены / Все. Each tab shows live count. Two view mode toggles: По событиям (group by scheduled date) / По заказам (flat list). Each order card: traveler avatar initials + name (first + last initial) + order ID + listing title + proposed date/time + participants + price + status badge + status-conditional CTA buttons.

**Status-conditional CTAs (from `01-guide-side.md`):**
- `awaiting_guide_confirmation` → "Подтвердить" button (primary) + "Ответить" (secondary)
- `confirmed` → "Ответить" + "Открыть билет"
- `completed` → "Открыть билет"

**Files:**
- Create: `src/features/guide/components/orders-inbox/orders-inbox.tsx`
- Create: `src/features/guide/components/orders-inbox/order-card.tsx`
- Create: `src/features/guide/components/orders-inbox/orders-tab-bar.tsx`
- Create: `src/features/guide/components/orders-inbox/view-mode-toggle.tsx`
- Modify: `src/app/(protected)/guide/orders/page.tsx` (or bookings)

- [ ] Write tests: tab counts, view mode switching, CTA visibility per status
- [ ] Run tests — expect FAIL
- [ ] Implement `orders-tab-bar.tsx` — 7 tabs with live counts from DB
- [ ] Implement `view-mode-toggle.tsx` — По событиям / По заказам
- [ ] Implement `order-card.tsx` — full anatomy + conditional CTAs
- [ ] Implement `orders-inbox.tsx` — composes all parts, handles tab switching + view mode
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(guide): orders inbox with 7 tabs and 2 view modes`

**Acceptance criteria (CDP verify):**
- [ ] 7 tabs visible with counts. Active tab highlighted.
- [ ] "Ждут подтверждения" tab count matches `bookings` rows with that status for this guide
- [ ] View mode toggle switches between grouped (by date) and flat (by order) layout
- [ ] Order card shows: avatar initials, traveler name (first + last initial), order ID, listing title, date, participants count, price, status badge
- [ ] "Подтвердить" button only on `awaiting_guide_confirmation` orders
- [ ] Clicking "Подтвердить" transitions status → `confirmed` and refreshes the inbox

---

### Task 2.3 — Guide listings page with state badges

**What:** `/guide/listings` page. Filter tabs: Все / Экскурсии / Туры / Трансферы. Each listing card has: cover photo, title, city, rating (listing rating + organizer rating), status badge (Опубликовано / Отказано / Отложено / Новое/Черновик). "Редактировать" button. "Добавить предложение" primary CTA → `/guide/listings/new`.

**Files:**
- Modify: `src/app/(protected)/guide/listings/page.tsx`
- Modify: `src/features/guide/components/listing-card-guide.tsx` (or create if not exists)

- [ ] Implement filter tabs by listing_type
- [ ] Implement status badge component with correct color per status
- [ ] Show rejection reason text below card when status = 'rejected'
- [ ] "Приостановить" / "Опубликовать" toggle button per card
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(guide): listings page with type tabs and state badges`

**Acceptance criteria:**
- [ ] 4 filter tabs (Все / Экскурсии / Туры / Трансферы) with counts
- [ ] Status badges: green "Опубликовано", red "Отказано", yellow "Отложено", grey "Черновик"
- [ ] Rejected listings show moderation reason text
- [ ] "Добавить предложение" CTA visible and linked

---

### Task 2.4 — Guide calendar

**What:** `/guide/calendar`. Month grid (current + next month). Each day cell is clickable. Day detail side panel shows 30-min time slots 00:00–23:30. Booked slots show: traveler name + participant count + listing title. Guide can block individual slots ("Закрыть время") or full days ("Закрыть день"). Filter dropdown: "Все предложения" or single listing.

**Files:**
- Modify: `src/app/(protected)/guide/calendar/page.tsx`
- Create: `src/features/guide/components/calendar/month-grid.tsx`
- Create: `src/features/guide/components/calendar/day-detail-panel.tsx`
- Create: `src/features/guide/components/calendar/time-slot.tsx`

- [ ] Write test: blocking a slot creates `listing_schedule_extras` row with action='close'
- [ ] Run test — expect FAIL
- [ ] Implement `month-grid.tsx` — 7-column grid, marks days with bookings
- [ ] Implement `day-detail-panel.tsx` — 30-min slot list, merges `listing_schedule` + `bookings` + `listing_schedule_extras`
- [ ] Implement slot blocking actions
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(guide): availability calendar with slot blocking`

**Acceptance criteria:**
- [ ] Month grid renders current month with Пн–Вс columns
- [ ] Days with bookings show a dot/chip indicator
- [ ] Clicking a day opens side panel with 48 time slots (30-min each)
- [ ] Booked slots show traveler name + listing title
- [ ] "Закрыть время" blocks the slot (grey), "Закрыть день" blocks all slots for that day
- [ ] Filter by listing dropdown works

---

## Phase 3 — Listing Editor Rewrite

**Goal:** Replace the current flat listing form with a Tripster-quality 8-section sidebar stepper. Type-branching: excursion shows all sections; tour replaces schedule with departures + itinerary; transfer trims to 4 sections. Draft auto-saves on blur. Mandatory step gate prevents publishing until required sections are complete.

**Tripster reference (embed in all phase 3 prompts):** Full content of `.claude/research/tripster/02-editor-schema.md` + `.claude/research/tripster/06-listing-type-matrix.md` + corrections from `07-gap-closure.md §4`

---

### Task 3.1 — Editor shell + sidebar stepper + draft lifecycle

**What:** Create `/guide/listings/[id]/edit/` route family. Layout has a sidebar with section links. Each section link shows: section name, completeness indicator (✓ / incomplete). Guard: can't navigate to section N+1 until section N is complete. Creating a new listing inserts a `draft` row then redirects to the editor. Draft auto-saves on field blur (debounced 500ms, PATCH to server action).

**Sections for excursion (base):**
1. Тип и формат
2. Описание (7 sub-steps: Название / Идея / Маршрут / Темы / Орг. детали / Факты / Аудитория)
3. Фото
4. Место встречи
5. Как проходит (duration / languages / movement / children / max persons)
6. Расписание
7. Настройки заказа
8. Цена

**Files:**
- Create: `src/app/(protected)/guide/listings/[id]/edit/layout.tsx`
- Create: `src/app/(protected)/guide/listings/[id]/edit/[section]/page.tsx`
- Create: `src/features/listings/editor/editor-shell.tsx`
- Create: `src/features/listings/editor/editor-sidebar.tsx`
- Create: `src/features/listings/editor/sections-config.ts` — SECTIONS_BY_TYPE map
- Create: `src/features/listings/editor/use-draft-autosave.ts` — debounced save hook
- Modify: `src/app/(protected)/guide/listings/new/page.tsx` — insert draft → redirect to editor

- [ ] Write test: `sections-config.ts` SECTIONS_BY_TYPE returns correct sections per listing_type
- [ ] Run test — expect FAIL
- [ ] Implement `sections-config.ts`:
```typescript
export const SECTIONS_BY_TYPE = {
  excursion: ['type-format','description','photos','meeting-point','how','schedule','order-config','pricing'],
  tour: ['type-format','description','photos','meeting-point','how','itinerary','departures','pricing'],
  transfer: ['type-format','description','photos','meeting-point','how','order-config','pricing'],
}
```
- [ ] Implement `editor-sidebar.tsx` — renders visible sections, completeness dots, step guard
- [ ] Implement `editor-shell.tsx` — wraps layout + sidebar + active section
- [ ] Implement `use-draft-autosave.ts` — debounced PATCH server action on field change
- [ ] Implement `new/page.tsx` — `INSERT INTO listings (guide_id, status='draft', listing_type='excursion') RETURNING id` → redirect to `/guide/listings/[id]/edit/type-format`
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(editor): editor shell + sidebar stepper + draft lifecycle`

---

### Task 3.2 — Editor sections 1–4 (Type/Format, Description, Photos, Meeting Point)

**What:** Implement the first 4 sections of the editor.

**Section 1 — Тип и формат:**
- Type radio: Экскурсия / Многодневный тур / Трансфер
- Format radio: Индивидуальный / Групповой
- On type change: recalculate visible sections via SECTIONS_BY_TYPE and persist

**Section 2 — Описание:** 7 text fields — Название (100 char limit) / Идея / Маршрут / Темы / Орг. детали / Факты (optional) / Аудитория (optional). Each as a labeled textarea. Tour hides Маршрут + Темы. Transfer shows only Название + Орг. детали.

**Section 3 — Фото:** Drag-drop upload. Min 6, max 25. Min 1350×1350px (warn if smaller). 20MB max per file. Copyright checkbox required before publishing ("Я подтверждаю, что имею права на все загруженные фотографии"). Progress bar per upload.

**Section 4 — Место встречи:** City autocomplete (from `destinations` table). Mode toggle: Фиксированное (map pin + address text) / По договоренности (approx text field). Note: "Точное место встречи станет доступно путешественнику после принятия предложения."

**Files:**
- Create: `src/features/listings/editor/sections/type-format.tsx`
- Create: `src/features/listings/editor/sections/description.tsx`
- Create: `src/features/listings/editor/sections/photos.tsx`
- Create: `src/features/listings/editor/sections/meeting-point.tsx`

- [ ] Implement all 4 sections with autosave wired
- [ ] Photo section: validate dimensions client-side using `createImageBitmap`
- [ ] Meeting point map: use Leaflet (already in project if present, else add)
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(editor): sections 1-4 type/format, description, photos, meeting point`

---

### Task 3.3 — Editor sections 5–8 (How, Schedule, Order Config, Pricing)

**Section 5 — Как проходит:**
- Duration: select from 24 options (0.5h–13h+)
- Languages: multi-select checkboxes (19 options from research)
- Movement type: single-select from 24 options with Russian labels
- Children allowed age: select (Нет / Любого возраста / от 3 лет / от 6 лет / от 10 лет / от 14 лет)
- Max persons: number input

**Section 6 — Расписание (excursion + transfer only):**
7-row weekly grid (Пн–Вс). Each row: checkbox to enable day + "from" time select + "to" time select (48 options, 30-min granularity, 08:00–07:30). Schedule duration: how many days ahead calendar is open (30/60/90/120/150/180 days dropdown).

**Section 7 — Настройки заказа:**
- Booking cutoff: select (1h–2.5 days)
- Event span buffer: select (0 / 30min / 1h / 1.5h / 2h)
- Instant booking toggle: disabled if guide has < 5 completed orders; shows "Доступно после 5 завершённых заказов"

**Section 8 — Цена:**
- Pricing model: radio — "За всё" (per_group) / "За человека" (per_person)
- Primary price: number input with ₽
- Tariff tiers: add/remove rows. Each row: name (select from presets or custom) + price. Presets: Пенсионеры / Студенты / Школьники / Дети до 18 лет / Дети до 16 лет / Дети до 12 лет / Дети до 7 лет.
- Discount: percent input + expiration date (optional)
- Seasonal price adjustments: add/remove rules. Each rule: date start + date end + weekday mask (checkboxes Пн–Вс) + action (Снизить / Повысить / Стандартная) + percent.

**Files:**
- Create: `src/features/listings/editor/sections/how-conducted.tsx`
- Create: `src/features/listings/editor/sections/schedule.tsx`
- Create: `src/features/listings/editor/sections/order-config.tsx`
- Create: `src/features/listings/editor/sections/pricing.tsx`
- Create: `src/features/listings/editor/sections/tariff-row.tsx`
- Create: `src/features/listings/editor/sections/price-adjustment-row.tsx`

- [ ] Implement all 4 sections with autosave wired
- [ ] Instant booking gate: query `guide_finished_orders_count` and disable toggle if < 5
- [ ] Tariff rows: add/remove with validation (no duplicate names, no empty price)
- [ ] Price adjustment rules: date range picker + weekday mask checkboxes + percent
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(editor): sections 5-8 how/schedule/order-config/pricing`

---

### Task 3.4 — Tour-specific sections (Itinerary days, Departures, Accommodation, Meals)

**What:** Additional sections shown only when `listing_type = 'tour'`.

**Itinerary days section:** Add/remove day cards. Each day: day number (auto) + title text + body textarea. "Добавить день" button. Days reorderable via drag.

**Departures section (replaces schedule for tours):** Add/remove departure rows. Each: start date + end date + price + max persons + status. "Добавить даты отправления" button.

**Accommodation section:** Hotel name + stars (1–5) + room type + nights count + optional upgrade options.

**Meals section:** Grid per day × meal type (Завтрак / Обед / Ужин) × status (Включено / За доплату / Не включено). Optional note per cell.

**Difficulty level:** Лёгкий / Средний / Высокий / Экстрим (shown for tour + activity types)

**Included / Not included:** Two tag-input fields (traveler sees these as bullet lists on listing detail)

**Files:**
- Create: `src/features/listings/editor/sections/tour-itinerary.tsx`
- Create: `src/features/listings/editor/sections/tour-departures.tsx`
- Create: `src/features/listings/editor/sections/tour-accommodation.tsx`
- Create: `src/features/listings/editor/sections/tour-meals.tsx`

- [ ] Write test: `SECTIONS_BY_TYPE.tour` includes all 4 new sections, excludes schedule
- [ ] Implement all 4 sections
- [ ] Run tests + typecheck
- [ ] Commit: `feat(editor): tour-specific sections itinerary/departures/accommodation/meals`

---

## Phase 4 — Public Catalog

**Goal:** Destination page with full Tripster-quality filter strip + category pills. Listing cards with exact field anatomy. Listing detail page with availability calendar, time-slot picker, "Задать вопрос"/inquiry tab, PII gate copy, and cross-sell sidebars.

**Tripster reference (embed in all phase 4 prompts):** Full content of `.claude/research/tripster/03-traveler-side.md` §1 (destination page) + §2 (listing detail)

---

### Task 4.1 — Destination page filter strip + category pills

**What:** Horizontally scrolling filter strip above the listing grid. Chips: Формат проведения (Индивидуальный / Групповой) / Способ передвижения (multi-select from 24 options) / Цена (range slider, ₽) / Длительность (range, hours) / Рубрики (category pills). Filters are URL params (matching Wave D pattern). Category pills row: 17 categories from research. Quick date-pick strip mid-list: "Сегодня / Завтра / Эти выходные [dates]".

**17 category labels:** Все / Необычные маршруты / Лучшие / Музеи и искусство / За городом / Уникальный опыт / Активности / Гастрономические / Монастыри и храмы / История и архитектура / Что ещё посмотреть / Активный отдых / Обзорные / Однодневные / Обзорные на автобусе / На автобусе / Ещё

**Files:**
- Create: `src/features/destinations/components/filter-strip.tsx`
- Create: `src/features/destinations/components/category-pills.tsx`
- Create: `src/features/destinations/components/quick-date-strip.tsx`
- Modify: `src/app/(site)/destinations/[slug]/page.tsx`

- [ ] Implement `filter-strip.tsx` — horizontal scroll, each filter as a chip/dropdown
- [ ] Wire filters to URL searchParams (server-side filtering via `list_destination_listings` query)
- [ ] Implement `category-pills.tsx` — 17 hardcoded categories, active chip highlighted
- [ ] Implement `quick-date-strip.tsx` — "today / tomorrow / this weekend" date shortcuts
- [ ] Cross-sell banner mid-list: "Многодневные туры — с проживанием. Найти тур →" (links to `/tours/`)
- [ ] Commit: `feat(destinations): filter strip, category pills, date shortcuts`

**Acceptance criteria:**
- [ ] Filter strip renders horizontally scrollable on mobile
- [ ] Selecting "Индивидуальный" format filters listings correctly
- [ ] Movement type multi-select works (can select Пешком + На автомобиле simultaneously)
- [ ] Price range slider filters by `price_from_minor`
- [ ] Active category pill highlighted and filters the list
- [ ] Quick date chips re-filter by available slots

---

### Task 4.2 — Listing cards full anatomy

**What:** Every listing card on catalog pages shows the full Tripster card anatomy:
- Cover image (fill-aspect-ratio)
- Attribute row (top): duration chip + movement type chip + format chip ("индивидуальная" / "групповая")
- Rating: "4,84 · 45 отзывов"
- Title
- One-line tagline
- Near-term slot chips (if listing has slots within 7 days): "сб, 19 апр в 10:00"
- Price: "от 6000 ₽ · за группу, 1–4 чел." OR "4000 ₽ · за человека"
- Heart icon (favorites toggle, authenticated users only)

**Files:**
- Modify: `src/features/listings/components/listing-card.tsx` (public-facing card)

- [ ] Add all missing chips (duration, movement, format)
- [ ] Add near-term slot chips from `listing_schedule` merged with availability
- [ ] Fix price string format: `от X ₽ · за группу, 1–{max_persons} чел.` vs `X ₽ · за человека`
- [ ] Add heart toggle wired to `listing_favorites` table
- [ ] Both rating numbers displayed (listing + organizer)
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(listings): full Tripster card anatomy`

**Acceptance criteria:**
- [ ] Duration chip visible on every card ("3 часа")
- [ ] Movement type chip visible ("На автомобиле")
- [ ] Format chip visible ("индивидуальная")
- [ ] Price string format matches: "от X ₽ · за группу, 1–N чел."
- [ ] Near-term slot chips appear for listings with upcoming availability

---

### Task 4.3 — Listing detail page full rewrite

**What:** The full listing detail page matching Tripster's layout, adapted to our bid-first model (no "Выбрать дату → checkout"). Primary CTA is "Запросить у гида" (creates a request linked to this guide) and "Присоединиться к группе" (if open requests exist for this listing's city).

**Blocks to build (top to bottom):**
1. Hero gallery (cover + photo count chip)
2. Breadcrumbs: Главная → [Region] → [City] → [Title]
3. Title + "N посетили" + guide avatar badge + rating (both)
4. Attribute row: movement / duration / children policy / language / format
5. Category chips ("Включено в рубрики")
6. Long-form sections: "Что вас ожидает" (route) + "Организационные детали"
7. Место встречи block with PII gate: _"Точное место встречи станет доступно после принятия предложения"_
8. **Availability section**: monthly calendar showing available days (from `listing_schedule`) + time-slot row for selected day
9. **Booking conditions block** (bid-first adapted):
   - "Отправьте запрос — гид пришлёт предложение с ценой и деталями"
   - "Оплата напрямую гиду при встрече"
   - "Контакты гида откроются после принятия предложения"
   - "Организатор прошёл верификацию" (if approved)
   - Pricing model display ("за группу, 1–N чел." or "за человека")
10. "Задать вопрос / Запросить предложение" — opens request form pre-filled with this guide
11. Reviews block: aggregate 4-axis rating + individual review cards
12. Cross-sell sidebar right: "Другие предложения этого гида" + "Похожие предложения"

**Files:**
- Modify: `src/app/(site)/listings/[slug]/page.tsx`
- Create: `src/features/listings/components/listing-detail/availability-calendar.tsx`
- Create: `src/features/listings/components/listing-detail/time-slot-row.tsx`
- Create: `src/features/listings/components/listing-detail/booking-conditions-block.tsx`
- Create: `src/features/listings/components/listing-detail/cross-sell-sidebar.tsx`
- Create: `src/features/listings/components/listing-detail/reviews-block.tsx`
- Create: `src/features/listings/components/listing-detail/inquiry-cta.tsx`

- [ ] Implement `availability-calendar.tsx` — pulls from `listing_schedule` merged with `listing_schedule_extras`. Highlights available days. Non-available days greyed out.
- [ ] Implement `time-slot-row.tsx` — for selected day, shows available time chips
- [ ] Implement `booking-conditions-block.tsx` — 5 trust signals as specified above
- [ ] Implement `cross-sell-sidebar.tsx` — same-guide listings + similar-category listings
- [ ] Implement `reviews-block.tsx` — aggregate 4-axis bars (Материал / Заинтересовать / Знания / Маршрут) + review cards
- [ ] Implement `inquiry-cta.tsx` — "Запросить у этого гида" button → `/requests/new?guide=[guide_id]&listing=[listing_id]`
- [ ] Commit: `feat(listings): full listing detail page rebuild`

**Acceptance criteria (CDP verify):**
- [ ] Hero gallery with photo count chip visible
- [ ] All attribute chips present (movement, duration, children, language, format)
- [ ] Availability calendar shows correct available days (green) and unavailable (grey)
- [ ] Time slots appear when a day is selected
- [ ] Booking conditions block shows all 5 trust signals
- [ ] "Запросить у этого гида" CTA present and navigates to request form
- [ ] Cross-sell sidebar shows at least 2 related listings
- [ ] Reviews block shows 4-axis rating breakdown

---

## Phase 5 — Order Surfaces

**Goal:** Build the post-match experience: order threads with inline system events + strong-highlighted field diffs, support sidebar on every order detail, booking ticket/voucher.

**Tripster reference (embed in all phase 5 prompts):** `.claude/research/tripster/03-traveler-side.md` §5 (order detail + thread)

---

### Task 5.1 — Thread system events with strong-highlighted field diffs

**What:** Every conversation thread (request thread + booking thread) renders system event rows differently from user messages. System event format: `"Provodnik / [date] / [event description]"` in a distinct grey/muted style. When a guide amends a bid, the system event uses **strong** highlighting for changed fields: `"Гид изменил предложение — **Стоимость:** 3200 ₽, **Начало:** 10:00"`.

**System event types (all must render correctly):**
- `request_created` → "Путешественник создал запрос"
- `bid_submitted` → "Гид отправил предложение — **Цена:** {price} ₽, **Дата:** {date}"
- `guide_amended` → "Гид изменил предложение — **{field}:** {new_value}" (bolded field)
- `bid_accepted` → "Путешественник принял предложение"
- `booking_created` → "Бронирование создано"
- `guide_confirmed` → "Гид подтвердил встречу"
- `participant_joined` → "{name} присоединился к запросу — теперь {n} участников"
- `booking_completed` → "Поездка завершена"

**Files:**
- Create: `src/features/messaging/components/system-event-row.tsx`
- Modify: `src/features/messaging/components/thread-view.tsx`

- [ ] Write test: `system-event-row` renders `bid_submitted` with bold price
- [ ] Run test — expect FAIL
- [ ] Implement `system-event-row.tsx` — parses `system_event_type` + `system_event_payload`, renders with bold fields
- [ ] Modify `thread-view.tsx` — branch on `system_event_type` to render `system-event-row` vs regular message row
- [ ] Add unread chip: message rows from the other party show "Не прочитано" until read
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(messaging): system event rows with strong-highlighted field diffs`

**Acceptance criteria:**
- [ ] System events render in grey/muted style distinct from user messages
- [ ] `bid_submitted` event shows **bold price** and **bold date**
- [ ] `guide_amended` event shows diff: only changed fields bolded
- [ ] Unread messages show "Не прочитано" chip until the recipient opens the thread
- [ ] All 8 event types render without error

---

### Task 5.2 — Support sidebar on order detail

**What:** Persistent sidebar block on every booking/order detail page. Content: "Поддержка" heading + working hours "с 9 до 21 часа" + order ID (copy-to-clipboard button) + contact channels (email link + Telegram link). This is the primary support entry point for users with active orders.

**Files:**
- Create: `src/features/bookings/components/support-sidebar.tsx`
- Modify: `src/app/(protected)/traveler/bookings/[bookingId]/page.tsx`
- Modify: `src/app/(protected)/guide/orders/[bookingId]/page.tsx`

- [ ] Implement `support-sidebar.tsx` with order ID copy-to-clipboard
- [ ] Wire into both traveler and guide order detail pages
- [ ] Commit: `feat(bookings): support sidebar on order detail`

---

### Task 5.3 — Booking ticket

**What:** "Открыть билет" button on confirmed bookings opens a ticket view (modal or separate page). Ticket content: booking ID (large, QR-code-able), listing title, date + time, participants count, meeting point (exact — unlocked for confirmed bookings), guide name + phone + contact details, any org details from listing.

**Files:**
- Create: `src/features/bookings/components/booking-ticket.tsx`
- Modify: `src/app/(protected)/traveler/bookings/[bookingId]/page.tsx`

- [ ] Implement `booking-ticket.tsx` — shows only when `booking.status IN ('confirmed','completed')`
- [ ] Meeting point text: show `meeting_point_text` (exact) for confirmed, `meeting_point_approx_text` for pending
- [ ] "Открыть билет" button visible in guide orders inbox for confirmed orders
- [ ] Commit: `feat(bookings): booking ticket with exact meeting point`

---

## Phase 6 — Profile & Account

**Goal:** Guide public profile as a full marketing layout. Guide profile settings sub-pages. Notification preferences as a 3D matrix.

---

### Task 6.1 — Guide public profile marketing layout

**What:** `/guide/[id]` (public). Marketing layout with: hero photo + name + city + "Гид с [year]" + languages badge + "Напишите мне" CTA. Bio section. Languages + specialties chips. Stats strip (response time, rating, order count). Listings grid ("Мои предложения"). Reviews section (with 4-axis aggregate + cards). Both ratings shown: guide organizer rating + count.

**Files:**
- Modify: `src/app/(site)/guide/[id]/page.tsx`
- Create: `src/features/guide/components/public/guide-profile-hero.tsx`
- Create: `src/features/guide/components/public/guide-stats-strip.tsx`
- Create: `src/features/guide/components/public/guide-listings-rail.tsx`

- [ ] Implement hero with avatar, name, city, experience years, languages
- [ ] Stats strip: response time, rating (organizer), total orders, years active
- [ ] Listings rail: published listings for this guide (max 6, "Все предложения →" link)
- [ ] "Напишите мне" CTA → `/requests/new?guide=[id]`
- [ ] Reviews section with 4-axis aggregate
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(guide): public profile marketing layout`

---

### Task 6.2 — Guide profile settings sub-pages

**What:** Expand guide profile settings beyond current verification form. Three sub-pages:

**О себе (`/profile/guide/about`):** Bio textarea + languages checkboxes + years of experience input + city/region served. Feeds the public profile.

**Правовые данные (`/profile/guide/legal`):** Entity type radio (Самозанятый / ИП / ООО) + INN text input + OGRN (optional) + passport number + passport issue date + work country. Stored on `guide_profiles`.

**Лицензии (`/profile/guide/licenses`):** Add/remove license entries. Each: license number + type + subject_name + issue_date + region + photo upload. `is_validated` shown as a badge (set by admin, not guide).

**Files:**
- Create: `src/app/(protected)/profile/guide/about/page.tsx`
- Create: `src/app/(protected)/profile/guide/legal/page.tsx`
- Create: `src/app/(protected)/profile/guide/licenses/page.tsx`

- [ ] Implement all 3 sub-pages with server actions for saving
- [ ] Sub-page nav: sidebar links (О себе / Правовые данные / Лицензии) within `/profile/guide/` layout
- [ ] Commit: `feat(profile): guide profile sub-pages`

---

### Task 6.3 — Notification preferences 3D matrix

**What:** `/profile/notifications`. Role toggle at top: Гид / Путешественник. Below: grid where rows = event types, columns = channels. Each cell is a checkbox.

**Rows (event types):**
- Новый заказ / запрос
- Новое сообщение
- Напоминание о встрече (за 24ч)
- Изменение статуса
- Новый отзыв
- Акции и новости (opt-in)

**Columns (channels):**
- Telegram (with "Подключить" link if `telegram_chat_id` is null)
- Email
- Push (disabled — "Скоро")

**Storage:** `user_profiles.notification_preferences jsonb` keyed by `{role}.{event_key}.{channel}`.

**Files:**
- Modify: `src/app/(protected)/profile/notifications/page.tsx`
- Create: `src/features/profile/components/notification-matrix.tsx`

- [ ] Implement `notification-matrix.tsx` — role toggle + event × channel grid
- [ ] Server action saves a single path in the jsonb: `role.event.channel = bool`
- [ ] Telegram column shows "Подключить" if not linked
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(profile): 3D notification preferences matrix`

---

## Execution Methodology — How to Use Superpowers Skills

### Per-phase execution protocol

```
For each phase:
1. Read the phase section from this plan
2. Invoke superpowers:subagent-driven-development
3. Per task:
   a. Embed relevant Tripster research file sections in the agent prompt
   b. Embed exact acceptance criteria from this plan
   c. Dispatch cursor-agent via native Agent subagent (not directly)
   d. Two-stage review after agent completes:
      - Stage 1: does it match spec? All files created? Scope respected?
      - Stage 2: code quality — no TODOs, no console.logs, typecheck passes
   e. CDP screenshot verification against acceptance criteria checklist
   f. Only mark DONE if CDP confirms criteria
4. Update METRICS.md after phase completes
5. Update ERRORS.md if any bugs found
6. git tag checkpoint/phase-N-name
```

### Agent prompt template for every UI task

Every cursor-agent prompt MUST contain:

```
CONTEXT: [relevant section from PROJECT_MAP.md + tech stack]
TRIPSTER REFERENCE: [paste the relevant research file section verbatim]
SCOPE: [exact files to create/modify, what NOT to touch]
TASK: [numbered steps with exact file paths]
ACCEPTANCE CRITERIA: [exact list from this plan — agent must satisfy these]
TDD CONTRACT: failing test → implement → passing test → commit
DONE WHEN: typecheck 0 errors + lint 0 errors + acceptance criteria verifiable by reading the code
```

### What "done" means

| Not done | Done |
|---|---|
| "Agent finished without errors" | CDP screenshot shows 7 tabs in guide orders inbox |
| "Tests pass" | Acceptance criteria checklist fully checked |
| "Build succeeds" | Real data renders (not empty states, not seed placeholders) |
| "Typecheck clean" | All of the above + typecheck clean |

---

## SOT Updates Required After Each Phase

After every phase merges to main:
- `METRICS.md` — add row with date, tests, agents used, pass/fail
- `ERRORS.md` — add any bugs found during verification
- `DECISIONS.md` — add any architectural decisions made during implementation
- `NEXT_PLAN.md` — update STATUS block at top

---

## Phase Completion Checklist

### Phase 1 done when:
- [ ] Traveler can create a request in 3 steps
- [ ] Open requests feed loads at `/requests`
- [ ] Other travelers can join a request and price recalculates
- [ ] Guide can submit a bid on an incoming request
- [ ] Traveler can accept a bid → booking created → redirected to booking

### Phase 2 done when:
- [ ] Every `/guide/*` route shows flat 5-item nav with live badges
- [ ] KPI strip shows 6 metrics on every guide route (not just dashboard)
- [ ] Guide orders inbox has 7 tabs + 2 view modes + status-conditional CTAs
- [ ] Guide calendar shows month grid with booked slots and blocking

### Phase 3 done when:
- [ ] Creating a listing → draft → 8-section stepper
- [ ] Changing listing type adapts visible sections correctly
- [ ] Schedule section renders weekly grid with 30-min slot pickers
- [ ] Pricing section includes tariff rows + price adjustment rules

### Phase 4 done when:
- [ ] Destination page shows filter chips (Формат / Движение / Цена / Длительность)
- [ ] 17 category pills render and filter correctly
- [ ] Listing cards show duration chip + movement chip + format chip + price string
- [ ] Listing detail shows availability calendar + time slots + booking conditions + cross-sell

### Phase 5 done when:
- [ ] System events render in threads with bold field diffs
- [ ] Support sidebar appears on all order detail pages
- [ ] "Открыть билет" button works on confirmed bookings

### Phase 6 done when:
- [ ] Guide public profile has full marketing layout
- [ ] Guide profile settings has 3 sub-pages
- [ ] Notification matrix is 3D (role × event × channel)
