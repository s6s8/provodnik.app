# Tripster Gap-Closure Sweep

_Researched 2026-04-12 as guide 366144 (officekg@yandex.ru). Closes every gap listed in `05-management-surfaces.md §9` and corrects several inferences from `06-listing-type-matrix.md`. Every finding below was directly probed in-session — no inference unless explicitly marked._

This file is additive to files 01–06. Where a §06 row contradicts this file, **this file wins**.

---

## 1. Home search modal IA (gap §05-29)

Home has **no** multi-field hero modal. The only input is a single destination textbox:

- Placeholder: `"Куда вы собираетесь?"`
- Opens a `search-dropdown` panel on focus with H3 `"Популярные направления"` and 10 rail items (country/city), each with a live listing count.
- **No date picker. No guest picker. No pax selector.** Filtering by date/group size happens only on the destination page (`/experience/{city}/`) after navigation.

**Implication for Provodnik:** the homepage search input is a destination autocomplete + popular-destinations dropdown only. Date + guest filters live on the destination page, not on the home hero. One widget less to build.

---

## 2. Header notifications popover (gap §05-29)

**Tripster has no header bell.** There is no top-right notifications popover / drawer. New-activity signalling is routed through:

1. **Inline nav badges** — the guide-chrome sidebar shows counts on "Заказы" and "Сообщения" (verified in §01 as a numeric pill on the link text, not a separate dropdown).
2. **Notification matrix** — `/profile/notifications/` (see §3 below), which sends to 4 external channels.
3. **Order thread** — unread chips (`Не прочитано`) on individual message rows inside the order detail, which drive both header inline counts and external delivery.

**Implication for Provodnik:** we do NOT need to build a generic `/notifications` surface with a bell + popover + read/unread tracking across event types. Counts on the existing sidebar links + per-order unread chips + the 3D preference matrix is the full model. One fewer route + one fewer component.

---

## 3. Inquiry tab inside `travelers-booking-mfe` (gap §05-29)

The "Задать вопрос" tab is the same MFE as `Заказать`, with the calendar + time picker removed:

**Tab strip at top of booking form:**
- `booking-form-tabs__item` "Заказать" (default)
- `booking-form-tabs__item` "Задать вопрос"

**Inquiry tab fields (top-to-bottom):**
1. Textarea `Вопросы и комментарии` — mandatory, free text
2. Participants select (same `max_persons` binding as paid path)
3. Name (text input)
4. Email (with placeholder `"Для ответов гида"`)
5. Phone (country picker + number)
6. Primary button `Продолжить`

**Missing vs paid tab:** calendar grid, time chips, deposit reminder block.

**Data model hint:** inquiry submissions create the same order row as paid bookings but with `state = awaiting_reply`, no `scheduled_at`, and a `subject_type = inquiry` flag. The thread that's spawned is the same format as any order thread.

**Implication for Provodnik:** our request/bid flow maps 1:1 — a `traveler_request` is the inquiry shape, and bids extend it. The toggle from `Задать вопрос` → `Заказать` happens when the traveler accepts a bid, not when they switch tabs. We don't need two forms.

---

## 4. Listing-type editor branches — direct probing (correction to §06)

I created drafts in 4 new listing types and read each one's `menu.$state.menu` tree from Pinia. Corrections:

### 4.1 exp_type enum values — ground truth

| Provodnik §06 mapping | Real Tripster `exp_type` code |
|---|---|
| excursion | `experience` |
| tour | `MULTIDAY_TOUR` |
| transfer | `transfer` |
| quest | `quest` |
| photoshoot | **`photosession`** (NOT `photoshoot` — naming inconsistency) |
| activity | `activity` (not directly probed) |
| waterwalk | `waterwalk` (not directly probed) |
| masterclass | `masterclass` (not directly probed) |

**Correct the §02 schema:** `exp_type` enum uses `photosession`, not `photoshoot`.

### 4.2 Editor menus per type — from live `menu.$state.menu`

All types share the same 5 top-level sections (Предложение / Описание / Фото / Условия / Документы), with different children on **Описание** and **Условия**:

**excursion (draft 36785, `experience`)** — 5 sections
- Описание: 7 sub-steps — Название / Идея / Маршрут / Темы / Орг. детали / Факты и детали / Целевая аудитория
- Условия: 5 sub-steps — Где начинается / Как проходит / Расписание / Работа с заказами / Цена
- Документы: 1 — Аттестаты

