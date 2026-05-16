# Tripster Listing-Type Matrix

_Researched 2026-04-11. Maps what the editor shows/hides across Tripster's 8 listing types, based on direct probing of `experience` (draft 115859) and `MULTIDAY_TOUR` (tour 61998 detail page). This is the file that drives §P0-B editor branching rules for Provodnik._

> **⚠️ Superseded in parts by `07-gap-closure.md` (2026-04-12).** Corrections applied after direct probing of 4 more listing types via Pinia menu store:
> - `photoshoot` enum value is actually `photosession` (naming fix)
> - transfer DOES have `Темы` sub-step AND uses `individualSchedule` (weekly template) — the "on-demand only" row in the visibility matrix below is **WRONG**
> - quest description has 6 sub-steps (excursion minus `Факты и детали`)
> - photosession description has 4 sub-steps (Название / Маршрут / Темы / Орг. детали)
> - Real excursion menu has 5 top-level sections: Предложение / Описание / Фото / Условия / Документы (Документы is its own section, not a sub-step of Условия)
> - Legal-status enum is `self_employed | individual | company`, NOT `self_employed | individual_entrepreneur | llc`
> - Ratings are 4-axis (Материал / Заинтересовать / Знания / Маршрут) + overall, not single-axis
>
> When in doubt, `07-gap-closure.md` wins.

## Tripster's 8 listing types — recap

From `02-editor-schema.md`:

| Code | Russian | Provodnik mapping (per ADR-014) |
|---|---|---|
| `experience` | Экскурсия | `excursion` |
| `MULTIDAY_TOUR` | Многодневный тур | `tour` |
| `activity` | Активный отдых | `tour` (if multi-day) or `excursion` |
| `waterwalk` | Водная прогулка | `excursion` |
| `quest` | Квест | `excursion` |
| `transfer` | Трансфер | `transfer` |
| `masterclass` | Мастер-класс | `excursion` |
| `photoshoot` | Фотосессия | `excursion` |

## Section visibility matrix (inferred from Tripster + probed where possible)

Rows are editor sections. Columns are listing types. `✓` = section visible, `—` = hidden, `?` = unprobed but inferred.

| Section | excursion | waterwalk | masterclass | photoshoot | quest | activity | tour | transfer |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Type + Format picker | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Title | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Idea (hook) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Route (narrative) | ✓ | ✓ | — | — | ✓ | ✓ | — | — |
| Theme | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Org details (cost/meals/transport) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Facts (optional) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Audience (optional) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| **Itinerary days** (per-day programme) | — | — | — | — | — | ? | **✓** | — |
| **Accommodation** (hotel/lodging) | — | — | — | — | — | ? | **✓** | — |
| **Meals** (что включено по приёмам пищи) | — | — | — | — | — | ? | **✓** | — |
| **Transport** (между пунктами) | — | — | — | — | — | ? | **✓** | ✓ |
| **Included / Not included** lists | — | — | — | — | — | ✓ | **✓** | — |
| **Difficulty level** (Уровень сложности) | — | — | — | — | — | ✓ | **✓** | — |
| Photos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Videos** | — | — | — | — | — | ? | **✓** | — |
| Meeting point (city + pin/approx) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Duration (single tour length) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Languages | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Movement type (transport mode) | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| Children allowed age | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Max persons | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Weekly schedule template** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| **Fixed date-range slots** (seasonal) | — | — | — | — | — | ? | **✓** | — |
| Schedule extras (one-off) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Booking cutoff (close_registration_before) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Event span (buffer) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Instant booking eligibility | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Pricing model (per_group / per_person) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Primary price | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tariff tiers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Seasonal price adjustments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Discount rate | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Deposit percent (per-listing)** | ✓ 25% | ✓ | ✓ | ✓ | ✓ | ✓ | **✓ 15%** | ✓ |
| **Tour operator registry flag** | — | — | — | — | — | — | **✓** | — |

Notes on probing confidence:
- Excursion row: directly probed via draft 115859 walk
- Tour row: inferred from tour 61998 detail page (all sections visible in read-only view matched the editor section list from the Vue router)
- activity / waterwalk / masterclass / photoshoot / quest / transfer: inferred from router structure only; editor branching not directly probed

