# Component Audit & Dedup Plan — Provodnik

СВОДКА: 522 исходных файла (~60 600 LOC) проверены; найдено 39 мёртвых компонентов (2 826 LOC, ноль продакшн-импортёров), 24 кластера дублирования и 4 видимых пользователю бага, порождённых копипастой. План миграции — 6 волн, оценка сокращения ≈ 4 500–5 000 LOC (~8%).

- **Date:** 2026-07-06 · **Branch:** `handover/excel-fixes` · **Mode:** analysis only, zero code changes (this file is the sole artifact).
- **Method:** mechanical inventory scripts (import-graph with `@/` + relative resolution, line-shingle Jaccard similarity, className-literal frequency) + 5 parallel read-only analysis passes (cards, empty/loading/status, forms/mutations, formatting utils, ui primitives). Every count below re-verified by fresh `rg` at audit time.
- **Trio:** Superpowers — phased workflow discipline (inventory → detect → design → plan, verification gate at the end); Ponytail — minimalism lens on every verdict (several merges rejected below, deletion preferred over abstraction); Context7 — not invoked: no claim in this report depends on external library API knowledge; every proposal uses dependencies already in `package.json` (G3 — no new dependencies proposed anywhere in this plan).

---

## 1. Executive summary

| Metric | Value | Evidence |
|---|---|---|
| Source files (excl. tests) | 522 (.ts/.tsx), 320 .tsx | file walk of `src/`, excluding `*.test.*` and `__tests__/` |
| Total LOC | 60 600 | line count over the same set |
| Components | `src/components`: 120 tsx (~10 600 LOC) · `src/features`: 105 tsx · `src/app`: 95 tsx | inventory scan |
| Custom hooks | 5 (`useConfirm`, `useGuideCatalog`, `useRequestForm`, `useRealtimeMessages`, `useUnreadCount`) | `rg "export (function|const) use[A-Z]"` |
| Dead components (0 prod importers) | **39 files / 2 826 LOC** (§3.1) | import graph, spot-verified by grep |
| Duplication clusters | **24** (D1: 5, D2: 8, D3: 5, D4: 5, D5: 1 aggregate) | §4 |
| Estimated LOC reduction | **≈ 4 500–5 000** (2 826 dead + ~2 000 consolidation) | per-cluster estimates §4 |
| Live bugs found by the audit | 4 wrong Russian-plural sites; `Одобрен` vs `Подтверждено` for one status; 100× client/server budget-floor drift; UTC vs Moscow `formatDateLabel` drift | §4.D4 |

**Top 5 wins (by value ÷ risk):**

1. **Delete 39 dead components** — 2 826 LOC, zero runtime risk (nothing imports them). Includes an entire retired design generation (`src/components/cards/`, old `Chip`/`border-line` tokens).
2. **One `StatusBadge` + Russian label registry** — today: 3 badge components + ~12 local status→label/color maps, one verbatim copy-pasted pair, and a user-visible inconsistency (`approved` → «Одобрен» in admin, «Подтверждено» in guide profile).
3. **Canonical `GroupTypeBadge` / `DateFlexBadge`** — the MVP canon requires colored param badges on ALL card levels; they are hand-rolled in 6 places with 3+ conflicting color schemes. This is a canon-compliance fix, not just cleanup.
4. **Merge `RequestCardFinal` + `OpenGroupCard`** — strongest structural twin pair (same skeleton, `pluralOffers` copied verbatim between them), plus retire legacy `ReqCard`.
5. **Route money/date/plural formatting through existing canonical helpers** — fixes the 4 plural bugs, the ₽-spacing inconsistency (NBSP vs space), and the timezone drift for free.

Honorable mention: `src/lib/actions/create-action.ts` — a tested server-action envelope with **zero production callers** while 49 `"use server"` files hand-roll 3 competing result dialects (`{success}` in 16 files, `{ok}` in 18, bare `{error}` in the rest) and ~16 inline auth guards with 5+ different unauthorized strings.

---

## 2. Stack (Phase 1 — detected, not assumed)

| Layer | Finding | Evidence |
|---|---|---|
| Router | Next.js 16 **App Router** (`next@16.2.6`, `src/app/` with route groups `(auth)/(home)/(protected)/(site)`) | `package.json`, `src/app/` |
| React | 19.2.4 + `babel-plugin-react-compiler` | `package.json` |
| Styling | Tailwind **v4** (`@tailwindcss/postcss`), `tw-animate-css`; custom tokens (`max-w-page`, `bg-glass`, `surface-high`) in `src/app/globals.css` | `package.json`, grep |
| UI lib | shadcn-style `src/components/ui/` (42 files) on the unified `radix-ui` package; `class-variance-authority` used by 6/42 primitives (button, badge, alert, tag, toggle, input-group) | §3.2 |
| Data | Supabase (`@supabase/ssr`, `supabase-js`) + server actions; TanStack Query used in only 2 components + 1 hook (messaging) | `rg useQuery` |
| Forms | `react-hook-form` + `@hookform/resolvers` + zod v4 — but only **6 files** use `useForm`; ~15 real forms are hand-rolled `useState` (§4.D4-1) | `rg "useForm\("` |
| Dates/misc | `date-fns` (used in 4 files), `lucide-react`, `cmdk`, `react-day-picker`, `clsx`+`tailwind-merge` via `cn` | grep |
| Component homes | **Two competing conventions:** by-type `src/components/{ui,shared,cards,discovery,listing-detail,trust,traveler,bookings,guide,help}` AND by-domain `src/features/<domain>/components/` — a root cause of the duplicate pairs in §4 | dir listing |

Verification commands for this repo (from `.claude/rules/provodnik-orchestration.md`): `bun run typecheck && bun run lint && bun run test:run && bun run build`; UI at 1280px and 375px with clean console.

---

## 3. Inventory

Full per-file table (path, LOC, server/client, prod-importer count, test-importer count) was generated mechanically; the highlights that drive the plan are below. Import counts resolve both `@/` aliases and relative imports, and treat `index.ts` barrels correctly.

### 3.1 Dead components — zero production importers (39 files, 2 826 LOC)

`imported_by = 0` across all non-test source; files marked ⊘ also have zero **test** importers. Verified: e.g. `rg -l "components/cards/" src -g '!**/__tests__/**' -g '!*.test.*'` → empty; `PhotoGallery`, `birjha-screen`, `step-details` → no grep hits outside self.