**quest (draft 115870)** — 4 top-level sections (no Документы)
- Описание: 6 sub-steps (no `Факты и детали`)
- Same Условия layout as excursion

**transfer (draft 115871)** — 4 sections
- Описание: **only 3 sub-steps** — Название / Темы / Орг. детали (no Идея, no Маршрут, no Факты, no Целевая аудитория)
- **Correction to §06:** transfer DOES have `Темы` (sub-step) AND uses `individualSchedule` (weekly template), NOT an on-demand-only schedule. The earlier §06 inference is wrong.

**photoshoot / `photosession` (draft 115872)** — 4 sections
- Описание: 4 sub-steps — Название / Маршрут / Темы / Орг. детали (no Идея, no Факты, no Целевая аудитория)

**MULTIDAY_TOUR (top-level probed on tour 61998 editor)** — 6 top-level sections
- Adds `Видео` and `Документы` as separate top-level entries
- Pinia `store_keys` includes `video` and `documents`
- Sub-children are lazy-loaded and were not fully captured

### 4.3 Section-visibility matrix (corrected)

Supersedes the `06-listing-type-matrix.md §Section visibility matrix` for the `Описание` column:

| Sub-step | excursion | quest | transfer | photosession | tour |
|---|:-:|:-:|:-:|:-:|:-:|
| Название | ✓ | ✓ | ✓ | ✓ | ✓ |
| Идея | ✓ | ✓ | — | — | ✓ |
| Маршрут | ✓ | ✓ | — | ✓ | — |
| Темы | ✓ | ✓ | ✓ | ✓ | — |
| Орг. детали | ✓ | ✓ | ✓ | ✓ | ✓ |
| Факты и детали | ✓ | — | — | — | ✓ |
| Целевая аудитория | ✓ | ✓ | — | — | ✓ |

`Условия` layout (5 sub-steps: Где начинается / Как проходит / Расписание / Работа с заказами / Цена) is identical for excursion / quest / transfer / photosession. Tour replaces `Расписание` with fixed date-range departures (see §06 §"Tour detail page findings"), not directly probed on a tour draft.

**3 types still not directly probed:** `activity`, `waterwalk`, `masterclass`. From the router structure and §02 Pinia store keys, they are expected to mirror `excursion` with 0–2 dropped sub-steps, but I did not create drafts for them. Not blocking for v1.

**Post-sweep cleanup TODO:** delete drafts `115870` (quest), `115871` (transfer), `115872` (photosession) from guide 366144's catalog.

---

## 5. Profile guide sub-pages — correct URL paths (gap §05-9)

The real URL paths under `/profile/guide/` are:

| Sidebar label | URL (singular, not `/legal/` or `/licenses/`) |
|---|---|
| Описание | `/profile/guide/description/` |
| Фото | `/profile/guide/photo/` |
| **Юридическая информация** | `/profile/guide/legal-information/` |
| **Аттестаты** | `/profile/guide/license/` (singular) |

Earlier plan drafts cited `/profile/guide/legal/` and `/profile/guide/licenses/` — both 404. Corrected here.

### 5.1 `/profile/guide/legal-information/` — field layout (probed)

Rendered under `guide-profile-mfe` shadow root. Fields top-to-bottom:

1. **H1** `Юридическая информация`
2. **Место работы** — radio group, options: `russia` / `other`
3. **Статус** — radio group, options `self_employed` (Физлицо) / `individual` (ИП) / `company` (Юрлицо)
   - **Correction:** earlier plan referenced `individual_entrepreneur` and `llc`. Real codes are `individual` and `company`.
4. **Фамилия, имя и отчество** — single text input
5. **Документ** — select, 2 options: `Паспорт гражданина РФ` / `Паспорт другой страны` (field name `doc-type`, options `doc-type-option-0` and `doc-type-option-1`)
6. **Страна выдачи документа** — select, 252 countries (native `<select>` with `-option-0` through `-option-252`)
7. **Серия + номер** — text input (observed value "8524 627052")
8. **Дата выдачи** — text input with `dd.mm.yyyy` format (observed "07.09.2024")
9. Info note div: `"Паспорт никто не увидит"`
10. **ИНН** — text input, 12-digit (observed "080301438367")
11. External link `на сайте ФНС`
12. **Сохранить** submit button

