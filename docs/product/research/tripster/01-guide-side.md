# Tripster Guide Side — Deep Map

_Researched 2026-04-11 as guide 366144 (officekg@yandex.ru). Every `/account/guide/{id}/*` screen is a separate Web Component / Shadow DOM micro-frontend. Content extracted by piercing shadow roots. Header, footer, and persistent KPI strip are shared chrome outside the MFEs._

## Persistent chrome (top of every guide screen)

### Header
- Left: logo
- Center primary nav — badges shown live on the session:
  - **Статистика** → `/account/guide/{id}/statistics/`
  - **Мои предложения** → `/account/guide/{id}/experiences/`
  - **Продвижение** → `/account/guide/{id}/promotion/`
  - **Заказы** (with count badge, e.g. "Заказы 1" / "Заказы 2") → `/account/guide/{id}/events/`
  - **Календарь** (with "1" badge) → `/account/guide/{id}/calendar/`
  - "Больше заказов — с продвижением" promo → "Подключить" link (deep-link to promotion)
- Right: O проекте / Помощь / small numeric badge "2" / user first name ("Гилян")
- Clicking user name opens dropdown:
  - **Статистика** / **Мои предложения** / **Продвижение** / **Заказы** / **Календарь** (same as nav)
  - **Профиль гида** → `/guide/{id}/` (public profile page)
  - `--- divider ---`
  - **Мои заказы 1** → `/account/traveler/inbox` (role switch to traveler)
  - **Промокоды** → `/account/traveler/bonuses/`
  - **Настройки профиля** → `/profile/` (account-level, shared between roles)
  - **Кабинет партнёра и турагента** → `/partner-account/`
  - Выйти

### KPI strip ("Ваша статистика")
Rendered above the page body on every guide screen. Live session values:
- **Отвечаете** — response time: "2 мин"
- **Подтверждаете** — confirmation rate: "85%"
- **Оплачивают** — payment rate: "82%"
- **Конверсия** — conversion: "70%"
- **Всего заказов**: 984
- **Вы заработали**: 2 146 693 ₽

These are lifetime guide reputation signals — duplicated on every tab so the guide is always aware of reputation health.

## 1. Statistics — `/account/guide/{id}/statistics/`
MFE: `guide-account-statistics-mfe`. Full analytics dashboard: order counts, conversion, rating trend, response time. (Scoped earlier in the session — detailed charts are out of scope for the replication plan; we can copy the top KPI block and a basic orders-over-time chart.)

## 2. My Listings — `/account/guide/{id}/experiences/`
MFE: `guide-account-experiences`. This is the catalog of the guide's own offers.

**Filter tabs:** Все / Экскурсии / Туры
**Listing states** (badge on each card):
- Опубликовано — live
- Отказано — rejected by moderation (shows rejection reason: "cannot publish as conditions not met")
- Отложено — on hold / paused
- Новое — draft

**Card anatomy**: cover photo + title + city + star rating + review count + status badge + "Редактировать" button.
**Primary CTA**: "Добавить предложение" → opens unified `/editor/` (same editor for excursions and tours, form is conditional on type).

## 3. Promotion — `/account/guide/{id}/promotion/`
MFE: `partner-promotions-mfe`. Paid boost product.

**Pitch**: "Получайте в 2 раза больше показов, продвигая свои предложения за дополнительную комиссию."
**Eligibility** (hard gate): конверсия ≥60% AND rating ≥4.6. Below threshold, whole page is locked.
**Pricing model**: extra % commission on every paid order *during* promotion window. No upfront spend.
**Per-city scarcity**: "В городе осталось мало рекламных мест" — promotion inventory is allocated per destination.
**Per-listing configuration**: slider "% доп. комиссия за продвижение" on each listing card; "Сохранить" / "Подтвердить" / "Отмена".
**Report tab**: "Отчёт" — shows earned vs promoted vs commission charged.

## 4. Orders — `/account/guide/{id}/events/`
MFE: `guide-account-orders`. The operational inbox. 

**Filter/tab bar (counts are live)**:
- В работе (11)
- Забронированы (6)
- Непрочитанные (42)
- Ждут подтверждения (3)
- Ждут оплаты
- Завершены
- Отменены

**Two view modes** (recent onboarding banner: "Обновили список заказов — Появилось два режима просмотра"):
- **По событиям** (by event) — groups all bookings for the same scheduled run/date
- **По заказам** (by order) — flat list of every booking thread