| File | LOC | Note |
|---|---|---|
| `src/components/cards/guide-card.tsx` / `listing-card.tsx` / `request-card.tsx` | 94/119/82 | whole dir referenced only by its own `__tests__` — retired design generation (old `Chip`/`Tag`/`border-line` tokens) |
| `src/components/discovery/FilterBar.tsx`, `IdentityRevealCard.tsx`, `SearchInput.tsx`, `StatStrip.tsx`, `TrustRibbon.tsx` | 68/95/84/51/45 | discovery dir mostly dead; live are only `NewGuideFrame`, `DestinationCard` |
| `src/components/listing-detail/PhotoGallery.tsx` ⊘ | 90 | generic gallery+lightbox, never wired; a second lightbox is hand-rolled in `offer-card.tsx:374` |
| `src/components/shared/`: `cabinet-shell` (101), `destination-badge` ⊘ (8), `destination-tile` ⊘ (53), `guide-card` ⊘ (49), `list-toolbar` (93), `marketing-header` (48), `notification-item` (75), `status-badge` ⊘ (39), `theme-icon-chip` ⊘ (44), `transport-option-pill` ⊘ (44) | 554 | `status-badge` is English-labeled — that's *why* nobody uses it (§4.D3-3) |
| `src/components/traveler/FilterBar.tsx` ⊘, `ListingGrid.tsx` ⊘ | 170/17 | ListingGrid dead ⇒ `traveler/ListingCard` has only 1 effective user |
| `src/components/ui/`: `booking-card` (84), `faq-accordion` (63), `form-step-section` (32), `kpi-card` (57), `radio-group` ⊘ (45), `seat-progress-bar` (40), `section` (39), `toggle` ⊘ (48), `what-happens-next` (53) | 461 | 9 dead primitives; `toggle`/`radio-group` sit unused while their use-cases are hand-rolled (§4.D3) |
| `src/features/...`: `guide/components/birjha/birjha-screen` ⊘ (49), `guide/components/dashboard/KpiCard` ⊘ (39), `listings/.../listing-cover-art` ⊘ (113), `profile/.../traveler-profile-for-guide` (34), `quality/.../marketplace-quality-card` ⊘ (103), `requests/.../sent-screen-enrich` (117), `requests/components/steps/step-destination` ⊘ (163), `steps/step-details` ⊘ (208), `traveler/.../cabinet-section` (70) | 896 | `steps/step-interests` **is** still imported — only 2 of 3 wizard steps are dead; delete carefully |

### 3.2 `src/components/ui` (42 files, 3 163 LOC) — usage spine

Healthy core: `button` 103 importers · `badge` 59 · `card` 38 · `alert` 22 · `textarea` 21 · `input` 20 · `label` 16 · `separator` 15 · `avatar` 14 · `skeleton` 11 · `dialog` 8. Thin tail: 12 primitives with ≤2 importers; 9 dead (table above). cva variants exist on 6/42.

### 3.3 `src/components/shared` (48 files, 4 449 LOC) — the de-facto second ui/

Well adopted: `page-header` (31), `empty-state` (16), `list-row` (10), `loading-skeletons` (6), `confirm-dialog` + `useConfirm` (6), `discovery-shell` (5). Long tail of 1–2-importer components including the duplicate pairs in §4.

### 3.4 Hooks (5 total) and key lib modules

| Module | LOC | Importers | Role |
|---|---|---|---|
| `src/lib/utils.ts` (`cn`, `pluralize`, `pluralizePeopleGenitive`, `arrowizeRoute`) | 35 | 119 | canonical — yet plural logic re-rolled 7× (§4.D4-3) |
| `src/lib/dates.ts` (Moscow-pinned RU formatters) | 132 | 25 | canonical — bypassed in 21 files (§4.D4-2) |
| `src/data/money.ts` (`formatRub*`, kopeck helpers, tested) | 71 | 30+ | canonical — ~12 local re-implementations (§4.D4-1) |
| `src/lib/actions/create-action.ts` (zod→run→Sentry→`{ok/error}`, tested) | — | **0 prod callers** | built, never adopted (§4.D4-4) |
| `src/lib/query-keys.ts` | 5 | 2 | fine; one hard-coded bypass at `conversation-list.tsx:51` |
| `src/lib/format.ts` / `src/lib/styles.ts` / `src/lib/copy.ts` | 24/6/79 | 3/1/4 | overlap & near-dead (§4.D4-2, §6) |
| Zod: 8 `src/data/*/schema.ts` + ~14 inline schema sites | — | — | 3 dead schema files, 2 drifting live pairs (§4.D4-5) |

---

## 4. Duplication clusters

Each cluster: ID · class · members (file:line) · what actually varies · verdict. LOC-savings estimates are per-cluster sums of removable lines.

### D1 — exact / near-exact

**C-01 `not-found` triplet.** `src/app/not-found.tsx` ↔ `src/app/(site)/not-found.tsx` (Jaccard 0.90 on normalized lines) ↔ `src/app/(protected)/not-found.tsx` (0.46/0.41). Varies: wrapper shell only. Verdict: **keep** — App Router requires per-segment files; extract one `<NotFoundBody>` only if a 4th copy appears. Deferred.

**C-02 `error.tsx` pair.** `src/app/(protected)/error.tsx` ↔ `src/app/(site)/error.tsx` (0.56); `src/app/(auth)/error.tsx:21` and `src/app/(home)/error.tsx:21` share the identical hand-rolled outline button (`rounded-xl border border-border px-4 py-2` ≡ `ui/button` outline variant). Verdict: same as C-01; the button bypass is fixed by Wave 3 sweep.

**C-03 verification label functions — verbatim copy.** `verificationBadgeVariant` + `verificationLabel` duplicated byte-for-byte: `src/app/(protected)/admin/guides/page.tsx:33,48` ≡ `src/app/(protected)/admin/guides/[id]/page.tsx:29,44`; third divergent map `verificationStatusLabel` at `src/app/(protected)/guide/profile/page.tsx:74` — **`approved` → «Одобрен» (admin) vs «Подтверждено» (guide profile), live copy inconsistency.** Verdict: merge into the StatusBadge registry (C-14). ~35 LOC.

**C-04 `pluralOffers` verbatim pair.** `src/components/shared/request-card-final.tsx:65-72` ≡ `src/components/shared/open-group-card.tsx:14-21`; re-derived a third time in `trip-card.tsx:226-243`. Verdict: `pluralize` from `src/lib/utils.ts:13` already does this. ~25 LOC.

**C-05 dispute/review page pair.** `src/app/(protected)/bookings/[bookingId]/dispute/page.tsx:18` and `.../review/page.tsx:20` contain byte-identical date-range helpers; pages share skeleton (Jaccard 0.41). Verdict: dedupe the helper into `lib/dates.ts` (C-19); page merge **rejected** — different domains, cost > savings.

### D2 — structural twins

**C-06 Request/group cards — strongest cluster.** Members:
- `src/components/shared/request-card-final.tsx` — `<article>` :161, hand-rolled badge class constants :35-50, badge rows :163-197, avatar/price footer :200-211 (user: traveler-requests-screen)
- `src/components/shared/open-group-card.tsx` — wrapper :89-93, status/group-type Badges :113-142, date/flex/time :144-158, InterestTags :160-168, footer :170-186 (users: homepage-shell2-classic, public-requests-marketplace-screen)
- `src/features/traveler/components/trip-card/trip-card.tsx` (request phases) — `FlexPills` :126-162, `RequestFacts` :187-224, `OfferCount` :226-243
- `src/components/shared/req-card.tsx` :51-112 — older generation (users: destination-detail, `/dev/req-cards`)

All render: location title + guide-status + group-type badge + date/flexibility + interest chips + avatar stack + publishedAt + price footer; unread accent `border-l-4 border-primary` at request-card-final:161 and trip-card:369. Varies: photo (open-group only), CTA (open-group only), owner vs public data, `Badge` vs raw `<span>`. Verdict: **merge** request-card-final + open-group-card into one canonical card (§5.1); trip-card consumes the shared badge subcomponents but keeps its phase engine; req-card migrated & deleted. ~300 LOC.