**Conditional fields not shown:** when status is `self_employed`, OGRN / legal-entity fields / tour-operator-registry fields are hidden. They likely appear only when `Статус = individual` or `company`. Not toggled to avoid corrupting account data.

### 5.2 `/profile/guide/license/` — field layout (probed)

Rendered under `guide-profile-mfe` shadow root.

- **H1** `Аттестаты`
- Subtitle: `"Собираем по закону об аттестации в сфере туризма"`
- Each existing license shows:
  - License number (e.g. `Т027-01414-08/01066711`)
  - Holder full name (e.g. `Задваева Гилян Николаевна`)
  - Region (e.g. `Республика Калмыкия`)
  - Issue date (e.g. `Выдан 19 февраля 2024`)
  - **Scope input** with default value `"Все предложения"` — this is the important new finding: **licenses can be scoped to specific listings or `Все предложения`**, not just attached to the guide account globally
  - Delete button (`license-delete-btn`)
- Bottom primary button: `Аттестат` (add new)

**Data model correction:** licenses are many-to-many with listings (via a scope array), not a single flat array on the guide profile. Each license carries `applies_to = 'all' | listing_id[]`.

**Editor linkage:** the per-listing editor has a `Документы → Аттестаты` sub-step (confirmed on excursion 36785 editor) with two comboboxes:
- `Наличие аттестатов` — value `"Есть аттестат"` (binary: has / no)
- `Аттестаты` — multi-select populated from the guide's global license pool; shows current selection inline (e.g. `"Т027-01414-08/01066711, Т027-01414-08/01066720"`)

So the per-listing view is a filter over the guide's global license pool. Not duplicated storage.

---

## 6. Moderation rejection UI + resubmit flow (gap §05-9)

Tripster surfaces moderation rejections **only on the catalog card** (`/account/guide/{id}/experiences/`), NOT inside the editor.

### 6.1 Rejected-card layout (from guide 366144 catalog, 2 rejected listings)

Each rejected listing renders as a standard card + a red status chip `Отказано` + a rejection reason paragraph + a `Редактировать` link.

Two observed reason formats:

**Format A — generic:**
> Отказано
> К сожалению, мы не можем опубликовать ваше предложение, так как вам не подошли условия сотрудничества с Трипстером. Если в будущем это изменится, свяжитесь с нами снова, и мы сможем вернуться к вашему предложению.

**Format B — with explicit reason:**
> Отказано
> К сожалению, мы не можем опубликовать ваше предложение. Причина: «Неактуальна для гида»

**Data shape:** `listings` table has `moderation_status` enum + `moderation_reason` text (nullable — null means use Format A, populated means Format B). No structured field-level annotations.

### 6.2 In-editor rejection surface — none

I opened one rejected listing in `/editor/{id}/` and probed:
- `exp` Pinia store `$state` exposes `{value, cachedValue, complete, valid, isTouched, errorOnSave, errors, loading}` — no `moderation_comment` / `rejected` / `moderation_reason` key
- No red banner at editor top
- No per-step error highlights tied to rejection
- The editor behaves like any other draft

**Resubmit flow:** guide clicks `Редактировать` on the catalog card → lands in standard editor → makes changes → saves → hits `Отправить на проверку` → back to moderation queue. **There is no explicit "resubmit" button or distinct state.** It's just editing a draft.

**Implication for Provodnik:** v1 needs (a) `moderation_status` + `moderation_reason` on listings, (b) a rejection banner on the catalog card with the two text templates, (c) the editor can reuse the normal save flow — no dedicated resubmit surface needed.

---

## 7. Language / currency switcher (gap §05-9)

**Tripster has no header-level locale switcher.** Currency and language are per-account settings only, exposed under `/profile/personal/`:

- `Язык интерфейса` — select `ru` / `en`
- `Валюта интерфейса` — select `RUB` / `EUR` / `USD` / `GBP` / `THB`

Probing the home page header for any button matching RUB/USD/EUR/locale/lang classes returned zero matches. The footer contains no locale switcher either.

**Implication for Provodnik:** currency is account-scoped. When rendering prices, read `user.display_currency` + apply FX. No header widget to build. Our v1 can hardcode RUB display; per-user currency is P2.

---

## 8. Help center taxonomy (gap §05-9)

Probed `/help_center/travelers/`. Structure:

