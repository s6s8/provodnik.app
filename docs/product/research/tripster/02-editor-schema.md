# Tripster Editor — Full Listing Schema

_Researched 2026-04-11 by creating draft ID 115859, walking the Vue router, and reading Pinia store state directly. Draft deleted after mapping. This is the complete data model Tripster uses for a listing._

## Top-level editor structure

Unified editor at `/editor/` (redirects to `/editor/{id}/experience/` after draft creation). Vue 3 SPA. Sidebar navigation changes based on completion state and listing type.

### Full Vue router route tree (from `router.getRoutes()`)

```
/:id(\d+)?/
  /experience/                      — Type + Format picker (entry)
  /description/
    /title/                         — Title (100 chars)
    /idea/                          — Idea / hook (textarea)
    /route/                         — Route description (textarea)
    /theme/                         — Topics covered (textarea)
    /org-details/                   — Cost, equipment, meals, restrictions, transport (textarea)
    /facts/                         — Optional: 2-3 hooks (textarea)
    /audience/                      — Optional: target audience (textarea)
  /photo/                           — 6–25 photos, min 1350×1350, jpg/png
  /conditions/
    /where-begin/                   — City + meeting point
    /how/                           — Duration, languages, movement, age, max persons
    /schedule/                      — Weekly recurring availability template
    /order-details/                 — Booking cutoff, event span, instant booking
    /price/                         — Pricing model, price, tariffs, discounts, adjustments
```

Step 1 asks two things and creates the draft row:

### Step 1: Type (`exp_type`) — 8 enum values
| Code | Russian | English |
|---|---|---|
| `experience` | Экскурсия | Tour/walk with guide narration |
| `MULTIDAY_TOUR` | Многодневный тур | Multi-day programme |
| `activity` | Активный отдых | Trekking, rafting, horseback |
| `waterwalk` | Водная прогулка | Yacht/boat trip |
| `quest` | Квест | Interactive storyline + tasks |
| `transfer` | Трансфер | Transport with/without guide |
| `masterclass` | Мастер-класс | Hands-on with a master |
| `photoshoot` | Фотосессия | Walk/tour with photoshoot |

### Step 1: Format (`exp_format`) — 2 values
- `individual` ("Индивидуальный") — one party of known people (friends, family, coworkers)
- `group` ("Групповой") — mixed strangers

→ Creates a `draft` row immediately and redirects to `/editor/{id}/experience/`.

## Pinia stores — complete inventory

The editor has **27 Pinia stores**. Reading their `$state` revealed the full API contract:

```
user              guideInfo           experience          menu
photo             meta                exp                 description
descriptionTitle  descriptionIdea     descriptionRoute    descriptionTheme
descriptionOrgDetails                 descriptionFacts    descriptionAudience
conditions        conditionsWhereBegin                    conditionsHow
individualSchedule                    orders              individualPrice
scheduleDuration  individualExtraSlots                    tariffsStore
discountStore     changePriceStore
```

## Master listing record (`exp.$state.exp` from draft 115859)

```jsonc
{
  "id": 115859,
  "exp_type": "private",           // Hmm — draft mode mapped to "private". On save this becomes experience|MULTIDAY_TOUR|... 
  "exp_format": "experience",      // individual vs group
  "title": "…",                    // <= 100 chars
  "status": "draft",               // draft | published | paused | rejected
  "guide_license_required": false,

  // === Description block ===
  "idea": "…",                     // textarea
  "route": "…",                    // textarea
  "theme": "…",                    // textarea
  "details": "",                   // optional "facts"
  "audience": "",                  // optional
  "annotation": "",                // short teaser (autogen?)
  "description": "",               // full description (autogen?)
  "tagline": "",                   // short line
  "org_details": "…",              // cost/equipment/meals/restrictions/transport

  // === Photos/videos ===
  "photos": [], "videos": [],
  "are_photos_legal": false, "are_videos_legal": false,  // copyright checkboxes

  // === City + meeting point ===
  "city": null,                    // cityId FK
  "is_meeting_point_set": true,
  "meeting_point_approx_text": "", // for "по договоренности"
  "meeting_point_text": "",        // user-entered address
  "meeting_point_location": null,  // {lat, lng} — map pin

  // === How it's conducted ===
  "duration": null,                // 0.5h - 13h (enum code)
  "languages": [1],                // array of lang IDs
  "movement_type": null,           // enum code (see below)
  "children_allowed_age": 0,       // 0=No, 1=any, 2=3+, 3=6+, 4=10+, 5=14+
  "max_persons": null,             // integer cap

  // === Schedule ===
  "schedule": {"slots":[], "fixed":[], "range":[], "events":[]},
  "schedule_type": "weekly_range", // or fixed date list
  "schedule_duration": 180,        // days window: 30/60/90/120/150/180
  "extra_slots": [],               // one-off exceptions

  // === Orders / booking config ===
  "instant_booking": false,        // requires ≥5 completed orders to enable
  "close_registration_before": 120,// minutes cutoff: 60-3600
  "is_close_registration_type_hour_before": null,
  "event_span": 0,                 // buffer between consecutive runs: 0/30/60/90/120 min

  // === Pricing ===
  "pricing_model": "per_group",    // per_group ("За всё") | per_person ("За человека")
  "price": null,                   // primary price
  "minimal_price": null,           // lower bound (shown in catalog)
  "currency": "EUR",               // RUB/EUR/USD/GBP/THB
  "tickets": [],                   // array of tariff tiers
  "total_commission_rate": 0.22,   // 22% platform commission
  "commission_rate": 0.22,
  "discount_rate": 0,
  "discount_expiration_date": null,
  "price_adjustment_data": [],     // seasonal rules

  // === Legal (pulled from guide account, not per-listing editable) ===
  "guide_legal_info": {
    "work_country": "russia",
    "legal_name": "…",
    "entity_type": "self_employed", // also: individual_entrepreneur, llc, etc.
    "inn": "…",
    "ogrn": null,
    "passport_number": "…",
    "passport_issue_date": "…",
    "legal_country": "russia",
    "license_required": true
  },
  "guide_legal_licenses": [
    {
      "number": "…",
      "type": "guide",
      "is_validated": true,
      "subject_name": "…",
      "issue_date": "…",
      "region": "…",
      "photos": [],
      "is_selected": false
    }
  ],

  "under_update_sections": [],     // which sections are pending moderation
  "intermediate_data": null
}
```

