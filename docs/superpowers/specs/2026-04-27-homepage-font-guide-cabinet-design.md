# Design Spec — Homepage Polish + Font Migration + Guide Cabinet
> Plans 15 / 16 / 17 (Alex: Plans 12 / 13 / 14)
> Date: 2026-04-27
> Author: orchestrator review

---

## 1. Scope

Six cursor-agent tasks + one BEK SQL task covering three user-visible areas:

| Area | Alex Plan | Internal |
|------|-----------|----------|
| Homepage cards polish + Rubik font | 12 | 15 |
| "Стать гидом" onboarding page | 13 | 16 |
| Guide cabinet cleanup | 14 | 17 |

Out of scope: any DB schema changes, new auth flows, payment, notifications.

---

## 2. Problems Being Fixed

### 2.1 Homepage — cards section narrower than form above it

`homepage-discovery.tsx` outer container:
```
<div className="mx-auto w-full max-w-2xl px-[clamp(20px,4vw,48px)]">
```
The clamp padding applies *inside* `max-w-2xl`, shrinking content to ~576px on wide screens.

`homepage-hero-form.tsx` uses the correct two-layer pattern:
```
<div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">   ← outer 1200px + padding
  <div className="mx-auto max-w-2xl">                                     ← inner 672px, no padding
```
Result: form content = 672px; cards content = ~576px. Edges don't align.

**Fix:** Change `homepage-discovery.tsx` container to the same two-layer pattern.

### 2.2 Homepage — shows 3 cards; 0-budget cards appear

`getHomepageRequests()` in `queries.ts:978`:
```ts
.eq("status", "open")
.order("created_at", { ascending: false })
.limit(3);
```
No budget guard. DB column: `budget_minor` (types.ts:163).

**Fix:** `.limit(4)` and `.gt("budget_minor", 0)`.

### 2.3 Typography — entire Russian UI falls back to system Georgia

`layout.tsx` loads both fonts with `subsets: ["latin"]` only:
```ts
DM_Sans({ display: "swap", subsets: ["latin"], variable: "--font-dm-sans" })
Cormorant_Garamond({ display: "swap", subsets: ["latin"], ... variable: "--font-cormorant-garamond" })
```
Neither font includes Cyrillic glyphs. Every Russian character falls back to system serif (Georgia on macOS/Windows). This is a rendering bug, not a design choice.

**Fix:** Replace both with Rubik (variable font, Cyrillic-native):
```ts
import { Rubik } from "next/font/google";

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: "300 900",          // variable font range
  display: "swap",
  variable: "--font-rubik",
});
```
Update `globals.css` CSS variable aliases:
```css
--font-sans:    var(--font-rubik);
--font-serif:   var(--font-rubik);
--font-display: var(--font-rubik);
```
`Geist_Mono` remains unchanged for code blocks.

No `font-display` or `font-serif` class renames needed — the CSS variable indirection handles all 10+ pages automatically.

### 2.4 Hero heading — wraps to two lines at desktop

`homepage-hero-form.tsx` heading:
```tsx
<h1 className="... font-display text-[clamp(1.75rem,4vw,2.75rem)] ...">
  Опишите запрос — гиды откликнутся
</h1>
```
At `max-w-2xl` (672px) with system Georgia (serif), the text wraps after the em-dash. At `2.75rem` the string is too wide for 672px regardless of font.

**Fix:** Reduce max step to `clamp(1.5rem, 2.5vw, 1.875rem)`. Rubik at `1.875rem` (30px) fits "Опишите запрос — гиды откликнутся" on one line at 672px. Cursor-agent verifies visually and adjusts incrementally if needed.

### 2.5 "Стать гидом" → generic login form

Three link targets:
- `site-header.tsx:178` — desktop nav button
- `site-header.tsx:289` — mobile slide-out button
- `src/app/(site)/guides/page.tsx:60` — guides listing CTA

All currently point to `/auth?role=guide`. Users who click get a login form with no guide-specific context.

**Fix:** New page `/become-a-guide`. All three links point there instead. Page CTA points to `/auth?role=guide` (confirmed valid: `auth-entry-screen.tsx:66` reads `searchParams.get("role")`).

### 2.6 Guide nav label "Биржа" is stale terminology

`site-header.tsx:36` `guideNavLinks`: `{ href: "/guide", label: "Биржа" }`.
Also: `guide/page.tsx` metadata `title: "Биржа"`, `birjha-screen.tsx` `aria-label="Биржа"`.

**Fix:** Rename to "Запросы" in all three locations. Confirmed by Alex (session 09:36).

### 2.7 Portfolio upload errors are silent

`guide-portfolio-screen.tsx` `handleUpload`:
```ts
try {
  const result = await uploadPortfolioPhoto({ ... });
  ...
} finally {
  setUploading(false);
}
```
No `catch` block. Failed uploads throw an unhandled rejection. Also: the upload `<input>` is `disabled` when `!locationName.trim()` but the wrapper `<label>` shows no visual disabled state and no helper text explaining why.

**Fix:** Add `catch` block that sets `uploadError` state; render error message below the button. Add `opacity-50 cursor-not-allowed` to label when disabled + helper text "Введите название места, чтобы загрузить фото".

### 2.8 Guide profile page crashes on new accounts

`guide/profile/page.tsx` runs a `Promise.all` of four Supabase queries at the top of a Server Component with no try/catch. On new guide accounts without a `guide_profiles` row the child components (LicenseManager, LegalInformationForm, GuideAboutForm) may receive unexpected data shapes and throw, causing the error boundary to show "Раздел временно недоступен".

