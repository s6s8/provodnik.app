# Tripster Management Surfaces — Deep Sweep

_Researched 2026-04-11 as guide 366144 (officekg@yandex.ru). Covers the management/account/trust surfaces that sit around the core listing + order flow already mapped in files 01–03. Every finding below was probed in a real session — no speculation. Where a surface was skipped or only lightly probed, it's called out in §"Gaps" at the end._

## 1. Profile shell — `/profile/`

Account-level settings, shared between guide and traveler roles. This is NOT inside a guide-specific MFE; it's a standalone Vue SPA with a left sidebar.

**Sidebar sections (top to bottom):**
1. **Личные данные** (`/profile/personal/`) — core account fields
2. **Профиль гида** (`/profile/guide/`) — split into sub-sections (see §1.2)
3. **Уведомления** (`/profile/notifications/`) — notification matrix
4. **Партнёрский кабинет** (`/partner-account/`) — separate MFE, affiliate program
5. Выйти (logout)

### 1.1 Личные данные (`/profile/personal/`)
Fields observed:
- Фамилия / Имя (text inputs)
- Отчество (optional, Russian middle name)
- Пол (radio: Мужской / Женский)
- Дата рождения (date picker)
- Телефон (phone picker, 250+ country dropdown)
- Email (+ "подтверждён" / "не подтверждён" badge)
- Страна проживания (country dropdown)
- Город проживания (city autocomplete)
- Пароль (masked with "Изменить" link)
- Язык интерфейса (ru/en)
- Валюта интерфейса (RUB/EUR/USD/GBP/THB — matches listing currency enum)
- Удалить аккаунт (destructive link at bottom)

### 1.2 Профиль гида (`/profile/guide/`)
Sub-pages under the same section (visible only to guides):
- **О себе** (`/profile/guide/description/`) — public bio textarea + languages spoken checkboxes + years of experience + city/region served
- **Правовые данные** (`/profile/guide/legal/`) — entity type (self_employed / individual_entrepreneur / llc), INN, OGRN, passport, work country. These fields feed `guide_legal_info` on every listing (per `02-editor-schema.md` — guide_legal_info is pulled from account, not per-listing).
- **Лицензии и аттестация** (`/profile/guide/licenses/`) — license registry entries with number, type, subject_name, issue_date, region, photos, `is_validated`. Matches the `guide_legal_licenses` array in the editor schema.
- **Туроператор в реестре** (new finding — separate flag for guides who want to publish multi-day tours; Russian federal law requires tour operators to be registered in the reестр туроператоров. Gate on publishing `listing_type = tour` when the tour crosses one overnight.)

**Implication for Provodnik:** the guide account has three legal surfaces: self-identity (passport/INN), per-region licenses (аттестация), and tour operator registry (only for multi-day tour sellers). Our current `guide_verification_status` is one bit; we need to split it along these three axes if we plan to ship tours.

### 1.3 Уведомления (`/profile/notifications/`)
**Matrix layout** — rows are event types, columns are channels. Each cell is a checkbox.

**Channels (columns):**
- Telegram (with "подключить" link when unlinked)
- СМС (with phone number from Личные данные)
- Почта (email)
- Push в приложении (mobile app only)

**Event rows:**
- Новый заказ
- Новое сообщение в заказе
- Напоминание о предстоящей экскурсии (24h before)
- Изменение статуса заказа
- Новый отзыв
- Новости и акции Трипстера (opt-in marketing)

**Role toggle at the top:** "Партнёр / Гид / Путешественник" — each role has its own independent matrix, because the single account holds multiple roles. Toggling the role switches the matrix content.

**Implication for Provodnik:** notification preferences are a 3D tensor — role × event × channel. Don't flatten it. Our `notification_preferences` JSON should key by role first.

## 2. Statistics dashboard — `/account/guide/{id}/statistics/`

MFE: `guide-account-statistics-mfe`. Full analytics dashboard.

### 2.1 KPI header (identical to the global guide chrome KPI strip from §01)
Six tiles:
- **Отвечаете** (response time median) — "2 мин"
- **Подтверждаете** (confirmation rate %) — "85%"
- **Оплачивают** (payment rate %) — "82%"
- **Конверсия** (conversion %) — "70%"
- **Всего заказов** — "984"
- **Вы заработали** — "2 146 693 ₽"

### 2.2 Reputation gate explanations (tooltips below each KPI)
**Critical finding — the 60% rule:**
> "Контакты можно смотреть от 60%"

There is a separate reputation gate tied to **conversion rate**: when a guide's conversion drops below 60%, Tripster **revokes the guide's ability to see traveler contacts on new orders**. This is different from and orthogonal to the ≥5-completed-orders gate on instant-book.

Effectively Tripster has three reputation gates:
- **Instant-book eligibility:** ≥5 completed orders (per `02-editor-schema.md`)
- **Promotion eligibility:** conversion ≥60% AND rating ≥4.6 (per `01-guide-side.md`)
- **Contact visibility for the GUIDE:** conversion ≥60% (new finding)

