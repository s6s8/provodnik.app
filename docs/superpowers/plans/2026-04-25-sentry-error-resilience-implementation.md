# Sentry Client Error Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 3 active Sentry unhandled-rejection errors by adding an error callback to a Supabase Realtime `.subscribe()` call and wrapping two network calls in try/catch.

**Architecture:** Three surgical one-file edits, each paired with a new Vitest test file. No new dependencies, no schema changes, no behaviour changes under normal conditions. On failure each component degrades to a safe zero/stale state instead of throwing.

**Tech Stack:** Next.js 15 App Router · `@supabase/supabase-js@^2.99.1` · `@supabase/ssr@^0.9.0` · Vitest 4 · `@testing-library/react` · jsdom

**Design spec:** `docs/superpowers/specs/2026-04-25-sentry-client-error-resilience-design.md`

---

## Dependency DAG

```
Task 1 (fix/sentry-notification-bell)   ──> no deps
Task 2 (fix/sentry-unread-count)        ──> no deps
Task 3 (fix/sentry-homepage-form)       ──> no deps

All three tasks are parallel-safe.
```

## Merge order

1. Task 1 (`fix/sentry-notification-bell`) — parallel-safe
2. Task 2 (`fix/sentry-unread-count`) — parallel-safe
3. Task 3 (`fix/sentry-homepage-form`) — parallel-safe

---

## Task summary

### Task 1 — NotificationBell realtime subscribe callback
Prompt: `.claude/prompts/out/plan-sentry-task-1.md`
Summary: Adds `(status, err) => {}` callback to the `.subscribe()` call at `NotificationBell.tsx:91`. On `CHANNEL_ERROR` logs to console — SDK retries automatically. Creates `NotificationBell.test.tsx` verifying the callback is wired and does not throw. One commit.

### Task 2 — use-unread-count fetch try/catch
Prompt: `.claude/prompts/out/plan-sentry-task-2.md`
Summary: Wraps the `fetch("/api/messages/unread-count")` call at `use-unread-count.ts:24` in try/catch. On any throw, sets `unreadCount(0)` and `userId(null)`. Creates `use-unread-count.test.ts` with three cases: throw, non-ok, success. One commit.

### Task 3 — HomepageRequestForm auth.getUser try/catch
Prompt: `.claude/prompts/out/plan-sentry-task-3.md`
Summary: Wraps `supabase.auth.getUser()` at `homepage-request-form.tsx:133–143` in try/catch. On throw, treats user as unauthenticated and opens the auth gate (form data preserved via `pendingFormData`). Creates `homepage-request-form.test.tsx` verifying auth gate opens on network failure. One commit.

---

## End-to-end verification (run after all tasks merged)

- `bun run typecheck` — 0 errors
- `bun run lint` — 0 errors, 0 new warnings
- `bun run test:run` — all tests green including 3 new test files
- In Firefox: navigate to provodnik.app while logged in, block `wss://yjzpshutgmhxizosbeef.supabase.co` in DevTools → Network → no unhandled rejections in console
- Sentry check after deploy: `curl -s "https://de.sentry.io/api/0/projects/na-3z2/javascript-nextjs/issues/?query=is:unresolved&limit=10" -H "Authorization: Bearer sntryu_REDACTED_2026-05-08_see_env_local"` returns empty array

---

## Self-review checklist

- [x] Every gap in the design spec has a task that fixes it. (3 root causes → 3 tasks, 1:1 mapping.)
- [x] No cross-file collisions — all 3 tasks touch distinct files.
- [x] Every file path referenced in any task prompt has been verified on disk (see Phase R gate above).
- [x] Every Context7 citation has a real URL: `https://github.com/supabase/supabase/blob/master/examples/prompts/use-realtime.md` · `https://github.com/testing-library/testing-library-docs/blob/main/docs/dom-testing-library/api-async.mdx`
- [x] DAG matches SCOPE dependency declarations in all task prompts (all independent).
- [x] Each task VERIFICATION section has ≥3 observable-state items.
- [x] Each task DONE CRITERIA names exact branch + file count + return string.
- [x] No terminology locks declared in the design spec — skip drift check.
- [x] Out-of-scope items from spec (reconnection tuning, toast UI, other fetches) appear in no task prompt scope.

---

## Risks and rollback

| Risk | Mitigation |
|---|---|
| Vitest mock hoisting fails (vi.mock must be at module top level) | Each test file declares vi.mock before any imports — hoisting works correctly |
| NotificationBell mock query chain incomplete | Tests only exercise mount + subscribe; markRead/markAllRead require user clicks not present in tests |
| `catch {}` bare catch triggers ESLint `@typescript-eslint/no-unused-vars` | Vitest config uses `eslint-disable` if needed; bare `catch` (no binding) is valid in ES2019+ and accepted by the project's TS config |

Rollback: `git revert <commit>` per task — each is one commit on its own branch.

---

## Out of scope (deferred)

- Supabase Realtime reconnection parameter tuning (SDK handles automatically)
- Toast/UI notification of degraded realtime state
- Audit of other client-side fetch calls across the codebase beyond the 3 Sentry-confirmed failures
- Sentry `captureException` instrumentation (console.error is sufficient; Sentry already has the event)
