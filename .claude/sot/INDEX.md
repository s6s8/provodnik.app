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
- ERR-059 — tripster-v1 e2e specs hard-code seed users (`traveler1@/guide1@`, password `testpass123`) that never existed; real seed is `traveler@/guide@/admin@` with `Travel1234!/Guide1234!/Admin1234!`. All 6 specs `test.skip`-gated 2026-05-10. Bek ticket: `docs/qa/2026-05-10-e2e-spec-rot-fix.md`. **Layer 1 RESOLVED 2026-05-11 (provodnik 10b0e5a)**: 7-file diff (new tests/e2e/fixtures.ts exporting typed SEED_USERS const + 6 spec files importing it + role-correct credential swaps). Shipped autonomously through the bot from `/new` to DONE — first non-trivial product refactor ticket end-to-end (session 20260510-fix-err-059-layer-euk5). Layers 2 (form selectors `[name=]` vs shadcn `#id`) + 3 (data-testid defensiveness in specs) still OPEN; tackle as follow-up tickets, each unskipping one spec at a time.
- ERR-063 — orchestrator verify-decide stage ignored e2e=false in verify results; advanced to SHIP_GATE on a session where playwright reported 5 spec failures, claiming "Typecheck and lint both passed cleanly". RESOLVED 2026-05-11 (quantumbek 05a2095): 15-verify-decide.mjs now iterates ALL keys of verify.results and ESCALATEs on any non-true non-'missing' value; Sonnet user prompt surfaces every step dynamically. +4 unit tests + ERR-063 regression test. Production-validated 2026-05-11 via session 20260510-add-one-line-top-pdpr (all-green PASS path).
- ERR-062 — orchestrator dispatch stage's diff capture was empty even when cursor-agent edited files (git diff main...HEAD ran against the worktree before any commit existed). RESOLVED 2026-05-11 (quantumbek eda07b4): git-ops.mjs gains commitWorktree({worktreePath, message}) (using `-F <tempfile>` for Windows-safe multi-line messages); 12-dispatch.mjs calls it between runCursor and getWorktreeDiff. PASS result now includes committed/commitSha. +5 git-ops tests + 2 dispatch regression tests. Production-validated 2026-05-11 via session 20260510-add-one-line-top-pdpr (committed=true, sha=5b9b6763, 10-line diff captured).
- ERR-061 — orchestrator advanced past CONSISTENCY on empty diff (with non-empty fileScope) without escalating; trivially passed VERIFY → SHIP_GATE on broken state. RESOLVED 2026-05-11 (quantumbek f252a05): 13-consistency.mjs reads session.artifacts.plan.fileScope and ESCALATEs on empty-diff + non-empty-scope. Empty fileScope (docs/meta tasks) still PASSes. +3 consistency tests.
- ERR-060 — orchestrator RESEARCH stage was codebase-blind. RESOLVED 2026-05-11 (quantumbek 1bc8299): hybrid architecture per ADR-059 — PROJECT_MAP + PATTERNS-SUMMARY (via summarizePatterns lib) inlined in the RESEARCH user prompt; Read/Grep/Glob exposed via `--allowed-tools` + `--add-dir <projectPath>`. Phase 7.1 spike (orchestrator/scripts/spike-claude-tools.mjs) verified claude CLI honors the flags under `--setting-sources ''` (sentinel test confirmed real file Read). Phase 7.8 escalationKind discriminator (missing_info / ambiguous_ticket) routes missing_info through RESEARCH_RETRY (capped by RETRY_MAX). Production-validated 2026-05-11 via session 20260510-add-one-line-top-pdpr — bot self-discovered `src/app/(home)/page.tsx` (NOT the stale `(site)/` path in PROJECT_MAP) via tools, no submitter path paste.
- ERR-064 — orchestrator DISPATCH worktreePath/worktreeBranch/commitSha + SHIP runner `out.sha` never propagated to session top-level; SHIP fell through to stubShip on every clean ticket; /devnote draft always errored with "no shippedSha recorded". RESOLVED 2026-05-11 (quantumbek eab344e): driver.mjs after artifact-persist copies DISPATCH worktree fields + SHIP sha to session; SessionSchema adds optional dispatchCommitSha (Zod silent-strip avoidance); runShip gets execFn:gitExecFn injection so unit tests can mock. Suite 263/263 (M4 +4 propagation assertions). Production-validated 2026-05-11 via session 20260510-add-one-line-top-47hq — provodnik.app/main 6759c6e → 793054e, /devnote sent to #provodnik-dev-notes ts=1778453759.448479. Closes GATE-7 criterion #7 (devnote round-trip on real ship).
- ERR-065 — ESCALATED sessions had no clean recovery path; /override only fired _PROCEED for gate states, /resume approve required shippedSha (post-ship only), so every pre-ship escalation forced /resume abort + fresh /new. RESOLVED 2026-05-11 (quantumbek 16c3e65): new bot/lib/override-recovery.mjs#classifyOverride applies safety bar (HARD_STOP/dep-file/cap → /resume-abort redirect; clarification → Refine-button redirect) and otherwise picks recovery target from escalatedFrom (spec-side → BRAINSTORM/PLAN/RESEARCH; dispatch/verify-side → DISPATCH; ship-side → SHIP; post-work → POST_WORK). SessionSchema adds optional escalatedFrom; driver captures it at both escalation paths. Suite 263 → 273 (+10 override-recovery + 1 driver capture). All recovery targets cross-checked against transitions.mjs ESCALATED allow-list. Closes Phase 8 candidate #3 + memory feedback_ship_gate_escalate_recovery_gap.md.
- ERR-066 — sessions ABORTED/ABANDONED after DISPATCH left .worktrees/task-<sid>/ + task/<sid> branch behind; accumulated on mini between sessions. RESOLVED 2026-05-11 (quantumbek 8e5bed1): new git-ops.mjs#deleteTaskBranch (idempotent — "not found" returns deleted:false instead of throwing); drivePipeline post-loop cleanup fires on terminal-abort states; bot.mjs manual abort paths now call continuePipeline so cleanup runs uniformly. Suite 273 → 277 (+3 git-ops + 1 driver). Proactive — exercises on next cancel-after-dispatch.
- ERR-067 — POST_WORK stage wrote new content to .claude/sot/PATTERNS.md / HOT.md / ERRORS.md but did not git-add/commit, leaving the main checkout dirty after every substantive ship. RESOLVED 2026-05-12 (quantumbek `2a106d1`, Phase 9.7): new git-ops.mjs#commitSotAdditions({projectPath, sessionId, execFn}) — idempotent: clean .claude/sot/ → no-op; dirty → git add .claude/sot/ + commit `chore(sot): codify pattern from <sid>` + push, push wrapped to capture failure without throwing. 18-post-work.mjs invokes it after the additions loop (best-effort: failure attaches to return as sotCommit.error, never escalates). Suite 350 → 356 (+6).
- ERR-068 — Vercel prod deploys 1dkkm16dp + p7jj3douu failed with "git provider HTTP 500 cloning the repo" on commits 5d6cd72 + 9ff5044. Transient GitHub hosting hiccup, NOT a code issue. RESOLVED 2026-05-11 by pushing empty commit `4d299c1` to refire the webhook — subsequent build green (provodnik-6kji0tj8t ● Ready 1m). Workaround pattern: `git commit --allow-empty -m "chore(ci): retrigger"` + push; don't chase phantom code bugs when the clone step itself fails.
- ERR-069 — `/think-cancel` silently no-op'd in production. ACTUAL ROOT CAUSE found 2026-05-12 via diagnostic log: Telegram's bot-command entity parser stops at the first non-word char, so `/think-cancel` arrives as entity `bot_command=/think` + literal text `-cancel`. grammY's `bot.command('think')` registration swallows it BEFORE `bot.on('message')` can route to `onTopicMessage`. `onThink` then early-returns at the General-topic guard (think topic ≠ General). The Phase 9.8 loose-regex defensive fix in `onTopicMessage` (commit `b721e53`) never executed in production because the message never reached that path. RESOLVED 2026-05-12 (quantumbek `9b4baf2`, Phase 9.9): top of `onThink` re-dispatches the hyphenated variants — `/think-cancel(@bot)?(\s|$)` → `onTopicMessage` (→ `handleThinkCancel`), `/think-list(@bot)?(\s|$)` → `onOwnerCommand`. Production-validated: fresh `/think-cancel` on topic 279 flipped state from `OPEN` → `CANCELLED` at 2026-05-12T01:44:27Z. The Phase 9.8 loose-regex + zero-width strip in `onTopicMessage` retained as belt-and-suspenders defense for hand-typed variants. Test-coverage gap noted: existing `/think-cancel` e2e test uses `handleUpdateForTest` which routes through its own dispatcher, NOT through grammY's `bot.command` middleware — passed under false premise. Follow-up: rewrite `handleUpdateForTest` to mirror grammY production behaviour (larger refactor) OR expose `onThink` for direct testing.