**C-07 Guide cards ×3 (two share the same export name).** `src/components/shared/public-guide-card.tsx` (portrait, :60-66 wrapper, chips :100-111, stats :113-146) ↔ `src/features/guide/components/public/public-guide-card.tsx` (horizontal, :40-48, Badges :76-88) — **both export `PublicGuideCard`**; `src/components/listing-detail/GuideCard.tsx` :48-81 renders the same concept (avatar+name+check+chips+rating+profile link) off a different row type. Verdict: **merge the two PublicGuideCards** (`layout: portrait|row` variant); fold `GuideCard` in second (PII-mask data difference). `GuideOfferCard` (306 LOC, selectable, price column, children slot) — **keep separate**: interactivity is structural. ~120 LOC.

**C-08 Listing tiles ×3.** `src/components/shared/listing-card.tsx` (:28-56 image+pills, :93-98 price) ↔ `src/components/traveler/ListingCard.tsx` (:56-96) — same Link→image→title→meta→rating→price skeleton; differ in aspect ratio, guide row, and **data layer** (`ListingRecord` from `@/data/supabase/queries` vs `ListingRow` from `@/lib/supabase/types` — two type worlds for one entity). `src/components/shared/tour-card.tsx` (:25-62) — photo-overlay layout, genuinely different. Verdict: merge first two after a unifying mapper; tour-card **keep** (fold later as `layout="overlay"` only if touched anyway). ~90 LOC.

**C-09 EmptyState ×2.** `src/components/ui/empty-state.tsx` (1 importer) vs `src/components/shared/empty-state.tsx` (16 importers). Varies: Card wrapper, icon prop type, tint tokens. Verdict: one survivor in `ui/` (§5.4). ~40 LOC.

**C-10 AvatarStack ×2.** `src/components/ui/avatar-stack.tsx` (7 importers) vs `src/components/shared/avatar-stack.tsx` (3: open-group-card, trip-panel, request-card-final). Verdict: migrate 3 users to `ui/`, delete shared fork. ~60 LOC.

**C-11 StatStrip ×2 (same export name).** `src/components/ui/stat-strip.tsx:47` (1 importer) vs `src/components/discovery/StatStrip.tsx:50` (0 importers — already in §3.1 dead list). Verdict: delete the dead one; done.

**C-12 NotificationItem ×2.** `src/components/shared/notification-item.tsx` (0 importers, dead) vs `src/features/notifications/components/NotificationItem.tsx:73` (live). Verdict: delete dead. Also dedupe the 5-line `formatDistanceToNow` helper duplicated at `NotificationItem.tsx:62` ≡ `notification-center-screen.tsx:396`.

**C-13 SearchInput / FilterBar forks.** `src/components/discovery/SearchInput.tsx` and both `FilterBar`s are dead (§3.1); live canon is `src/components/shared/discovery-search-input.tsx` (4 importers). Verdict: delete-only. Also **Avatar ×2**: `src/components/profile-avatar.tsx` re-implements `ui/avatar` with raw `<img>`+initials — migrate its users to `ui/avatar`, low priority.

### D3 — inline repeats

**C-14 Status chips — worst category: 3 components + ~12 local maps.** Components: `src/components/shared/status-badge.tsx` (dead; auto-generates **English** labels via `status.replaceAll("_"," ")` at :26 — in a Russian product, which is why everyone bypassed it), `src/components/bookings/booking-status-badge.tsx` (live, RU `BOOKING_STATUS_LABELS`), `src/features/guide/components/bookings/guide-booking-status.tsx` (own switch). Local maps: `disputes-queue.tsx:10`, `dispute-case-detail.tsx:38`, `DisputeThread.tsx:16,25` (three dispute maps!), `messaging/OfferCard.tsx:41,62`, `traveler-request-status.tsx:7`, `admin/guides/page.tsx:33,48` ≡ `admin/guides/[id]/page.tsx:29,44` (C-03), `guide/profile/page.tsx:74`, `admin/listings/page.tsx:31`, `admin/bookings/page.tsx:21` (re-declares RU booking labels despite exported `BOOKING_STATUS_LABELS`), `guide-excursions-screen.tsx:326`, `lib/copy.ts:31`. Verdict: one `StatusBadge` + per-domain label registry (§5.2). ~250 LOC + kills the «Одобрен/Подтверждено» bug.

**C-15 Canonical param badges hand-rolled 6× with 3+ color schemes** (violates the MVP canon "colored group-type + date-flexibility badges on ALL card levels"):

| Site | Group type | Date flex |
|---|---|---|
| `request-card-final.tsx:39-42` | raw span purple-100/sky-100 | :35-38 emerald/rose |
| `trip-card.tsx:139-159` | same purple/sky | :156 emerald, label «± даты» |
| `bid-form-panel.tsx:517-518` | sky/purple | :440-441 emerald/rose |
| `open-group-card.tsx:135-138` | `Badge variant="info"` (blue) | :151 `Badge variant="success"` |
| `offer-card.tsx:236-247` | `Badge outline` primary-tint | :248-252 neutral |
| `guide-requests-inbox-screen.tsx:350-355` | `Badge secondary/outline` | `default/outline` |

Same request renders different badge colors on Г1 vs Г2 vs guide inbox. Verdict: extract `GroupTypeBadge`/`DateFlexBadge`/`GuideStatusBadge` (locals already exist inside request-card-final:74-121 — promote them), adopt at all 6 sites (§5.3). ~120 LOC + canon compliance.

**C-16 Empty states inline (14 sites bypass both EmptyStates).** `ReviewsList.tsx:73`, `NotificationBell.tsx:177`, `BonusLedger.tsx:59`, `request-detail-screen.tsx:750`, `dispute-case-detail.tsx:135`, `disputes-queue.tsx:54`, `LicenseManager.tsx:61` ≡ `admin/guides/[id]/page.tsx:284` (**identical string** «Пока нет добавленных документов о квалификации.»), `LicenseAddButton.tsx:165`, `public-guides-grid.tsx:128`, `TourDeparturesList.tsx:45`, `WeeklyCalendar.tsx:194`, `guide/calendar/page.tsx:270`, `destinations-grid.tsx:56`. Verdict: survivor EmptyState gets a `compact` variant; migrate multi-line sites, leave single-`<p>` cases alone (YAGNI). ~70 LOC.

**C-17 Hand-pasted skeleton pages.** 10/13 `loading.tsx` use shared `Skeleton`/`loading-skeletons`; 3 re-implement raw pulse divs: `admin/disputes/[caseId]/loading.tsx` (90 LOC, 27 pulse divs), `guide/bookings/[bookingId]/loading.tsx` (68, 22), `bookings/[bookingId]/review/loading.tsx` (52, 15). `rounded-full bg-muted/70 animate-pulse` = 23× across exactly these 3 files. These same files inline the glass string (C-24). Verdict: rebuild on `Skeleton` + `DetailSkeleton` + `GlassCard`. ~180 LOC.

**C-18 Confirm flows ×3 idioms.** Canon `ConfirmDialog`/`useConfirm` (`src/components/shared/confirm-dialog.tsx`, 6 users) vs raw AlertDialog scaffolds `cancel-booking-button.tsx` (54 LOC) ≈ `cancel-request-button.tsx` (79 LOC, Jaccard 0.42, both «Назад»/«Да, отменить») vs `window.confirm` at `ApiTokenManager.tsx:52`, `guide-portfolio-screen.tsx:135`, `day-panel.tsx:85,103` (destructive actions get browser-native confirm while siblings get the canon dialog). Verdict: migrate all to `useConfirm`. ~100 LOC.

