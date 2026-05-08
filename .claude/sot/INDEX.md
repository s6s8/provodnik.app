# SOT INDEX

_One-line lookup map for orchestrator. For the 8 priority landmines see HOT.md. For full context read the source file._

## Errors (see ERRORS.md)

- ERR-001 — slug used directly in ilike data column query (destination listings returned 0)
- ERR-002 — demo role-switch bar rendered in production (no NODE_ENV guard)
- ERR-003 — wrong Unsplash hero photos in seed for Kazan / Nizhny
- ERR-004 — listing images always fall back to mountain (URL parsed from description JSON)
- ERR-005 — listingCount preferred static seed over live query
- ERR-006 — HTML `required` attr triggers browser tooltip instead of styled JS error
- ERR-007 — test guide account had no matching seed listings (guide_id mismatch)
- ERR-008 — cursor-agent rejects `claude-sonnet-4-6`; use `claude-4.6-sonnet-medium` or `auto`
- ERR-009 — `null as any` Supabase client in 7 dynamic route pages
- ERR-010 — ESLint silently broken; 47 errors accumulated
- ERR-011 — cursor-agent `.cmd` wrapper hangs silently on Windows git-bash (see ADR-010 for fix)
- ERR-012 — Node v24 blocks `spawn('.cmd', { shell: false })` with EINVAL (see ADR-010 for fix)
- ERR-013 — `bunx vitest run` hangs inside cursor-agent shell tool on Windows; use `bun run test:run`
- ERR-014 — prompts referenced `lib/*` but repo convention is `src/lib/*`
- ERR-015 — chained `cd && ls && ls || ls` hangs in cursor-agent shell on Windows
- ERR-016 — missing shadcn/ui `table` component broke Vercel build
- ERR-017 — `turbopackUseSystemTlsCerts` not a valid Next ExperimentalConfig key
- ERR-018 — Upstash Redis env var name mismatch (`STORAGE_KV_*`, not `UPSTASH_*`)
- ERR-019 — `getOpenRequests`/`getRequestById` ignored client param, used `getPublicClient()`
- ERR-020 — no direct FK from bookings to guide_profiles; PostgREST join fails
- ERR-021 — `PostgrestError` is not `instanceof Error`; use `typeof err.message === 'string'`
- ERR-022 — `todayLocalISODate` TZ-divergent (see AP-010)
- ERR-023 — mystery `* 0.8` multiplier on traveler dashboard budget
- ERR-024 — `submitRequest` accepted draft/archived listings (missing status guard)
- ERR-025 — wizard `budgetMap` wrote RUB integer to `budget_minor` (missing × 100) — see ADR-013
- ERR-026 — inbox `useEffect` skipped fetch when session resolved later; subscribe to `onAuthStateChange`
- ERR-027 — booking form catch block returned one generic message for every error code
- ERR-028 — traveler dashboard rendered empty grid instead of skeleton during initial fetch
- ERR-029 — registration white screen; JWT minted before `handle_new_user` trigger (see ADR-014)
- ERR-030 — browser `signOut()` can't clear HTTP-only SSR cookies (see ADR-015)
- ERR-031 — `getConfirmedBookings` filtered on `'pending'`; `accept_offer` inserts `'awaiting_guide_confirmation'`
- ERR-032 — QA send didn't update UI; missing optimistic setThread
- ERR-033 — `QA_MESSAGE_LIMIT` hardcoded as `8` in client component (not exported)
- ERR-034 — async server component imported into `'use client'` parent (see AP-014)
- ERR-035 — `cron.schedule` not idempotent; add `cron.unschedule` first
- ERR-036 — value import from server-only module pulls `next/headers` into client bundle (see AP-014)
- ERR-044 — PM2 on Windows + Node ESM `import.meta.url` self-detection silently fails; main() never runs (see AP-018)
- ERR-045 — [SUPERSEDED by ERR-046] Claude CLI 2.1.119 self-protects `.claude/**` writes even with `--dangerously-skip-permissions` (see AP-019)
- ERR-046 — `.claude/**` self-protect is mode-independent; allow rules + acceptEdits both fail; only path migration works (see AP-020 + ADR-024)
- ERR-047 — cursor-agent's bash tool hangs on plain `git`/`bun` invocations on Windows host (not just `cd /d/...` chains); blocks whole agent loop until wrapper timeout (see ADR-025)
- ERR-048 — `as const` INTEREST_CHIPS + Map literal type mismatch; use `Record<string, string>` + `Object.fromEntries` instead of `Map` (see homepage-discovery.tsx)
- ERR-049 — cursor-agent hallucination: reports DONE with zero file changes; detect via `git log <branch>` and apply directly (see AP-022)
- ERR-050 — cursor-agent timeout on large Server Component restructure (>150 lines, structural wrap); abort at 120s of no Edit/Write activity and apply directly
- ERR-051 — `next/font/google` TS types reject weight range syntax `"300 900"` for variable fonts; omit `weight` field entirely for variable fonts
- ERR-052 — guide/profile error boundary; createSupabaseServerClient() must be inside try/catch
- ERR-053 — cursor-agent adds JSX siblings without wrapping fragment; orchestrator wraps `<>...</>` post-edit
- ERR-054 — cursor-agent writes to main workspace regardless of --workspace; copy → commit-in-worktree → restore-main
- ERR-055 — Plan 29 cursor-agent stall on pure-delete T1; for `rm`-shaped tasks skip cursor-agent and apply directly
- ERR-056 — notFound() returns HTTP 200 when route-group layout has `await` (Next.js streaming commits to 200 before page eval); robots:noindex meta is the documented mitigation
- ERR-057 — `/listings/[slug]` page renders duplicate `<header>`/`<footer>` because page wraps content in same `SiteHeader`/`SiteFooter` that `(public)/layout.tsx` already provides — RESOLVED 034e12f
- ERR-058 — Traveler request detail shows budget ×100 (kopecks rendered as RUB) — direct AP-012 / ERR-025 reoccurrence in `(protected)/traveler/requests/[requestId]/page.tsx:66` — RESOLVED 034e12f