## Tour detail page findings (from tour 61998 — "Калмыкия: буддийские храмы и степной простор")

The detail-page rendering confirms the tour-specific data model:

### 1. Day-by-day programme (Программа)
A numbered list, 3 entries for 3-day tour:
- **День 1 · 13 апреля** — "Встреча в Элисте. Обзорная экскурсия. Обед в кафе национальной кухни. Посещение хурула Сякюсн-Сюме…"
- **День 2 · 14 апреля** — "Выезд в Яшкуль. Чолун-хамур. Обед у озера…"
- **День 3 · 15 апреля** — "Гучин-алтан. Возвращение в Элисту. Трансфер в аэропорт."

Each day has: day number, absolute date, narrative paragraph. Some entries include inline highlights (e.g. "Обед в кафе национальной кухни 1500 ₽ оплачивается отдельно").

**Data shape:** `listing_days(listing_id, day_number smallint, title text, body text, date_override date NULL)` — `date_override` is NULL when the programme is slot-agnostic and computed from the start date.

### 2. Accommodation (Проживание)
Flat section:
- "2 ночи в гостинице «Элиста», 3* · двухместный стандарт"
- Alternative upgrade option: "Люкс за 1500 ₽/ночь доплата"

**Data shape:** probably a single `accommodation` jsonb column on listings, schema `{hotel_name, stars, room_type, nights, upgrade_options[]}`.

### 3. Meals (Питание)
Per-day breakdown:
- "Завтрак: все дни (включено в стоимость)"
- "Обед: 1 и 2 день (включено); 3 день (~800 ₽ оплата на месте)"
- "Ужин: не включено"

**Data shape:** a grid per day × meal type × included/paid-extra/not-included.

### 4. Transport (Транспорт)
"Микроавтобус Mercedes Sprinter (14 мест). Водитель + гид. Весь транспорт между пунктами программы включён."

### 5. Difficulty level (Уровень сложности)
Single enum: Лёгкий / Средний / Высокий / Экстрим. Tour 61998 uses "Лёгкий".

### 6. Included / Not included
Two bulleted lists. Example:
- **Включено:** Проживание, Завтраки, Транспорт по программе, Входные билеты, Гид-сопровождающий
- **Не включено:** Перелёт, Обеды (кроме 1 и 2 дня), Ужины, Страховка, Сувениры

**Data shape:** two text[] columns, `included[]` and `not_included[]`.

### 7. Fixed date-range slots (instead of weekly schedule)
Tour 61998 shows 5 upcoming departures, each a date range with its own price:
- 13–15 апр · 29 000 ₽
- 27–29 апр · 31 900 ₽
- 4–6 мая · 33 500 ₽
- 18–20 мая · 35 200 ₽
- 1–3 июн · 35 200 ₽

**Data shape:** `listing_tour_departures(listing_id, start_date, end_date, price_minor, currency, max_persons smallint, status text)` — seats on a departure are tracked individually, NOT via the weekly schedule.

This is the critical branching point: `excursion` uses `listing_schedule` (weekly template) + `listing_schedule_extras` (one-off), `tour` uses `listing_tour_departures` (fixed date ranges). They do NOT share storage. The editor for tour has a "Добавить даты отправления" button instead of a weekly grid.

### 8. Deposit percent — per-listing, NOT global
Tour 61998 shows "Предоплата 15%" in the booking-conditions block.
Excursion 22051 (from §03) shows "Предоплата 25%".

**Finding:** Tripster's `deposit_rate` is a per-listing field, defaulting from type (tours tend to 15%, excursions 25%) but guide-overridable. For Provodnik v1 this is moot — no deposits — but if we ship payments in v2 we must store `deposit_rate` on `listings`, not on a global config.

### 9. Tour operator registry flag
Tour 61998 header shows a trust chip: **"Организатор есть в реестре туроператоров"**. This is separate from the guide license chip and visible only on `listing_type = tour` rows where the tour crosses at least one overnight. Backed by a field on the guide account (not per-listing) that the guide fills in `/profile/guide/legal/`.

**Legal context:** Russian federal law "Об основах туристской деятельности" requires multi-day tour operators to be registered in the федеральный реестр туроператоров with a bank guarantee (500k–50M ₽ depending on activity). Guides publishing tours must display this flag to be compliant.