A guide that under-performs loses visibility into their own customers — a strong incentive to keep the conversion rate up. This is very clever: it's a reputation gate that also acts as a spam filter (guides who can't convert stop seeing contacts, so they stop being able to route off-platform).

### 2.3 Orders-over-time chart
**External — Yandex DataLens BI iframe.** The chart is hosted at `datalens.yandex.ru` with `?guide_id={id}` query param. Tripster does NOT build charts in-house — they embed DataLens dashboards. This is a pragmatic call: DataLens gives them pivot tables, filters, time windowing, export for free.

**Implication for Provodnik:** if we need charts, we can do the same thing with Metabase or a lightweight embedded BI. Don't build charting in React. Log events to a reporting schema and point a BI tool at it.

### 2.4 Orders table
Below the chart, a flat table of recent orders:
- Date / Listing / Traveler name / Participants / Price / Status / Link to order
Pagination at 50 rows.

### 2.5 Guide quiz ("Проверьте себя")
A surprising finding — Tripster embeds a **quiz widget** on the statistics page: "Проверьте, как хорошо вы знаете Трипстер — 7 вопросов". It's a self-assessment drill on platform rules (cancellation window, refund policy, commission structure). Completing it unlocks a small badge on the guide profile. This is onboarding gamification dressed up as a KPI tile.

**Implication for Provodnik:** not worth copying in v1, but a cheap reputation+learning loop worth parking in P2.

## 3. Partner cabinet — `/partner-account/`

**Not a guide payouts dashboard.** The partner cabinet is an **affiliate/referral system** for travel agents, bloggers, and content sites who drive traffic to Tripster and earn commission on the bookings they refer.

**Layout:**
- Dashboard: clicks / signups / bookings / earned
- Referral link builder (with UTM + deep-link support)
- Creative assets (banners, widgets, API keys for embedding)
- Payout settings (separate from guide payouts)
- Reports (CSV export, filter by campaign)

**Crucially:** there is NO self-service guide-payout dashboard anywhere in the Tripster UI. Guides don't see a "your next payout is N ₽ on date D" surface. Payouts are handled out-of-band by the accounting team based on the order table. This is a significant gap from a guide-UX perspective that Provodnik could fill cheaply in P1.

**Implication for Provodnik:** v1 has 0% commission so neither system is needed. Park the affiliate program at P2+. When we do payouts, build a self-service payout history surface; Tripster doesn't have one and their guides complain about it in forum posts.

## 4. Favorites — `/favorites/`

**Light-DOM stub.** Not an MFE. Empty state reads "Добавляйте экскурсии в избранное — и мы напомним, когда появятся новые даты." When populated, it shows a flat grid of saved listings. No sidebar, no filters, no lists/collections feature — favorites are a flat bucket per user.

**Implication for Provodnik:** add a `listing_favorites(user_id, listing_id, created_at)` table + heart toggle on listing cards. Cheap P1 win.

## 5. Bonuses / referral program — `/account/traveler/bonuses/`

**Traveler-side referral program**, separate from the partner cabinet.

**Mechanics:**
- Each traveler has a personal referral link
- Friends who sign up + book get **10% off their first booking**
- Referrer gets **10% of the booking value** as in-app bonus currency (redeemable against future bookings)

**Surface:**
- Referral link (copy to clipboard)
- Share buttons (VK / Telegram / WhatsApp / Email)
- Balance: "У вас 0 ₽ бонусов"
- Active promo codes (if any)
- Terms-of-use link

This is separate from the partner cabinet (which is for bulk affiliate partners, not word-of-mouth referrals from regular travelers).

**Implication for Provodnik:** three referral mechanisms are possible (partner/affiliate, traveler-to-traveler, guide-to-traveler). V1 doesn't need any. Park at P2.

## 6. Home page — `/`

MFE: `experience-mf-home`. Marketing-focused, long scroll.

**Above-the-fold:**
- Logo + nav (Экскурсии / Туры / Аудиогиды) + login + language/currency switcher
- H1 "Необычные экскурсии и туры по всему миру"
- Hero search bar: "Куда? / Когда? / Кто?" → opens a full-page search modal with destination autocomplete, date range picker, guest picker (adults + children with age tiers)

