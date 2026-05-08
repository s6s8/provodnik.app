# Provodnik — Complete App Replan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` part-by-part. Every agent prompt MUST embed the relevant Tripster research section AND the Jobs design principles listed in §Design Law. No exceptions.

**Goal:** Rebuild Provodnik as a demand-first travel marketplace — travelers post what they want, guides bid, strangers form groups — with Jobs-level simplicity, emotional polish, and full Tripster-quality functionality.

**Architecture:** Next.js 15 app router, Supabase, TypeScript, Tailwind CSS, shadcn/ui. Parts execute in order A→H. Each part is independently deployable. CDP verification with explicit checklist before any part is marked done.

**Tech Stack:** Next.js 15, Supabase, TypeScript, Tailwind CSS, shadcn/ui, Resend, Sentry, Upstash KV, bun

---

## §1 — THE ONE QUESTION

Before any agent writes a line of code, answer this:

> *Can a first-time traveler, with no explanation, understand in 10 seconds what Provodnik does and complete the one most important action it offers?*

Every design decision in this plan is tested against that question. If a feature, screen, copy, or button fails it — simplify until it passes.

---

## §2 — DESIGN LAW (embed in every single agent prompt)

These are not guidelines. They are constraints. Agents that violate them produce wrong output.

1. **One primary action per screen.** Every screen has one thing the user should do next. That thing has the most visual weight. Everything else recedes. Never two equal-weight buttons side by side.

2. **Empty states are invitations, not dead ends.** "Нет запросов" is a failure. "Опишите свою мечту — гиды сами вас найдут →" is correct. Every empty state ends with a CTA.

3. **Mobile-first, always.** Design for 375px first. Desktop is an enhancement. Touch targets ≥44px. No hover-only interactions.

4. **Consistent copy, everywhere, always.** See §3 for the copy glossary. Never deviate. An agent that writes "заявка" instead of "запрос" has violated this rule.

5. **Emotional moments at key transitions.** Five transitions get visual celebration. See §5. These are not optional.

6. **The guide's face is the trust signal.** On every surface showing a guide — listing card, bid card, profile — their photo is large and prominent. Avatar initials are last resort only.

7. **0% commission is always visible** on guide-facing pages. It appears in the guide onboarding, the guide dashboard header, and the "Стать гидом" page. Never buried.

8. **Response time and rating are always near the guide.** Whenever a guide is shown to a traveler, their response time and rating appear next to their name. Not on a separate tab. Right there.

9. **Button hierarchy is strict:** Primary (filled, brand color, one per screen) → Secondary (outlined) → Ghost (text only). Never two filled buttons on the same screen.

10. **Russian copy is emotional, not transactional.** "Создать запрос" not "Submit form". "Гид скоро ответит" not "Request submitted". The product speaks like a helpful person, not a database.

---

## §3 — COPY GLOSSARY (must be used verbatim everywhere)

| Concept | Russian | Never use |
|---|---|---|
| Traveler's request/bid | **Запрос** | Заявка, Тикет, Обращение |
| Guide's offer/bid | **Предложение** | Оффер, Бид, Заявка |
| Confirmed booking | **Поездка** | Бронирование, Заказ (except in admin) |
| The traveler | **Путешественник** | Клиент, Пользователь, Заказчик |
| The guide | **Гид** | Организатор (except legal contexts) |
| Group joining | **Присоединиться к группе** | Записаться, Добавиться |
| Accepting a bid | **Принять предложение** | Подтвердить, Выбрать |
| Sending a bid | **Отправить предложение** | Сделать ставку, Откликнуться |
| Bid accepted notification | **Предложение принято** | Заявка одобрена |
| Trip completed | **Поездка завершена** | Заказ выполнен |

---

## §4 — INFORMATION ARCHITECTURE (all routes)

### Public (no auth required)
```
/                          Home — demand-first entry point
/requests                  Open requests feed — live traveler demand
/destinations              Destinations index
/destinations/[slug]       Destination page — listings + open requests in that city
/listings/[slug]           Listing detail — guide portfolio + bid CTA
/guide/[id]                Guide public profile — marketing layout
/tours                     Multi-day tours catalog
/how-it-works              How Provodnik works (3-step explainer)
/for-guides                Guide acquisition — "Стать гидом"
/help                      Help center
/auth                      Login / signup
```

### Traveler (authenticated)
```
/traveler/requests         My requests + incoming bids  ← TRAVELER HOME
/traveler/requests/new     Post a request (3 steps)
/traveler/requests/[id]    Request detail + bid comparison
/traveler/bookings         My confirmed trips (Поездки)
/traveler/bookings/[id]    Trip detail + thread + ticket
/traveler/favorites        Saved listings
```

### Guide (authenticated)
```
/guide/inbox               Incoming requests  ← GUIDE HOME (rename from /guide/requests)
/guide/inbox/[id]          Request detail + bid form
/guide/orders              My orders (confirmed Поездки)
/guide/orders/[id]         Order detail + thread + ticket
/guide/listings            My listings portfolio
/guide/listings/new        → draft insert → redirect to editor
/guide/listings/[id]/edit/[section]   Listing editor (8-section stepper)
/guide/calendar            Availability calendar
/guide/stats               Statistics + KPI detail
```

### Shared (authenticated)
```
/profile/personal          Account: name, email, phone, language
/profile/guide/about       Guide: bio, languages, city, years
/profile/guide/legal       Guide: entity type, INN, OGRN, passport
/profile/guide/licenses    Guide: license entries with photos
/profile/notifications     Notification matrix (3D: role × event × channel)
/notifications             In-app notification feed
```

### Admin
```
/admin/dashboard
/admin/listings            Moderate listings
/admin/guides              Verify guides
/admin/disputes            Resolve disputes
```

---

## §5 — EMOTIONAL MOMENTS (must be built, not skipped)

These five transitions are when the product earns love. Each gets a distinct visual treatment.