- ERR-070 — RESOLVED 2026-05-12 (qmtbek dfbed24) — grammY bot.command(epic) swallowed hyphenated /epic-{abort,done,pause,resume}; re-dispatch fix mirrors ERR-069/think-cancel; promoted to HOT.md

- ERR-071 — RESOLVED 2026-05-12 (qmtbek a236f6a) — /fire never called continuePipeline; child FSM stuck in ROUTE
- ERR-072 — OPEN — Cyrillic-only title → gibberish slug for child topic name (cosmetic, slugify ASCII-strip)
- ERR-073 — OPEN — editMessageText 'message not modified' log noise (suppress this specific 400 in catch)
- ERR-074 — OPEN — sanitize-reply substring substitution mangles paths mid-token (need word-boundary)
- ERR-075 — OPEN — back-report dumps raw JSON ship artifact instead of clean one-line summary
- ERR-076 — RESOLVED 2026-05-12 (qmtbek 5a58f2c) — ✅/❌ reactions REACTION_INVALID in provodnik chat; only 👀 used now
- ERR-077 — RESOLVED 2026-05-12 (qmtbek 6b6d431) — Telegram messages displayed raw Markdown; fixed via parse_mode HTML + markdownToTelegramHTML converter
- ERR-078 — RESOLVED 2026-05-13 (qmtbek 36dec2c) — bot stopped polling silently under pm2 on stale answerCallbackQuery 400 (no bot.catch + no try/catch); fixed via ackCb helper + bot.catch registration
- ERR-079 — RESOLVED 2026-05-13 (qmtbek 14f6370) — orphan session ABORTED transitioned silently in its own forum topic (back-report skipped when no parentEpicId); fixed via new terminal-notify block in driver.mjs + abortReason capture in /override and /resume
- ERR-080 — RESOLVED 2026-05-14 (qmtbek 3dbb9ec) — kodex-capture test hardcoded 2026-05-12 date; fixed by importing todayMoscowISODate and computing TODAY at module-load
- ERR-081 — RESOLVED 2026-05-14 (qmtbek pending) — operator-level scripts and one-off curl sendMessage bypassed sanitize+format pipeline, leaked stage names + cursor-agent + owner name to worker-visible chat (msg 849); fixed via new bot/lib/worker-comms.mjs helper