## Rating model — listing rating vs organizer rating

Both tour detail and excursion detail pages show **two separate rating numbers**:

- **Рейтинг экскурсии / тура** — "4,94 · 234 отзыва" (aggregated over this listing only)
- **Рейтинг организатора** — "4,89 · 1520 отзывов" (aggregated over all the guide's listings)

This is a small but important UX decision: a new listing with 0 reviews still inherits trust from the guide's overall reputation via the second number. The same guide can have a 5-star organizer rating and a 3-star listing rating simultaneously — the platform shows both so travelers can judge.

**Implication for Provodnik:** `guide_profiles.average_rating` and `listings.average_rating` must be maintained independently. Rating aggregation jobs write to both. Listing cards show listing rating; detail pages show both.

## Implications for Provodnik §P0-B editor

Rewrite the P0-B section visibility rules to handle the tour branch:

**For `listing_type = excursion`:**
- Sidebar shows the 8-section flow from `02-editor-schema.md` as-is
- Schedule section renders weekly template editor
- Price section shows single base price + optional tariffs

**For `listing_type = tour`:**
- Hide: Route (narrative), Theme, Weekly schedule, Event span, Instant-booking toggle, Tariffs section, Movement type (use Transport section instead)
- Show: **Itinerary days**, **Accommodation**, **Meals grid**, **Transport description**, **Difficulty level**, **Included / Not included lists**, **Videos**, **Fixed date-range departures**
- Pricing model defaults to `per_person` (tours don't price per group)
- Publishing blocked unless `guide_profile.is_tour_operator = true` when `tour.duration > 24h`

**For `listing_type = transfer`:**
- Hide: Route, Theme, Facts, Audience, Tariff tiers (single price only), Difficulty, Itinerary, Accommodation, Meals, Included/Not-included
- Show: Pickup point + drop-off point (two meeting-point pins instead of one), Vehicle type, Capacity, Baggage allowance, Price per vehicle (per_group default)
- Schedule: on-demand, no weekly template — `extras` only

The Vue-router-guard equivalent in Next.js: compute visible sections from `listing_type` inside the layout and redirect to the first incomplete visible section on mount.

## Updates to §P0-A schema migration

Add to the `20260412000001_listings_tripster_schema.sql` migration:

**New columns on `listings`:**
- `difficulty_level text CHECK IN ('easy','medium','hard','extreme') NULL`
- `included text[] DEFAULT '{}'`
- `not_included text[] DEFAULT '{}'`
- `accommodation jsonb NULL` — schema documented in §1.2 above
- `deposit_rate numeric(4,3) DEFAULT 0` — 0 for v1 (no payments)
- `pickup_point_text text NULL` — transfer only
- `dropoff_point_text text NULL` — transfer only
- `vehicle_type text NULL` — transfer only
- `baggage_allowance text NULL` — transfer only

**New columns on `guide_profiles`:**
- `is_tour_operator boolean DEFAULT false`
- `tour_operator_registry_number text NULL`

**New tables:**
- `listing_days(listing_id uuid, day_number smallint, title text, body text, date_override date NULL, PRIMARY KEY (listing_id, day_number))`
- `listing_meals(listing_id uuid, day_number smallint, meal_type text CHECK IN ('breakfast','lunch','dinner'), status text CHECK IN ('included','paid_extra','not_included'), note text, PRIMARY KEY (listing_id, day_number, meal_type))`
- `listing_tour_departures(id uuid PRIMARY KEY, listing_id uuid, start_date date, end_date date, price_minor int, currency text, max_persons smallint, status text)` — replaces weekly schedule for tours

These are additive migrations — the existing `listing_schedule` + `listing_schedule_extras` tables stay and remain the canonical availability source for `excursion` and `transfer` types. Tours use `listing_tour_departures` exclusively.

## Summary — Tripster's editor is one router, seven shapes

The data model is a superset keyed by `exp_type`. The editor hides sections it doesn't need and swaps the schedule-and-pricing leaves for the type's dedicated variant. Provodnik can do the same with one `ListingEditor` shell + a `SECTIONS_BY_TYPE` map + a handful of type-specific leaf components (`TourDaysEditor`, `TransferPickupEditor`, `ExcursionScheduleEditor`). Don't build three separate editors — build one and branch.