| Trigger | What the user sees | Implementation |
|---|---|---|
| **Bid received** (traveler gets first bid on their request) | Banner on `/traveler/requests/[id]`: "Гид Алексей отправил предложение — посмотрите" with guide avatar + pulse animation | In-app notification + page banner component |
| **Bid accepted** (traveler clicks "Принять предложение") | Full-screen confirmation: "Вы выбрали Алексея! Он получил уведомление и скоро подтвердит встречу." Large guide avatar, green checkmark, count-up to trip date. "Отлично" dismiss button. | Transition screen at `/traveler/requests/[id]/accepted` |
| **Group join price drop** (traveler joins someone's request) | Toast + card update: "Вы присоединились! При группе 3 человека каждый платит **2 100 ₽** вместо 4 000 ₽" | Toast component with ₽ delta highlighted in green |
| **Contact unlock** (bid accepted → guide contacts now visible) | Animated reveal card on booking page: "Контакты Алексея теперь доступны" slides in, shows phone + Telegram, glow border for 3 seconds | `ContactUnlockReveal` component with CSS animation |
| **Trip completed + review prompt** | Full-screen prompt (can't be missed): "Как прошла поездка с Алексеем?" Large stars, 4-axis rating, optional comment. "Оставить отзыв" primary + "Позже" ghost. | Triggered by `booking.status = 'completed'`, shown on next app open |

---

## §6 — NAVIGATION STRUCTURE

### Unauthenticated header
```
[Проводник logo]    Как это работает    Стать гидом    Войти    [Создать запрос ▶]
```
- "Создать запрос" is a filled button (brand color). Only CTA in the header.
- Mobile: logo + hamburger. Drawer shows all items.

### Traveler header
```
[Проводник logo]    Открытые запросы    Мои запросы(N)    Поездки    ♥    🔔(N)    [Avatar]
```
- Badge on "Мои запросы" = count of requests with unread bids
- Badge on 🔔 = unread notifications

### Guide header (flat, 5 items + persistent KPI strip below)
```
[Проводник logo]    Входящие(N)    Заказы(N)    Предложения    Календарь    Статистика    [Avatar]
```
- "Входящие" = incoming requests with unread count
- "Заказы" = confirmed bookings with pending-confirm count
- Below header on ALL guide routes: KPI strip (6 metrics, always visible)
- Mobile: logo + hamburger

### KPI strip (guide only, all routes)
```
Отвечаете: 4 мин    Подтверждаете: 85%    Конверсия: 70%    Заказов: 984    Заработали: 2 146 693 ₽    0% комиссия ✓
```
- Last tile always shows "0% комиссия ✓" in green — permanent reminder
- Values from `guide_kpi` SQL view, cached 5 min

---

## PART A — Foundations

**Goal:** Establish the information architecture, navigation components, copy system, and shared layout. Everything else builds on this. Do not start Part B until Part A is merged and deployed.

---

### Task A1 — Route structure audit and rename

**What:** Rename `/guide/requests` → `/guide/inbox` (incoming requests is the guide's home, "inbox" is clearer). Update all internal links, redirects, and nav references. Add missing routes as placeholder pages.

**Files:**
- Rename: `src/app/(protected)/guide/requests/` → `src/app/(protected)/guide/inbox/`
- Create placeholder: `src/app/(protected)/guide/stats/page.tsx`
- Create placeholder: `src/app/(site)/how-it-works/page.tsx`
- Create placeholder: `src/app/(site)/for-guides/page.tsx`
- Create placeholder: `src/app/(site)/tours/page.tsx`
- Modify: all nav files referencing `/guide/requests`

- [ ] Rename directory and update all imports
- [ ] Create placeholder pages (each returns a `<h1>` with page name for now)
- [ ] Run `bun run typecheck` — 0 errors
- [ ] Run `bun run build` (Vercel build) — 0 errors
- [ ] Commit: `refactor(routes): rename guide/requests to guide/inbox, add missing route placeholders`

---

### Task A2 — Copy constants file

**What:** Central file for all Russian copy strings. Every UI string in the app should reference this file. Prevents inconsistency across agents.

**Files:**
- Create: `src/lib/copy.ts`

```typescript
// src/lib/copy.ts
// Single source of truth for all UI copy strings.
// NEVER hardcode Russian strings in components — import from here.

export const COPY = {
  // Core nouns
  request: 'Запрос',
  requests: 'Запросы',
  offer: 'Предложение',
  offers: 'Предложения',
  trip: 'Поездка',
  trips: 'Поездки',
  traveler: 'Путешественник',
  guide: 'Гид',

  // Actions
  createRequest: 'Создать запрос',
  sendOffer: 'Отправить предложение',
  acceptOffer: 'Принять предложение',
  joinGroup: 'Присоединиться к группе',
  openTicket: 'Открыть билет',
  leaveReview: 'Оставить отзыв',

  // Status labels
  status: {
    awaitingConfirmation: 'Ждёт подтверждения',
    confirmed: 'Подтверждена',
    completed: 'Завершена',
    cancelled: 'Отменена',
    disputed: 'Спор',
    draft: 'Черновик',
    published: 'Опубликовано',
    paused: 'Приостановлено',
    rejected: 'Отказано',
    pending: 'На проверке',
  },

  // Navigation
  nav: {
    inbox: 'Входящие',
    orders: 'Заказы',
    listings: 'Предложения',
    calendar: 'Календарь',
    stats: 'Статистика',
    myRequests: 'Мои запросы',
    openRequests: 'Открытые запросы',
    myTrips: 'Поездки',
    favorites: 'Избранное',
    howItWorks: 'Как это работает',
    becomeGuide: 'Стать гидом',
    signIn: 'Войти',
  },

  // Empty states — always end with a CTA hint
  empty: {
    noRequests: 'У вас ещё нет запросов.\nОпишите свою мечту — гиды сами вас найдут.',
    noTrips: 'У вас ещё нет поездок.\nКак только гид примет ваш запрос — поездка появится здесь.',
    noIncomingRequests: 'Новых запросов пока нет.\nПутешественники публикуют запросы каждый день.',
    noOrders: 'Подтверждённых заказов пока нет.',
    noListings: 'У вас ещё нет предложений.\nДобавьте первое — путешественники уже ищут гидов.',
    noOpenRequests: 'Открытых запросов пока нет.\nБудьте первым — создайте запрос.',
    noFavorites: 'Вы ещё не добавили ничего в избранное.',
  },

  // Emotional moments
  moments: {
    bidAcceptedTitle: 'Предложение принято!',
    bidAcceptedBody: (guideName: string) =>
      `Вы выбрали ${guideName}! Гид получил уведомление и скоро подтвердит встречу.`,
    groupJoinSaving: (saving: number, perPerson: number) =>
      `Вы присоединились! При вашей группе каждый платит ${perPerson.toLocaleString('ru')} ₽ вместо ${saving.toLocaleString('ru')} ₽`,
    contactUnlockTitle: (guideName: string) =>
      `Контакты ${guideName} теперь доступны`,
    tripCompletedTitle: (guideName: string) =>
      `Как прошла поездка с ${guideName}?`,
  },

  // Commission
  zeroCommission: '0% комиссия — вы получаете всё',
  zeroCommissionShort: '0% комиссия ✓',
} as const
```

- [ ] Create `src/lib/copy.ts` with content above
- [ ] Run `bun run typecheck` — 0 errors
- [ ] Commit: `feat(copy): central copy constants — single source of truth for all UI strings`

---

### Task A3 — Unauthenticated header

**What:** Build the unauthenticated site header exactly as defined in §6. Logo left. Three nav links center. "Создать запрос" filled CTA button right. Mobile: hamburger drawer.

**Files:**
- Modify: `src/components/layout/site-header.tsx` (or equivalent public header)

- [ ] Implement header with exact copy from `COPY.nav`
- [ ] "Создать запрос" links to `/traveler/requests/new` (redirects to auth if not logged in, then back)
- [ ] Mobile hamburger drawer with all nav items
- [ ] Active route highlighted in nav
- [ ] Run: `bun run typecheck` — 0 errors
- [ ] Commit: `feat(header): unauthenticated header with demand-first CTA`

**Acceptance criteria:**
- [ ] "Создать запрос" is a filled button (brand color) — visually dominant
- [ ] Mobile: hamburger → drawer with all items
- [ ] Logo links to `/`
- [ ] "Стать гидом" links to `/for-guides`

---

### Task A4 — Traveler header

**Files:**
- Create: `src/components/layout/traveler-header.tsx`
- Modify: `src/app/(protected)/traveler/layout.tsx`

- [ ] 5-item nav: Logo | Открытые запросы | Мои запросы(badge) | Поездки | ♥ | 🔔(badge) | Avatar
- [ ] Badge on "Мои запросы" = count of requests with `guide_offers.status = 'pending'` unread by traveler
- [ ] Notification bell badge = unread `notifications` count
- [ ] Avatar dropdown: Профиль / Уведомления / Выйти
- [ ] Commit: `feat(header): traveler header with live badges`

---

### Task A5 — Guide header + KPI strip

**Files:**
- Create: `src/components/layout/guide-header.tsx`
- Create: `src/components/layout/guide-kpi-strip.tsx`
- Modify: `src/app/(protected)/guide/layout.tsx`

- [ ] 5-item flat nav: Logo | Входящие(badge) | Заказы(badge) | Предложения | Календарь | Статистика | Avatar
- [ ] KPI strip rendered below header on ALL guide routes (in guide layout, not per-page)
- [ ] 6 KPI tiles from `guide_kpi` SQL view: Отвечаете / Подтверждаете / Конверсия / Заказов / Заработали / **0% комиссия ✓**
- [ ] "0% комиссия ✓" tile is always green, never changes — it's a permanent morale signal
- [ ] KPI values: skeleton loaders while fetching, cache 5 min
- [ ] Commit: `feat(header): guide header flat nav + persistent KPI strip with 0% commission tile`

**Acceptance criteria:**
- [ ] KPI strip appears on `/guide/inbox`, `/guide/orders`, `/guide/listings`, `/guide/calendar`, `/guide/stats` — every guide route
- [ ] "0% комиссия ✓" tile is green on every guide page
- [ ] Badge counts are live (not static)

---

## PART B — Home Page + Entry Points

**Goal:** Rebuild the home page around the demand-first promise. A traveler lands, reads one headline, and within 15 seconds has posted their first request or joined an open group. No browse-catalog-first.

---

### Task B1 — Home page (demand-first redesign)

**What:** Full rewrite of `/`. Jobs principle: one promise, one action, proof it works.

**Layout (top to bottom):**

**Section 1 — Hero (above the fold on mobile)**
- Headline (H1, large): *"Опишите экскурсию мечты — гиды сами предложат варианты"*
- Subheadline: *"Не ищите среди сотен предложений. Скажите, что хотите. Лучшие гиды ответят вам."*
- Single primary CTA button (brand color, large): **"Создать запрос"** → `/traveler/requests/new`
- Secondary ghost link below: **"Смотреть открытые запросы"** → `/requests`
- Background: full-bleed hero photo (city/excursion atmosphere)
- No search bar. No destination dropdown. One button.

**Section 2 — How it works (3 steps, icons)**
- Step 1: "Опишите что хотите" — destination, dates, group size, interests
- Step 2: "Получите предложения от гидов" — guides bid with price and details
- Step 3: "Выберите лучшее" — compare, accept, go

**Section 3 — Live open requests rail**
- Title: *"Путешественники ищут прямо сейчас"*
- Horizontal scroll rail of open request cards (max 6, "Все запросы →" link)
- Each card: city chip + date + group size + "N гидов ответили" + "Присоединиться" ghost button
- This section makes the marketplace feel alive

**Section 4 — Featured guides rail**
- Title: *"Проверенные гиды"*
- 4 guide cards: large photo + name + city + rating + response time + "Написать"

**Section 5 — Trust block**
- 3 stats: "0% комиссия для гидов" + "Проверенные гиды" + "Бесплатно для путешественников"
- Short trust copy: *"Деньги напрямую — без посредников. Мы соединяем, вы договариваетесь."*

**Section 6 — Guide acquisition CTA**
- *"Вы гид? Принимайте запросы от путешественников. 0% комиссия."*
- CTA: "Стать гидом" → `/for-guides`

**Files:**
- Modify: `src/app/(site)/page.tsx`
- Create: `src/features/home/components/hero-section.tsx`
- Create: `src/features/home/components/how-it-works.tsx`
- Create: `src/features/home/components/open-requests-rail.tsx`
- Create: `src/features/home/components/featured-guides-rail.tsx`
- Create: `src/features/home/components/trust-block.tsx`
- Create: `src/features/home/components/guide-acquisition-cta.tsx`

- [ ] Implement all 6 sections
- [ ] `open-requests-rail`: server component, fetches 6 most recent open requests
- [ ] `featured-guides-rail`: fetches 4 guides sorted by `average_rating DESC` where `verification_status = 'approved'`
- [ ] Hero has no search bar — just headline + CTA button
- [ ] Mobile: sections stack, hero fills viewport, CTA button 48px height minimum
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(home): demand-first home page rebuild`

**Acceptance criteria (CDP verify):**
- [ ] Hero headline visible above fold on 375px mobile
- [ ] "Создать запрос" is the only filled button in the hero
- [ ] Open requests rail shows real data (not empty)
- [ ] "0% комиссия для гидов" appears in trust block
- [ ] No destination search bar on the home page

---

### Task B2 — "Стать гидом" page

**What:** Guide acquisition page at `/for-guides`. Converts potential guides. Prominently features 0% commission.

**Layout:**
- Hero: *"Принимайте запросы от путешественников. Зарабатывайте больше."*
- Subheadline: *"На Проводнике 0% комиссии. Всё, что вы зарабатываете — ваше."*
- Primary CTA: "Зарегистрироваться как гид" → `/auth?role=guide`
- How it works for guides (3 steps): Создайте профиль → Получайте запросы → Предлагайте условия
- 0% commission comparison block: Проводник 0% vs competitors 15–25%
- Guide testimonials (seed 2–3 from seed data)
- CTA repeat at bottom

**Files:**
- Modify: `src/app/(site)/for-guides/page.tsx`

- [ ] Implement full page as server component
- [ ] Commission comparison table: Проводник 0% | Tripster 22% | Airbnb Exp 20%
- [ ] Commit: `feat(for-guides): guide acquisition page with 0% commission prominence`

---

### Task B3 — "Как это работает" page

**What:** Simple 3-section explainer. For travelers + for guides. Links to request creation and guide signup.

**Files:**
- Modify: `src/app/(site)/how-it-works/page.tsx`

- [ ] For travelers section: 3 steps with icons
- [ ] For guides section: 3 steps with icons
- [ ] FAQ section (5 questions): "Это бесплатно?", "Как гиды получают оплату?", "Могу ли я присоединиться к чужой группе?", "Как долго ждать предложения?", "Что если гид не ответит?"
- [ ] Commit: `feat(how-it-works): explainer page`

---

## PART C — Demand-Side Core (The Differentiator)

**Goal:** The complete request → bid → accept → join flow. This is what no other platform has. It must be flawless.

---

### Task C1 — Request creation (3-step form)

**What:** `/traveler/requests/new`. Three steps. Clean, one-question-at-a-time. Jobs: don't show all the questions at once — guide the user.

**Step 1 — Куда и когда?**
- Destination: city autocomplete (from `destinations` table) + optional free text ("or describe anywhere in Russia")
- Date range: start + end (min = today). Single date is fine (duration = 1 day).
- Group size: stepper 1–20 with label ("Только я" for 1, "Мы двое" for 2, "Группа 3+" for 3+)
- Next button enabled only when city + at least one date selected

**Step 2 — Что вас интересует?**
- Interest chips (multi-select, min 1): История / Архитектура / Природа / Гастрономия / Искусство / Активный отдых / Фото / Для детей / Необычное / Ночная жизнь
- Optional budget range: "До 2000 ₽ / До 5000 ₽ / До 10 000 ₽ / Без ограничений" (4 radio chips)
- Format preference: "Индивидуально" / "Готов к группе" / "Всё равно"

**Step 3 — Расскажите подробнее**
- Textarea: "Что хотите увидеть или сделать? Любые детали помогут гидам сделать лучшее предложение." (optional, but prompted)
- Preview card: shows summary of step 1 + 2 selections (guides see this)
- Submit button: **"Опубликовать запрос"** (large, primary)
- Below: "Ваш запрос увидят проверенные гиды и смогут предложить условия"

**On submit:**
```typescript
// Server action: createTravelerRequest
// 1. INSERT into traveler_requests: city, date_from, date_to, group_size, interests[], budget_range, format_pref, description, is_public=true, status='open', user_id
// 2. INSERT into conversation_threads: subject_type='request', subject_id=request.id, participant_ids=[user_id]
// 3. INSERT into messages: thread_id, system_event_type='request_created', system_event_payload={city, date_from, group_size}
// 4. Redirect to /traveler/requests/[id]
```

**Files:**
- Modify: `src/app/(protected)/traveler/requests/new/page.tsx`
- Create: `src/features/requests/components/request-wizard.tsx`
- Create: `src/features/requests/components/steps/step-destination.tsx`
- Create: `src/features/requests/components/steps/step-interests.tsx`
- Create: `src/features/requests/components/steps/step-details.tsx`
- Create: `src/app/(protected)/traveler/requests/actions.ts`

- [ ] Write test: `createTravelerRequest` creates request + thread + system event, returns request id
- [ ] Run test — expect FAIL
- [ ] Implement server action with exact 4-step sequence above
- [ ] Implement 3-step wizard with progress bar (Step 1 of 3)
- [ ] Step navigation: "Назад" ghost + "Далее" primary (disabled until required fields filled)
- [ ] Run tests — PASS
- [ ] Run typecheck — 0 errors
- [ ] Commit: `feat(requests): 3-step request creation wizard`

**Acceptance criteria:**
- [ ] Progress bar "1 из 3 / 2 из 3 / 3 из 3" visible
- [ ] "Далее" disabled until required fields on current step are filled
- [ ] Destination autocomplete works
- [ ] Group size stepper labels change (Только я / Мы двое / Группа N)
- [ ] Interest chips are multi-select
- [ ] Preview card on step 3 shows step 1+2 summary
- [ ] Submit creates DB rows and redirects to request detail

---

### Task C2 — Open requests feed (`/requests`)

**What:** Public page. The marketplace's pulse. Shows demand in real time.

**Layout:**
- Header: "Открытые запросы" + count + "Создать свой →" CTA right
- Filter bar: city dropdown + date range + group size range
- Request cards grid (2-col desktop, 1-col mobile)
- Empty state: "Запросов пока нет. Будьте первым — создайте запрос." with CTA

**Request card anatomy:**
- City chip (top left) + "N дней назад" (top right)
- Interests chips row
- Date range: "15–17 мая · 3 дня"
- Group size: "👥 2 человека"
- Budget: "До 5 000 ₽" or "Бюджет не указан"
- Description preview (2 lines max, truncated)
- Footer: traveler name (first + last initial) + "N предложений от гидов" + [Join button if logged in and different user]

**Files:**
- Create: `src/app/(site)/requests/page.tsx`
- Create: `src/features/requests/components/open-request-card.tsx`
- Modify: `src/data/supabase/queries/requests.ts`

```typescript
// getOpenRequests(filters: { city?: string, date_from?: string, group_size_min?: number })
// Returns: traveler_requests where is_public=true AND status='open'
// Include: offer_count (count of guide_offers), participant_count
// Exclude: the current user's own requests (if logged in)
// Order: created_at DESC
```

- [ ] Write test: `getOpenRequests` excludes current user's own requests
- [ ] Run test — FAIL
- [ ] Implement query
- [ ] Implement open-request-card.tsx with all anatomy above
- [ ] Implement page.tsx as server component with filter params
- [ ] Empty state uses `COPY.empty.noOpenRequests`
- [ ] Run tests — PASS
- [ ] Commit: `feat(requests): public open requests feed`

---

### Task C3 — Request detail + bid comparison (`/traveler/requests/[id]`)

**What:** The traveler's command center. Shows their request, all incoming bids, and the conversation thread. Must feel like a negotiation, not a form.

**Layout:**
- Back: "← Мои запросы"
- Request summary card (city / dates / group size / interests chips / description)
- Status bar: "Ожидаем предложений от гидов..." (animate) or "N предложений · Выберите лучшее"

**Bids section (if offers exist):**
- Section title: "Предложения гидов"
- Bid cards grid (1 per card, full width mobile):
  - Guide photo (large) + name + city
  - Rating: listing rating + organizer rating side by side
  - Response time chip: "Отвечает за 4 мин"
  - Proposed price (large, prominent): "3 500 ₽ · за группу"
  - Proposed date + time: "15 мая · 10:00"
  - Guide note (italic, 3 lines max)
  - Primary: **"Принять предложение"** (only for request owner)
  - Secondary ghost: "Профиль гида →"
- Sorting: by price / by rating / by response time

**On "Принять предложение":**
```typescript
// acceptBidAction(offerId, requestId):
// 1. UPDATE guide_offers SET status='accepted' WHERE id=offerId
// 2. UPDATE guide_offers SET status='declined' WHERE request_id=requestId AND id != offerId
// 3. INSERT bookings: request_id, guide_id, listing_id, proposed_start_at, total_price_minor, status='awaiting_guide_confirmation'
// 4. INSERT conversation_threads: subject_type='booking', subject_id=booking.id
// 5. INSERT messages: system_event_type='bid_accepted', payload={guide_name, price, date}
// 6. INSERT messages (booking thread): system_event_type='booking_created'
// 7. UPDATE traveler_requests SET status='matched'
// 8. Send notification to guide
// 9. Redirect to /traveler/requests/[id]/accepted  ← emotional moment screen
```

**Thread section (below bids):**
- Shows conversation_thread for this request
- Traveler can message guides who have bid
- System events inline

**Files:**
- Create: `src/app/(protected)/traveler/requests/[id]/page.tsx`
- Create: `src/app/(protected)/traveler/requests/[id]/accepted/page.tsx` — emotional moment
- Create: `src/features/requests/components/bid-card.tsx`
- Create: `src/features/requests/components/bid-comparison.tsx`
- Modify: `src/app/(protected)/traveler/requests/actions.ts`

- [ ] Write test: `acceptBidAction` executes all 8 steps, guide is notified
- [ ] Run test — FAIL
- [ ] Implement `acceptBidAction`
- [ ] Implement `bid-card.tsx` — shows both ratings, response time chip, guide photo large
- [ ] Implement `/accepted` page — emotional moment (see §5)
- [ ] Run tests — PASS
- [ ] Commit: `feat(requests): request detail with bid comparison and acceptance flow`

**Acceptance criteria:**
- [ ] Guide photo is large on bid card (not a tiny avatar)
- [ ] Both rating numbers shown: "4,84 (тур) · 4,91 (гид)"
- [ ] "Принять предложение" is primary button — only one per screen
- [ ] After acceptance → `/accepted` page with celebration UI
- [ ] Declined bids show "Отклонено" badge
- [ ] Thread section below bids shows conversation

---

### Task C4 — Group join flow

**What:** Any traveler (not the request creator) can join an open request. Joining means they'll be part of the group when the guide delivers the tour. Price recalculates.

**Files:**
- Create: `src/features/requests/components/join-group-button.tsx`
- Create: `src/features/requests/components/group-price-calculator.tsx`
- Modify: `src/app/(protected)/traveler/requests/actions.ts`

```typescript
// joinRequestAction(requestId):
// 1. INSERT request_participants: request_id, user_id, joined_at
// 2. INSERT messages (request thread): system_event_type='participant_joined',
//    payload={user_name, new_participant_count}
// 3. Recalculate per-person price on all pending guide_offers:
//    if offer.pricing_model='per_group': per_person = offer.price / new_count
// 4. Send notification to request owner: "N присоединился к вашему запросу"
// 5. Return: { saving_amount, new_per_person_price }
```

**Price display on bid cards (after join):**
```
3 500 ₽ за группу
При 3 участниках: 1 167 ₽/чел
```

**Emotional moment (group join toast):**
```typescript
// After joinRequestAction returns:
// Show toast: COPY.moments.groupJoinSaving(original_price, new_per_person_price)
// Green background, price delta highlighted
```

- [ ] Write test: joining adds participant, recalculates price, notifies owner
- [ ] Run test — FAIL
- [ ] Implement `joinRequestAction`
- [ ] Implement `join-group-button.tsx` — shows "Присоединиться · 1 167 ₽/чел" or current group count
- [ ] Implement `group-price-calculator.tsx` — live price display per group size
- [ ] Toast on join: see §5
- [ ] Run tests — PASS
- [ ] Commit: `feat(requests): group join with price recalculation and celebration toast`

---

### Task C5 — Guide bid submission

**What:** Guide views incoming requests at `/guide/inbox`. Each request card has "Отправить предложение" primary CTA. Form opens as an inline panel (not a page nav — Jobs: keep context).

**Request card (guide view):**
- Traveler name (first + last initial) + "N человек" + interests chips
- City + date range
- Budget indicator: "До 5 000 ₽"
- Group member count + join count
- Primary: "Отправить предложение" | Secondary ghost: "Написать вопрос"

**Bid form (inline panel, slides in from right on desktop / bottom sheet on mobile):**
- Your price: number input + "₽" + pricing model toggle ("за группу" / "за человека")
- Proposed date: date picker (within request's date range)
- Proposed time: time select (30-min slots)
- Note to traveler: textarea (optional, shown to traveler on bid card)
- Preview: traveler sees their guide card on the right
- Submit: "Отправить предложение" primary

**On submit:**
```typescript
// submitBidAction(requestId, bid):
// 1. INSERT guide_offers: request_id, guide_id, price_minor, pricing_model, proposed_start_at, note, status='pending'
// 2. INSERT messages (request thread): system_event_type='bid_submitted',
//    payload={guide_name, price, proposed_date, note}
// 3. Send notification to traveler: "Гид [name] отправил предложение"
// 4. Close inline panel, show success toast: "Предложение отправлено!"
```

**Files:**
- Modify: `src/app/(protected)/guide/inbox/page.tsx`
- Create: `src/features/guide/components/incoming-request-card.tsx`
- Create: `src/features/guide/components/bid-form-panel.tsx`
- Create: `src/app/(protected)/guide/inbox/actions.ts`

- [ ] Write test: `submitBidAction` creates offer + system event + notification
- [ ] Run test — FAIL
- [ ] Implement `submitBidAction`
- [ ] Implement `bid-form-panel.tsx` — slides in, doesn't navigate away
- [ ] Implement `incoming-request-card.tsx` — full anatomy as above
- [ ] Run tests — PASS
- [ ] Commit: `feat(guide): incoming requests inbox with bid submission panel`

---

## PART D — Guide Workspace

**Goal:** The guide's day-to-day operating environment. Must feel like a professional tool — clear, fast, always showing what matters most.

---

### Task D1 — Guide incoming requests page (`/guide/inbox`)

**What:** The guide's home screen after login. Shows all open `traveler_requests` in their operating cities/regions where they haven't bid yet, plus requests where they have a pending bid.

**Tabs:**
- Новые (unread/new requests — no bid from this guide yet)
- Мои предложения (requests where guide has submitted a bid, bid still pending)
- Принятые (bids that were accepted — linked to confirmed bookings)

**Sort / filter:**
- City filter dropdown
- Date range filter
- Sort: Новые сначала / По дате поездки / По размеру группы

**Empty state per tab (uses `COPY.empty.noIncomingRequests`):**
- "Новых запросов пока нет. Путешественники публикуют запросы каждый день."

**Files:**
- Modify: `src/app/(protected)/guide/inbox/page.tsx`
- Modify: `src/features/guide/components/incoming-request-card.tsx`

- [ ] Implement 3 tabs with live counts
- [ ] "Новые" tab: requests where no `guide_offers` row exists for this guide
- [ ] "Мои предложения": requests with pending offer from this guide, shows offered price + proposed date
- [ ] City filter from guide's registered cities
- [ ] Commit: `feat(guide): inbox page with 3 tabs and smart filtering`

---

### Task D2 — Guide orders inbox (`/guide/orders`)

**What:** All confirmed bookings. 7 filter tabs. 2 view modes. Status-conditional CTAs.

**7 tabs (with live counts):**
В работе / Ждут подтверждения / Забронированы / Непрочитанные / Завершены / Отменены / Все

**2 view modes:**
- По событиям: grouped by scheduled date (all bookings for same date grouped together)
- По заказам: flat chronological list

**Order card:**
- Traveler avatar (photo if exists, else initials) + name (first + last initial)
- Order ID (small, muted)
- Listing title
- Date + time + "N участников"
- Price (prominent)
- Status badge (color-coded)
- **Status-conditional CTAs:**
  - `awaiting_guide_confirmation` → "Подтвердить" (primary) + "Написать" (ghost)
  - `confirmed` → "Написать" (primary) + "Открыть билет" (ghost)
  - `completed` → "Открыть билет" (ghost) + "Напомнить об отзыве" (ghost)

**"Подтвердить" action:**
```typescript
// confirmBookingAction(bookingId):
// 1. UPDATE bookings SET status='confirmed'
// 2. INSERT messages: system_event_type='guide_confirmed', payload={guide_name, confirmed_at}
// 3. Send notification to traveler: "Гид подтвердил встречу"
// Emotional moment: contact unlock reveal shown to traveler on their next visit
```

**Files:**
- Modify: `src/app/(protected)/guide/orders/page.tsx`
- Create: `src/features/guide/components/orders/orders-inbox.tsx`
- Create: `src/features/guide/components/orders/order-card.tsx`
- Create: `src/features/guide/components/orders/orders-tab-bar.tsx`
- Create: `src/features/guide/components/orders/view-mode-toggle.tsx`
- Modify: `src/app/(protected)/guide/orders/actions.ts`

- [ ] Write tests: tab counts correct, CTA visibility per status
- [ ] Run tests — FAIL
- [ ] Implement all components
- [ ] Confirm action: 3-step sequence above
- [ ] Run tests — PASS
- [ ] Commit: `feat(guide): orders inbox with 7 tabs, 2 view modes, status CTAs`

**Acceptance criteria:**
- [ ] 7 tabs with counts — "Ждут подтверждения" count matches DB
- [ ] View mode toggle works
- [ ] "Подтвердить" only shows on `awaiting_guide_confirmation` orders
- [ ] Confirming updates status and shows toast "Встреча подтверждена"

---

### Task D3 — Guide listings page (`/guide/listings`)

**What:** The guide's portfolio. Clear listing states. Type filters. Quick actions.

**Tabs:** Все / Экскурсии / Туры / Трансферы (with counts)

**Listing card (guide view):**
- Cover photo
- Title + city + rating (listing + organizer, both)
- Status badge: Опубликовано (green) / Черновик (grey) / На проверке (yellow) / Отказано (red) / Приостановлено (orange)
- If "Отказано": rejection reason text below badge
- Actions: "Редактировать" | "Приостановить" / "Опубликовать" toggle
- Stat strip: views count + request count + booking count

**Primary CTA:** "Добавить предложение" (fills the blank space when 0 listings, top-right otherwise)

**Files:**
- Modify: `src/app/(protected)/guide/listings/page.tsx`
- Create: `src/features/guide/components/listings/guide-listing-card.tsx`

- [ ] Implement 4 filter tabs with counts
- [ ] Status badge with correct colors
- [ ] Rejection reason visible when status='rejected'
- [ ] Publish/pause toggle action
- [ ] Empty state: `COPY.empty.noListings` with "Добавить предложение" CTA
- [ ] Commit: `feat(guide): listings page with type tabs and status badges`

---

### Task D4 — Guide calendar (`/guide/calendar`)

**What:** Availability management. Month grid. Day detail side panel with 30-min slots.

**Files:**
- Modify: `src/app/(protected)/guide/calendar/page.tsx`
- Create: `src/features/guide/components/calendar/month-grid.tsx`
- Create: `src/features/guide/components/calendar/day-panel.tsx`

- [ ] Month grid: 7-col (Пн–Вс), current + next month tabs
- [ ] Days with bookings: dot indicator
- [ ] Days fully blocked: grey fill
- [ ] Click day → right panel slides in with 48 time slots (30-min)
- [ ] Booked slots show: traveler name + listing title (blue background)
- [ ] Blocked slots: grey background
- [ ] "Закрыть время": click empty slot → confirm → creates `listing_schedule_extras` (action='close')
- [ ] "Закрыть день": button in day panel → closes all slots for that day
- [ ] Filter dropdown: "Все предложения" + each listing by name
- [ ] Commit: `feat(guide): availability calendar with slot blocking`

---

## PART E — Listing Editor

**Goal:** An 8-section sidebar stepper that guides a guide through creating a complete listing. Type-branching. Draft auto-saves. Feels like building something, not filling a form.

**Jobs principle:** Show one section at a time. Progress is visible. The guide always knows where they are and how far they have to go.

---

### Task E1 — Editor shell + sidebar stepper

**Files:**
- Create: `src/app/(protected)/guide/listings/[id]/edit/layout.tsx`
- Create: `src/app/(protected)/guide/listings/[id]/edit/[section]/page.tsx`
- Create: `src/features/listings/editor/editor-layout.tsx`
- Create: `src/features/listings/editor/editor-sidebar.tsx`
- Create: `src/features/listings/editor/sections-config.ts`
- Create: `src/features/listings/editor/use-autosave.ts`
- Modify: `src/app/(protected)/guide/listings/new/page.tsx`

**`sections-config.ts`:**
```typescript
type SectionId =
  | 'type-format' | 'description' | 'photos' | 'meeting-point'
  | 'how-conducted' | 'schedule' | 'order-config' | 'pricing'
  | 'tour-itinerary' | 'tour-departures' | 'tour-accommodation' | 'tour-meals'
  | 'transfer-points'

type SectionConfig = {
  id: SectionId
  label: string
  requiredFields: string[]  // listing fields that must be non-null for completeness
}

export const SECTIONS_BY_TYPE: Record<'excursion' | 'tour' | 'transfer', SectionConfig[]> = {
  excursion: [
    { id: 'type-format',    label: 'Тип и формат',      requiredFields: ['listing_type', 'format'] },
    { id: 'description',    label: 'Описание',           requiredFields: ['title', 'idea', 'org_details'] },
    { id: 'photos',         label: 'Фото',               requiredFields: ['photo_count_gte_6'] },
    { id: 'meeting-point',  label: 'Место встречи',      requiredFields: ['city'] },
    { id: 'how-conducted',  label: 'Как проходит',       requiredFields: ['duration_minutes', 'max_persons'] },
    { id: 'schedule',       label: 'Расписание',         requiredFields: ['has_schedule'] },
    { id: 'order-config',   label: 'Настройки заказа',   requiredFields: [] },
    { id: 'pricing',        label: 'Цена',               requiredFields: ['price_from_minor'] },
  ],
  tour: [
    { id: 'type-format',       label: 'Тип и формат',     requiredFields: ['listing_type', 'format'] },
    { id: 'description',       label: 'Описание',          requiredFields: ['title', 'org_details'] },
    { id: 'photos',            label: 'Фото',              requiredFields: ['photo_count_gte_6'] },
    { id: 'meeting-point',     label: 'Место встречи',     requiredFields: ['city'] },
    { id: 'how-conducted',     label: 'Как проходит',      requiredFields: ['duration_minutes', 'max_persons'] },
    { id: 'tour-itinerary',    label: 'Программа по дням', requiredFields: ['has_itinerary_days'] },
    { id: 'tour-departures',   label: 'Даты отправления',  requiredFields: ['has_departures'] },
    { id: 'tour-accommodation',label: 'Проживание',        requiredFields: [] },
    { id: 'tour-meals',        label: 'Питание',           requiredFields: [] },
    { id: 'pricing',           label: 'Цена',              requiredFields: ['price_from_minor'] },
  ],
  transfer: [
    { id: 'type-format',    label: 'Тип и формат',   requiredFields: ['listing_type', 'format'] },
    { id: 'description',    label: 'Описание',        requiredFields: ['title', 'org_details'] },
    { id: 'photos',         label: 'Фото',            requiredFields: [] },
    { id: 'transfer-points',label: 'Маршрут',         requiredFields: ['city'] },
    { id: 'how-conducted',  label: 'Детали',          requiredFields: ['max_persons'] },
    { id: 'order-config',   label: 'Настройки',       requiredFields: [] },
    { id: 'pricing',        label: 'Цена',            requiredFields: ['price_from_minor'] },
  ],
}
```

**Sidebar UI:**
- Each section shown as a step: number + label + completeness dot (✓ green / ● incomplete)
- Active section highlighted
- Clicking a completed section navigates to it
- Clicking an incomplete section: blocked if it's ahead of the first incomplete section (mandatory step gate)
- Header: listing title (or "Новое предложение") + "Предпросмотр →" link + "Сохранить черновик" auto (shows "Сохранено" checkmark)

**`use-autosave.ts`:**
```typescript
// Debounced 600ms. On any field change, PATCH /api/listings/[id] with changed fields.
// Shows "Сохранено" checkmark for 2s after save.
// Shows "Ошибка сохранения" if PATCH fails, with retry button.
export function useAutosave(listingId: string, fields: Partial<ListingDraft>) {
  // debounce + optimistic "Сохранено" state
}
```

- [ ] Write test: `SECTIONS_BY_TYPE.tour` has itinerary + departures, not schedule
- [ ] Run test — FAIL
- [ ] Implement `sections-config.ts`
- [ ] Implement `editor-sidebar.tsx`
- [ ] Implement `use-autosave.ts`
- [ ] Implement `editor-layout.tsx` wrapping sidebar + section content
- [ ] Modify `new/page.tsx`: INSERT draft, redirect to `/guide/listings/[id]/edit/type-format`
- [ ] Run tests — PASS
- [ ] Commit: `feat(editor): shell + sidebar stepper + draft autosave`

---

### Task E2 — Editor sections 1–4

**Section 1 — Тип и формат (`type-format`):**
- 3 type cards (not radios — large clickable cards with icon + label + description):
  - Экскурсия: "Прогулка, мастер-класс, фотосессия — один день"
  - Многодневный тур: "Путешествие с ночёвками и программой"
  - Трансфер: "Маршрут из А в Б с или без гида"
- 2 format cards: Индивидуально (one party) / Группа (mixed strangers)
- On type change: sidebar sections recalculate immediately

**Section 2 — Описание (`description`):**
- Fields vary by type (see `06-listing-type-matrix.md`):
  - Excursion: Название (100) / Идея / Маршрут / Темы / Орг. детали / Факты (opt) / Аудитория (opt)
  - Tour: Название / Идея / Орг. детали / Включено[] / Не включено[] / Сложность (Лёгкий/Средний/Высокий/Экстрим)
  - Transfer: Название / Орг. детали
- Character counts where limits exist (Название: 100 chars)

**Section 3 — Фото (`photos`):**
- Drag-and-drop zone + "Выбрать фото" button
- Min 6, max 25. Warn if < 1350×1350px. 20MB max.
- Thumbnail grid with reorder (drag) and delete (×)
- Progress bar per upload
- Copyright checkbox: "Я подтверждаю авторские права на все фотографии" — required before publishing
- Counter: "6 из 25 фото добавлено"

**Section 4 — Место встречи (`meeting-point`):**
- City autocomplete (from destinations table)
- Mode toggle: Фиксированное / По договоренности
- Фиксированное: text input (address) + map pin (Leaflet)
- По договоренности: text field "Опишите примерный район"
- Info box: "Точное место встречи путешественник увидит после принятия предложения"

**Files:**
- Create: `src/features/listings/editor/sections/type-format.tsx`
- Create: `src/features/listings/editor/sections/description.tsx`
- Create: `src/features/listings/editor/sections/photos.tsx`
- Create: `src/features/listings/editor/sections/meeting-point.tsx`

- [ ] Implement all 4 sections
- [ ] Type cards: large clickable cards (not small radios)
- [ ] Photos: client-side dimension validation via `createImageBitmap`
- [ ] All fields wire to `useAutosave`
- [ ] Commit: `feat(editor): sections 1-4 type/description/photos/meeting-point`

---

### Task E3 — Editor sections 5–8

**Section 5 — Как проходит (`how-conducted`):**
- Duration: dropdown (0.5h to 12h+, 24 options from `02-editor-schema.md`)
- Languages: checkbox list (19 languages)
- Movement type: single-select with icons (24 options, exact labels from research)
- Children: dropdown (Нет / Любого / от 3 / от 6 / от 10 / от 14 лет)
- Max persons: number input (1–50)

**Section 6 — Расписание (`schedule`) — excursion + transfer only:**
- 7-row weekly template: Пн / Вт / Ср / Чт / Пт / Сб / Вс
- Each row: enable checkbox + "с" time select + "до" time select (48 slots, 30-min, 08:00–07:30)
- "Окно бронирования": how far ahead (30/60/90/120/150/180 days) dropdown
- One-off extras: "+ Добавить исключение" (date + open/close action + optional custom times)

**Section 7 — Настройки заказа (`order-config`):**
- Booking cutoff: "Принимать запросы не позднее чем за" + select (1h–2.5 days)
- Event span buffer: "Перерыв между экскурсиями" + select (0/30min/1h/1.5h/2h)
- Instant booking toggle: if guide has < 5 completed orders, show disabled + "Доступно после 5 завершённых поездок. Сейчас: N"

**Section 8 — Цена (`pricing`):**
- Pricing model: 2 large cards — "За всё" (one price regardless of group size) / "За человека" (price × headcount)
- Primary price: number input + "₽" label
- Tariff tiers: "+ Добавить категорию" (Пенсионеры / Студенты / Школьники / Дети до N лет / Своё). Each row: name select + price.
- Discount: percent input (0–80%) + optional expiration date
- Seasonal adjustments: "+ Добавить правило". Each rule: date range + weekday checkboxes (Пн–Вс) + action (Снизить/Повысить/Стандартная) + percent.

**Files:**
- Create: `src/features/listings/editor/sections/how-conducted.tsx`
- Create: `src/features/listings/editor/sections/schedule.tsx`
- Create: `src/features/listings/editor/sections/order-config.tsx`
- Create: `src/features/listings/editor/sections/pricing.tsx`

- [ ] Implement all 4 sections
- [ ] Movement type: icons + labels (all 24 from `02-editor-schema.md`)
- [ ] Schedule: 48 time slot options (08:00, 08:30, ..., 07:30)
- [ ] Instant booking gate: query `completed_bookings_count`, disable toggle if < 5
- [ ] Tariff rows: add/remove, no empty price allowed, no duplicate names
- [ ] Price adjustment: date range picker + weekday mask checkboxes
- [ ] Commit: `feat(editor): sections 5-8 how/schedule/order-config/pricing`

---

### Task E4 — Tour-specific + transfer-specific sections

**Tour itinerary (`tour-itinerary`):**
- "Программа по дням" — add/remove day cards
- Each day: Day N header (auto) + title text + body textarea (markdown supported)
- Drag handle to reorder days
- "+ Добавить день" button

**Tour departures (`tour-departures`):**
- List of fixed date-range departures
- Each departure: start date + end date + price + max persons + status (active/cancelled)
- "+ Добавить даты отправления" button
- Replaces weekly schedule for tours entirely

**Tour accommodation (`tour-accommodation`):**
- Hotel name + stars (1–5) + room type + nights

**Tour meals (`tour-meals`):**
- Grid: rows = days, columns = Завтрак / Обед / Ужин
- Each cell: Включено / За доплату / Не включено + optional note

**Transfer points (`transfer-points`):**
- Pickup point: map pin + text label "Откуда"
- Dropoff point: map pin + text label "Куда"
- Vehicle type: select (Легковой / Минивэн / Микроавтобус / Автобус)
- Baggage: text field

**Files:**
- Create: `src/features/listings/editor/sections/tour-itinerary.tsx`
- Create: `src/features/listings/editor/sections/tour-departures.tsx`
- Create: `src/features/listings/editor/sections/tour-accommodation.tsx`
- Create: `src/features/listings/editor/sections/tour-meals.tsx`
- Create: `src/features/listings/editor/sections/transfer-points.tsx`

- [ ] Implement all 5 sections
- [ ] Tour itinerary: drag-to-reorder days
- [ ] Meals grid: 3×N grid (days × meal types)
- [ ] Commit: `feat(editor): tour and transfer specific editor sections`

---

## PART F — Public Catalog

**Goal:** Destination pages with Tripster-quality filtering. Listing cards that communicate everything at a glance. Listing detail that makes a traveler want to request the guide — not browse away.

---

### Task F1 — Destination page filter strip + category pills

**Tripster filter chips (horizontal scroll row, from `03-traveler-side.md §1`):**
- Формат проведения: Индивидуальный / Групповой (radio)
- Способ передвижения: multi-select from 24 options
- Цена: range slider (min 0, max 50 000 ₽)
- Длительность: range (0.5h – 12h+)
- Рубрики: category pills (17 categories)

**17 category labels (exact):** Все / Необычные маршруты / Лучшие / Музеи и искусство / За городом / Уникальный опыт / Активности / Гастрономические / Монастыри и храмы / История и архитектура / Что ещё посмотреть / Активный отдых / Обзорные / Однодневные / Обзорные на автобусе / На автобусе / Ещё

**Quick date-pick strip mid-list:** "Сегодня / Завтра / Эти выходные [dates]"

**Open requests section (Provodnik-only, bottom of page):**
- Title: "Путешественники ищут гида в [city]"
- Shows open `traveler_requests` for this city
- CTA: "Присоединиться к запросу" or "Создать свой запрос"

**Files:**
- Create: `src/features/destinations/components/filter-strip.tsx`
- Create: `src/features/destinations/components/category-pills.tsx`
- Create: `src/features/destinations/components/quick-date-strip.tsx`
- Create: `src/features/destinations/components/city-open-requests.tsx`
- Modify: `src/app/(site)/destinations/[slug]/page.tsx`

- [ ] Filter strip: all chips wired to URL searchParams (server-side filter)
- [ ] Category pills: 17 exact labels, active pill highlighted
- [ ] Open requests section: shows max 3, "Все запросы в [city] →" link
- [ ] Commit: `feat(destinations): filter strip, category pills, open requests section`

---

### Task F2 — Listing cards full anatomy

**Card anatomy (from `03-traveler-side.md §1 "Listing card anatomy"`):**
```
[Cover image — fill aspect ratio]
[Duration chip] [Movement type chip] [Format chip]
★ 4,84 · 45 отзывов
[Title H2]
[One-line tagline]
[Slot chips if near-term: сб, 19 апр в 10:00 · вс, 20 апр в 14:00]
от 6 000 ₽ · за группу, 1–4 чел.   [♥ heart]
```

**Price string logic:**
```typescript
const priceString = listing.pricing_model === 'per_group'
  ? `от ${formatRub(listing.price_from_minor)} · за группу, 1–${listing.max_persons} чел.`
  : `${formatRub(listing.price_from_minor)} · за человека`
```

**Near-term slot chips:** Show upcoming slots within 7 days (from `listing_schedule` + `listing_schedule_extras`). Max 3 chips. Format: "сб, 19 апр в 10:00"

**Files:**
- Modify: `src/features/listings/components/listing-card.tsx`

- [ ] Add duration chip, movement chip, format chip
- [ ] Fix price string to exact format above
- [ ] Add near-term slot chips
- [ ] Heart toggle wired to `listing_favorites`
- [ ] Both ratings (listing + organizer) on hover/expanded state
- [ ] Commit: `feat(listings): full Tripster listing card anatomy`

---

### Task F3 — Listing detail page full rewrite

**Blocks (top to bottom, from `03-traveler-side.md §2`):**

1. **Hero gallery:** cover + photo count chip ("14 фото"). Click → full gallery modal.

2. **Breadcrumbs:** Главная → [Region] → [City] → [Title]

3. **Header block:**
   - Title (H1)
   - "N посетили" stat
   - Guide avatar + name link → `/guide/[id]`
   - ★ Listing rating (N отзывов) + ★ Guide rating (guide-wide)
   - Verified badge if `guide.verification_status = 'approved'`

4. **Attribute row:** movement chip + duration chip + children policy + languages + format

5. **"Включено в рубрики":** category chip pills

6. **Long-form content:**
   - "Что вас ожидает" (route/idea text)
   - "Организационные детали" (org_details)

7. **Место встречи:**
   - If `meeting_point_approx_text`: shows that
   - PII lock copy: *"Точное место встречи откроется после принятия предложения"*

8. **Availability section (Provodnik adapted — bid-first):**
   - Monthly calendar showing available days (green dots) from `listing_schedule`
   - "Хотите другую дату? Укажите в запросе — гид подтвердит."
   - NOT a booking calendar — a trust signal showing when the guide operates

9. **Booking conditions block (bid-first copy):**
   - "Отправьте запрос — гид пришлёт предложение с ценой и деталями"
   - "Оплата напрямую гиду при встрече. 0% комиссии."
   - "Контакты гида откроются после принятия предложения"
   - "Организатор прошёл верификацию" (if approved)
   - Pricing model: "за группу, 1–N чел." or "за человека"

10. **Primary CTA block (RIGHT SIDE sticky on desktop, bottom on mobile):**
    - Price large: "от 6 000 ₽"
    - Primary button: **"Запросить у этого гида"** → `/traveler/requests/new?guide=[id]&listing=[slug]`
    - OR if open group requests exist: "Присоединиться к группе (N чел.) · от 2 100 ₽/чел" → `/requests?city=[city]`
    - Secondary ghost: "Задать вопрос гиду" → opens inquiry form

11. **Reviews block:**
    - Aggregate: 4-axis bars (Материал / Заинтересовать / Знания / Маршрут) + overall
    - Review cards: traveler name + date + rating + text + "N поездок" badge

12. **Cross-sell sidebars:**
    - "Другие предложения от [guide name]" (same-guide, different listing)
    - "Похожие предложения в [city]" (same category, different guide)

**Files:**
- Modify: `src/app/(site)/listings/[slug]/page.tsx`
- Create: `src/features/listings/components/listing-detail/hero-gallery.tsx`
- Create: `src/features/listings/components/listing-detail/availability-signal.tsx`
- Create: `src/features/listings/components/listing-detail/booking-conditions.tsx`
- Create: `src/features/listings/components/listing-detail/sticky-cta.tsx`
- Create: `src/features/listings/components/listing-detail/reviews-block.tsx`
- Create: `src/features/listings/components/listing-detail/cross-sell-sidebar.tsx`
- Create: `src/features/listings/components/listing-detail/inquiry-form.tsx`

- [ ] Implement all 12 blocks in order
- [ ] `sticky-cta.tsx`: sticky on desktop right column, fixed bottom bar on mobile
- [ ] `inquiry-form.tsx`: opens as bottom sheet (mobile) / modal (desktop), no page nav
- [ ] Reviews: 4-axis bars with percent fills
- [ ] Cross-sell: query same-guide + same-category listings
- [ ] Commit: `feat(listings): full listing detail page rebuild`

**Acceptance criteria (CDP verify):**
- [ ] Gallery chip shows photo count
- [ ] Both ratings (listing + guide) visible in header
- [ ] Booking conditions shows 0% commission
- [ ] "Запросить у этого гида" is the ONE primary button
- [ ] Sticky CTA bar visible on mobile (fixed bottom)
- [ ] Reviews show 4-axis bars
- [ ] Cross-sell sidebar shows ≥ 2 listings

---

## PART G — Order Surfaces

**Goal:** The post-match experience. The thread where the deal was struck and the trip is planned. Must feel alive — system events tell a story, not log data.

---

### Task G1 — Thread system events

**System events render as distinct rows (different from user messages):**
```
[Проводник icon] [timestamp]
[Event description in muted text]
```

**Each event type and its copy:**
| `system_event_type` | Rendered text |
|---|---|
| `request_created` | "Путешественник создал запрос" |
| `bid_submitted` | "Гид [name] отправил предложение — **Цена:** [price] ₽, **Дата:** [date]" |
| `guide_amended` | "Гид изменил предложение — **[field]:** [new_value]" |
| `bid_accepted` | "Путешественник принял предложение от [guide_name]" |
| `booking_created` | "Поездка создана · [date]" |
| `guide_confirmed` | "Гид подтвердил встречу" |
| `participant_joined` | "[name] присоединился к запросу — теперь [n] участников" |
| `booking_completed` | "Поездка завершена" |

**Field diff formatting (`guide_amended`):**
```typescript
// system_event_payload: { changed_fields: { price?: number, date?: string, time?: string } }
// Render: "Гид изменил предложение — Цена: 3 200 ₽" where "Цена:" is bold/strong
```

**Unread chips:** Messages from the other party show "Не прочитано" badge until thread is opened.

**Files:**
- Create: `src/features/messaging/components/system-event-row.tsx`
- Create: `src/features/messaging/components/message-row.tsx`
- Modify: `src/features/messaging/components/thread-view.tsx`

- [ ] Write test: `system-event-row` renders `bid_submitted` with bold price field
- [ ] Run test — FAIL
- [ ] Implement `system-event-row.tsx`
- [ ] Implement `message-row.tsx` with unread chip
- [ ] Modify `thread-view.tsx` to branch on `system_event_type`
- [ ] Run tests — PASS
- [ ] Commit: `feat(messaging): system event rows with bold field diffs`

---

### Task G2 — Support sidebar + booking ticket + emotional moments

**Support sidebar (on all booking/order detail pages):**
```
Поддержка
С 9:00 до 21:00 по Москве
Заказ: #6306617  [Скопировать]
✉ support@provodnik.app
Telegram: @provodnik_help
```

**Booking ticket (shown when `booking.status IN ('confirmed','completed')`):**
- Full-page modal, printable
- Booking ID (large, QR-ready)
- Listing title + guide name
- Date + time + participants
- Meeting point (exact — `meeting_point_text` visible for confirmed+)
- Guide phone + Telegram (unlocked PII)
- Org details from listing

**Contact unlock reveal (emotional moment, see §5):**
- Shown once when traveler first opens booking page after `guide_confirmed` event
- Animated card slides in: "Контакты [guide_name] теперь доступны"
- Shows phone + Telegram with glow border for 3 seconds

**Trip completed review prompt (emotional moment, see §5):**
- Triggered when `booking.status = 'completed'`
- Full-screen overlay on traveler's next visit
- "Как прошла поездка с [guide_name]?" + 4-axis star rating + text
- Dismissable with "Позже"

**Files:**
- Create: `src/features/bookings/components/support-sidebar.tsx`
- Create: `src/features/bookings/components/booking-ticket.tsx`
- Create: `src/features/bookings/components/contact-unlock-reveal.tsx`
- Create: `src/features/bookings/components/review-prompt-overlay.tsx`
- Modify: `src/app/(protected)/traveler/bookings/[bookingId]/page.tsx`
- Modify: `src/app/(protected)/guide/orders/[bookingId]/page.tsx`

- [ ] Implement support sidebar (both traveler and guide booking pages)
- [ ] Implement booking ticket modal
- [ ] Implement contact unlock reveal with CSS animation (slide-in + glow)
- [ ] Implement review prompt overlay (shown once per completed booking)
- [ ] Commit: `feat(bookings): support sidebar, booking ticket, emotional moments`

---

## PART H — Profile & Account

**Goal:** The guide's public profile is a stage, not a form. Account settings are clean and purposeful.

---

### Task H1 — Guide public profile (`/guide/[id]`)

**Layout (marketing, not settings):**
- Hero: full-width guide photo OR city photo background
- Guide card overlay: large avatar + name + city + "Гид с [year]" + "Отвечает за [time]"
- Languages chips + specialty chips
- "Написать запрос" primary CTA → `/traveler/requests/new?guide=[id]`

**Stats strip:**
- ★ [organizer_rating] ([N] отзывов) · [total_orders] поездок · Отвечает за [response_time]

**Bio section:** "О себе" — guide's `about` text (full, not truncated)

**Listings rail:** "Мои предложения" — max 6 published listings, "Все предложения →"

**Reviews section:**
- Aggregate: 4-axis bars
- Review cards: traveler name + date + listing name + rating + text

**Trust signals (footer of profile):**
- Верификация пройдена (if approved)
- Лицензии (count of validated licenses)
- На платформе с [year]

**Files:**
- Modify: `src/app/(site)/guide/[id]/page.tsx`
- Create: `src/features/guide/components/public/profile-hero.tsx`
- Create: `src/features/guide/components/public/profile-stats-strip.tsx`
- Create: `src/features/guide/components/public/profile-listings-rail.tsx`
- Create: `src/features/guide/components/public/profile-reviews.tsx`

- [ ] Implement all sections
- [ ] "Написать запрос" is the ONE primary button
- [ ] Guide photo is large and prominent (not thumbnail)
- [ ] Both rating numbers: listing rating + organizer rating
- [ ] Commit: `feat(guide): public profile marketing layout`

---

### Task H2 — Guide profile settings sub-pages

**Three sub-pages under `/profile/guide/`:**

**О себе (`/profile/guide/about`):**
- Bio textarea (feeds public profile "О себе")
- Languages: checkboxes (19 options)
- City/region served: city autocomplete (multi)
- Years of guiding experience: number input
- Save → updates `guide_profiles.bio`, `languages`, `city`

**Правовые данные (`/profile/guide/legal`):**
- Entity type: radio (Самозанятый / ИП / ООО)
- INN: text input
- OGRN: text input (optional for Самозанятый)
- Passport number + issue date
- Work country: dropdown
- Tour operator registry number: text input + checkbox "Я включён в реестр туроператоров" (required for multi-day tours)

**Лицензии (`/profile/guide/licenses`):**
- Add/remove license entries
- Each: number + type (guide/excursion/art/other) + subject_name + issue_date + region + photo upload (multiple)
- `is_validated` badge: "Подтверждена администратором" (set by admin only)

**Files:**
- Create: `src/app/(protected)/profile/guide/about/page.tsx`
- Create: `src/app/(protected)/profile/guide/legal/page.tsx`
- Create: `src/app/(protected)/profile/guide/licenses/page.tsx`
- Create: `src/app/(protected)/profile/guide/layout.tsx` — shared sidebar

- [ ] Implement all 3 sub-pages with server actions
- [ ] Sub-page sidebar nav: О себе / Правовые данные / Лицензии
- [ ] All save actions have success/error toast
- [ ] Commit: `feat(profile): guide profile sub-pages about/legal/licenses`

---

### Task H3 — Notification preferences matrix

**`/profile/notifications` — 3D matrix: role × event × channel**

**Role tabs:** Путешественник / Гид

**Event rows (6):**
1. Новый запрос / предложение
2. Новое сообщение
3. Напоминание о встрече (за 24 часа)
4. Изменение статуса поездки
5. Новый отзыв
6. Акции и новости (opt-in, off by default)

**Channel columns (3):**
- Telegram (link "Подключить" if `telegram_chat_id IS NULL`)
- Email (shows current email)
- Push — disabled chip "Скоро"

**Storage:** `user_profiles.notification_preferences jsonb`:
```json
{
  "traveler": {
    "new_offer": { "telegram": true, "email": true },
    "new_message": { "telegram": true, "email": false }
  },
  "guide": {
    "new_request": { "telegram": true, "email": true }
  }
}
```

**Files:**
- Modify: `src/app/(protected)/profile/notifications/page.tsx`
- Create: `src/features/profile/components/notification-matrix.tsx`

- [ ] Role tab toggle
- [ ] 6×3 checkbox grid
- [ ] Server action saves individual path in jsonb
- [ ] Telegram column shows "Подключить" if not linked
- [ ] Push column always shows disabled chip "Скоро"
- [ ] Commit: `feat(profile): 3D notification matrix`

---

## Execution Order Summary

```
Part A (Foundations)     → Deploy first. Everything depends on copy + nav.
Part B (Home + entry)    → The face of the product. Ships second.
Part C (Demand core)     → Our differentiator. Third.
Part D (Guide workspace) → Guides need this to handle Part C requests. Fourth.
Part E (Listing editor)  → Guides create portfolios. Fifth.
Part F (Public catalog)  → Browse mode. Sixth.
Part G (Order surfaces)  → Post-match polish. Seventh.
Part H (Profile)         → Trust signals. Eighth.
```

---

## CDP Verification Checklist (run after each Part)

### After Part A:
- [ ] Copy glossary file exists, typecheck passes
- [ ] Guide header shows KPI strip on `/guide/inbox`, `/guide/orders`, `/guide/listings`
- [ ] KPI strip "0% комиссия ✓" tile is green
- [ ] Unauthenticated header: "Создать запрос" is the only filled button

### After Part B:
- [ ] Home page hero has NO search bar — only "Создать запрос" button
- [ ] Open requests rail shows real data
- [ ] "0% комиссия для гидов" in trust block

### After Part C:
- [ ] 3-step wizard: progress indicator visible, "Далее" disabled until fields filled
- [ ] Open requests feed: shows requests with bid counts
- [ ] Guide bid card: large photo, both ratings, response time chip
- [ ] Accepting a bid → `/accepted` page with celebration UI
- [ ] Group join toast shows ₽ savings

### After Part D:
- [ ] Guide inbox: 3 tabs with counts
- [ ] Guide orders: 7 tabs, 2 view modes, status CTAs correct
- [ ] "Подтвердить" only on awaiting_guide_confirmation orders
- [ ] Calendar: month grid, booked slots visible

### After Part E:
- [ ] New listing → draft created → editor opens on type-format step
- [ ] Changing type to tour: schedule section replaced by departures + itinerary sections
- [ ] Autosave: "Сохранено" appears within 1s of typing
- [ ] Pricing section: tariff rows addable/removable

### After Part F:
- [ ] Destination page: filter chips horizontally scrollable on mobile
- [ ] Listing card: duration chip + movement chip + format chip all visible
- [ ] Listing detail: "Запросить у этого гида" is the ONE primary button
- [ ] Listing detail mobile: sticky CTA fixed at bottom

### After Part G:
- [ ] Thread: `bid_submitted` system event renders with bold price
- [ ] Support sidebar appears on booking detail pages
- [ ] Booking ticket opens on confirmed bookings

### After Part H:
- [ ] Guide public profile: large guide photo, "Написать запрос" is ONE primary button
- [ ] Notification matrix: role tabs work, checkboxes save

---

## What "Done" Means

| Not done | Done |
|---|---|
| Agent finished | CDP checklist fully checked |
| Tests pass | Real data renders (not empty states or placeholders) |
| Build succeeds | Every emotional moment tested manually |
| Copy looks OK | Every Russian string uses `COPY.*` constants — no hardcoded strings |
| Mobile looks fine | Tested at 375px — touch targets ≥44px, no overflow |
