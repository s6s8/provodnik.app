# Merged: Security Fixes + Plan A (Request Form Rework)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans

**Goal:** Fix 2 CodeQL security alerts AND implement Alex's 9 approved request form changes from BEK Plan A — all in one atomic execution.

**Architecture:** Security tasks first (no DB, fully independent). Then DB migration. Then backend schema/data layer. Then UI. Then auth phone. Then display updates. Commit every logical group. Push once at the end.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod, react-hook-form, Supabase PostgREST, react-markdown (new), Vitest, Tailwind.

---

## Critique & decisions

| BEK said | Decision | Why |
|---|---|---|
| Multi-step wizard (request-wizard.tsx) | Single-page form, add fields | YAGNI — 9 items don't require wizard |
| `photo` chip → `religion` chip | Add `religion` to experienceType list | `photo` never existed; religion is additive |
| Remove endDate entirely | Auto-set `ends_on = starts_on` in action | DB column stays, single-day excursions |
| Wrong file paths (`src/features/requests/...`) | Correct to actual paths | BEK doesn't have codebase access |
| Phone mask library | Plain `type=tel` input | YAGNI — no masking dep needed |

---

## File map

| Action | File |
|---|---|
| CREATE | `src/lib/auth/safe-redirect.ts` |
| CREATE | `src/lib/auth/safe-redirect.test.ts` |
| MODIFY | `src/app/(auth)/auth/confirm/route.ts` |
| CREATE | `src/lib/seo/json-ld.ts` |
| MODIFY | `src/app/(site)/destinations/[slug]/page.tsx` |
| MODIFY | `src/app/(site)/guide/[id]/page.tsx` |
| MODIFY | `src/app/(site)/guides/[slug]/page.tsx` |
| MODIFY | `src/components/help/HelpArticle.tsx` |
| MODIFY | `package.json` (add react-markdown) |
| CREATE | `supabase/migrations/20260420000001_plan_a_time_fields.sql` |
| MODIFY | `src/lib/supabase/requests.ts` |
| MODIFY | `src/lib/supabase/types.ts` |
| MODIFY | `src/data/traveler-request/schema.ts` |
| MODIFY | `src/app/(protected)/traveler/requests/new/actions.ts` |
| MODIFY | `src/features/traveler/components/request-create/traveler-request-create-form.tsx` |
| MODIFY | `src/features/auth/actions/signUpAction.ts` |
| MODIFY | `src/features/auth/components/auth-entry-screen.tsx` |
| MODIFY | `src/data/supabase/queries.ts` |
| MODIFY | `src/features/guide/components/requests/guide-request-detail-screen.tsx` |
| MODIFY | `src/app/(protected)/traveler/requests/[requestId]/page.tsx` |

---

## Tasks

### T1 · safeRedirectPath + tests (Security Alert #1)
### T2 · Apply safeRedirectPath to confirm route
### T3 · Extract serializeJsonLd + install react-markdown + rewrite HelpArticle (Security Alert #2)
### T4 · DB migration: start_time + end_time on traveler_requests
### T5 · Update requests.ts: schema + insert + SELECT_COLS
### T6 · Update types.ts: TravelerRequestRow
### T7 · Update traveler-request/schema.ts: mode, times, groupMax, religion
### T8 · Update createRequestAction
### T9 · Rewrite request create form
### T10 · Phone field: signUpAction + auth-entry-screen
### T11 · Update RequestRecord + mapRequestRow (queries.ts)
### T12 · Guide request detail: add time display
### T13 · Traveler request detail page: green banner + time display
### T14 · Full gate + push + Slack + Telegram
