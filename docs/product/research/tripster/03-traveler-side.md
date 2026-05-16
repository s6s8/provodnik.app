# Tripster Traveler Side — Deep Map

_Researched 2026-04-11 signed in as officekg@yandex.ru (the same account that owns the guide side — Tripster is single-user-dual-role). Every traveler screen is a Web Component / Shadow DOM MFE under a different tag name. Content extracted by piercing shadow roots with the leaf-filter pattern._

## Route map

| URL | Shadow-root tag | Purpose |
|---|---|---|
| `/` | `experience-mf-home` | Home (hero search, popular destinations, trust, app promo) |
| `/experience/{slug}/` | `experience-mf-listing` | Destination catalog (city page) |
| `/experience/{id}/` | `travelers-experience-mfe` | Listing detail |
| `/mfs/experience/booking/{id}/` | `travelers-booking-mfe` | **Booking form (checkout)** |
| `/account/traveler/inbox/` | `frontend-experience-app-traveler-orders` | Traveler order inbox |
| `/experience/order/{order-id}/` | `experience-mf-traveler-order` | **Order detail + chat thread** |
| `/favorites/` | — (not yet probed) | Wishlist |
| `/account/traveler/bonuses/` | — (not yet probed) | Promo codes |

Each MFE is an independent Vue/React bundle mounted inside a shadow root, so the traveler surface is ~7 separately-deployable apps sharing only the header chrome.

## 1. Destination / catalog page — `/experience/Elista/`

**Header block**
- Breadcrumbs: Главная → Россия → (city)
- H1: "Экскурсии в Элисте"
- Subtitle: "Необычные экскурсии от местных жителей. Цены на экскурсии по городу от 1400 ₽" — computed from the cheapest listing.
- Search bar summary: "Любые даты, 1 чел." (clicking opens date+guest picker).

**Filter strip** (horizontally scrolling chip row)
- Формат проведения (individual / group)
- Способ передвижения (bound to the 24-option `movement_type` enum from the editor)
- Цена (range)
- Фильтры (catch-all: duration, languages, max persons, etc.)
- Рубрики (category chips)
- Ещё

**Category pills row** — both rendered as chips AND as sidebar groups:
Все / Необычные маршруты / Лучшие / Музеи и искусство / За городом / Уникальный опыт / Активности / Гастрономические / Монастыри, церкви, храмы / История и архитектура / Что ещё посмотреть / Активный отдых / Обзорные / Однодневные / Обзорные на автобусе / На автобусе / Ещё

**Content sections** (rendered top to bottom in one scroll)
1. **Featured subrail** "Лучшие / Необычные темы и маршруты" — 1 highlighted category with tagline + 4 card rail.
2. **Full list** "Все экскурсии" with "20 предложений · По популярности" sort header — same card template as featured, full flat list.
3. **Cross-sell CTA banner** mid-list: "Туры в Калмыкию и Поволжье с проживанием — Буддийские праздники, калмыцкая кухня… / Найти свой тур" (links to `/tours/`).
4. **Quick date-pick strip** mid-list: "Когда вы планируете посетить экскурсию? · сегодня / завтра / выходные 11-12 апр" — re-filters the list by availability.

**Listing card anatomy** (every card on the page):
- Cover image (fill-aspect)
- Attribute row top-left: duration ("3 часа"), movement type ("На автомобиле"), format ("индивидуальная" / "групповая")
- Rating: numeric (e.g. "4,84") + "45 отзывов" link
- Title (h2-sized)
- One-line tagline (p)
- Optional inline slot chips for listings with near-term capacity: "вс, 12 апр в 10:00 · 11:00"
- Price: "от 6000 ₽ · за группу, 1–4 чел." OR "4000 ₽ · за одного" (format determined by `pricing_model`)

## 2. Listing detail — `/experience/{id}/`

Already captured in prior session. Highlights for the plan:
- Guide-owner controls only when viewed by the listing's guide (Приостановить / Редактировать / В избранное).
- Hero gallery with photo count chip.
- Breadcrumb + category chips.
- Title + review count + "{N} посетили" + guide avatar badge "Представитель команды гидов" + "Напишите мне".
- Attribute row: movement type / duration / children policy / language / format.
- "Включено в рубрики" — category chip pills.
- Long-form sections: "Что вас ожидает" (route), "Организационные детали" (with inline extras like "Подношение 100 ₽/взр., 50 ₽/дет.").
- **"Место встречи"** with the explicit note: _"Начало экскурсии на площади «Пагоды 7 дней». Точное место встречи вы узнаете после внесения предоплаты."_ → meeting point hidden until prepay.
- "Остались вопросы? / Задать вопрос / Напишите организатору и уточните всё важное до оплаты" — **inbound question flow bypasses the booking form** (creates a message thread without a deposit).
- Reviews block: aggregate 4,94/5, breakdown bars, traveler cards with "N экскурсий" badge per reviewer.
- **"Доступные даты"** inline calendar (Апрель / Май) with per-day prices, then time-slot picker "Завтра · 11:30 · 12:00 · …" with overflow "+10".
- Participant count row with price curve: 1×=6000 … 11×=316000 (per-group pricing with linear markup per extra head above the group base).
- **"Выбрать дату"** primary CTA → `/mfs/experience/booking/{id}/`.
- Booking-conditions block shown directly on the listing (before checkout):
  - "Предоплата 25%, остальное — организатору напрямую"
  - "Бесплатная отмена за 48 часов"
  - "Моментальное бронирование без ожидания ответа гида"
  - "Задать вопросы организатору можно в заказе до предоплаты"
  - "Организатор предоставил документы об аттестации"
  - "за 1–5 человек, независимо от числа участников"