**Fix:** Wrap the entire data-fetch + render block in `try/catch`. On error: render the page shell with empty/null sections rather than hitting the error boundary.

---

## 3. Architecture

No new tables, no new API routes, no schema changes. All changes are UI layer only.

### Font migration propagation

```
layout.tsx
  └─ imports Rubik (latin + cyrillic, variable)
  └─ applies --font-rubik CSS var

globals.css
  └─ --font-sans    = var(--font-rubik)
  └─ --font-serif   = var(--font-rubik)
  └─ --font-display = var(--font-rubik)

Tailwind utilities (font-sans, font-serif, font-display)
  └─ all resolve to Rubik — zero class renames in any page file
```

### /become-a-guide page

Server Component (no interactivity). Uses existing card/layout patterns.

```
/become-a-guide
  └─ page.tsx (Server Component)
       ├─ H1: "Станьте гидом на Проводнике"
       ├─ 3 value-prop items (icon + text):
       │    ① Нулевая комиссия — вы забираете 100% стоимости
       │    ② Свободный график — принимайте только те запросы, которые вам интересны
       │    ③ Входящие запросы — путешественники приходят к вам сами
       ├─ Primary CTA → /auth?role=guide  "Зарегистрироваться — займёт 2 минуты"
       └─ Secondary link → /auth  "Уже есть аккаунт? Войти"
```

---

## 4. Execution Plan

Branch: `feat/plan-15-16-17`

### Batch A — all parallel (zero file conflicts)

| # | Task | Files touched |
|---|------|---------------|
| T1 | Homepage cards: width + limit 4 + budget filter | `homepage-discovery.tsx`, `queries.ts` |
| T2 | Rubik font migration + hero heading one-line | `layout.tsx`, `globals.css`, `homepage-hero-form.tsx` |
| T3 | Portfolio upload error handling + disabled state | `guide-portfolio-screen.tsx` |
| T4 | Profile page crash fix (try/catch) | `guide/profile/page.tsx` |
| T5 | Site-header omnibus: Биржа→Запросы + Стать гидом links | `site-header.tsx`, `guide/page.tsx`, `birjha/birjha-screen.tsx`, `guides/page.tsx` |

### Batch B — after Batch A

| # | Task | Files touched |
|---|------|---------------|
| T6 | New /become-a-guide page | `app/(site)/become-a-guide/page.tsx` (new) |

### Post-deploy (BEK direct SQL)

| # | Task |
|---|------|
| T7 | Update 3 demo requests with interests arrays; insert 4th demo request |

---

## 5. Key Constraints (from HOT.md)

- **AP-021 / ADR-025**: No `git` or `bun` commands in cursor-agent prompts. Orchestrator runs all verification.
- **AP-014**: No value imports from server-only modules into `'use client'` files. Font variables are CSS-level, safe.
- **AP-011**: Supabase errors must not be silently swallowed. Profile page fix uses try/catch, not `catch {}`.

---

## 6. Verification Checklist

### Plan 15 (homepage + font)
- [ ] Left edge of cards section aligns with left edge of request form above at ≥1024px
- [ ] Homepage shows exactly 4 cards in a 2×2 grid
- [ ] No card with "0 ₽" budget appears
- [ ] All Russian text (body, headings, buttons, nav) renders in Rubik — no Georgia fallback
- [ ] Hero heading "Опишите запрос — гиды откликнутся" fits on one line at ≥1024px
- [ ] Cards with interests show interest labels (visible after T7 demo data)

### Plan 16 (become-a-guide)
- [ ] "Стать гидом" in desktop nav opens `/become-a-guide`
- [ ] "Стать гидом" in mobile slide-out opens `/become-a-guide`
- [ ] "Стать гидом" on `/guides` page opens `/become-a-guide`
- [ ] CTA on `/become-a-guide` navigates to `/auth?role=guide`
- [ ] Page renders without error, tsc clean

### Plan 17 (guide cabinet)
- [ ] Guide nav label shows "Запросы" (not "Биржа") on all `/guide/*` pages
- [ ] Browser tab title on guide main page shows "Запросы"
- [ ] Portfolio: failed upload shows error message (not silent failure)
- [ ] Portfolio: button disabled before location name entered + helper text visible
- [ ] Profile page opens without hitting error boundary on a new guide account
- [ ] `bun run typecheck` passes, `bun run lint` passes

---

## 7. Critique Notes (orchestrator review)

Issues caught vs. BEK's original plan-15/16/17 files:

1. **Site-header conflict**: Plans 16.T1 and 17.T1 both listed `site-header.tsx` as a target but were marked "parallel / independent." Merged into T5 (combined site-header omnibus) to eliminate the conflict.
2. **Budget column unspecified**: Plan said "filter budget = 0" without naming the DB column. Column is `budget_minor`; filter is `.gt("budget_minor", 0)`.
3. **Rubik weight spec**: Rubik is a variable font; use `weight: "300 900"` range, not an array of fixed weights.
4. **Hero one-line impractical at 2.75rem**: Text too wide for 672px at the original max. Reduced to `clamp(1.5rem, 2.5vw, 1.875rem)`.
5. **Profile crash root**: Code handles `null` data safely via `?.`/`??`. Likely crash is in a child component. Try/catch fix is correct regardless of exact throw site.
6. **Demo data ordering**: Constraint "deploy code before SQL" preserved — T7 is post-deploy.