**Order card anatomy** (list row):
- Avatar initials ("НБ") + traveler first name + last initial ("Наталья Б.")
- Order ID ("6306617")
- Listing title ("Элиста — степной оазис и буддийский центр")
- Date + time ("16 апр, чт 16:00")
- Participants ("2 уч")
- Price ("6000 ₽")
- Status badge: `Забронирован` / `Ждёт подтверждения` / `Ждёт оплаты` / `Внесена предоплата`
- Actions (conditional on status):
  - **Подтвердить** — when status is "Ждёт подтверждения"
  - **Ответить** — opens inline reply thread (messaging is per-order, not a separate inbox)
  - **Напомнить об оплате** — for pending-payment orders
  - **Открыть билет** — after pre-payment

**Implication for Provodnik**: order status machine is richer than ours — Tripster has explicit separate states for awaiting-guide-confirm vs awaiting-traveler-payment, which maps cleanly to a bid/request flow if we extend it.

## 5. Calendar — `/account/guide/{id}/calendar/`
MFE: `guide-calendar-mfe`. Availability editor.

**Month grid**: "Апрель 2026" with weekday columns Пн-Вс, showing each day as a clickable cell.
**Day detail** (side panel): 30-minute time slots from 00:00 to 23:30.
**Slot states**:
- Empty / Available
- Booked slot (e.g. "16:00–18:00 Ольга, 2 человека Элиста — степной оазис и буддийский центр")
- "Закрыто" — guide-blocked time
**Actions per day**:
- **Закрыть время** — block individual slot(s)
- **Закрыть день** — block entire day
**Filter**: "Что показывать / Все предложения / [list of guide's offers]" — see availability for one specific listing or for all.
**Help link**: "Как пользоваться календарем"

**Implication for Provodnik**: Tripster treats the calendar as the single source of truth for slot-level availability. Bookings land on the calendar; blocked time is set directly there. We currently have listings with free-text working hours — to replicate we'd need a per-guide `availability_slots` model.

## 6. Editor (listing creation / edit) — `/editor/`
_Not yet mapped. Next investigation target. Unified editor; branches inside the form by "type" toggle (excursion vs tour)._

## 7. Profile settings — `/profile/`
_Account-level, shared between guide and traveler roles. Likely: name, email, phone, password, language, notifications, avatar. Mapped next._

## 8. Public guide profile — `/guide/{id}/`
Same URL as anonymous view. Guide sees their own profile in marketing-facing layout with bio, photos, languages, offers, reviews.

## Cross-cutting patterns to copy

1. **Persistent KPI strip** above every guide screen — reputation always on top of mind.
2. **Sidebar-less flat nav** — 5 top-level items (Statistics, Listings, Promotion, Orders, Calendar) + profile dropdown. No nested sidebars.
3. **Badge counts on nav** — Orders and Calendar have live badges drawn from the inbox/calendar state.
4. **Single-user-dual-role**: traveler items live inside the profile dropdown; role switch is a link, not a logout.
5. **Inline messaging per order** — no separate /messages screen; reply surfaces open in-place from the order card.
6. **Status-dependent actions** — the CTAs on each order card change by status (Confirm / Remind / Open ticket / Reply). We should do the same instead of always showing every action.
7. **Unified editor** — one form for excursions and tours; type picked as a radio inside the form. Cuts code duplication and gives us the same entry point for the bid/request flow.
8. **Moderation queue with reject reasons** — listings show "Отказано" with a visible rejection explanation. We need this for the verification + publishing flow.
9. **Promotion as a paid commission-uplift** (no upfront ad spend) — this is a much better fit for a two-sided marketplace than CPM/CPC ads. Worth considering for v1 monetization.

## Open questions still to answer

- How are "events" (scheduled runs) created — from a listing with a recurring slot pattern, or one-off?
- How is pricing stored — per-person or per-group? Per-listing `price` probably has a "mode" switch inside editor.
- Where does the guide see reviews, and can they reply to them?
- Are there payout/invoicing screens? (Not in main nav, not in dropdown — possibly inside Statistics or `/partner-account/`.)
- Verification: does creating a first listing trigger guide verification, or is it a separate one-time form?
- Direct-message threads without an order: do they exist? (My hypothesis: no — all threads are tied to a booking.)