- Sidebar: "Другие предложения в Элисте" (same-guide cross-sell) + "Похожие предложения" (similar-category).
- Policy block: "Как мы работаем с отзывами".

## 3. Booking form (checkout) — `/mfs/experience/booking/{id}/`

**Single-page form** (not a multi-step wizard), ordered top to bottom in one MFE shadow root (`travelers-booking-mfe`):

1. **Summary strip (top)**
   - Listing title + "Индивидуальный формат в Элисте" format label
   - "Только для вас и вашей компании, 1–5 человек"
   - Guide name (link)
   - Note: "Контакты станут доступны после подтверждения и предоплаты" — hard PII gate.
   - Tabs: "Заказать" / "Задать вопрос" — the same MFE hosts both the paid booking and the free pre-booking inquiry flow.

2. **Дата** — 2-month calendar grid with per-day price chips. Cells carry `data-test="booking-form-calendar-day-available"` when bookable or `data-test="false"` when disabled. CSS class `.cell-day`, price under `.price`. Tripster does NOT change the cell class on click — selection is tracked in Vuex state, cells update via a CSS binding not present in the static snapshot.

3. **Время** — time chips, populated from the listing's weekly schedule template (`individualSchedule`) merged with `extra_slots`.

4. **Участников** — native `<select>` bound to `max_persons` ceiling. Pricing row recomputes immediately (per-group pricing: 1× base + linear markup; per-person: N × base).

5. **Как вас зовут** — single text input.

6. **Ваша эл. почта** — email.

7. **Ваш телефон** — custom phone component with country picker (250+ countries, default "Россия +7").

8. **Продолжить** primary button — submits the form, creates the order row, redirects to `/experience/order/{order-id}/` where the deposit-payment widget opens.

**Side block** (right column):
- "Индивидуальный формат / Только для вас и вашей компании, 1–5 человек"
- Длительность
- Место встречи
- Гарантия лучшей цены + "Подробнее"
- "234 отзыва. Оценка 4,94 из 5"
- "Напишите комментарий и обсудите детали заказа с организатором"
- **Deposit-policy reminder**: "После подтверждения заказа 25% вы оплачиваете на Трипстере, а остальные деньги напрямую организатору"
- "При отмене заказа за 48 часов до начала мы вернем предоплату"
- Platform trust footer: "Мы работаем с 2013 года. Каждый месяц сотни тысяч человек…"

**Key finding — no separate "cart" or "checkout review" screen.** The whole booking is one form; the deposit-payment UI lands on the order detail page after submission, not inside the booking form.

## 4. Traveler inbox — `/account/traveler/inbox/`

MFE: `frontend-experience-app-traveler-orders`.

**Layout** — flat order list, no tabs, no filters. Much simpler than the guide side.

**Sidebar**:
- Мои заказы (active)
- Промокоды
- Upsell card: "Нужен трансфер? / Доберитесь до места встречи или проживания / Забронировать"

**Order row** (every card uses the same template):
- Cover image of the listing
- "Платежи гидов Трипстеру" small label = payment recipient (Tripster handles the deposit, so this label is constant)
- Order status: "Забронировано" (Internal states observed on the guide side also include "Ждёт подтверждения", "Ждёт оплаты", "Внесена предоплата", "Завершён", "Отменён" — the same order row adapts.)
- Weekday of the scheduled run
- Price
- Primary CTA "Открыть билет"
- Conditional "Написать отзыв" (appears once the event has passed)

No badge counts, no "Unread" filter, no segmentation — the traveler is expected to have a handful of orders, not a pipeline.

## 5. Order detail + thread — `/experience/order/{order-id}/`

MFE: `experience-mf-traveler-order`. **This is where the per-order messaging surfaces.**

**Top strip**
- Back link "Все заказы"
- Scheduled date/time: "10 ноября, пн 12:00"
- "Заказ № 5867979"
- Status badge "Забронировано"
- Participant count
- Payment-recipient label "Платежи гидов Трипстеру"