### D4 — logic dupes

**C-19 Money formatting: canonical + 12 bypasses.** Canonical `src/data/money.ts` (tested). Local `formatRub(minor)` wrappers: `TariffsList.tsx:4`, `TourDeparturesList.tsx:9`, `TourShapeDetail.tsx:47`, `traveler/ListingCard.tsx:22`, `WeeklyCalendar.tsx:39`. Local `Intl.NumberFormat("ru-RU",{currency:"RUB"})` (NBSP output ≠ canonical space — two ₽-spellings coexist in UI): `booking-detail-screen.tsx:890`, `trip-card.tsx:12`, `offer-card.tsx:67`, `guide-bookings-screen.tsx:232`, `request-detail-screen.tsx:375`, `dispute-case-detail.tsx:31`; inline: `guide/calendar/page.tsx:256`, `admin/bookings/page.tsx:127`, `admin/listings/page.tsx:122`, `listings/[id]/book/page.tsx:64`. **Shadow canonical:** `src/data/supabase/queries/core.ts:193` exports its own `formatRub`. Verdict: all → `formatRubFromMinor`/`formatRub`. ~120 LOC.

**C-20 Date formatting: canonical + 21 bypass files.** Canonical `src/lib/dates.ts` (Moscow-pinned). Dupes: «day month» helpers at `TourItineraryDisplay.tsx:8`, `offer-card.tsx:75`, `owner-request-actions.ts:368`, `guide-requests-inbox-screen.tsx:390`; short variants `slot-chips.tsx:14`, `TourDeparturesList.tsx:13`; range helpers (with dash/year drift) `trip-card.tsx:31`, `review/page.tsx:20` ≡ `dispute/page.tsx:18` (byte-identical), `step-details.tsx:48`, `WeeklyCalendar.tsx:94`; **same-name `formatDateLabel` twice with TZ drift** — `queries/core.ts:197` (UTC) vs `guide/bookings/[bookingId]/actions.ts:166` (unpinned) vs Moscow canon; Moscow day-key idiom rebuilt at `bid-form-panel.tsx:57`, `conversation-list.tsx:15`, `BookingFormTabs.tsx:82`; `formatDateOnlyLocal` triplicated verbatim `MonthlyCalendar.tsx:15` / `WeeklyCalendar.tsx:18` / `guide/calendar/page.tsx:28`. Verdict: extend `dates.ts` (short format + day-key export), delete locals. ~150 LOC + TZ-bug fix.

**C-21 Russian plurals: 1 canonical + 6 copies, 4 of them WRONG.** Canonical `pluralize` `src/lib/utils.ts:13`. Correct clones: `guide-offer-card.tsx:50` (`pluralRu`), C-04 pair, `slot-chips.tsx:20`, `trip-card.tsx:50`. **Wrong rules (break at 21, 22, 111 — user-visible bugs):** `TourDeparturesList.tsx:72` (`n===1?"день":n<5?"дня":"дней"`), `booking-detail-screen.tsx:347`, `listing-cover-art.tsx:55` (dead file), `queries/core.ts:208` (`daysLabel` → «21 дней»). Verdict: all → `pluralize`. ~60 LOC + 3 live bug fixes (one is in a dead file).

**C-22 Server-action envelope: helper exists, zero adopters.** `src/lib/actions/create-action.ts:17` (zod-parse → run → Sentry → `{ok/error}`, tested) has **0 production call sites** (`rg -ln createAction src` → only itself + test). Meanwhile 49 `"use server"` files: `{success:bool}` in 16 files, `{ok:bool}` in 18, bare `{error}` elsewhere; ~16 inline auth guards with divergent strings («Требуется вход» / «Требуется вход в аккаунт» / «Требуется авторизация.» / «Необходима авторизация.» / «Не авторизован» / «Ошибка авторизации…»; `updatePersonalSettings.ts:19` throws instead). Concrete twin bodies: `submitOfferAction` (`offer-actions.ts:79`) vs `editOfferAction` (`:262`) share ~50 lines — same `safeParse` (:153/:329), same `checkOfferAgainstLocks` call (:169/:339), same `revalidatePath` pair (:251-252/:363-364); `guide/calendar/actions.ts:8/40/57` — 3 actions with identical guard+client preamble. Verdict: extend `createAction` with `requireUser`, migrate incrementally (§5.6); dedupe offer submit/edit into one local `parseAndValidateOfferForm`. ~300 LOC.

**C-23 Form scaffolding + homepage twin.** The pending-bool + serverError + try/finally trio appears in ≥7 files (`bid-form-panel`, `verification-upload-form`, `use-request-form`, `hero-conversation`, `LicenseAddButton`, `PersonalSettingsForm`, `FourAxisReviewForm`) plus `errorMsg`/`isSubmitting` variants in auth/profile forms. Verbatim: `submitWithFormData` at `use-request-form.ts:67-75` ≡ `hero-conversation.tsx:83-91`, including the auth-gate-pending-FormData dance (`hero-conversation.tsx:94-120`). Both homepages call the same `createRequestAction`; `/` uses homepage-classic, `/ai` uses homepage — **both live**, not dead code. Verdict: one `useActionSubmit(action)` hook → `{submit, pending, error}`; extract `useAuthGatedRequestSubmit` for the homepage pair. ~150 LOC. Minor: `Array.isArray(v)?v[0]:v` searchParams idiom ×7 (`auth/page.tsx:21,28`, `admin/guides/page.tsx:69`, `bookings/[bookingId]/page.tsx:18`, `review/page.tsx:17`, `dispute/page.tsx:31`, `admin/audit/page.tsx:85`) → 2-line `firstParam` in utils.

**C-24 (D4/D6) Zod drift.** Dead legacy schemas (0 external importers): `src/data/guide-offer/schema.ts:9` (vs live `lib/supabase/offers.ts:19`), `src/data/guide-listing/schema.ts:12` (vs live `lib/supabase/listing-schema.ts:8`), `src/data/reviews/schema.ts:13` (vs live `review/actions.ts:10` + `lib/supabase/reviews.ts:26`). **Live drift:** traveler request — form `src/data/traveler-request/schema.ts:51` `budgetPerPersonRub.min(1_000)` (rubles) vs server `src/lib/supabase/requests.ts:39-43` `budget_minor.min(1_000)` with message «не менее 1 000 ₽» — 1 000 minor = **10 ₽**, server floor is 100× looser than the client's and the message lies. `HH:MM` regex defined 3× (`traveler-request/schema.ts` + inline `requests.ts:72,76`). Verdict: delete dead schemas; fix `budget_minor` min to `100_000`; shared limits module for the request pair.

### D5 — style dupes (aggregate)