## Anti-patterns (see ANTI_PATTERNS.md)

- AP-001 — don't use slug directly in ilike data column queries; resolve slug → record first
- AP-002 — don't store image URLs inside text/description JSON; use dedicated column
- AP-003 — don't mix HTML `required` attr with custom JS validation
- AP-004 — don't seed listings under unreachable guide_ids
- AP-005 — don't create worktrees in the parent workspace repo; app is nested at `provodnik.app/`
- AP-010 — don't use `new Date().toISOString().slice(0,10)` for calendar dates; pin TZ via `Intl.DateTimeFormat`
- AP-011 — don't `catch {}` Supabase errors; return discriminated `{ error: code }` and map via `userMessageForError`
- AP-012 — don't inline `* 100` / `/ 100` currency math; go through `rubToKopecks`/`kopecksToRub` (see ADR-013)
- AP-013 — don't use `'qa'` as `thread_subject` enum; use `'offer'` with `offer_id` set
- AP-014 — don't import async server components or value-imports from server-only modules into `'use client'`; split constants into `*-types.ts`
- AP-015 — don't filter `traveler_requests.status` on non-existent values; enum is `open|booked|cancelled|expired`
- AP-017 — don't manually create or delete `_archive/bek-frozen-2026-05-08/logs/restart.flag`; it's the watchdog → daemon restart channel (see ADR-022)
- AP-018 — don't rely on `import.meta.url`/`argv[1]` self-detection in PM2-managed Node ESM scripts on Windows; split entrypoint into a `<x>-run.mjs` shim (see ERR-044)
- AP-019 — [SUPERSEDED by AP-020] don't rely on `--dangerously-skip-permissions` alone for `.claude/**` writes; add explicit Write/Edit allow rules to `settings.json` (see ERR-045)
- AP-020 — don't try to bypass `.claude/**` self-protect at all (allow rules, acceptEdits, hooks, Bash redirects all fail); move the write target out of `.claude/` to `_archive/bek-frozen-2026-05-08/` (see ERR-046 + ADR-024)
- AP-021 — don't include `git`/`bun` commands in cursor-agent prompts on Windows; orchestrator runs all git + verification (see ERR-047 + ADR-025)
- AP-022 — don't author plans without first running a fresh `grep -rn` for every COPY key / symbol being removed; missed callers force emergency scope expansion mid-execution
- AP-023 — when deleting a route file, grep for BOTH static `from "<path>"` AND dynamic `import("<path>")` references; static grep misses Next.js feature-flag dispatchers (Plan 45 transfer/page)