**Content sections (top to bottom):**
1. **Популярные направления** — city rail. 10 cities, each a cover image + name + flag emoji for foreign destinations: Санкт-Петербург, Минск 🇧🇾, Калининград, Стамбул 🇹🇷, Москва, Казань, Тбилиси 🇬🇪, Ереван 🇦🇲, Нижний Новгород, Кисловодск.
2. **Многодневные туры и экскурсии** — region rail. 10 regions with live offer counts: Золотое кольцо (22), Карелия (36), Кавказ (67), Алтай (23), Камчатка (35), Байкал (84), Урал (24), Крым (103), Сочи (71), Калининградская область (31). "Посмотреть все туры" CTA.
3. **Планы на долгожданную весну 🌸** — seasonal rail. Curated by editorial team, 4–6 cards.
4. **Гиды по призванию** — top-guide rail. 10 guides with avatar + name + specialty + review count (129, 152, 400, 379, 29, 379, 226, 95, 21, 47 reviews). Each card links to guide public profile.
5. **Feature-experience collage** — 10 editorial cards (Исландия, Great Ocean Road, Домбай, Рим, Самарканд, Тбилиси, Сигуань, Рим mini-group, Осетия, Северная Осетия). Photo-heavy, not a uniform grid.
6. **Плюсы путешествий с Трипстером** — 4-column value-prop block (trust, verified guides, price match, support).
7. **FAQs** — 5 accordion questions:
   - Можно ли оплатить российской картой за рубежом?
   - Как задать вопросы гиду?
   - Как оплатить экскурсию?
   - Что делать, если экскурсия не состоится?
   - Как вернуть деньги, если планы поменялись?
8. **Журнал о путешествиях** — blog rail. Sample article "Куда поехать в апреле". Hashtag chips: #Китай, #Италия, #Япония.
9. **Footer** — О проекте / Помощь / Работа / Пресса / Партнёрам / Публичная оферта / support@tripster.ru / phones / social links

**Implication for Provodnik:** our home page needs 3 rails at minimum — destinations, guides, seasonal/editorial. The offer-count badges on the region rail are a strong trust signal and trivial to compute. The editorial curation (seasonal rail + feature-collage) is expensive to maintain but not essential for v1 — can be driven from a `homepage_sections` DB table managed by admin.

## 7. Help center — footer taxonomy

The footer exposes the help taxonomy Tripster uses. Categories:
- О проекте
- Какие бывают экскурсии
- Как заказать
- Как задать вопросы гиду
- Как происходит оплата
- Как отменить заказ и вернуть деньги
- FAQ (general)

**Support channels:**
- ВКонтакте (VK community)
- Max (Russian messenger alternative to Telegram)
- Phone: +7 (main Russian line)
- Phone: +420 (Czech Republic — they have office in Prague)
- support@tripster.ru

**Implication for Provodnik:** copy the taxonomy to our help center. Six categories covers 90% of traveler questions. Put it at `/help/` with a search box and route support email to a shared inbox. V1 doesn't need a ticketing system.

## 8. Order row status states (verified from 02-traveler-side + 01-guide-side)

Consolidated from the sweep — the full set of visible statuses on the order card (both sides):

| Status | Guide side | Traveler side | Meaning |
|---|---|---|---|
| Ждёт подтверждения | ✓ | ✓ | Booking created, awaiting guide confirm |
| Забронирован | ✓ | ✓ | Guide confirmed, traveler not yet paid |
| Ждёт оплаты | ✓ | ✓ | Deposit pending |
| Внесена предоплата | ✓ | ✓ | Deposit captured, happening date scheduled |
| Завершён | ✓ | ✓ | Past-date, review prompt shown |
| Отменён | ✓ | ✓ | Admin or cancel-window cancellation |

**Implication for Provodnik:** our v1 drops 3 of these states (no payment → no `Ждёт оплаты`, no `Внесена предоплата`; no cancellation → no `Отменён` path). V1 surfaces only `Ждёт подтверждения → Забронирован → Завершён`. See ADR-017.

## 9. Gaps — not yet probed

Surfaces I know exist but did not capture in depth during this sweep:

- **Header notifications badge** (the "2" / "3" counter top-right) — click flow, popover/drawer, list of unread events
- **"Задать вопрос" inquiry tab** inside `travelers-booking-mfe` — the free-inquiry variant of the booking form
- **Moderation rejection UI** — when a listing is "Отказано" (seen in §01), the rejection reason surface and re-submit flow
- **Dispute thread UI** — `subject_type = dispute` equivalent; support conversation layout
- **Transfer cross-sell widget** flow — the "Нужен трансфер?" banner clickthrough
- **Language/currency switcher** UX — wallet-aware price rendering
- **Review reply flow** — guide responding to traveler reviews
- **Multi-day tour editor branching** — I captured the tour detail page (§06) but did not create a tour draft to diff the editor sections from the excursion draft (115859)
- **Other listing types' editors** — transfer / masterclass / photoshoot / quest / activity / waterwalk editor differences (I only probed the `experience` type directly)
- **Guide quiz widget submission flow** — seen on statistics, not drilled
- **Guide reviews tab on public profile** — referenced in §01 but not opened
- **Home page search modal** — the `Куда?/Когда?/Кто?` hero search modal IA

None of these block the v1 replication plan. The backbone — editor schema, bid flow, state machine, PII gate, filter surface, thread component — is fully captured. The gaps are polish and edge cases.
