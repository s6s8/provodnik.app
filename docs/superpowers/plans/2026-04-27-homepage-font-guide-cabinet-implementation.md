# Homepage Polish + Font Migration + Guide Cabinet — Implementation Plan
> **Plan 18** (internal) — supersedes plans 15/16/17 (BEK draft). Alex: Plans 12/13/14.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three visible UX areas — homepage card layout + budget filter, full Rubik font migration (critical Cyrillic rendering bug), "Стать гидом" onboarding page, guide cabinet label/crash/portfolio fixes.

**Architecture:** All changes are UI-layer only. No DB schema changes. Font migration uses `next/font/google` with CSS variable aliasing — zero class renames across the 10+ pages that use `font-display`/`font-serif`. Site-header changes from two plans are merged into one task (T5) to eliminate merge conflict.

**Tech Stack:** Next.js 15 App Router, `next/font/google` (Rubik variable font), Supabase client, Tailwind v4, TypeScript, Bun.

**Design spec:** `docs/superpowers/specs/2026-04-27-homepage-font-guide-cabinet-design.md`

**Branch:** `feat/plan-15-16-17` (all tasks share one branch)

---

## Phase R — Path Verification Table

| Cited path | On disk | Notes |
|---|---|---|
| `src/features/homepage/components/homepage-discovery.tsx` | ✅ | container bug at line 39 |
| `src/data/supabase/queries.ts` | ✅ | `getHomepageRequests` at line 969 |
| `src/app/layout.tsx` | ✅ | DM_Sans + Cormorant_Garamond Latin-only confirmed |
| `src/app/globals.css` | ✅ | `--font-sans`/`--font-serif`/`--font-display` at lines 6–8 |
| `src/features/homepage/components/homepage-hero-form.tsx` | ✅ | two-layer container at lines 12–14 |
| `src/features/guide/components/portfolio/guide-portfolio-screen.tsx` | ✅ | silent catch confirmed |
| `src/app/(protected)/guide/profile/page.tsx` | ✅ | no top-level try/catch |
| `src/components/shared/site-header.tsx` | ✅ | guideNavLinks at line 35, links at 178+289 |
| `src/app/(protected)/guide/page.tsx` | ✅ | `title: "Биржа"` at line 6 |
| `src/features/guide/components/birjha/birjha-screen.tsx` | ✅ | `aria-label="Биржа"` at line 16 |
| `src/app/(site)/guides/page.tsx` | ✅ | CTA link at line 60 |
| `src/app/(site)/become-a-guide/page.tsx` | NEW | doesn't exist — T6 creates it |

## Phase R — Gap-to-Task Mapping

| Gap identified in design review | Task that fixes it |
|---|---|
| Site-header collision (Plans 16.T1 + 17.T1 both edit site-header.tsx) | T5 — merged into one omnibus task |
| Budget filter column name unspecified | T1 — `.gt("budget_minor", 0)` |
| Rubik must use variable range `weight: "300 900"` | T2 |
| Hero heading too wide at `2.75rem`; need `clamp(1.5rem, 2.5vw, 1.875rem)` | T2 |
| Profile page crash — no top-level try/catch | T4 |
| `/auth?role=guide` confirmed valid (auth-entry-screen.tsx:66) | T6 confirmed |
| Demo data runs after deploy | T7 post-deploy |

## Phase R — Collision Resolution

| File | Conflicting plans | Resolution |
|---|---|---|
| `src/components/shared/site-header.tsx` | Plan 16 Task 1 + Plan 17 Task 1 | **Merged into T5.** T5 handles all site-header edits: rename Биржа→Запросы in nav array, update both Стать гидом links to /become-a-guide. No other task may touch site-header.tsx. |

---

## Dependency DAG

```
T1 (homepage cards width + filter) ──────────────────────────────────┐
T2 (Rubik font + hero heading)     ──────────────────────────────────┤
T3 (portfolio error handling)      ──────────────────────────────────┼──> T6 (become-a-guide page) ──> T7 (BEK SQL, post-deploy)
T4 (profile crash fix)             ──────────────────────────────────┤
T5 (site-header omnibus)           ──────────────────────────────────┘

Note: T6 has no file conflict with T1–T5, but logically depends on T5
having updated the Стать гидом links so they point to the new page.
Run T6 after T5 to avoid a brief 404 window on the new route.
```

## Merge order

1. **Tasks 1, 2, 3, 4, 5** — Batch A, fully parallel. Commit each to `feat/plan-15-16-17` independently (no file conflicts between any two tasks).
2. **Task 6** — Batch B, after all Batch A tasks committed.
3. **Task 7** — Post-deploy only. BEK runs SQL directly. No cursor-agent.

---

## Task summary

### Task 1 — Homepage cards: width alignment + 4-card limit + budget filter
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-18-task-1.md`
Summary: Fix `homepage-discovery.tsx` container from single-layer `max-w-2xl + padding` to two-layer `max-w-page + padding / max-w-2xl` — matching the form above. In `queries.ts` `getHomepageRequests`: change `.limit(3)` → `.limit(4)` and add `.gt("budget_minor", 0)` to exclude zero-budget requests. Two files, five line changes total.

### Task 2 — Rubik font migration + hero heading one-line fix
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-18-task-2.md`
Summary: In `layout.tsx`: remove `DM_Sans` and `Cormorant_Garamond` imports; add `Rubik` with `subsets: ["latin", "cyrillic"]`, `weight: "300 900"`, `variable: "--font-rubik"`. Update `html` className. In `globals.css`: remap `--font-sans`, `--font-serif`, `--font-display` to `var(--font-rubik)`. In `homepage-hero-form.tsx`: reduce hero heading clamp to `clamp(1.5rem, 2.5vw, 1.875rem)`. No class renames in any other file — CSS variable aliasing propagates automatically.

