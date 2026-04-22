# Homepage2 — Диалог Concept Design Spec

_Date: 2026-04-22 | Status: approved for implementation_

---

## Goal

Replace the current homepage hero and middle sections with a "Диалог" concept: a full-bleed hero where the traveler fills a natural-language sentence describing their trip, submits it as a request to all active guides, and lands on a confirmation screen that makes the Биржа mechanic feel real and exciting. Keep `HomePageGuideAcquisition` and `SiteFooter` unchanged.

---

## What We Are Building

### New page route (test before replacing `/`)
`/home2` — parallel route so current homepage stays live during development.

### New shell: `HomePageShell2`
```
HomePageHero2        ← client component, slot interaction
HomePageDiscovery    ← server component, 3 open-request cards
HomePageGuideAcquisition  ← unchanged
SiteFooter           ← unchanged
```

Everything currently between Hero and GuideAcquisition (`HomePageTwoWays`, `HomePageGateway`, `HomePageDestinations`, `HomePageProcess`, `HomePageTrust`) is removed from the new shell. Original shell stays untouched.

---

## Architecture Decisions

### A. Request created before confirmation screen (Option A)
The DB write happens immediately on submit. The sent screen shows a live request. "It's broadcasting right now" is honest. This matches the existing action pattern (`createRequestAction` already does `redirect` after DB write).

### B. No blocking details screen
The 3 hero slots (destination + duration + companion) provide enough data to create a valid DB row. Budget and notes are optional in the schema. Users land on the sent screen immediately — enrichment is available inline on that screen, non-blocking.

### C. Auth via redirect, not inline modal
If user is not logged in when they hit submit, store params in URL (`?destination=X&duration=3d&companion=пара`), redirect to `/auth?redirect=/traveler/requests/quick?...`. After auth, Next.js redirect param brings them back. No custom modal scope.

### D. New `createQuickRequestAction` — separate from existing wizard
The existing 3-step wizard action is untouched. New lightweight action reads destination + duration + companion, maps to DB fields with sane defaults, writes request, redirects to sent screen.

### E. Destination picker is supply-driven
Only cities from `listings WHERE status = 'published'` appear in the picker. New query `getActiveGuideDestinations()`. Auto-populates as guides onboard. No admin curation.

### F. `/home2` → swap to `/` only after review
Dev at `/home2`. Once approved, `app/(site)/page.tsx` switches to `HomePageShell2`.

---

## Data Layer

### New query: `getActiveGuideDestinations()`
```sql
SELECT city AS name, region, COUNT(DISTINCT guide_id) AS guide_count
FROM listings
WHERE status = 'published' AND city IS NOT NULL
GROUP BY city, region
HAVING COUNT(DISTINCT guide_id) >= 1
ORDER BY guide_count DESC
LIMIT 50
```
Returns `{ name: string, region: string, guideCount: number }[]`.
Fetched server-side in `home2/page.tsx`, passed as prop to `HomePageHero2`.

### Fix: real `offerCount` for homepage cards
Current mapper hardcodes `offerCount: 0`. New `getHomepageRequests()` function joins with offers:
```sql
SELECT tr.*, COUNT(o.id) AS offer_count
FROM traveler_requests tr
LEFT JOIN offers o ON o.request_id = tr.id
WHERE tr.status = 'open'
GROUP BY tr.id
ORDER BY tr.created_at DESC
LIMIT 3
```
Returns 3 open requests with real offer counts.

### New query: `getSimilarRequests(destinationSlug, excludeId)`
For the sent screen Zone 4. Fetches up to 3 open requests matching the same destination slug, excluding the just-created request. Falls back to most-recent open requests if no destination match.

---

## Components

### `HomePageHero2` — `'use client'`

**Props:** `destinations: { name: string, region: string, guideCount: number }[]`

**State:**
```ts
selectedDestination: string | null
selectedDuration: '1-2d' | '3-5d' | '7d' | '14d' | 'custom' | null
selectedCompanion: 'solo' | 'pair' | 'friends' | 'kids' | 'group' | null
activeSlot: 'destination' | 'duration' | 'companion' | null
isPending: boolean
```

**Visual:** Full-bleed background image (same Unsplash mountain URL as current hero), dark overlay (60% opacity). Height: `min-h-screen`. All text white.

**Sentence:** Large handwritten-style font (Kalam or existing display font), centered:
> "Хочу в **[_Алтай_]** на **[_3–5 дней_]** **[_с подругой ▾_]**"

Each slot is a `<button>` inline. Empty slots show underlined placeholder. Filled slots highlight in brand red (`bg-primary text-white rounded px-2`).

**Slot pickers:**
- Destination: search input + scrollable list showing `name (N гидов)`. Filters client-side as user types.
- Duration: horizontal chip row: `1–2 дня` / `3–5 дней` / `неделю` / `2 недели` / `свой вариант`. "Свой вариант" shows a simple date range input (two `<input type="date">` fields).
- Companion: chip row: `один` / `пара` / `с друзьями` / `с детьми` / `группа`.

**Submit:** CTA button `→ Отправить гидам` (disabled until destination filled). Below: ghost link `Смотреть готовые туры →` → `/listings`. Micro-copy: `обычно 4–7 предложений за 24 часа`.

**On submit (logged in):** calls `createQuickRequestAction` via form action. Shows spinner on button.

**On submit (not logged in):** `window.location.href = '/auth?redirect=/traveler/requests/quick?destination=X&duration=Y&companion=Z'`