| Class string | Count | Files | Absorber |
|---|---|---|---|
| `bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass` | 20× | 8 | **`GlassCard` already exists** (`src/components/shared/glass-card.tsx`, exactly this string, 2 importers) — heavy inliners are the 3 skeleton pages of C-17 + destinations/requests loading |
| `mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]` | 22× | 13 | no `PageContainer` exists (`rg PageContainer` → 0); dead `ui/section.tsx` uses a *conflicting* container (`max-w-5xl px-5`). Top inliners: `destination-detail-screen.tsx` :65,102,134,188,210,258; `guide-profile-screen.tsx` :128,228,235,260 |
| `text-lg font-semibold tracking-tight` | 19× | 9 | 17/19 concentrated in `src/components/listing-detail/` (`TourShapeDetail.tsx:159,168,181,195,211`; `ExcursionShapeDetail.tsx:165,172,179,196,203`; +5 files) — one h2 style, drift vector |
| `text-sm font-medium text-foreground` (label idiom) | 55× | 27 | mostly form labels; `ui/label` exists (16 importers) — absorbed naturally by C-23 form work, not worth a sweep of its own |
| `rounded-full bg-muted/70 animate-pulse` | 23× | 3 | C-17 |
| policies pages triple (`border-border bg-card scroll-mt-24` 17×/3 files) | — | 3 | static legal pages, same template — **rejected**, content pages, drift harmless |

Also: raw `<button>` outside ui/: **80** (top: `guide-excursions-screen` 9, `bid-form-panel` 8); raw `<select>` 4 (`guide-excursions-screen.tsx:447`, `MonthlyCalendar.tsx:108`, `guide-requests-inbox-screen.tsx:277,291`); raw `<textarea>` 3; hand-rolled `role="dialog"` 4 (`offer-card.tsx:374`, `booking-ticket.tsx:48`, `bid-form-panel.tsx:257`, `day-panel.tsx:123`); `role="tablist"` 2 — while `ui/toggle` (aria-pressed pills) and `ui/radio-group` sit at 0 importers. Missing `link` variant on `ui/button` (needed by `auth-entry-screen.tsx:442`). Rating stars re-rolled in ~12 files while `shared/rating-display.tsx` (3 importers) exists.

---

## 5. Canonical component specs (Phase 3)

All specs use existing deps only (cva, radix, tailwind-merge — already installed). Naming: primitives → `src/components/ui/`, composed domain components → `src/components/features/<domain>/` does **not** exist in this repo; the established convention is `src/components/shared/` (48 files) for cross-domain and `src/features/<domain>/components/` for domain-owned — specs follow the established convention rather than inventing a third home.

### 5.1 `RequestCard` (absorbs C-06)

- **Location:** `src/components/shared/request-card.tsx` (replaces `request-card-final.tsx`, `open-group-card.tsx`, `req-card.tsx`)
- **Props:**
  ```ts
  type RequestCardProps = {
    viewpoint: "owner" | "open";        // cva variant: owner = no photo/CTA + unread accent; open = photo + CTA
    title: string; href: string;
    guideStatus: { offerCount: number; accepted?: boolean };   // renders GuideStatusBadge
    groupType: GroupType; dateLabel: string; dateFlexible: boolean; timeLabel?: string;
    interests: string[];                 // renders InterestTag row
    participants: { avatars: AvatarStackProps; label: string };
    publishedAt: string; priceLabel?: string;
    photoUrl?: string; cta?: ReactNode;  // open variant only
    unread?: boolean;                    // owner variant only
  };
  ```
- **Variants via cva:** `viewpoint` only. No boolean-prop soup: photo/CTA presence follows the variant.
- **Mapping:**

| Current | Canonical usage |
|---|---|
| `traveler-requests-screen.tsx` → `RequestCardFinal` | `<RequestCard viewpoint="owner" …>` |
| `homepage-shell2-classic.tsx`, `public-requests-marketplace-screen.tsx` → `OpenGroupCard` | `<RequestCard viewpoint="open" cta={<Button…>}>` |
| `destination-detail-screen.tsx` (+ `/dev/req-cards`) → `ReqCard` | `viewpoint="open"`; delete `req-card.tsx` |
| `trip-card.tsx` FlexPills/RequestFacts/OfferCount | replace internals with `GroupTypeBadge`/`DateFlexBadge`/`GuideStatusBadge` (5.3); TripCard shell **stays** |

### 5.2 `StatusBadge` + label registry (absorbs C-14, C-03)

- **Location:** `src/components/shared/status-badge.tsx` (replace the dead English one in place) + `src/lib/status-labels.ts`
- **API:** `StatusBadge({ domain: "booking"|"request"|"offer"|"dispute"|"verification"|"listing", status: string })`. Registry: `Record<domain, Record<status, { label: string; variant: BadgeVariant }>>` — builds on `ui/badge`'s existing cva variants (`success/warning/info/…`), single source for Russian labels. Seed from existing `BOOKING_STATUS_LABELS` (`booking-status-badge.tsx:7`) — do not re-translate.
- **Mapping:** each of the ~12 local maps in C-14 → one `<StatusBadge domain=… status=…>`; `booking-status-badge.tsx` and `guide-booking-status.tsx` become re-exports then get deleted; label conflict resolved by product decision («Подтверждено» — matches booking canon) recorded in the registry.

### 5.3 `GroupTypeBadge` / `DateFlexBadge` / `GuideStatusBadge` (absorbs C-15, C-04)

- **Location:** `src/components/shared/request-badges.tsx` — promote the local functions already written at `request-card-final.tsx:74-121`.
- **API:** `GroupTypeBadge({ groupType })`, `DateFlexBadge({ flexible, label? })`, `GuideStatusBadge({ offerCount, accepted })` (uses `pluralize` — kills C-04). One color scheme (the request-card-final purple/sky + emerald/rose set is the most widely used — 3 of 6 sites; confirm with design canon before Wave 2).
- **Mapping:** the 6 sites in the C-15 table each replace 3–15 lines with one component call.

### 5.4 `EmptyState` unification (absorbs C-09, C-16)

- **Survivor:** `src/components/ui/empty-state.tsx` (newer token system) + add `variant: "card" | "plain" | "compact"` via cva (card = current shared/ look, so the 16 existing users migrate with zero visual change; compact = single-line for C-16 sites).
- **Mapping:** 16 `shared/empty-state` importers → `ui/empty-state variant="card"`; delete `shared/empty-state.tsx`; migrate the ≥3-line inline sites from C-16, leave single-`<p>` cases.

### 5.5 `PageContainer` + `GlassCard` adoption (absorbs C-24-style rows)

- **`PageContainer`:** new `src/components/ui/page-container.tsx` — one line: `<div className={cn("mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]", className)}>`. Replaces 22 inline copies; delete conflicting dead `ui/section.tsx`.
- **`GlassCard`:** already exists (`shared/glass-card.tsx`) — adoption only, no new code.
- **`RatingDisplay`:** move `shared/rating-display.tsx` → `ui/rating-display.tsx`, route the ~12 star re-rolls through it (input variant `StarRatingInput` stays separate — different interaction).

### 5.6 `createAction` + `useActionSubmit` (absorbs C-22, C-23)

- **`createAction`:** exists at `src/lib/actions/create-action.ts` — extend with `requireUser: true` option that resolves the Supabase user (via `src/lib/auth/server-auth.ts`, 13 importers) and returns the canonical error `{ ok: false, error: "Требуется вход" }`. Envelope standard: `{ ok: boolean; error?: string; data?: T }` (the `{ok}` dialect — 18 files already use it, largest camp).
- **`useActionSubmit`:** new `src/lib/actions/use-action-submit.ts` — `function useActionSubmit<T>(action: (fd: FormData) => Promise<Result<T>>): { submit; pending; error }` (~20 LOC, wraps `useTransition`).
- **Mapping:** migrate action files wave-wise (see W6); `submitOfferAction`/`editOfferAction` first extract local `parseAndValidateOfferForm` (`offer-actions.ts`).