## Enumerated metadata (from `meta.$state.meta`)

Every enum below is server-provided — the editor loads them once and renders dropdowns.

### `duration` (tour length)
0.5h, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10, 11, 12, "больше 12 часов" (13=">12h")

### `close_registration_before` (cutoff for new bookings, minutes)
1h, 2h, 3h, 4h, 5h, 6h, 7h, 8h, 9h, 10h, 11h, 12h, 18h, 1 day, 1.5 days, 2 days, 2.5 days

### `event_span` (buffer between consecutive runs)
0 (no buffer), 30min, 1h, 1.5h, 2h

### `movement_type` — 24 options
| Code | Label |
|---|---|
| 2 | Пешком |
| 3 | На автомобиле |
| 5 | На автобусе |
| 4 | На велосипеде |
| 10 | На самокате |
| 6 | На мотоцикле |
| 11 | На квадроцикле |
| 12 | Верхом |
| 7 | На кораблике |
| 19 | На катере |
| 18 | На яхте |
| 13 | На теплоходе |
| 14 | На лодке |
| 15 | На каяке |
| 16 | На сапе |
| 17 | На сёрфе |
| 20 | На гидроцикле |
| 21 | На шаре |
| 22 | На параплане |
| 23 | На самолёте |
| 24 | На вертолёте |
| 9 | В помещении |
| 8 | В музее |
| 1 | Другое |

### `children_allowed_age`
0=Нет, 1=Любого возраста, 2=от 3 лет, 3=от 6 лет, 4=от 10 лет, 5=от 14 лет

### `languages` — 19 options
Русский, Английский, Китайский, Французский, Итальянский, Немецкий, Испанский, Иврит, Датский, Голландский, Латышский, Норвежский, Польский, Сербский, Турецкий, Украинский, Чешский, Шведский, Португальский

### `schedule_duration` (how many months ahead the calendar is open)
30, 60, 90, 120, 150, 180 days

### `currencies` — 5 options
RUB ₽, THB, GBP £, EUR €, USD $

### `tariffs` — pre-defined tier names
Пенсионеры, Студенты, Школьники, Дети до 18 лет, Дети до 16 лет, Дети до 12 лет, Дети до 7 лет (plus custom names).

### `instant_booking`
- `instant_booking_enable_limit: 5` — guide needs ≥5 completed orders before it can be toggled on. Below that, the control is hardcoded off.
- `guides_finished_orders` — live counter shown to the guide

### `photo_info`
- `min_count: 6`
- `min_dimensions: [1350, 1350]`

### `video_info`
- `max_count: 1`

## Meeting point model (`conditionsWhereBegin`)

```jsonc
{
  "value": {
    "cityId": null,              // FK to cities table
    "isMeetingPointSet": true,
    "approxText": "",            // "description of area" for flexible
    "locationText": "",          // exact address label
    "location": null             // {lat, lng}
  },
  "meetingPlaces": [
    { "code": "fixed", "text": "Фиксированное" },
    { "code": "approx", "text": "По договоренности" }
  ]
}
```

→ Two meeting-point modes: `fixed` (exact pin on map) or `approx` (agreed with traveler in chat).

## Schedule model (`individualSchedule`)