Auth status checked client-side via `createSupabaseBrowserClient().auth.getUser()` on mount.

---

### `HomePageDiscovery` — server component

**Props:** `requests: RequestRecord[]` (3 items, with real `offerCount`)

**Visual:** White background. Section label: `вот что сейчас обсуждают другие` (small, muted, uppercase). Desktop: 3-column row. Mobile: stacked.

**Card design (sketch/notebook style):**
- Border: `border border-foreground/15`
- Shadow: `shadow-sm`
- Background: white
- Top: quoted sentence in display/handwritten font: `"Алтай, 5 дней, бюджет 60 тыс."`
- Derived from: `${destination}, ${dateLabel}, бюджет ${budgetLabel}`
- Middle: `↳ ${offerCount} ответов гидов` in muted small text
- Bottom right: `открыть →` link to `/requests/[id]`

---

### Sent Screen — `app/(protected)/traveler/requests/[requestId]/sent/page.tsx`

Server component. Fetches request by `requestId` + similar requests.

**Zone 1 — The moment**
Centered. Animated pulse dot (CSS `animate-pulse`, brand red). Heading: `Запрос отправлен!`. Sub: `Гиды получат уведомление и начнут предлагать варианты`.

Below: the request rendered as a sentence card — same handwritten font. `"Хочу в [destination] на [dateLabel] [companion]."` Reads back exactly what they said.

**Zone 2 — Enrich (collapsed by default)**
`'use client'` island (`SentScreenEnrich` component). Toggle link: `Добавить детали ↓`.

When expanded:
- Budget chips (до 10к / 10–30к / 30–60к / от 60к) → calls `updateRequestDetailsAction` on click, optimistic update
- Notes textarea (280 chars max) → debounced auto-save via `updateRequestDetailsAction`
- No submit button. Changes save silently.

**Zone 3 — What happens next**
Three numbered steps (inline, no accordion):
1. Гиды видят ваш запрос прямо сейчас
2. Каждый предложит программу и цену — обычно за 2–24 часа
3. Вы выбираете лучшее предложение и подтверждаете поездку

**Zone 4 — Похожие запросы**
Heading: `Или присоединитесь к похожей поездке`. 2–3 cards (same sketch style as `HomePageDiscovery`). Fetched by `getSimilarRequests`. If none: section hidden.

**Zone 5 — CTA**
Primary button: `Смотреть входящие предложения` → `/traveler/requests/[requestId]`
Ghost link: `К моим запросам` → `/traveler/requests`

---

### `createQuickRequestAction` — new server action

File: `src/app/(protected)/traveler/requests/quick/actions.ts`

**Input mapping:**
```
destination  → destination (string, required)
duration     → starts_on (today + 14d default), ends_on (starts_on + N)
  '1-2d'     → +1 day
  '3-5d'     → +3 days
  '7d'       → +7 days
  '14d'      → +14 days
  custom     → parsed from customStart / customEnd params
companion    → participants_count + open_to_join + format_preference
  'solo'     → count=1, open_to_join=false, format='private'
  'pair'     → count=2, open_to_join=false, format='private'
  'friends'  → count=3, open_to_join=true,  format='group'
  'kids'     → count=2, open_to_join=false, format='private'
  'group'    → count=4, open_to_join=true,  format='group'
```

**Defaults:** `budget_minor=0`, `notes=null`, `interests=[]`, `allow_guide_suggestions=true`, `region=null`

**On success:** `redirect('/traveler/requests/${id}/sent')`

**On failure:** returns `{ error: string }` — hero shows inline error toast.

---

### `updateRequestDetailsAction` — new server action

File: `src/app/(protected)/traveler/requests/[requestId]/sent/actions.ts`

Updates `budget_minor` and/or `notes` on an existing request. Verifies ownership (request.traveler_id === user.id) before writing. Returns `{ ok: true }` or `{ error: string }`.

---

## Route for quick-request pickup after auth

When user was not logged in, they go to:
`/auth?redirect=/traveler/requests/quick?destination=Алтай&duration=3d&companion=pair`

After auth succeeds, the auth callback redirects to the full URL. The `/traveler/requests/quick` page reads query params and calls `createQuickRequestAction` server-side. Redirects to sent screen.

File needed: `src/app/(protected)/traveler/requests/quick/page.tsx`
A server page that reads `searchParams`, calls the action, and redirects. No UI — pure redirect logic.

---

## Out of Scope

- Changes to existing 3-step wizard (`RequestWizard`, `StepDestination`, `StepInterests`, `StepDetails`)
- Changes to existing homepage shell or `/` route (until `/home2` is approved)
- Swapping `/` to use new shell (post-review step, done manually)
- Push notifications to guides (existing trigger handles this)
- Payment or booking flow
- Mobile date picker improvements (use native `<input type="date">`)
- Destinations table admin sync

---

## Self-Review

- No TBDs or incomplete sections
- Option A/B/C/D decisions all explicit
- Auth flow covers both logged-in and logged-out paths
- `offerCount` fix is scoped to new homepage query, not the shared mapper (no regressions)
- `createQuickRequestAction` is additive — existing wizard action untouched
- Sent screen has a client island (`SentScreenEnrich`) within a server page — RSC boundary respected
- Duration → dates mapping uses "today + N" which is approximate; acceptable since guides see destination and offer specific dates in their bids
- Companion → DB field mapping fully specified, no ambiguity
- `/traveler/requests/quick/page.tsx` is a pure redirect page — no UI surface, minimal risk