### Rejected consolidations (cost > savings)

| Candidate | Why rejected |
|---|---|
| C-01/C-02 not-found/error unification | App Router requires per-segment files; bodies are ~20 LOC each; an abstraction saves <40 LOC and adds indirection |
| `TourCard` into ListingCard | overlay layout is structurally different; only 2 users; revisit only when next touched |
| `GuideOfferCard` into guide-card cluster | selection state, price column, children slot = different contract |
| Policies pages template (17× repeated classes) | static legal content; drift is harmless; templating legal text adds risk |
| `messaging/OfferCard` vs traveler `offer-card` | same name, different lifecycle (chat negotiation widget vs offer detail); rename one instead (see W0) |
| TanStack query-key factory expansion | only 3 keys exist; fix the single hard-coded bypass and stop |
| `cn()` sweep over 34 template-literal classNames | twMerge only matters for conditional conflicts; batch opportunistically, no dedicated wave |
| `label` idiom (55×) as a component | it's a Tailwind idiom, not a component; C-23 form work absorbs the form-label subset naturally |
| Homepage vs homepage-classic merge | both live (`/` and `/ai`), different UX experiments sharing one action; dedupe only the submit hook (C-23), let product decide the experiment's fate |

---

## 6. Migration plan (Phase 4)

Order: leaf primitives & pure functions first, data-bearing cards last. Every wave = independent PR, verified by `bun run typecheck && bun run lint && bun run test:run && bun run build` + listed routes at 1280px/375px with clean console. **Process guard (repo rules):** QuantumHands executes; deleting tracked files requires explicit operator approval per CLAUDE.md hard rule — each deletion wave lists files for a `git rm` the operator approves. Never `git push` without instruction.

Server/client boundary flags: W0 deletions include client components (no risk — dead). W5 card merges must keep the canonical card a **server component** (all current members are server); embedding client CTAs stays via `children`/`cta` slots — flagged HIGH RISK where noted.

---

### W0 — delete dead code (effort S, risk ~zero, −2 826 LOC)

```text
HANDOFF W0 (junior-safe, zero context needed)
Goal: remove all components with zero production importers.
Preconditions: clean git status; operator approval for deletions granted.
Steps:
1. git rm the 39 files listed in §3.1 of docs/COMPONENT_AUDIT.md, EXCEPT:
   - keep src/features/requests/components/steps/step-interests.tsx (it IS imported);
     delete only step-destination.tsx and step-details.tsx from that dir.
2. Also git rm their co-located test files: every path in
   src/components/cards/__tests__/, plus any __tests__ file or *.test.tsx that imports
   a deleted file (find with: rg -l "<basename-without-ext>" src --glob '*.test.*'
   --glob '**/__tests__/**' for each deleted file).
3. Before each rm, re-verify deadness: for file X run
   rg -l "<import path of X>" src --glob '!**/__tests__/**' --glob '!*.test.*'
   → must return nothing. If it returns anything, SKIP that file and note it in the PR.
4. Rename to remove the duplicate-name landmine that survives deletion:
   none required in this wave (both dead PublicGuideCard/StatStrip name clashes
   resolve by deletion; the messaging/OfferCard vs traveler offer-card clash is W5).
Verify: bun run typecheck && bun run lint && bun run test:run && bun run build
Routes to check (1280px + 375px, clean console): / , /requests , /guides , /destinations
Done-criteria: build green, no route regression, diff is deletions-only (+ report includes git diff --stat).
Rollback: git revert of the single deletion commit.
```

### W1 — pure-function consolidation: plurals, money, dates, zod (effort M, risk low, −~350 LOC, fixes 4 bugs)

```text
HANDOFF W1
Goal: route all plural/money/date formatting through the canonical helpers; fix zod drift.
Files touched: src/lib/utils.ts (no change needed), src/data/money.ts (no change),
src/lib/dates.ts (add helpers), src/lib/supabase/requests.ts, + the bypass sites below.
Steps:
1. PLURALS → pluralize from @/lib/utils (§4 C-21, C-04):
   - guide-offer-card.tsx:50 delete pluralRu; replace calls with pluralize.
   - request-card-final.tsx:65 & open-group-card.tsx:14 delete pluralOffers; replace with
     `${n} ${pluralize(n,"отклик","отклика","откликов")}` (extract once in W2's GuideStatusBadge).
   - slot-chips.tsx:20, trip-card.tsx:50 same treatment.
   - FIX WRONG RULES: TourDeparturesList.tsx:72, booking-detail-screen.tsx:347,
     src/data/supabase/queries/core.ts:208 (daysLabel) → pluralize. These are bug fixes;
     add one unit test each asserting n=21 renders «21 день»/«21 человек»/«21 день».
2. MONEY (§4 C-19): delete the 5 local formatRub wrappers (TariffsList.tsx:4,
   TourDeparturesList.tsx:9, TourShapeDetail.tsx:47, traveler/ListingCard.tsx:22,
   WeeklyCalendar.tsx:39) → import formatRubFromMinor/formatRubNumber from @/data/money.
   Replace the 6 local Intl.NumberFormat helpers + 4 inline sites (list in C-19) with
   formatRub/formatRubFromMinor. Delete the shadow formatRub in
   src/data/supabase/queries/core.ts:193 and re-export from @/data/money instead.
   NOTE: canonical output uses a regular space before ₽; NBSP snapshots in tests may need updating.
3. DATES (§4 C-20): in src/lib/dates.ts add formatRussianDateShort(iso) («5 мая») and
   moscowDayKey(date) (the en-CA/Europe/Moscow trick). Then delete the local helpers listed
   in C-20 and import from @/lib/dates. Resolve the same-name formatDateLabel pair:
   queries/core.ts:197 keeps the name (switch tz from UTC to Europe/Moscow — flag in PR:
   changes rendered strings), guide/bookings/[bookingId]/actions.ts:166 imports it.
   Delete formatDateOnlyLocal ×3 (MonthlyCalendar.tsx:15, WeeklyCalendar.tsx:18,
   guide/calendar/page.tsx:28) → moscowDayKey.
4. ZOD (§4 C-24): git rm src/data/guide-offer/schema.ts, src/data/guide-listing/schema.ts,
   src/data/reviews/schema.ts (re-verify 0 importers first, same probe as W0 step 3;
   move their still-used types.ts siblings' imports if any — check before rm).
   In src/lib/supabase/requests.ts:42 change budget_minor .min(1_000) → .min(100_000)
   (message already says «не менее 1 000 ₽»; 100 000 kopecks = 1 000 ₽). FLAG: server-side
   validation tightening — confirm no legit sub-1000₽ requests exist in prod data first.
5. Add firstParam(v: string|string[]|undefined) to src/lib/utils.ts; adopt at the 7 sites in C-23.
Verify: bun run typecheck && bun run lint && bun run test:run && bun run build
Routes: /listings/[any] , /bookings/[any] , /guide/calendar , / (request form submit)
Done: all listed call sites import canonical helpers (rg the old names → 0 hits);
      4 new plural unit tests green; git diff --stat in report.
Rollback: revert commit; no schema/data migrations involved (zod only).
```

### W2 — badge & status primitives (effort M, risk low-medium, −~400 LOC, canon-compliance)

