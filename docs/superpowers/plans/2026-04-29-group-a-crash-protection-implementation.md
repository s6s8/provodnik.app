# Group A Crash Protection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap `createSupabaseServerClient()` + data queries in try/catch on four public entry pages so that any Supabase initialisation failure renders an empty fallback state instead of an error boundary.

**Architecture:** Each affected Server Component pre-declares its data arrays as empty defaults before the try block. The try block assigns to those variables on success. The JSX render lives outside the try, so it always executes — with real data on success or with empty arrays on failure. No new components or data-fetching paths are introduced.

**Tech Stack:** Next.js 15 App Router, Server Components, `@supabase/ssr` via project helper `createSupabaseServerClient`.

**Design spec:** `_archive/bek-frozen-2026-05-08/prompts/out/plan-27-design.md`

---

## Dependency DAG

```
T1 (destinations) ──┐
T1 (listings)    ──┤──> single commit on fix/plan-27-t1
T1 (guides)      ──┤
T1 (homepage)    ──┘
```

All four edits are in one task / one branch. No inter-task dependencies.

## Merge order

1. T1 — all four files in one commit on `fix/plan-27-t1` → merge to `main`

---

## Task summary

### Task 1 — Crash protection: wrap Supabase calls in try/catch (4 public pages)
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-27-task-1.md`

Applies the same 5-line try/catch pattern to:
- `src/app/(site)/destinations/page.tsx` — variables already pre-declared; wrap lines 17–19
- `src/app/(site)/listings/page.tsx` — variable already pre-declared; wrap supabase init + getActiveListings
- `src/app/(site)/guides/page.tsx` — extract `readAuthContextFromServer()` from `Promise.all` (it's safe outside try); wrap supabase init + getGuides
- `src/app/(home)/page.tsx` — pre-declare `destinations` and `requests` arrays; wrap supabase init + `Promise.all`; move JSX return outside try

No new imports. No new components. No DB changes.

---

## End-to-end verification (run after task merged)

- `bun run typecheck` — 0 errors
- `bun run lint` — 0 errors
- Open `/` in browser as guest at 1280px — page renders, no red console errors
- Open `/listings` in browser as guest at 1280px — catalog or empty state renders, no red console errors
- Open `/guides` in browser as guest at 1280px — guide grid or "Гиды скоро появятся" renders, no red console errors
- Open `/destinations` in browser as guest at 1280px — grid or "Пока нет доступных направлений." renders, no red console errors

---

## Self-review checklist

- [x] Every gap in the design spec has a task. Mapping: all 4 ERR-052-pattern pages → T1.
- [x] No cross-file collisions (T1 owns all 4 files exclusively).
- [x] All file paths Glob/bash-verified as existing.
- [x] Context7 citation has real URL: https://context7.com/supabase/ssr/llms.txt
- [x] DAG matches SCOPE dependency declarations in task prompt.
- [x] Task VERIFICATION section has ≥3 observable-state items.
- [x] Task DONE CRITERIA names exact branch + file count + return string.
- [x] No terminology locks declared in design spec — terminology check skipped.
- [x] Out-of-scope items (/tours, /help, /search, mobile) not referenced in task scope.

---

## Risks and rollback

| Risk | Mitigation |
|---|---|
| Homepage pre-declared types mismatch `HomePageShell2` props | cursor-agent reads `HomePageShell2` props before writing; types are inferred from existing usage pattern |
| `/guides` refactor extracts `readAuthContextFromServer()` from Promise.all — changes execution order | `readAuthContextFromServer()` has no dependency on `supabase`; sequential execution is fine and actually safer |
| Empty array renders expose unfinished empty states | Empty states already coded in all 4 components (verified in code review) |

Rollback: `git revert <commit-sha>` on the single commit that T1 produces.

---

## Out of scope (deferred)

- `/tours` stub (not in main nav, low traffic risk)
- `/help` feature flag gate (not in main nav)
- `/search` nav linkage audit
- Mobile version — covered by Plan 26
- Cabinet pages (traveler, guide, admin) — Groups B–H, future plans
- Visual redesign of any Group A page