## Decisions (see DECISIONS.md)

- ADR-001 — traveler dashboard is a server component (stat cards, no client state)
- ADR-002 — guide dashboard shows stats; onboarding moved to `/guide/settings`
- ADR-003 — listings get dedicated `image_url` column (not JSON in description)
- ADR-004 — all seed changes go in one worktree to avoid merge conflicts
- ADR-005 — forgot-password deferred until Resend Custom SMTP is live
- ADR-006 — destination pages render "Гиды в этом городе" section (server-fetched, limit 6)
- ADR-007 — [SUPERSEDED by ADR-010] pivot away from cursor-agent to native Agents on Windows
- ADR-008 — map DB `awaiting_guide_confirmation` → state-machine `pending` at boundary
- ADR-009 — guide verification stepper uses real DB enum (`draft|submitted|approved|rejected`)
- ADR-010 — cursor-agent restored as primary coder via `cursor-dispatch.mjs` wrapper
- ADR-011 — Slack dev-notes ONLY via `slack-devnote.mjs` hard-gate wrapper
- ADR-012 — two-mode architecture: Биржа (bid) + Трипстер (direct book) coexist
- ADR-013 — all RUB ⇄ kopecks crossings go through `src/data/money.ts` helpers
- ADR-014 — auth registration is server-only via `signUpAction` + admin client
- ADR-015 — logout goes through `/api/auth/signout` route handler (not browser client)
- ADR-016 — traveler cabinet queries use server components + `React.cache()` + `.in('id', ids)` batch
- ADR-017 — offer acceptance is an atomic `accept_offer` SECURITY DEFINER RPC
- ADR-018 — `send_qa_message` RPC enforces 8-msg Q&A limit atomically (no TOCTOU)
- ADR-019 — `GuideOfferQaPanel` is a client component fetching via server action
- ADR-020 — request expiry runs via `pg_cron` hourly UPDATE (not triggers)
- ADR-022 — BEK self-healing via file-based restart flag (watchdog → daemon flag → PM2 autorestart, phase-aware threshold + 3/30min circuit breaker)
- ADR-024 — BEK v2: `_archive/bek-frozen-2026-05-08/` repo-root + retry wrapper + structured incidents.jsonl with bek-postmortem CLI (supersedes ERR-045 / AP-019; see ERR-046 / AP-020)
- ADR-025 — cursor-agent dispatches do file edits ONLY (Read/Edit/Write/Glob/Grep); orchestrator runs all `git` + `bun` (see ERR-047 + AP-021)
- ADR-050 — Monetization model deferred to post-launch; trigger: 100 real traveler requests OR 30 days post-launch — 2026-05-02
- ADR-051 — /tours activation deferred; trigger: 50+ completed bookings via bid-flow AND ≥2 alpha publishers — 2026-05-02
- ADR-052 — Anti-disintermediation softening deferred; trigger: 6 months post-launch OR measurable Telegram-invite rate in first chat messages — 2026-05-02
- ADR-053 — Push notification "fill specializations" deferred; trigger: 30%+ active guides have specs OR 50+ guides on platform within 60d — 2026-05-02
- ADR-054 — Defer priority hint on listing-detail hero `<Image>`; P2 perf polish — 2026-05-04 (later partially resolved by T063/T067)
- ADR-055 — Defer broken Unsplash seed image URLs; P2 visual polish — 2026-05-04 (later resolved by T070 in Plan 61)
- ADR-056 — Defer listings-search input `id`/`name` attributes; P2 a11y polish — 2026-05-04
- ADR-057 — Accept `/guide/inbox` empty-state for demo guide; intentional product behaviour — 2026-05-04
- ADR-058 — Defer guide test-credential mismatch in audit task specs (`guide@provodnik.app` vs `dev+guide@rgx.ge`); audit-tooling concern, not a product defect — 2026-05-04