### Task 3 — Portfolio upload: error handling + disabled button state
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-18-task-3.md`
Summary: In `guide-portfolio-screen.tsx`: add `uploadError` state and `catch` block to `handleUpload` that sets the error message. Render `uploadError` below the button when set. Add visual disabled styling (`opacity-50 cursor-not-allowed`) to the label wrapper when `!locationName.trim()`, and a helper text line "Введите название места, чтобы загрузить фото" that shows only when location is empty.

### Task 4 — Profile page crash fix (try/catch)
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-18-task-4.md`
Summary: In `guide/profile/page.tsx`: wrap the `Promise.all(...)` data-fetch block in `try { ... } catch { ... }`. On catch: render the page shell with null/empty props (profile=null, licenses=[], listings=[], documents=[]) so the error boundary "Раздел временно недоступен" is never hit on new guide accounts with incomplete data.

### Task 5 — Site-header omnibus (Биржа rename + Стать гидом rewire)
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-18-task-5.md`
Summary: Four files, all surgical edits. `site-header.tsx`: rename `"Биржа"` → `"Запросы"` in `guideNavLinks` array; change both "Стать гидом" link hrefs from `/auth?role=guide` → `/become-a-guide`. `guide/page.tsx`: metadata `title: "Запросы"`. `birjha-screen.tsx`: `aria-label="Запросы"`. `guides/page.tsx` line 60: link href → `/become-a-guide`. No logic changes.

### Task 6 — New /become-a-guide page
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-18-task-6.md`
Summary: Create `src/app/(site)/become-a-guide/page.tsx` as a Server Component. Export `metadata` with `title: "Стать гидом"`. Content: H1 "Станьте гидом на Проводнике", three value-prop items (нулевая комиссия / свободный график / входящие запросы), primary CTA → `/auth?role=guide` labelled "Зарегистрироваться — займёт 2 минуты", secondary link → `/auth` labelled "Уже есть аккаунт? Войти". Use existing glass-card / layout patterns. No new components.

### Task 7 — Demo data SQL (BEK direct, post-deploy)
No cursor-agent prompt. BEK runs directly in Supabase SQL editor after deploy:
1. Update 3 existing `traveler_requests` rows: set `interests` arrays with 2-3 values each (from the platform's INTEREST_CHIPS keys: `history`, `architecture`, `nature`, `gastronomy`, `active`, etc.).
2. Insert 1 new `traveler_requests` row with status=`open`, `budget_minor > 0`, `interests` populated.

---

## End-to-end verification (after all tasks merged)

- [ ] Left edge of "Запросы путешественников" cards aligns with left edge of the request form at ≥1024px viewport
- [ ] Homepage shows exactly 4 cards in 2×2 grid; no card with "0 ₽" appears
- [ ] All Russian text on every page renders in Rubik (no system Georgia fallback) — check body, headings, buttons, nav labels
- [ ] Hero heading "Опишите запрос — гиды откликнутся" fits on one line at ≥1024px
- [ ] "Стать гидом" in desktop nav → `/become-a-guide` (not `/auth`)
- [ ] "Стать гидом" in mobile slide-out → `/become-a-guide`
- [ ] "Стать гидом" on `/guides` page → `/become-a-guide`
- [ ] `/become-a-guide` CTA → `/auth?role=guide`; page renders without error
- [ ] Guide nav label shows "Запросы" on all `/guide/*` pages; browser tab title "Запросы"
- [ ] Portfolio: failed upload shows error message; location-empty state shows helper text + disabled styling
- [ ] Guide profile page opens without error boundary on a new guide account
- [ ] `bun run typecheck` — 0 errors
- [ ] `bun run lint` — 0 errors, 0 new warnings
- [ ] (After T7) Homepage cards show interest labels

---

## Self-review checklist

- [x] Every gap in the design spec's gap list has a task that fixes it. Mapping table above.
- [x] Every cross-file collision has an explicit resolution sentence in every affected task prompt (T5 omnibus).
- [x] Every file path referenced in any task prompt has been Glob-verified. Path table above.
- [x] Every Context7 citation has a real URL. Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/02-components/font.mdx
- [x] DAG above matches the SCOPE dependency declarations in every task prompt.
- [x] Each task VERIFICATION section has ≥3 observable-state items.
- [x] Each task DONE CRITERIA names exact branch + file count + return string.
- [x] No terminology locks declared in design spec requiring rg check.
- [x] No task references out-of-scope items (DB schema, auth flows, payments, notifications).

---

## Risks and rollback

| Risk | Mitigation |
|---|---|
| Rubik fails to load (network/CDN) | `display: "swap"` ensures text renders in fallback; Next.js self-hosts font files at build time — no CDN dependency |
| Hero heading still wraps at certain viewports | cursor-agent instructed to verify at 1024px and reduce max clamp step if needed |
| Profile page catch masks a real DB error | catch logs the error to console (not swallowed); renders page with empty sections, not a blank |
| Portfolio error state not dismissed on retry | error state reset to null at start of handleUpload |
| `/become-a-guide` briefly 404s if T6 deploys before T5 | Run T5 commit before T6 commit on same branch — single deploy covers both |

Rollback: `git revert <commit-sha>` per task. Each task is one commit on `feat/plan-15-16-17`.

---

## Out of scope (deferred)

- DB schema changes of any kind
- New auth flows or role-guard changes
- Payment, notifications, Sentry
- Any page not explicitly listed in task SCOPE sections
- Mobile-specific layout QA (separate plan)
- Lighthouse audit (separate plan)