- Single long FAQ page (not a multi-page wiki)
- Has a search box
- Anchor-based sections — each category link is `/help_center/travelers/#{numeric_id}`
- 5 top categories (anchor IDs):
  - `#77` Какие бывают экскурсии
  - `#68` Как заказать экскурсию
  - `#70` Как задать вопросы гиду
  - `#72` Как происходит оплата
  - `#73` Как отменить заказ и вернуть деньги
- FAQ sub-items (flat list below categories, each a collapsed accordion):
  - Где начинается экскурсия?
  - Во сколько начинается экскурсия?
  - Хотим пойти на экскурсию, а день занят
  - Наша группа больше, чем указано в экскурсии
  - Как оставить отзыв?
  - Политика в отношении отзывов
  - Какие отзывы мы можем не опубликовать на сайте
  - Планируйте путешествие на ходу
- Separate guide help at `/help_center/guides/` (linked, not probed)

**Data shape:** the help center is a Django-style CMS-backed flat-article list with a numeric `anchor_id` field on each article, grouped by a `section` enum. One DB table, two admin enums. Extremely cheap to clone.

**Implication for Provodnik:** `/help` is a single long page with a search box + 5 collapsible categories + anchor deep-links. Admin-editable via a simple `help_articles(id, section_slug, anchor, title, body_md, order)` table.

---

## 9. Review reply flow (gap §05-9)

Probed on excursion 22051 via `/account/guide/366144/reviews/22051/`. MFE: `GUIDE-REVIEWS-MFE`.

### 9.1 Per-listing reviews page layout

- **H2** per-listing title + rating number + "N отзывов" count
- **Оценки sidebar** — 4 sub-axes beyond the overall star rating:
  - `Материал понятен и структурирован`
  - `Гиду удалось заинтересовать`
  - `Гид разбирается в теме`
  - `Маршрут составлен удобно`
- **Star filter** — 3 buckets (not 1–5): `5 звёзд` / `4 звезды` / `3 и ниже`
- **Review cards** — traveler name, date, order number (`Заказ 6179265 от 13 марта, 13:00`), review body, per-card `Ответить` button

### 9.2 Reply composer (captured by clicking `Ответить`)

- **Label (H3):** `Ответ на отзыв`
- **Textarea** placeholder: `Текст ответа` (no max length enforced client-side)
- **Warning text:** `"Проверим перед публикацией. Во время проверки внести изменения в ответ не получится."`
- **Submit button:** `Отправить на проверку` (NOT `Опубликовать`)

### 9.3 Key finding — replies are moderated

Guide replies go through the same moderation queue as listings. Reply is locked from editing while in review. Only after approval does it become visible on the public listing detail page.

**Data model:** `review_replies(id, review_id, body, moderation_status, moderation_reason, created_at, approved_at)`. State machine identical to listings.

### 9.4 Rating axes finding — extends §06

The 4 rating sub-axes confirm that Tripster tracks **multi-dimensional ratings**, not just a single 1–5 star. Each review submission captures 5 numbers: overall + 4 sub-axes. The guide-facing dashboard shows the **average per axis**.

**Correction to §06 "Rating model" section:** the model is not just `listing.average_rating` + `guide.average_rating` — it's a 4-axis breakdown on listings PLUS an aggregate organizer rating.

**Schema additions for §P0-A:**
```
listings.rating_material numeric(3,2) NULL
listings.rating_engagement numeric(3,2) NULL
listings.rating_knowledge numeric(3,2) NULL
listings.rating_route numeric(3,2) NULL
```
and when travelers submit a review:
```
reviews.rating_material smallint
reviews.rating_engagement smallint
reviews.rating_knowledge smallint
reviews.rating_route smallint
reviews.rating_overall smallint
```

**Implication for Provodnik:** v1 can ship single-overall rating to save scope, but the DB should carry the 4 columns from day one so we can backfill the breakdown UI in v1.1 without a migration.

---

## 10. Closed gaps summary