```text
HANDOFF W2 (depends: W1)
Goal: one StatusBadge with RU label registry; canonical GroupType/DateFlex/GuideStatus badges.
Files: NEW src/lib/status-labels.ts, REWRITE src/components/shared/status-badge.tsx,
NEW src/components/shared/request-badges.tsx, + call sites from C-14/C-15 tables.
Steps:
1. Create src/lib/status-labels.ts per §5.2. Seed booking labels from
   src/components/bookings/booking-status-badge.tsx:7 (BOOKING_STATUS_LABELS), dispute labels
   from features/disputes/components/DisputeThread.tsx:16, request labels from
   features/traveler/components/requests/traveler-request-status.tsx:7, verification labels
   from app/(protected)/admin/guides/page.tsx:48 — resolving approved → «Подтверждено»
   (decision recorded here; admin pages change label, flag in PR for operator sign-off).
2. Rewrite shared/status-badge.tsx as <StatusBadge domain status> on ui/badge variants.
3. Create request-badges.tsx by lifting GroupTypeBadge/GuideStatusBadge from
   request-card-final.tsx:74-121 and DateFlexBadge from its :35-38 constants;
   GuideStatusBadge uses pluralize (finishes C-04).
4. Replace the ~12 local maps (C-14 table) and 6 badge sites (C-15 table) with the new
   components. Delete booking-status-badge.tsx and guide-booking-status.tsx after their
   users are migrated (keep BOOKING_STATUS_LABELS re-export path working until then;
   admin/disputes also import BOOKING_STATUS_LABELS — point it at status-labels.ts).
5. Visual check: badge colors on Г1 (/requests marketplace), Г2 (request detail), guide inbox
   must now be IDENTICAL for the same request. 1280px + 375px.
Verify: bun run typecheck && bun run lint && bun run test:run && bun run build
Routes: /requests , /requests/[id] , /guide/inbox , /admin/guides , /admin/bookings ,
        /admin/disputes , /guide/profile , /bookings/[id]
Done: rg "verificationLabel|STATUS_META|statusBadgeVariant|pluralOffers" src → 0 hits
      outside status-labels.ts; screenshots of the 3 card levels attached; git diff --stat.
Rollback: revert; purely presentational, no data changes.
```

### W3 — shared-component adoption: EmptyState, skeletons, confirm, GlassCard, PageContainer, RatingDisplay (effort M, risk low, −~500 LOC)

```text
HANDOFF W3 (depends: W0; independent of W2)
Goal: adopt existing shared components at bypass sites; unify the EmptyState pair.
Steps:
1. EmptyState (§5.4): add variant="card|plain|compact" (cva) to src/components/ui/empty-state.tsx,
   with card matching the current shared/empty-state.tsx rendering exactly (Card wrapper,
   same paddings). Migrate the 16 importers of shared/empty-state (list them:
   rg -l "shared/empty-state" src) to ui/empty-state variant="card"; git rm shared/empty-state.tsx.
   Migrate the multi-line inline sites from C-16 (skip single-<p> ones).
2. Skeleton pages (C-17): rewrite the 3 hand-rolled loading.tsx
   (admin/disputes/[caseId], guide/bookings/[bookingId], bookings/[bookingId]/review)
   using Skeleton / DetailSkeleton / ListRowSkeleton from shared/loading-skeletons and
   GlassCard where they inline the glass string. Match current layout roughly — skeletons
   are placeholders, exactness not required.
3. Confirm (C-18): rewrite cancel-booking-button.tsx and cancel-request-button.tsx on
   useConfirm (see accept-offer-button.tsx for the working pattern); replace the 3
   window.confirm sites (ApiTokenManager.tsx:52, guide-portfolio-screen.tsx:135,
   day-panel.tsx:85,103) with useConfirm.
4. GlassCard adoption (D5): replace the remaining inline glass strings (rg the exact string,
   20 hits) with <GlassCard>. PageContainer: create ui/page-container.tsx per §5.5, adopt at
   the 22 sites (rg "max-w-page px-\[clamp"), git rm dead ui/section.tsx (already gone in W0).
5. RatingDisplay: git mv src/components/shared/rating-display.tsx src/components/ui/;
   update its 3 importers; migrate the star re-rolls in listing-detail/GuideCard,
   TourShapeDetail, ExcursionShapeDetail, DestinationCard, reviews/ReviewCard, shared/tour-card,
   shared/guide-offer-card (each: delete local Star loop, render <RatingDisplay …>).
   StarRatingInput stays as-is (input, not display).
Verify: bun run typecheck && bun run lint && bun run test:run && bun run build
Routes: every migrated screen; minimum: /messages , /favorites , /notifications ,
        /admin/moderation , /bookings/[id] (cancel flow!) , /requests/[id] (cancel flow!),
        /listings/[id] , /guides/[slug] — 1280px + 375px, clean console.
Done: rg "shared/empty-state|window.confirm" src → 0 hits (prod code);
      glass string appears only inside glass-card.tsx; container string only in
      page-container.tsx; git diff --stat.
Rollback: revert; presentational only. NOTE cancel flows are destructive-action UI —
      manually exercise both before merge.
```

### W4 — form & action envelope (effort L, risk medium, −~450 LOC) — HIGH RISK: server/client boundaries

```text
HANDOFF W4 (depends: W1)
Goal: adopt createAction envelope + useActionSubmit hook; dedupe offer actions.
HIGH RISK NOTE: changing an action's return shape breaks its client callers —
migrate action + all its callers in the same commit, one domain at a time.
Steps:
1. Extend src/lib/actions/create-action.ts with requireUser option (§5.6) — resolve user
   via src/lib/auth/server-auth.ts; standard failure: { ok: false, error: "Требуется вход" }.
   Add unit test.
2. Create src/lib/actions/use-action-submit.ts (§5.6, ~20 LOC, "use client", useTransition).
3. Migrate domain-by-domain, one commit each, callers included. Order (smallest first):
   a. guide/calendar/actions.ts (3 actions, identical preambles) + calendar screens
   b. features/requests/sent-request-actions.ts + owner-request-actions.ts + their screens
   c. features/guide/offer-actions.ts: FIRST extract parseAndValidateOfferForm covering
      the shared ~50 lines of submitOfferAction(:79)/editOfferAction(:262)
      (FormData→raw, safeParse, traveler_requests select, checkOfferAgainstLocks, revalidatePath),
      THEN wrap both in createAction. bid-form-panel.tsx is the main caller.
   d. bookings, profile, disputes, admin — same pattern, stop when the wave budget is spent;
      remaining files stay on their current dialect (envelope adoption is incremental by design).
4. Replace the pending/error scaffolds (C-23 list) with useActionSubmit as their actions migrate.
   Extract useAuthGatedRequestSubmit from use-request-form.ts:67-75 ≡ hero-conversation.tsx:83-91
   into src/features/homepage-classic/components/ (imported by both homepages).
Verify per commit: bun run typecheck && bun run lint && bun run test:run && bun run build
Routes per domain: the screens that call the migrated actions (calendar: /guide/calendar;
   requests: /requests/sent, /requests/[id]; offers: /guide/inbox bid flow — submit AND edit an offer).
Done: createAction has ≥10 production callers; rg '"success": true|success: true' over
   migrated files → 0; both homepage forms still submit (test / and /ai manually);
   git diff --stat per commit.
Rollback: per-domain commits revert independently.
```

### W5 — card merges (effort L, risk highest, −~500 LOC) — HIGH RISK: data layers + server components