```jsonc
{
  "value": [
    {"index": 1, "label": "Пн", "from": "", "to": "", "isValid": true},
    {"index": 2, "label": "Вт", "from": "", "to": "", "isValid": true},
    // ... 7 days
  ],
  "options": ["08:00", "08:30", ..., "07:30"]  // 48 slots, 30-min granularity
}
```

**Model**: one recurring weekly template. Each day has a single `from`/`to` window. Days without times are unavailable. `extra_slots` holds one-off overrides (vacations, extra dates outside the weekly pattern).

## Pricing model (`individualPrice`, `tariffsStore`, `discountStore`, `changePriceStore`)

### Pricing types
```jsonc
[
  { "value": "per_group",  "text": "За всё" },       // flat price for the whole group
  { "value": "per_person", "text": "За человека" }   // price × headcount
]
```

### Primary price + minimal price
- `price` — what the traveler pays for 1 person (or the whole group)
- `minimalPrice` — lower bound shown in catalog ("from N ₽") when tariffs vary

### Tariffs (tier rows)
```jsonc
{
  "name": "Стандартный",
  "price": null,
  "errors": { "duplicate": false, "emptyPrice": false, "emptyName": false },
  "guid": "uuid",
  "isTouched": false
}
```
Guide can add multiple tariffs (e.g. adult / child / student). Tariff names can be picked from the pre-defined list or custom.

### Discounts
```jsonc
{
  "discountRate": 0,               // percent
  "discountExpirationDate": null,  // date-based
  "discountCommissionRate": 0      // platform takes a different cut on discounted rows
}
```

### Price adjustments (seasonal rules)
```jsonc
{
  "priceAction": "down",           // down | up | normal
  "adjustmentActionOptions": [
    { "type": "down",   "name": "Снизить" },
    { "type": "up",     "name": "Повысить" },
    { "type": "normal", "name": "Установить стандартную" }
  ],
  "priceAdjustmentData": {
    "date_end":   "2026-10-11",
    "date_start": "2026-04-11",
    "days": []                     // weekday mask
  }
}
```

→ Guide can set rules like "raise by 20% on weekends in July", "lower by 15% on weekdays in low season", "reset to standard on this date range".

### Commission
- Default 22% (`total_commission_rate: 0.22`)
- Separate commission applies to discounted rows
- Promotion feature (Phase 3 tab) stacks an extra % on top

## Order config (`orders.$state`)

```jsonc
{
  "instantBooking": false,         // locked below 5 completed orders
  "eventSpan": 0,                  // minutes buffer between runs
  "closeRegistrationBefore": 120   // minutes cutoff before start
}
```

## Photo store (`photo.$state`)

```jsonc
{
  "value": [],                     // uploaded files
  "previewFiles": [],              // staged files pending upload
  "photosFromServer": [],          // persisted URLs
  "arePhotosLegal": false,         // mandatory checkbox — guide indemnifies platform for copyright
  "errors": { "preview": false, "arePhotosLegal": false }
}
```

Upload validation: 6–25 files, 20 MB each, 1350×1350 minimum.

## Key architectural takeaways for Provodnik

1. **One editor for 8 listing types** — the form adapts to type via sidebar visibility (no Видео/Документы for `experience`, both shown for `MULTIDAY_TOUR`). We can copy this: one `/listing/editor/{id}` route with conditional sections.

2. **Mandatory step gate** — Vue router guard blocks navigation to an unfilled section. Guide cannot skip around. This forces data completeness for moderation — adopt it.

3. **Schedule is a separate store** from the listing — `individualSchedule` + `extra_slots` is one model, `calendar` (the guide-wide tab) is a view of the merged availability of all listings. Don't store slot data inside the listing row.

4. **Tariffs as separate rows, not JSON columns** — `tariffsStore` holds an array with per-row errors, uuids, touched state. Each tariff is a separate DB row keyed to the listing.

5. **Seasonal price adjustments as rules, not overrides** — `priceAdjustmentData` is a rule set (date range + weekday mask + action type + percent), applied at booking time. Don't materialize every future date with a custom price.

6. **Instant booking as reputation gate** — ≥5 completed orders required. Similar mechanism maps well to our "verified guide" gating of auto-confirm.

7. **Meeting point as fixed vs approximate** — two modes from day one; approximate mode relies on chat to finalize. For our bid/request flow this is a natural fit.

8. **Commission at 22%** is the market signal. Competitive pricing — but note they stack additional commission on discounted rows and promoted rows, which is how the free promotion pitch works economically.

9. **Photo copyright checkbox with explicit fine warning** (~10,000 ₽/photo) — legal shield for the platform. Add to our upload flow.

10. **Guide legal info lives on the guide account**, not per listing. Lists of licenses are picked at listing creation time (`is_selected` per license). This matches our guide verification model.