**Summary card** (right column)
- "Индивидуальная экскурсия" format
- "Tripster" payout brand
- **PII lock**: "Контакты недоступны в отменённых и завершённых заказах" — contact info is gated on order state.
- Stat rows: Дата / Начало (местное время) / Длительность / Участников / Стоимость
- CTAs: "Написать отзыв" (post-event), "Открыть билет" (always), "в билете" link.
- Cross-sell: transfer banner.
- Mobile-app QR.

**Messaging thread** (the important part)

Reply composer pinned at the top:
- H3 "Ваше сообщение"
- Textarea + "Отправить"

Thread body below, reverse-chronological, mixing **user messages** and **system events** in one stream:

| Row type | Shape | Example |
|---|---|---|
| System: order created | "Tripster / {date} / Путешественник оформил заказ" | 9 ноя 2025 |
| User message | "{author name} / {date} / {body}" | "Гилян / 9 ноя 2025 / 1250 руб, заказ 5844859" |
| System: guide changed order | "Tripster / {date} / Организатор изменил заказ — **Стоимость:** {new price}" | **strong** is used to flag the changed field inline |
| System: guide confirmed | "Tripster / {date} / Организатор подтвердил заказ" | — |
| System: deposit paid | "Tripster / {date} / Внесена предоплата" | — |
| Support message | "Светлана (Команда Трипстера) / {date} / Спасибо, оплату получили!" | Platform support joins the same thread |

Each traveler message row carries a "Не прочитано" chip until the guide reads it (mirror of the guide-side "Непрочитанные 42" tab).

**Support sidebar** (always visible on order detail):
- H3 "Поддержка"
- Working hours: "с 9 до 21 часа"
- Order number (for copy-paste into support)
- Channels: ВКонтакте / Чат / Max / +7 495 146-39-66 / support@tripster.ru

**Refund policy** block at bottom with "Подробнее" link.

## Takeaways for Provodnik

1. **Order = conversation.** Tripster has no separate `/messages` surface on either side — every thread is bound to an order. System events, user messages, and support replies interleave in one stream. This is exactly what we need for the bid/request flow: a request is an order-in-negotiation, and its thread holds both traveler messages, guide bids, and system events ("bid submitted", "bid accepted", "deposit paid", "meeting point sent").

2. **Single-page booking form with deposit-only collection** — not a multi-step wizard, not a Stripe-style split checkout. The form creates the order row first; payment widget opens on the resulting `/order/{id}/` detail page. For Provodnik this means the booking form itself doesn't need to embed a payment provider — payment is a second step that only runs if the guide accepts.

3. **PII gate tied to order state.** Exact meeting point, guide phone, guide email are hidden until the traveler pays the deposit (and re-hidden if the order is cancelled/completed). This is a deliberate friction point that funds the platform. Adopt it for Provodnik so guides can't route travelers off-platform before a deposit lands.

4. **Inquiry flow lives inside the same MFE as the booking form.** `travelers-booking-mfe` has two tabs: "Заказать" (paid) and "Задать вопрос" (free inquiry). Both produce an order row that creates a thread; the inquiry variant simply skips the calendar + payment widget. For our bid/request flow this maps 1:1: a request is the inquiry path extended with bids.

5. **Destination page is a pure filter-over-list layout** — no hero carousel, no editorial intro blocks, no separate "tours vs excursions" split. Category pills double as sidebar groups. Featured subrail + full list is enough. Our current destination page can match this with minor rework.

6. **Traveler inbox is deliberately thin** — no tabs, no filters. If a user has more than ~10 orders they're expected to use the calendar. Don't over-engineer the traveler inbox; the effort goes into the **order detail** surface because that's where they spend time.

7. **Payment-recipient labelling as trust signal.** The constant "Платежи гидов Трипстеру" label on every order row/header/card reinforces that Tripster handles money. A similar "Оплата через Provodnik" chip everywhere we collect money is cheap trust infrastructure.

8. **Support is inside the order.** A dedicated support sidebar on every order detail page with channels + working hours + copy-ready order number removes the "where do I complain" friction. Cheap to build, high-value for marketplace trust.

9. **Strong-highlighted inline diffs in order changes.** When the guide changes the price, the system message says _"Организатор изменил заказ — **Стоимость:** 1500 ₽"_. Field-level change surfacing. Adopt for our bid amendments: "Guide amended bid — **Price:** 15000 ₽, **Start:** 12:00".

## Still not probed
- `/favorites/` (wishlist UX)
- `/account/traveler/bonuses/` (promo codes)
- Actual deposit-payment widget (would require submitting a real booking — out of scope)
- "Задать вопрос" inquiry-only submission path (same MFE, different tab)
- Traveler-side view of a cancelled/completed order (PII lock behavior)

None of these are blocking for the replication plan — the negotiation loop (listing → booking form → order thread → deposit) is fully captured.