```text
HANDOFF W5 (depends: W2; do LAST)
Goal: canonical RequestCard; merge PublicGuideCard pair; merge listing tiles.
HIGH RISK: these are data-bearing server components on core marketplace screens.
Keep every merged card a SERVER component ('use client' must NOT appear in the new files;
interactive bits arrive via props/children from client parents). Screenshot before/after each.
Steps:
1. RequestCard (§5.1): create shared/request-card.tsx per spec, composing W2's request-badges +
   ui/avatar-stack + shared/interest-tag. Migrate callers per §5.1 mapping table one commit each:
   traveler-requests-screen → homepage-shell2-classic + public-requests-marketplace-screen →
   destination-detail-screen. Then git rm request-card-final.tsx, open-group-card.tsx, req-card.tsx.
   TripCard: replace FlexPills/RequestFacts/OfferCount internals (trip-card.tsx:126-243) with the
   shared badges; do NOT merge TripCard itself.
2. PublicGuideCard (§4 C-07): merge the two same-named components into
   src/components/shared/public-guide-card.tsx with layout="portrait"|"row" (cva).
   Callers: public-guides-grid.tsx (portrait), destination-detail-screen.tsx (row).
   git rm src/features/guide/components/public/public-guide-card.tsx.
   listing-detail/GuideCard.tsx: fold into layout="row" ONLY if its GuideProfileRow data +
   PII mask maps cleanly; otherwise leave and record in §7 as deferred — do not force it.
3. Listing tiles (C-08): PRE-STEP: write one mapper listingCardModel(x: ListingRecord|ListingRow)
   → shared view model (place next to shared/listing-card.tsx). Then merge
   traveler/ListingCard into shared/listing-card (aspect + badge differences become props with
   defaults matching the majority user). traveler/ListingGrid is already deleted (W0), so
   traveler/ListingCard has one effective caller — verify with rg before merging.
   tour-card.tsx: DO NOT merge (rejected, §5).
4. Rename collision cleanup: rename features/messaging/components/OfferCard.tsx export to
   ChatOfferCard (file may keep its name; update its importers — rg -l "components/OfferCard").
Verify: bun run typecheck && bun run lint && bun run test:run && bun run build
Routes (1280px + 375px, clean console, screenshots): / , /requests , /requests/[id] ,
   /destinations/[slug] , /guides , /listings , /guide/inbox
Done: badge canon identical across Г1/Г2/inbox (re-check W2's criterion still holds);
   rg "OpenGroupCard|RequestCardFinal|ReqCard" src → 0 hits; git diff --stat per commit.
Rollback: per-card commits; keep the old component file in the same commit as its last caller
   migration so a single revert restores both.
```

### W6 — misfiled/naming hygiene (effort S, optional)

```text
HANDOFF W6 (anytime after W0)
Goal: resolve the two-component-homes drift for the files this audit touched.
Steps: git mv src/components/traveler/ListingCard.tsx → merged in W5 (skip if done);
  git mv src/components/profile-avatar.tsx usage → ui/avatar (C-13, 3 template-literal
  classNames inside also die); move discovery/DestinationCard + NewGuideFrame into
  src/components/shared/ (last two live files of the discovery dir) and delete the dir.
  Add `link` variant to ui/button (cva, one line) and adopt at auth-entry-screen.tsx:442.
  Adopt ui/tabs at guide-requests-inbox-screen.tsx:240 (role=tablist hand-roll) and
  ui/select at the 4 raw <select> sites (C-24 list) — each is a mechanical swap.
Verify: bun run typecheck && bun run lint && bun run test:run && bun run build; spot-check routes.
Done: src/components/discovery removed; raw <select> count 0 (rg '<select' src -g '!ui/**').
Rollback: revert.
```

**Wave summary**

| Wave | Scope | Effort | Risk | Est. −LOC |
|---|---|---|---|---|
| W0 | delete 39 dead files | S | ~0 | 2 826 |
| W1 | plurals/money/dates/zod | M | low (2 flagged behavior changes) | ~350 |
| W2 | StatusBadge + request badges | M | low-med (label change needs sign-off) | ~400 |
| W3 | EmptyState/skeleton/confirm/Glass/Container/Rating | M | low | ~500 |
| W4 | createAction + useActionSubmit | L | med (return-shape migrations) | ~450 |
| W5 | card merges | L | high (core screens, data layers) | ~500 |
| W6 | hygiene | S | low | ~100 |

---

## 7. Rejected / deferred (with reasoning)

Rejections with reasoning: see the table at the end of §5. Deferred items:

- **`src/data` Supabase I/O vs `.claude/rules/data-layering.md`** — the rule says all Supabase I/O lives in `src/lib/supabase/<domain>.ts`, but `src/data/supabase/queries.ts` (31 importers), `src/data/guide-templates/supabase-client.ts`, `src/data/guide-assets/supabase-client.ts` do read-side I/O. No function-level duplication today (read vs write split), so this is **architecture debt, not a dedup wave** — needs its own plan; out of scope here. Note: `queries.ts` ↔ `queries/core.ts` is NOT a dupe (core is re-exported via `queries.ts:39`, 0 direct importers by design).
- **`listing-detail/GuideCard` fold-in** — conditional in W5 step 2; PII-mask data shape may make it a bad merge.
- **`lib/copy.ts` «NEVER hardcode Russian strings» rule** — 4 importers vs hundreds of hardcoded RU strings; enforcing it is a product/i18n decision, not a refactor. Flagged to operator.
- **Homepage experiment consolidation** — `/` (classic) and `/ai` both live; W4 dedupes their shared submit logic; killing either variant is a product call.
- **`text-sm font-medium text-foreground` 55×/27 files** — form-label idiom; partially absorbed by W3/W4; a dedicated sweep would churn 27 files for ~0 structural gain.
- **`useRequestForm`/wizard steps** — `steps/step-interests.tsx` still imported while its 2 sibling steps are dead; suggests an abandoned wizard refactor. Deleting the siblings is W0; whether to finish or remove the wizard is a product question.

---

## 8. Final gate (executed 2026-07-06)

- **Re-verified 3 random usage counts by fresh grep:** ① glass class string → 20 occurrences / 8 files (`rg -o | wc -l`, `rg -l | wc -l`) — matches §4 D5. ② `text-lg font-semibold tracking-tight` → 19 / 9 files — matches C-17 table (the initial mechanical scan said 18; fresh grep found 19 — one occurrence uses the string inside a `cn()` call; report uses the verified 19). ③ `createAction` production callers → `rg -ln "createAction" src` → definition + test only, 0 prod callers — matches C-22. Additional spot-verifies during the audit: `ui/toggle` importers = 0; raw `<button>` excl. ui/tests = 80; `pluralOffers` pair at :65/:14; `budget_minor.min(1_000)` at `requests.ts:42`; verification-label pair at `admin/guides/page.tsx:33,48` ≡ `[id]/page.tsx:29,44`.
- **Zero writes outside docs/:** the only repo write in this session is this file; all scripts/intermediates live in the session scratchpad outside the repository.
- **Every cluster has file:line evidence:** C-01…C-24 each list member paths with line numbers (§4).
- **Every wave block is runnable cold:** each names goal, exact files, steps with grep probes to re-verify preconditions, verify commands, routes, done-criteria, and rollback; no step requires knowledge outside this document + the repo.