- ERR-095 — AP-012 regex false-positive: `_minor` matched inside SELECT column strings (narrowed to require adjacent arithmetic operator) — see ERR-095 / AP-037

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
- AP-024 — every Telegram api.answerCallbackQuery call must be try/catch wrapped (stale-callback 400 is normal); every grammY bot must register bot.catch before bot.start() — otherwise polling stops silently under pm2 (ERR-078 lesson)
- AP-025 — every terminal session transition (ABORTED/ABANDONED) must produce a worker-visible message in session.topicId; route writes through continuePipeline so driver.mjs ERR-079 block fires; new optional session fields must be declared in SessionSchema Zod or safeParse silent-strips on load (ADR-061)
- AP-026 — gate button taps must produce a visible message edit (stamp + remove keyboard); answerCallbackQuery toast alone is invisible on mobile and drives repeat taps + stale-callback errors (F1 / Alex 2026-05-13 lesson)
- AP-027 — single-backtick `inline code` for short paste-and-run commands; reserve ```triple-backtick``` for multi-line code only — mobile Telegram copies inline code cleanly, triple-backtick can copy as image on Android (F2 / Alex 2026-05-13 lesson)
- AP-028 — bot allocates a worker-facing short ID (T-NN sessions, E-NN epics) at intake via monotonic per-app counter; long sessionIds (20260513-160-px-96-px-g00m) are unworkable in conversation, workers invent parallel numbering otherwise (F4 / Alex 2026-05-13 lesson)
- AP-029 — operator-level scripts must use bot/lib/worker-comms.mjs (sendWorkerMessage / editWorkerMessage) for any worker- or owner-facing Telegram send; raw api.sendMessage from scripts/* bypasses sanitize+format and leaks internal jargon (ERR-081 lesson)

- AP-037 — consistency-rule regex matched symbol outside arithmetic context (operation-anchored vs symbol-anchored)

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
- ADR-059 — Hybrid codebase-awareness in orchestrator RESEARCH: PROJECT_MAP + PATTERNS-SUMMARY inlined + Read/Grep/Glob via `--allowed-tools` + `--add-dir`; missing_info escalations retry RESEARCH (bounded), ambiguous_ticket escalates immediately — 2026-05-11 (closes ERR-060)
- ADR-060 — Think-mode pre-ticket brainstorm surface in quantumbek orchestrator. `/think <slug>` opens a `💭 think-…` topic; multi-user back-and-forth backed by Opus 4.7 (Sonnet via `--fast`) with full SOT-inlined RESEARCH-grade context (Read/Grep/Glob tools over projectPath). `/ticket` synthesizes the conversation into a six-line `/new` ticket and silently auto-fires; new FSM session runs in its own topic. Per-app config gates: `think.enabled` + `think.allowWorkers` + `think.maxTurnsPerSession`. Quantumbek `2fe9e10` (T.1-T.6 + spec + plan, suite 277 → 312) + `f3b3663` (rawText opt-out for free-form replies — fix surfaced 2026-05-11 during production validation when parseLooseJson ate Opus prose as `[]`). Production-validated 2026-05-11 via think→ticket→ship cycle for nightlife-chip cleanup (provodnik `5d6cd72`). Closes Phase 8 candidate post-MVP follow-up: pre-ticket co-thinking — 2026-05-11
- ADR-061 — SOUL + KODEX per-app persona + discipline (Phase 9.P, quantumbek `ba3e65b`+`3dd55fc`+`57f4c40`). SOUL.md = identity/voice (stable; provodnik = Russian dry/sarcastic register, no flattery, no jargon, privacy rules). KODEX.md = operating discipline (six axes + four traps + 11 numbered project rules preserved + append-only "Captured rules"). Loaded into /think system prompt via loadSoulKodex when persona.enabled+applyToThink (off by default; flip per app). Capture triggers: `/kodex <rule>` slash + `<text> +kodex` suffix in ANY topic, anyone in private supergroup, Sonnet reformat → canonical 1-line entry → git add+commit+push. Scaffold script + 7 templates at quantumbek for future apps. Suite 322 → 350 (+28). Production-validated 2026-05-12: /kodex captured rule landed in provodnik `db97d64`; /think reply in Russian dry register, cited Plan numbers, ended with clarifying question — voice confirmed applied — 2026-05-12
- ADR-062 — Chat-reply sanitization three-layer defense-in-depth (Phase 9.9b, quantumbek `814ecb6` + provodnik `e364ce9`). User-flagged leak in /think output: paths, ADR/ERR ids, pipeline names, tool names, vendor names landing in Russian user-facing text. Three layers, none load-bearing alone: (1) SOUL.md strict revert — no team-collaborator carve-out; explicit blacklist + vocabulary substitution table; (2) think-runner.mjs system-prompt framing promoted privacy rules from SOUL content into the system prompt itself (survives token pressure better than user-side); (3) bot/lib/sanitize-reply.mjs — deterministic post-process, REPLACEMENTS dict (length-descending) → BLACKLIST audit, redacts surviving leaks with `[…]` for submitter audience + console.error '[sanitize] leak…' for operator visibility. /kodex confirmation drops the commit sha. /think welcome drops model name + session id. Suite 366 → 380 (+14). Production-validated 2026-05-12: leak-prone question on real provodnik returned cleanly-substituted Russian reply (Кодекс / Душа / Движок / Защитный отказ / доступ к проекту на чтение и поиск / этап исполнения) — zero forbidden tokens — 2026-05-12

## Decomposition patterns (see DECOMPOSITION.md)

_Auto-extended (Phase 10.B) after each `/epic-done`. Captures empirical decomposition rules per project — which feature shapes split into which trees._

- ADR-063 — Epic primitive (Phase 10.A, quantumbek `b8eb19e`). New first-class long-lived topic above per-ticket FSM. Director opens `/epic <intent>`; Bek decomposes into tree-of-tickets; `/fire <n>` spawns child FSM sessions with parentEpicId linkage; driver back-reports terminal states to parent epic topic (✅ #N closed · sha + summary); pinned tree message updates live. `/think` continues as a single-node Epic shim for 30-day deprecation. Scaffold-template-first: `templates/app-sot/DECOMPOSITION.md.template` + `templates/app-config/config.json.template`; second app inherits Epic natively. Suite 380 → 470 (+90). Triggered 2026-05-12 by Alex feedback: multi-ticket plans collapsed into one ticket on `/ticket`; planning room force-closed; big-picture lost. Mission: asymmetry #1 (flat owner effort per epic, not per ticket).

- **ERR-082** canon ticket shipped against the audit it was supposed to operationalize → ERRORS.md (orch-handoff-stalls 2026-05-15)
- **ERR-083** General-topic Telegram commands silently dropped (thread_id undefined) → ERRORS.md (2026-05-15)
- **ERR-084** silent gate stalls — owner-tap dependency had no compensating behaviour → ERRORS.md (2026-05-15)
- **AP-030** Comparing inbound Telegram message_thread_id without ?? 0 normalization → ANTI_PATTERNS.md (2026-05-15)
- **AP-031** Decomposing an epic with specifics baked into titles before the audit/research dep has run → ANTI_PATTERNS.md + HOT.md (2026-05-15)
- **AP-032** Auto-shipping a verify-green ticket with confidence=1 / concerns=[] when fileScope touches a high-stakes path → ANTI_PATTERNS.md + HOT.md (2026-05-15)
- **AP-033** Operator scripts that bypass FSM gates without an audit trail → ANTI_PATTERNS.md (2026-05-15)
- **AP-034** Cron job for bot-internal housekeeping → ANTI_PATTERNS.md + HOT.md (2026-05-15)
- **ERR-085** epic decomposition hallucinated fileScope paths (no codebase access) -> ERRORS.md (2026-05-16)
- **ERR-086** createWorktree not idempotent — verify-retry re-dispatch escalated -> ERRORS.md (2026-05-16)
- **ERR-087** verify-retry feedback never reached the re-dispatch prompt -> ERRORS.md (2026-05-16)
- **ERR-088** escalatedReason object corrupted the session file -> ERRORS.md (2026-05-16)
- **ERR-089** critique-retry loops could not converge — re-run stage never saw the critique -> ERRORS.md (2026-05-16)
- **ERR-090** SHIP_GATE/clarification button taps no-op (deferred, diagnosed) -> ERRORS.md (2026-05-16)
- **ERR-091** canonical theme list built from the wrong vocabulary (photo vs religion) -> ERRORS.md (2026-05-16)
- **AP-035** propagating an inherited canon/constant without examining whether it is correct -> ANTI_PATTERNS.md (2026-05-16)
- **ERR-092** migration files in repo never applied to live DB (date_flexibility + search_guides_rpc); request creation + guide search were dead; supabase_migrations table unreliable -> ERRORS.md (2026-05-19)
- **AP-036** valueAsNumber:true on an OPTIONAL react-hook-form numeric field — empty input → NaN → z.number().optional() rejects → submit silently blocked; use setValueAs -> ANTI_PATTERNS.md (2026-05-19)