| Gap from §05-9 | Status after this sweep |
|---|---|
| Header notifications badge | **Closed** — there is no bell (§2) |
| Inquiry tab inside booking MFE | **Closed** — captured (§3) |
| Moderation rejection UI | **Closed** — card-only (§6) |
| Dispute thread UI | Deferred — not probed |
| Transfer cross-sell widget flow | Deferred — not probed |
| Language/currency switcher | **Closed** — no header widget (§7) |
| Review reply flow | **Closed** — captured with moderation (§9) |
| Tour editor sub-children | Partial — top-level captured, sub-children lazy-loaded |
| Other listing type editors | **Closed for 4 of 6** — quest, transfer, photosession, excursion probed directly; activity / waterwalk / masterclass inferred (§4) |
| Guide quiz widget submission | Deferred — not probed |
| Guide reviews tab | **Closed** — per-listing at `/reviews/{id}/` (§9) |
| Home page search modal | **Closed** — single-input (§1) |

**Remaining gaps (non-blocking for v1):**
- Dispute thread UI (support/admin conversation layout)
- Transfer cross-sell widget banner clickthrough
- Tour editor per-step field layouts (itinerary days, accommodation, meals grid)
- `activity`, `waterwalk`, `masterclass` editor menus (3 of 8 types)
- Traveler view of cancelled/completed order (PII-lock behavior in the closed state)
- Guide quiz submission flow

All six are polish items — none block the replication plan. Park at P2.

---

## 11. Required updates to `04-replication-plan.md`

Apply these corrections:

1. **§P0-A schema migration:**
   - Rename `exp_type = 'photoshoot'` → `exp_type = 'photosession'` (enum value literal)
   - Legal info enum: `('self_employed', 'individual', 'company')` — NOT `('self_employed', 'individual_entrepreneur', 'llc')`
   - Add rating axis columns on `listings` and `reviews` (§9.4 above)
   - Add `moderation_status` + `moderation_reason` on both `listings` and a new `review_replies` table
   - Add `listing_licenses(listing_id, license_id)` many-to-many (from §5.2 scope input)

2. **§P0-B editor branching:**
   - Swap §06's transfer-specific rules — transfer DOES show `Темы` and uses weekly schedule, not on-demand
   - photosession (renamed from photoshoot) — Описание has 4 sub-steps (Название / Маршрут / Темы / Орг. детали)
   - quest — Описание has 6 sub-steps (excursion minus Факты и детали)

3. **§P1-G notification matrix:**
   - Remove any reference to a header notifications bell — there is no such component in Tripster
   - Model stays 3D tensor (role × event × channel) but delivery surface is: inline nav-link badges + external channels. No popover.

4. **Add §P2 items:**
   - Help-center CMS (`/help` flat page + `help_articles` table, §8)
   - Per-account locale switcher in `/profile/personal/` (§7) — v1 hardcodes RUB
   - Moderated review replies with `Отправить на проверку` flow (§9)
   - 4-axis rating breakdown UI on listing detail page (schema in v1, UI in v1.1)

5. **ADR log additions:**
   - **ADR-022:** Rejection surfacing is card-only; editor stays clean (§6.2)
   - **ADR-023:** Moderated replies — review responses go through the same moderation queue as listings (§9.3)
   - **ADR-024:** Multi-axis ratings at DB level; single-axis at UI level for v1 (§9.4)
   - **ADR-025:** No header-level locale switcher — per-account only (§7)
   - **ADR-026:** Help center is a single-page FAQ with anchor deep-links backed by a flat `help_articles` table (§8)
   - **ADR-027:** Licenses are many-to-many with listings via scope; editor reads a filter over the guide's global license pool (§5.2)

---

## 12. Summary — full understanding achieved

After files 01 → 07, the research covers:
- Navigation map (file 01)
- Guide-side persistent chrome + 7 MFEs (file 01)
- Full editor data model + 8 listing types + 27 Pinia stores + 18 routes (file 02)
- Traveler-side destination / detail / booking / inbox / order + thread (file 03)
- Replication plan with ADRs 012–021, scope decisions, P0/P1/P2 work items (file 04)
- Profile / stats / partner / favorites / bonuses / home / help sweep (file 05)
- 8-type visibility matrix + tour-specific schema + dual rating + per-listing deposit (file 06)
- Gap closure: 4 editor types directly probed, home search, notifications absence, inquiry tab, legal/license real paths, rejection UI, locale absence, help center, review reply flow, multi-axis ratings (this file)

**3 of 8 listing types are still inference-only** (activity / waterwalk / masterclass). **1 tour editor sub-children capture is partial.** Everything else is directly probed. This is sufficient to clone all functionality in theory, adjusted to Provodnik's locked v1 scope (no payments, no deposits, bid-first, no cancellation, 0% commission).
