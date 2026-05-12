# DECISIONS.md — Architecture Decision Records

_Append-only. Format: ADR-NNN. See INDEX.md for lookup; HOT.md for top-8 landmines._

---

### ADR-062: Chat-reply sanitization — three-layer defense-in-depth (quantumbek 2026-05-12)
- **Context:** Phase 9.7 introduced a SOUL.md two-channel rule that explicitly *allowed* file paths and ADR/ERR ids in `/think` replies ("team-collaborator channel"). Empirically wrong — production `/think` output leaked `.claude/sot/CODEX.md`, `ANTI_PATTERNS.md`, `DECISIONS.md`, `PATTERNS.md`, `cursor-agent`, `orchestrator`, `FSM`, `HARD_STOP`, `ambiguous_ticket`, `ADR-060`, `package.json`, `.env`, `supabase/migrations/`, `Read/Grep/Glob` into Russian user-facing text. The leak invited an architectural question: relying solely on a guidance prompt to keep the model honest is fragile under token pressure.
- **Decision:** Three-layer defense-in-depth, none load-bearing alone. (1) SOUL.md (`provodnik.app e364ce9`) reverted to strict default for all channels — no team-collaborator carve-out — with an explicit blacklist and a vocabulary substitution table so the model has product-language ready, not just bans. (2) `think-runner.mjs` system-prompt framing (`quantumbek 814ecb6`) — privacy rule promoted from SOUL content into the system prompt itself; system-level constraints survive long-context pressure better than user-side text. Vocabulary substitutions inline. Slash commands explicitly allowed. (3) `bot/lib/sanitize-reply.mjs` — deterministic post-process. Length-descending REPLACEMENTS dict + BLACKLIST audit scan. Surviving leaks redacted with `[…]` for `submitter` audience, surfaced via `console.error '[sanitize] leak…'` for operator visibility. `auditInfo` audience logs but passes text through unchanged so owner can debug.
- **Alternatives considered:** (a) Sanitizer alone — fragile; doesn't teach the model better drafting habits and produces ugly `[…]` blocks in the user's view. (b) System prompt alone — fragile; observed today in production that even very explicit "never include X" rules leak under token pressure. (c) SOUL.md alone — same. (d) Strip everything indiscriminately including user-quoted text — rejected; the "Понял так: X. Если иначе — поправь" pattern from KODEX requires echoing the user's own words verbatim. (e) Different audiences per channel — kept `auditInfo` for owner debugging on audit-topic surfaces; `submitter` strips. Bilingual register on audit topic kept.
- **Consequences:** Every free-form reply from the bot now passes through the sanitizer before send. Operator sees `[sanitize] leak <token> in <sid>` in pm2 logs when the model regresses — sanitizer is a teaching signal, not just a filter. New apps onboarding via `scaffold-app-sot` inherit the strict SOUL by default; future SOUL edits should keep the strict baseline. `/kodex` confirmation drops the commit SHA from user-visible text (internal detail). `/think` welcome message drops model name + session id.
- **Implementation:** quantumbek `814ecb6` (Phase 9.9b): SOUL strict revert (provodnik.app `e364ce9`), `bot/lib/sanitize-reply.mjs` + 13 unit tests, `think-runner.mjs` system prompt rewrite, wire-up in `handleThinkTurn` + `handleTicket` error paths + `handleCodexCapture` confirmation/failure + onThink welcome. 1 e2e regression in `think-turn.test.mjs` exercising the end-to-end wire-up with a leaky fake-Opus reply. Suite 366 → 380 (+14).
- **Production validation:** Fresh `/think sanitizer-test` topic on real provodnik (2026-05-12T01:55Z). Asked the leak-prone question "Where do you save rules, what are your tools?". Reply substituted `Кодекс`/`Душа`/`Движок`/`Защитный отказ`/`доступ к проекту на чтение и поиск`/`этап исполнения` for all internal terms. Zero forbidden tokens in the reply. One borderline: "грепать по символам" — Russian colloquial verb derived from `grep`, not on the blacklist. Logged as low-priority follow-up.
- **Date:** 2026-05-12

### ADR-061: SOUL + KODEX — per-app persona + discipline (quantumbek 2026-05-12)
- **Context:** Provodnik had no persona — `/think` replies sounded like generic Opus, not BEK. The old quantumbek had a sarcastic-Russian-senior-engineer voice baked into `src/system-prompt.ts`; we lost it in the rewrite. Additionally, Alex captures rules during conversation ("never X", "always Y") but there was no mechanism to persist them. Mission asymmetry #2 (codified taste applied infinitely): persona + discipline are per-app files the owner edits once, not arguments rebuilt every session.
- **Decision:** Two new per-app files under `<app>/.claude/sot/`: **SOUL.md** (identity / voice — stable, rarely edited) and **KODEX.md** (operating discipline — six axes + four traps + project rules + append-only "Captured rules"). Loaded by `bot/lib/identity-context.mjs#loadSoulKodex(projectPath)` when `cfg.persona.enabled && cfg.persona.applyToThink`. Two equivalent capture triggers in any topic: `/kodex <rule>` slash command + `<text> +kodex` message-suffix. Sonnet reformats every raw capture into a canonical 1-line entry: `- YYYY-MM-DD [tag] — body (≤40 words)`. Fixed 8-tag taxonomy (`tone | communication | process | decomposition | reporting | verification | safety | scope` + `[other]` escape). `bot/lib/kodex-store.mjs#appendAndCommitRule` writes to `## Captured rules` section, git-adds, commits with `chore(sot): codify rule from <source>`, pushes. Pre-flight refuses to commit if other SOT files are dirty (ERR-067 guard against bundling POST_WORK's uncommitted PATTERNS.md).
- **Alternatives considered:** (a) Single `AGENTS.md` (Cursor convention) — rejected because identity and discipline have very different edit cadences and bundling them invalidates prompt-cache more often. (b) Natural-language capture ("запомни это") — rejected; old bek tried, false-positive prone, expensive. (c) Persona in FSM stages too — rejected; user explicitly scoped to `/think` only ("during coding, we do not need chatbot persona"). (d) Skip Anzor Defense Protocol — user said it was a joke; not ported.
- **Consequences:** `/think` replies now match the app's voice. Captures land as git-tracked SOT entries — every rule traceable to the message that captured it. Per-app scaffold script `orchestrator/scripts/scaffold-app-sot.mjs` + 7 templates at `orchestrator/templates/app-sot/` mean new app onboarding goes from manual-half-day to scaffold + 30 min editing. Feature flag `cfg.persona.enabled` (default false) keeps the pre-persona behavior available; flip per app to activate.
- **Implementation:** quantumbek commits across Phase 9.P sub-phases: `ba3e65b` (P.1 + P.2 — schema + loader + wire into /think), `3dd55fc` (P.3 — /kodex + +kodex + Sonnet reformat + git append/push), `57f4c40` (P.4 — templates + scaffold script). Spec at `quantumbek/docs/superpowers/specs/2026-05-12-soul-kodex-persona.md`. Suite 322 → 350 (+28 tests across P.1-P.4). Production validation: `/kodex always include commit sha when reporting DONE; green typecheck is not enough` from General topic landed in provodnik `db97d64` correctly reformatted. `/think persona-test` reply was Russian, dry, analytical, cited specific Plan numbers + file paths, ended with one clarifying question — voice clearly applied.
- **Date:** 2026-05-12

### ADR-060: Think-mode — pre-ticket multi-user brainstorm surface (quantumbek 2026-05-11)
- **Context:** The /new pipeline assumes the submitter already knows what they want. Vague tickets get correctly rejected by the SPEC_CRITIQUE rigor (saw it 2026-05-11 with "analyze the source code, find issues, fix them" — RESEARCH classified as `ambiguous_ticket` with conf=0.2, surfacing prompt-injection-shape concerns). The owner becomes the bottleneck for ticket-shaping. Mission asymmetry #1 ("owner stops being the team's bottleneck") + #2 ("codified taste applied at idea-time, not just execution-time") require a surface that exists before /new.
- **Decision:** New `/think <slug> [--fast]` command opens a Telegram topic prefixed `💭 think-…`. Multi-user (per `cfg.think.allowWorkers`) back-and-forth backed by Opus 4.7 (Sonnet via `--fast`), with full RESEARCH-grade context (SOT files inlined + Read/Grep/Glob tools over the projectPath). When convergence reached, `/ticket` synthesizes the conversation into a six-line ticket and silently auto-fires `/new <text>` — the new FSM session runs in its own topic. Think-topic auto-closes with a pointer.
- **Alternatives considered:** (a) Edit-before-fire confirmation step — added friction without clear safety win because the downstream FSM gates already catch synthesis errors. (b) Sonnet-only default — rejected; think is the highest-leverage decision step and bad think → wrong ticket → wasted compute. (c) Per-private-supergroup brainstorms — over-engineered for the current single-owner mode; same supergroup with 💭 emoji prefix gives visual separation without operational overhead.
- **Consequences:** Workers can iterate on a ticket without owner help; the bot teaches good ticket shape by example via spec critique. Cost per think-session ~$5-20 (Opus, bounded by user exit + per-session invocation cap). New owner command `/think-list` (audit topic) lists OPEN think-sessions for visibility.
- **Implementation:** quantumbek commits `2fe9e10` (T.1-T.6 + spec + plan, 16 files, +1942 LOC, suite 277 → 312) and `f3b3663` (rawText opt-out for free-form replies — surfaced during production validation when parseLooseJson greedily ate Opus's bracketed prose as an empty JSON array).
- **Production validation:** session `20260511-think-nightlife-chip-hsxq` brainstormed the leftover-nightlife-chip cleanup (3 turns, Opus corrected my path, surfaced sibling drift, recommended scope, asked one open question). `/ticket` synthesized → auto-fired `/new` → session `20260511-remove-nightlife-interest-chip-00mr` → all FSM gates green first try → shipped `5d6cd72` (3-file removal). Slack devnote thread today totals 11hr / $1650 / 11 commits across three real ships.
- **Date:** 2026-05-11

### ADR-001: Traveler dashboard as server component (B3)
- **Context:** Traveler dashboard was a simple redirect to /traveler/requests. Audit requires real content.
- **Decision:** Implement as a Next.js Server Component that fetches summary stats (request count, booking count, favorite count) + renders stat cards + quick-action links. No client-side state needed for static counts.
- **Alternatives Considered:** (A) Keep redirect, update nav — too minimal, doesn't fix the audit finding. (B) Client component with useEffect — unnecessary for static counts.
- **Consequences:** Server component renders counts on every page load. Acceptable for dashboard stats. No stale data risk.
- **Date:** 2026-04-06

### ADR-002: Guide dashboard refactor strategy (B4)
- **Context:** Guide dashboard currently renders GuideOnboardingScreen (form). This is wrong — it should show a stats dashboard. Onboarding should be its own page.
- **Decision:** (1) Move onboarding form to /guide/settings. (2) Guide dashboard page checks auth.role === 'guide' and renders guide-specific stats. (3) Unverified guides (verification_status !== 'approved') see an "Account pending" state with link to verification page.
- **Alternatives Considered:** (A) Keep onboarding on dashboard for new guides — confusing for verified guides. (B) Redirect to /guide/verification always — breaks verified guides.
- **Consequences:** Need new GuideDashboardScreen component and to create /guide/settings page.
- **Date:** 2026-04-06

### ADR-003: Listing image_url as dedicated column (B6)
- **Context:** Current approach stores image URL inside description text as JSON, always falls back to mountain photo.
- **Decision:** Add `image_url text` column to listings table via new migration. Update mapListingRow to read image_url first, fall back to parseImageFromJson for backwards compatibility, then fallbackHeroImage.
- **Alternatives Considered:** (A) Add JSON to description field — hacky, wrong separation of concerns. (B) Use category-based fallback images — doesn't fix individual listing accuracy.
- **Consequences:** Migration required (20260406000001_listings_image_url.sql). Seed data must be updated with correct image URLs.
- **Date:** 2026-04-06

### ADR-004: All seed changes in one worktree
- **Context:** Multiple tasks (A2, B6-seed, C2, C3, C4) modify the same seed.sql file.
- **Decision:** Group all seed.sql changes in a single worktree (fix/seed) to avoid merge conflicts.
- **Consequences:** Seed worktree must merge before the query code worktree (fix/a3-query) since B6 code reads the new image_url column that migration creates.
- **Date:** 2026-04-06

### ADR-005: Defer forgot-password (B1) to post-launch
- **Context:** Phase 8 audit found no forgot-password flow. Requires Supabase Custom SMTP config (Resend) to work in production. Code is straightforward but has an infra dependency.
- **Decision:** Explicitly deferred per user instruction. Will implement post-launch when Resend is connected to Supabase Custom SMTP in dashboard.
- **Alternatives Considered:** Implement now but email silently fails in prod (confusing UX).
- **Consequences:** Users who forget passwords must contact support until B1 ships.
- **Date:** 2026-04-06

### ADR-007: [SUPERSEDED by ADR-010] Pivot executor from cursor-agent → native Claude Code Agent on Windows
- **Context:** Orchestrator brief mandated cursor-agent for all code writing. On Windows, cursor-agent invoked via its `.cmd` wrapper from headless git-bash produced 0 stdout, 0 git activity, and 0 file edits for 9+ min despite 22 child processes running (attempts 1 and 2 both failed this way).
- **Decision:** For this Windows environment, use native Claude Code `Agent` subagents (general-purpose) instead. They have Edit/Write/Bash/Read, can work in absolute-path worktrees, and return a structured completion notification.
- **Alternatives Considered:** (A) Run cursor-agent interactively in foreground terminal — breaks autonomous flow, blocks orchestrator. (B) Install codex CLI — not available on this machine. (C) Claude writes code itself — violates CLAUDE.md "never write feature code yourself" but is faster. Picked native subagents: still delegates, still parallel, still isolated, just uses a different executor.
- **Consequences:** Three P0+P1 batches shipped in ~10 min total versus burning tokens on failing cursor-agent dispatches. cursor-agent remains documented in CLAUDE.md as the preferred executor; pivot is Windows-only. ERR-011 documents the root cause.
- **Date:** 2026-04-11

### ADR-008: Map DB enum `awaiting_guide_confirmation` → state-machine `pending` at the boundary
- **Context:** P0-002 (guide confirm button) exposed a naming mismatch: `src/lib/bookings/state-machine.ts` exports a narrow `BookingStatus` (`pending|confirmed|completed|cancelled|disputed`) locked by a unit test, while the DB enum is wider (`pending|awaiting_guide_confirmation|confirmed|cancelled|completed|disputed|no_show`).
- **Decision:** Do NOT widen the state-machine enum. Instead, map `awaiting_guide_confirmation → pending` at two boundaries: the server action (`confirmBookingAction`) and the traveler booking detail page heading resolver. Keep the state machine as a narrow public interface; treat the DB column as the source of truth but translate at the edges.
- **Alternatives Considered:** (A) Widen `BookingStatus` and update the locking test — larger blast radius, ripples through `transitionBooking`, risks unintended transitions. (B) Rename DB enum — migration, RLS policies affected, out of scope for UI batch.
- **Consequences:** Rows currently stuck in `awaiting_guide_confirmation` will surface "Invalid booking transition" from `transitionBooking` if the user clicks confirm — acceptable because seed data doesn't have that state and new bookings go straight to `pending`. If/when a real `awaiting_guide_confirmation` workflow lands, either widen the enum or add a dedicated action.
- **Date:** 2026-04-11

### ADR-009: Use real DB enum values for guide verification stepper (P1-015)
- **Context:** P1-015 spec asked for status values `pending | approved | rejected | changes_requested`. Actual DB `guide_verification_status` enum is `draft | submitted | approved | rejected`. No `changes_requested` value exists in schema.
- **Decision:** Use real DB enum values in the stepper. Map: `draft → step 1 active`, `submitted → step 2 active`, `approved → all three done`, `rejected → step 2 shows "Отклонено"`. Read existing `verification_notes` column and render under the stepper on `rejected`.
- **Alternatives Considered:** (A) Migrate DB enum to add `changes_requested` — out of scope for UI batch. (B) Hardcode `changes_requested` branch anyway — would never fire, dead code.
- **Consequences:** If a `changes_requested` workflow is later added, add a new enum value + a new branch in `getVerificationSteps()`. No backfill needed.
- **Date:** 2026-04-11

### ADR-010: Reverse ADR-007 — cursor-agent restored as primary coder via dispatch wrapper
- **Context:** ADR-007 (2026-04-11 earlier) pivoted away from cursor-agent to native Claude Code Agents on Windows after two dispatch attempts produced 0 stdout / 0 git activity for 9+ min. Root causes (now identified): (1) `cmd //c "cursor-agent.cmd ..."` wrapper eating stdout, (2) bash brace expansion on `{...}` in prompt strings, (3) Node v24 blocking `spawn('.cmd', { shell: false })` — see ERR-012.
- **Decision:** Build `cursor-dispatch.mjs` — a Node wrapper that (a) reads prompts from files (no shell quoting issues at all), (b) resolves `node.exe` + `index.js` from `cursor-agent\versions\<latest>\` and spawns node directly, bypassing `.cmd` + powershell, (c) parses stream-json live and prints `[init] → [tool_call] → [assistant] → [result]` progress to stderr, (d) stall watchdog at 60s + hard timeout at 900s, (e) tees raw stream to a log file. Restore cursor-agent as the primary coder for all non-trivial code tasks. Native Agents retained for research, review, and as wrappers around `cursor-dispatch.mjs` calls when parallel dispatch is needed.
- **Alternatives Considered:** (A) Keep ADR-007 (native Agents only) — proven to work for Wave D, but burns orchestrator tokens for long code tasks and can't be parallelized cheaply. (B) `shell: true` + cmd.exe quoting — fragile with Cyrillic/braces/newlines. (C) Invoke `powershell.exe -File cursor-agent.ps1` — adds startup overhead and still doesn't give live stream-json parsing.
- **Consequences:** Heavy code tasks (multi-file, long-file rewrites) can now be dispatched to cursor-agent in parallel from native Agent wrappers, each running in a separate worktree. Confirmed working 2026-04-11: 20.3s wall, init → tool_call (Read) → assistant text → result success, exit 0, correct output. Project CLAUDE.md now documents the wrapper as the only sanctioned dispatch path.
- **Date:** 2026-04-11

### ADR-011: Slack dev-notes enforcement via slack-devnote.mjs hard gate
- **Context:** Wave D post-work (2026-04-11) violated the codex-ops `slack-dev-notes.yaml` spec in 8 different ways: duplicate same-day post instead of update, `header` block instead of section, massive jargon in technical items (server-компонент, useMemo, searchParams, Tailwind classes), wrong emojis (🎨 📱 not in whitelist), missing footer suffix, hours estimated from memory, no inventory-first. LLM-level instructions in CLAUDE.md drift under load.
- **Decision:** Build `slack-devnote.mjs` — a hard-gate wrapper that is the ONLY sanctioned way to post Provodnik dev-notes. It reads `slack-state.yaml` to decide post vs update (same-day merge on last `last_patch_N` with today's date), accumulates items in a daily sidecar, counts hours from git commits since 00:00 (feat=3h, fix=1.5h, style/docs=0.5h, +20% planning, ceil), validates every item against a forbidden-jargon blacklist (~40 words) and regex patterns (Tailwind class patterns, file extensions, hex colors, CamelCase, paths, backticks), enforces emoji whitelist (🔒 📦 🏗 🚀 🔍 📋 for tech; 🔧 ✨ 🔄 ⬆️ for user-visible), builds the exact block structure (section → divider → section → context), and hardcodes the title/footer format. `--dry` mode previews blocks without calling Slack. Deprecated `slack-post.mjs` / `slack-update.mjs` for dev-notes; direct `chat.postMessage`/`chat.update` calls forbidden.
- **Alternatives Considered:** (A) Stricter CLAUDE.md instructions — proven unreliable; drifts under load. (B) Review checklist in post-work.sh — same LLM-drift failure mode. (C) Pre-commit hook on slack-state.yaml — too late, post already sent. Hard validation at the script level is the only reliable enforcement.
- **Consequences:** Future Slack dev-notes cannot violate the spec without editing the script. Validation errors explain exactly what's wrong. Sidecar merge means re-running with new items accumulates rather than duplicates. Orchestrator workflow: produce items JSON → run wrapper → read errors → rephrase → re-run → `--dry` to verify → post.
- **Date:** 2026-04-11

### ADR-012: Two-mode architecture — Биржа + Трипстер coexistence
- **Context:** Alex feedback exposed that ExcursionShapeDetail.tsx routed to bid marketplace (Биржа) instead of direct booking (Трипстер). Both listing shapes (Tour + Excursion) must support direct booking by default; bid flow lives exclusively in the request wizard.
- **Decision:** Both shapes route CTAs to `/listings/[id]/book` (Трипстер mode). Request wizard owns Биржа mode. No schema changes needed. 10 concrete code tasks + 7 ride-along fixes shipped in one sprint across 3 worktrees.
- **Alternatives Considered:** (A) Separate routes per mode — over-engineered for current stage. (B) Feature flag per listing — adds complexity without user benefit.
- **Consequences:** All listing pages now funnel to direct booking. Guide orders page renders both request-based and direct-booking rows. Home page educates users about both modes via "Two ways to book" section.
- **Date:** 2026-04-16

### ADR-013: Centralised kopecks helpers in src/data/money.ts
- **Context:** Budget values stored in kopecks (minor units) but displayed/input in rubles. Inline `* 100` / `/ 100` scattered across wizard actions and queries — error-prone (FP-4 found a missing conversion).
- **Decision:** Create `src/data/money.ts` with `rubToKopecks(rub)` and `kopecksToRub(kopecks)` + round-trip Vitest test. All conversions must use these helpers.
- **Consequences:** Single source of truth for currency conversion. AP-012 added to anti-patterns prohibiting inline arithmetic.
- **Date:** 2026-04-16

### ADR-006: Phase 10.1 — Guides section on destination pages
- **Context:** GG stakeholder Change 6 — destination pages should show "Гиды в этом городе". Was deferred from Phase 5, now scheduled as Phase 10.1.
- **Decision:** Implement as a server-side fetched section at bottom of destination-detail-screen. Query guide_profiles filtered by verification_status='approved' AND region match. Limit 6 cards.
- **Alternatives Considered:** Client-side fetch with TanStack Query (unnecessary for static data). Separate /destinations/[slug]/guides route (over-engineered).
- **Consequences:** Destination pages now surface local guides — key for marketplace discovery.
- **Date:** 2026-04-06

### ADR-014: Auth registration via admin server action (no browser signUp)
- **Context:** Browser `supabase.auth.signUp()` triggers a race between JWT mint time (when `custom_access_token_hook` reads the profile) and the `handle_new_user()` trigger commit. When hook runs before trigger, no role → white screen.
- **Decision:** Registration is handled entirely by `signUpAction` server action using the admin client: create user + upsert profiles + stamp `app_metadata.role` + `signInWithPassword` — all on the server, all before any JWT is returned to the browser.
- **Alternatives Considered:** (A) Disable hook, derive role from JWT at runtime — breaks the existing role-guard middleware. (B) Delay JWT with a sleep/retry — fragile, unpredictable latency. (C) Remove trigger entirely — duplicate upsert logic was already needed for admin-created users.
- **Consequences:** Registration is server-only; no browser direct signUp calls anywhere. `email_confirm: true` skips confirmation email (Resend SMTP configured, DNS pending).
- **Date:** 2026-04-20

### ADR-016: Plan B traveler cabinet — server components with React.cache() batch queries
- **Context:** Traveler requests page needed two data sets (active requests + confirmed bookings) with guide avatar stacks and booking profiles, requiring multiple Supabase queries per render.
- **Decision:** Implement both query functions (`getActiveRequests`, `getConfirmedBookings`) as server-side using `React.cache()` for per-request deduplication. Batch profile fetches with `.in('id', ids)` — single query for all guide avatars, not N+1. Page component is a server component; no client-side fetching.
- **Alternatives Considered:** (A) Client component with useEffect — unnecessary round trip, skeleton flash. (B) Single combined query — PostgREST join complexity with two different join paths.
- **Consequences:** Zero N+1 queries. SSR with no loading state needed. React.cache() deduplicates if page is called multiple times in same request.
- **Date:** 2026-04-21

### ADR-017: accept_offer as SECURITY DEFINER Postgres RPC
- **Context:** Accepting an offer requires 5 atomic steps: accept offer, decline others, mark request booked, insert booking, create conversation thread. Doing this as sequential client calls risks partial failure and TOCTOU.
- **Decision:** Single `accept_offer(p_offer_id, p_traveler_id)` plpgsql RPC in `SECURITY DEFINER` context. Verifies ownership, runs all 5 mutations in one transaction. App calls `supabase.rpc('accept_offer', ...)`.
- **Alternatives Considered:** (A) Sequential server action calls — TOCTOU, partial failure possible. (B) DB trigger — can't take parameters or verify caller identity.
- **Consequences:** Offer acceptance is atomic. Partial states impossible. `conversation_threads` check constraint satisfied because booking row is inserted before thread row in same transaction.
- **Date:** 2026-04-21

### ADR-018: send_qa_message as SECURITY DEFINER Postgres RPC
- **Context:** 8-message Q&A limit enforced application-side is vulnerable to TOCTOU: count check then insert are two round-trips; concurrent sends can both pass the count check and exceed the limit.
- **Decision:** Single `send_qa_message(thread_id, sender_id, sender_role, body)` plpgsql RPC. COUNT + INSERT happen in one atomic function call. Raises `'qa_thread_at_limit'` exception if count ≥ 8.
- **Alternatives Considered:** (A) Application-level count+insert — TOCTOU race with concurrent senders. (B) DB trigger on messages — can't return custom exception name.
- **Consequences:** 8-message limit is guaranteed at DB level. App catches exception by message string `'qa_thread_at_limit'`.
- **Date:** 2026-04-21

### ADR-019: GuideOfferQaPanel as client component with server action fetch
- **Context:** `guide-requests-inbox-screen.tsx` is `'use client'`. The QA panel was initially built as an async server component. Directly importing an async server component into a client component violates the RSC boundary — `createSupabaseServerClient` uses `cookies()` which requires server context; it silently fails or crashes at runtime.
- **Decision:** Convert `GuideOfferQaPanel` to a `'use client'` component. Add `getQaPanelDataAction` server action that fetches thread + messages. Panel calls this action in `useEffect` on mount with a cancellation token to prevent stale-state on offer card switch.
- **Alternatives Considered:** (A) Pass pre-rendered panels as children from page (server component) — can't pre-render because `offerId` is client-side state (depends on which card the guide clicked). (B) Keep as server component, restructure page — would require significant refactor of inbox screen state management.
- **Consequences:** One extra client→server round-trip per offer card open. Acceptable; data is small. Cancellation token prevents stale data.
- **Date:** 2026-04-21

### ADR-020: pg_cron for request expiry (not triggers)
- **Context:** `traveler_requests.status` must be set to `'expired'` when `starts_on < CURRENT_DATE`. A Postgres trigger only fires on row modification — requests nobody touches stay `'open'` forever.
- **Decision:** Use `pg_cron` extension with `cron.schedule('expire-open-requests', '0 * * * *', ...)` running an UPDATE hourly. Migration also runs a one-time backfill. Schedule call is guarded by `cron.unschedule` first for idempotency on re-apply.
- **Alternatives Considered:** (A) Trigger — only fires on row touch, not time-based. (B) Edge Function cron — extra infra, costs invocations, not atomic with DB.
- **Consequences:** Open requests auto-expire within 1 hour of their start date passing. No application code needed.
- **Date:** 2026-04-21

### ADR-015: Logout via /api/auth/signout route handler (not browser client)
- **Context:** `@supabase/ssr` stores session in HTTP-only cookies. Browser client `signOut()` cannot clear these cookies, leaving the server session alive.
- **Decision:** Single `/api/auth/signout` GET route handler calls server-side `signOut()` (which has cookie write access) then redirects to `/`. All logout callsites use `window.location.href = '/api/auth/signout'`.
- **Alternatives Considered:** (A) Expose a cookie-clearing API endpoint manually — more code, same effect. (B) `router.push` to signout — Next.js router doesn't do a full page load, cookie header wouldn't be applied.
- **Consequences:** Logout is instant and correct. Full page navigation means React state is also cleared. `useRouter` and `createSupabaseBrowserClient` imports removed from `site-header.tsx`.
- **Date:** 2026-04-20

### ADR-021: BEK MessageQueue depth-cap instead of busy-check
- **Context:** All BEK message handlers had `if (queue.busy) return` which silently dropped messages when Claude was processing. MessageQueue already supports multiple jobs via #drain(). The guard defeated the queue's purpose.
- **Decision:** Remove all queue.busy checks. Add queue.full (size ≥ 4) as the only rejection gate. Messages now queue behind running jobs and process in order.
- **Alternatives Considered:** (A) Keep busy-check, tell user to resend — poor UX, loses context. (B) Debounce text+image into one combined message — complex, not needed for now.
- **Consequences:** Up to 4 messages can be queued. Rapid text+image sends work naturally. Overflow (>4 pending) rejected with a message.
- **Date:** 2026-04-22

### ADR-022: BEK self-healing via file-based restart flag
- **Context:** 2026-04-24T23:05Z incident — BEK daemon received a message, spawned Claude, never completed. PM2 saw a healthy process; the in-flight job had hung. Existing safety nets (claude_timeout_ms, PM2 autorestart, crash-recovery-on-startup) all require the process to *exit*, which a hung process doesn't. We also could not see *what* Claude was doing — `stream-json` chunks were parsed for signals and discarded.
- **Decision:** Two PM2 apps communicating only through files. (1) `quantumbek` daemon writes a per-message activity log under `_archive/bek-frozen-2026-05-08/logs/stream/<ts>-<chatId>-<msgId>.log`, mirrors the active stream to `current.log` (append-to-both), and rewrites `_archive/bek-frozen-2026-05-08/logs/heartbeat.json` atomically on every Claude stream chunk. The daemon polls `_archive/bek-frozen-2026-05-08/logs/restart.flag` every 5s; if present, it deletes the flag, writes a final `closing` heartbeat, and calls `process.exit(0)`. (2) `bek-watchdog` polls heartbeat + session every 30s. If state ≠ IDLE and the heartbeat is stale beyond a phase-aware threshold (`STALE_TEXT_MS=90s` for text-class phases, `STALE_TOOL_MS=300s` for `tool_running:<name>` phases), it logs an incident and `touch`es the flag. Recovery delegated to PM2 autorestart with the existing `restart_delay: 62000` (ERR-038).
- **Alternatives Considered:** (A) PM2-from-PM2 (watchdog calls `pm2 restart quantumbek`) — fragile across PM2 versions, drags a heavy CLI dep into the watchdog, breaks if pm2 daemon itself is unhealthy. (B) Second Telegram bot for incident alerts — user explicitly rejected (operator already lives in the existing channel). (C) Webhook mode for liveness — out of scope; design spec §1 non-goals. (D) Single global stale threshold — false-positives every time a legitimate `Bash` ran for >90s with no streaming output during it.
- **Constants pinned:** `POLL_MS=30_000`, `STALE_TEXT_MS=90_000`, `STALE_TOOL_MS=300_000`, `RESTART_COOLDOWN_MS=300_000`, `CIRCUIT_BREAKER_LIMIT=3`, `CIRCUIT_BREAKER_WINDOW_MS=1_800_000`. Phase taxonomy frozen in `heartbeat.mjs PHASES` const + dynamic `tool_running:<name>` strings emitted by `claude-runner.mjs` on `tool_use` blocks.
- **Why phase-aware threshold:** A Bash command compiling something for 200s is not stuck — it's working. Distinguishing `tool_running:Bash` from `text` lets us tolerate slow legitimate tools without losing the 90s detection budget for actual hangs.
- **Why circuit breaker:** Prevents infinite restart cycles when the daemon ships genuinely broken (syntax error, missing dep, etc). After 3 restarts in 30 minutes the watchdog logs `GIVING_UP` and stops touching the flag for the rest of its process lifetime — manual `pm2 restart bek-watchdog` resets it.
- **Consequences:** Stuck Claude is detected and recovered in ≤2 minutes with no human input. Operator can `Get-Content -Wait _archive/bek-frozen-2026-05-08/logs/stream/current.log` and see in real time which tool Claude is using and which text it's generating. No second alert channel. No second LLM call. Watchdog itself is ~120 LOC of mechanical decision logic with full test coverage (12 unit tests).
- **Date:** 2026-04-25

### ADR-024: BEK v2 — `_archive/bek-frozen-2026-05-08/` repo-root + retry wrapper + structured incidents

> **ARCHIVED 2026-05-10** — superseded by macmini Telegram orchestrator (`@QuantumBekBot` in supergroup `-1003617072585`). Session ledger now lives at `quantumbek/orchestrator/apps/provodnik/.sessions/` (per-machine). Body retained for archaeology — do NOT reactivate the bek runtime; the path constants below all point at archived code. Restart of the live system uses `pm2 restart orch-provodnik` on macmini.

- **Context:** Two pressures converged: (1) Claude CLI 2.1.119 added hardcoded `.claude/**` self-protect (ERR-045) that overrode `permissions.allow` rules, blocking BEK from writing plans + sessions + SOT updates; and (2) BEK's transient-error handling was a single try-catch — one ECONNRESET to api.telegram.org surfaced as ❌ with no retry.
- **Decision:** Three changes shipped together as BEK v2:
  - **Path migration:** all BEK-writeable artifacts moved out of `.claude/` to a new repo-root `_archive/bek-frozen-2026-05-08/` directory. Source at `_archive/bek-frozen-2026-05-08/src/`, sessions at `_archive/bek-frozen-2026-05-08/sessions/`, prompts at `_archive/bek-frozen-2026-05-08/prompts/`, SOT at `_archive/bek-frozen-2026-05-08/sot/`, logs at `_archive/bek-frozen-2026-05-08/logs/`, devnotes at `_archive/bek-frozen-2026-05-08/logs/devnotes/`. `.claude/` retains only Claude Code platform config (settings.json, CLAUDE.md, skills/, commands/, agents/, hooks).
  - **Retry wrapper:** `retryTransient()` in `_archive/bek-frozen-2026-05-08/src/retry.mjs` — 3 attempts with 1s/5s/25s exponential backoff + 500ms jitter. Classifies ECONNRESET / ETIMEDOUT / EPIPE / EAI_AGAIN / ECONNREFUSED / ENETUNREACH / EHOSTUNREACH and HTTP 408/425/429/500-504 as transient; isBekTimeout, "Claude exited with code N", and unclassified as permanent. Wraps `runClaude()` in `bek-daemon.mjs:handleMessage`.
  - **Structured incidents:** `incidents.mjs` writes BOTH a plain-text `_archive/bek-frozen-2026-05-08/logs/incidents.log` line and a `_archive/bek-frozen-2026-05-08/logs/incidents.jsonl` JSON record on every watchdog trigger and daemon error. `bek-postmortem` CLI at `_archive/bek-frozen-2026-05-08/src/tools/postmortem.mjs` filters by date / session / kind / last-N. Incident kinds: `restart_triggered`, `cooldown_skipped`, `circuit_breaker`, `unknown_heartbeat`, `retry_exhausted`, `permanent_error`, `crash_recovery`.
- **Alternatives Considered:** (A) Keep `.claude/` layout with hook-based permission overrides — empirically failed in interactive testing, hooks don't override the hardcoded protect. (B) Migrate to Claude Agent SDK — bigger rewrite, moves billing from claude.ai sub to API key, scope outside this work. (C) TypeScript port + observability HTTP server — designed and specced (`docs/superpowers/specs/2026-04-25-bek-v2-design.md` items D + F) but deferred to a follow-up session in the interest of getting BEK back online quickly.
- **Constants pinned:** retry `maxAttempts=3`, `baseDelayMs=1000`, `maxDelayMs=25000`, `jitterMs=500`. Incident kinds frozen as 7-element union per the spec.
- **Why:** The path move is a permanent fix for a class of failure (`.claude/**` self-protect) that would have kept biting on every CLI release. The retry wrapper turns most ECONNRESETs into invisible self-heals. Structured incidents replace error spelunking with a queryable forensic record.
- **Consequences:** BEK runs from `_archive/bek-frozen-2026-05-08/src/` under PM2 (ecosystem.config.cjs script paths updated). Path constants in `bek-daemon-helpers.mjs`, `heartbeat.mjs`, `bek-watchdog.mjs`, `bek-daemon.mjs`, `bek.config.json`, `system-prompt.mjs` all point at `_archive/bek-frozen-2026-05-08/...`. Tests pass 130/130 (was 114, +12 retry +4 incidents). Operator runs `node _archive/bek-frozen-2026-05-08/src/tools/postmortem.mjs --date YYYY-MM-DD` for postmortems.
- **Deferred (scope explicitly cut):** TypeScript port (D), observability HTTP server (F), and SOT updates (this entry plus ERR-046 / AP-020) are landed; the TS port and obs server stay in the v2 design spec for future work.
- **Date:** 2026-04-26

### ADR-025: Cursor-agent dispatches do file edits ONLY — orchestrator runs git + bun
- **Context:** Plan 08 Task 1 v1 cursor-agent dispatch hung for 14 minutes on a `cd /d/... && git branch --show-current` chain (initially blamed on the cd chain). Task 1 v3 then hung on plain unchained `git add -A` and `git commit`, confirming the hang isn't about chaining — cursor-agent's bash tool blocks on `git` (and `bun`) invocations on Windows regardless of form. See ERR-047 for the failure detail. Tasks 2–5 v2 all succeeded in 30–90s after the prompts forbade all bash usage.
- **Decision:** Every cursor-agent prompt going forward uses the "no bash at all" hard rule, stated explicitly in the prompt:
  - cursor-agent uses ONLY native Read, Edit, Write, Glob, Grep tools.
  - cursor-agent does NOT run `git` (any subcommand), `bun run typecheck/lint/build`, or any shell command — the lone exception is none; not even `git status` is allowed.
  - The orchestrator handles all git operations: branch creation, file deletes via `rm`, `git add`, `git commit`, `git checkout`, `git merge`, `git push`.
  - The orchestrator runs all verification: `bun run typecheck`, `bun run lint`, `bun run build`.
  - cursor-agent's DONE report lists: files edited, any unexpected findings. No commit SHA, no typecheck output (those come from the orchestrator).
  - The final commit message goes in the prompt as documentation. Orchestrator copy-pastes it on commit.
- **Alternatives Considered:**
  - (A) Have cursor-agent commit but not verify — still hangs on `git commit` even without cd-chain (Task 1 v3 evidence).
  - (B) Wrap git in a script that disables pager/tty (`git --no-pager` etc.) — adds complexity, doesn't address root cause (it's the bash tool's process spawning, not git's behavior).
  - (C) Run cursor-agent on Linux/WSL instead — out of scope; Windows-native is the project constraint.
  - (D) Increase timeout — masks the symptom, doesn't fix anything; the agent never recovers.
- **Consequences:**
  - cursor-agent dispatches are pure file work. Faster (30–90s for typical edits vs 14+ min when bash is involved).
  - Orchestrator does ~5 lines of bash per task: `git add -A && git commit -m "..."` then optional `bun run typecheck` for verification.
  - DONE reports are simpler (no commit SHA from agent).
  - Plans must include the commit message verbatim for orchestrator copy-paste.
  - This rule applies to every future plan; not Plan 08-specific.
- **Date:** 2026-04-26

### ADR-026: Defer F009 — raw file input visible on listing create/edit (Plan 44 P2)
- **Context:** Plan 44 audit found an unstyled `<input type="file">` ("Choose file · No file chosen") visible alongside the styled photo upload button on `/guide/listings/new` and `/guide/listings/[id]/edit`.
- **Decision:** Deferred. The upload flow is functional; the naked input is cosmetic. Fix is to add `className="hidden"` or `sr-only` to the raw input and ensure the styled button triggers it via `ref.current.click()`. Defer until after Phase 4 full audit cycle.
- **Trigger:** Raise priority to P1 if a real guide reports confusion with the upload area.
- **Date:** 2026-05-03

### ADR-027: Defer F010 — listing detail shows "0 дня" duration (Plan 44 P2)
- **Context:** Plan 44 audit found the ДЛИТЕЛЬНОСТЬ field on `/guide/listings/[id]` shows "0 дня". The editor form shows value=1. The seed listing likely has `duration_days=0` in the DB.
- **Decision:** Deferred. Likely a seed data issue, not a code bug. Fix: run `UPDATE listings SET duration_days=1 WHERE duration_days=0` on affected seed rows. Low impact — real guide-created listings are unaffected. Revisit during final data-quality pass before launch.
- **Date:** 2026-05-03

### ADR-028: Defer F011 — listing detail generic page title (Plan 44 P2)
- **Context:** Plan 44 audit found `/guide/listings/[id]` has title "Тур — Provodnik" regardless of tour name.
- **Decision:** Deferred. Fix is to pass listing name into `generateMetadata`. Low UX impact since the listing detail is a guide-only protected route. Raise to P1 when public listing pages (`/listings/[slug]`) have the same issue.
- **Date:** 2026-05-03

### ADR-029: Defer F012 — /guide/stats "Скоро" coming-soon fiction (Plan 44 P2)
- **Context:** Plan 44 audit found `/guide/stats` shows only "Скоро здесь будут ваши показатели." Product vision requires no fiction — unshipped features must be hidden, not promised.
- **Decision:** Deferred short-term. The "Скоро" text is a vision violation. Fix options: (A) hide the route from guide nav so guides never land there, (B) replace with "Статистика недоступна" with no forward-promise copy. Must resolve before public launch; this must not ship to real users with a promise. Assign as P1 during final polish phase (T035-GATE or earlier).
- **Date:** 2026-05-03

### ADR-030: Accept F013 — /guide/verification anchor redirect (Plan 44 P2)
- **Context:** Plan 44 audit found `/guide/verification` silently redirects to `/guide/profile#verification`. The redirect is intentional (verification section merged into profile) but undocumented.
- **Decision:** Accepted as intended behaviour. The redirect works correctly. No user-visible issue. Documented here as intentional. No code change needed.
- **Date:** 2026-05-03

### ADR-031: Defer F014 — booking detail redundant location label at bottom (Plan 44 P2)
- **Context:** Plan 44 audit found `record.destination` (meeting point string) appears both as H1 and as `helper` text in the Деньги card StatCard for "Статус".
- **Decision:** Deferred. Cosmetic. The `helper` prop of the Статус StatCard currently renders `record.title` (same as meeting point). Fix: pass an empty string or a more descriptive helper like "из базы данных бронирования". Defer until booking detail redesign.
- **Date:** 2026-05-03

### ADR-032: Defer F015 — calendar chart empty at 375px (Plan 44 P2)
- **Context:** Plan 44 audit found the "Бронирований в день" chart on `/guide/calendar` renders correctly at 1280px but collapses to invisible at 375px.
- **Decision:** Deferred. The chart library needs a responsive container fix or a mobile text-summary fallback. Low priority — calendar is a secondary surface. Fix before public launch.
- **Date:** 2026-05-03

### ADR-033: Defer FIND-004 — /profile/personal/notifications renders 404 for travelers (ПППД-C P2)
- **Context:** ПППД-C audit found `/profile/personal/notifications` renders a 404 error page ("Страница кабинета не найдена") for travelers, while the parent `/profile/personal` at least redirects. Inconsistent guard pattern between parent and child route.
- **Decision:** Deferred. T028.3 will render a real page at `/profile/personal` for travelers. Once that lands, the child `/profile/personal/notifications` should add a `redirect("/profile/personal")` guard. Assign as a follow-up EDIT in the same session that verifies T028.3 ships cleanly.
- **Trigger:** T028.3 merged to main.
- **Date:** 2026-05-03

### ADR-034: Defer FIND-005 — "Личный кабинет" nav label points to requests list (ПППД-C P2)
- **Context:** ПППД-C audit found the traveler nav item "Личный кабинет" links to `/traveler/requests` (the requests list), not a profile or settings page. Misleading label — user expects account settings, lands in inbox.
- **Decision:** Deferred. The correct fix is to update the nav link to point to `/profile/personal` once T028.3 ships a real traveler profile page. Raise to P1 if a real traveler reports confusion. Assign as EDIT in the same session that ships T028.3.
- **Trigger:** T028.3 merged to main + manual nav-link update in SiteHeader or nav component.
- **Date:** 2026-05-03

### ADR-035: Defer FIND-006 — guide name inconsistency between confirmed-requests tab and booking detail (ПППД-C P2)
- **Context:** ПППД-C audit found the confirmed requests tab shows guide name "Г / Гид" (seed placeholder) while the booking detail for the same booking shows "АС / Алексей Соколов". Two different data paths produce different guide names for the same booking.
- **Decision:** Deferred. Root cause is that the two queries load guide name through different join paths — confirmed-requests tab uses a lighter query that does not join full guide_profiles, booking detail uses a fuller query. Fix: add guide profile join to the confirmed-requests query. Low priority; seed data inconsistency, not a code regression. Include in the final data-quality pass before launch.
- **Date:** 2026-05-03

### ADR-036: Accept F005 — auth gate is inline modal, T029 spec was wrong (ПППД-E P2)
- **Context:** T029 spec described "Redirect to `/auth?next=/requests/new`" as the guest form submission path. Actual implementation uses `HomepageAuthGate` — an inline dialog that stores pending form data and auto-submits via `handleAuthSuccess` after login. No data loss.
- **Decision:** Accepted as better-than-spec UX. The inline modal preserves form data across auth without a page navigation or query-string encoding. No code change needed. The T029 spec description is updated here. Future test descriptions should reference `HomepageAuthGate` modal pattern, not the redirect pattern.
- **Date:** 2026-05-03

### ADR-037: Defer F006 — "Ночная жизнь" chip present in new-request form after T001 removal (ПППД-E P2)
- **Context:** T001 removed "Ночная жизнь" from `INTEREST_CHIPS` in `src/data/interests.ts` (homepage form). The standalone `/traveler/requests/new` form sources its interest chips from a different location and still shows the old chip. Traveler sees 9 chips on the standalone form but 8 on the homepage form — inconsistent.
- **Decision:** Deferred. Fix: audit where the standalone form imports its interest chip list and align with `INTEREST_CHIPS`. Low impact — cosmetic inconsistency visible only after login. Assign as EDIT in next cleanup session.
- **Trigger:** Next ПППД audit cycle or pre-launch polish pass.
- **Date:** 2026-05-03

### ADR-038: Defer F007 — bid price input has valuemax="0" (ПППД-E P2)
- **Context:** PPPD-E audit found the bid amount `<input type="number">` in the guide bid dialog renders with `aria-valuemax="0"` or equivalent. The max constraint evaluates to 0, which is semantically wrong and may confuse screen readers.
- **Decision:** Deferred. Fix: locate the bid dialog component and ensure the `max` prop on the price input maps to a reasonable non-zero value (e.g., `max={10_000_000}`). Aria attribute is auto-set from `max` prop in most input components. Low impact while bid submission itself is blocked by F003 (P0 RLS). Promote to P1 once F003 is fixed and bid flow is testable.
- **Trigger:** T030.3 merged (F003 RLS fix) + next bid-form audit pass.
- **Date:** 2026-05-03

### ADR-039: Defer F008 — T018 specialization badge untestable on seed guide (ПППД-E P2)
- **Context:** PPPD-E audit confirmed T018 badge logic is correct but untestable because `guide@provodnik.app` seed user has `specializations = '{}'` in `guide_profiles`. The badge correctly gates on `specializations.length > 0`, so no badge renders for an empty-specs guide.
- **Decision:** Deferred as seed data gap, not a code bug. Fix: `UPDATE guide_profiles SET specializations = ARRAY['history','architecture'] WHERE user_id = (SELECT id FROM auth.users WHERE email = 'guide@provodnik.app')`. Run via Supabase MCP before the Phase 5 guide-journey walkthrough (T038). Bundle with whatever Supabase maintenance precedes T038.
- **Trigger:** Pre-T038 (Phase 5 guide walkthrough).
- **Date:** 2026-05-03

### ADR-040: Defer F003 — /help/[slug] per-article deep links missing (ПППД-A Residual P2)
- **Context:** T031 audit found no `src/app/(public)/help/[slug]/page.tsx`. Help articles have slugs in DB but no per-article routing; users cannot deep-link or share specific help entries.
- **Decision:** Deferred. The accordion FAQ at `/help` is fully functional. Per-article routing adds shareability but is not a launch blocker. Add a `[slug]/` route in a post-launch content pass when help articles are expected to be linked externally.
- **Trigger:** Post-launch content strategy review.
- **Date:** 2026-05-03

### ADR-041: Defer F004 — "Локальный гид" fallback name on destination listing cards (ПППД-A Residual P2)
- **Context:** `src/data/supabase/queries.ts` lines ~280 and ~775 fall back to literal `"Локальный гид"` when the guide join yields no `display_name`. Seed listings have UUIDs resolving to real profiles but these query paths don't surface the name correctly.
- **Decision:** Deferred. Real production listings will have profiles populated before publishing; the fallback is cosmetically wrong only for seed data visible in dev/demo. Fix: audit the two query paths and ensure `guide_profiles.display_name` is JOIN-selected. Assign as EDIT in next cleanup session before Phase 5.
- **Trigger:** Pre-T036 (Phase 5 guest walkthrough) — destination listing cards appear in the guest journey.
- **Date:** 2026-05-03

### ADR-042: Accept F005 — seed guide profiles use Unsplash stock images (ПППД-A Residual P2)
- **Context:** Seed guide profiles link to Unsplash photo URLs (e.g., `photo-1504593811423-6dd665756598`). Real users who register and upload photos will have their own images; stock URLs appear only because seed data was generated without real uploads.
- **Decision:** Accepted as seed-data limitation, not a code defect. No code fix required. Stock photos disappear automatically once real guides upload their own profile photos. No action before launch.
- **Trigger:** N/A.
- **Date:** 2026-05-03

### ADR-043: Defer F004 — nested `<main>` in `(site)/not-found.tsx` (ПППД-F/G/H P2)
- **Context:** T033 audit found `(site)/not-found.tsx` wraps its content in a `<main>` element, but the surrounding site layout already provides a `<main>` wrapper, producing nested `<main>` elements — invalid per ARIA spec. Screen readers may announce two landmark regions.
- **Decision:** Deferred. Fix: replace the top-level `<main>` in `(site)/not-found.tsx` (and likely `(site)/error.tsx`) with `<div>` or `<section>`. No user-visible regression in current browsers; assistive-technology impact is low for a 404 page. Assign as EDIT in the next cleanup session before Phase 5.
- **Trigger:** Pre-T036 (Phase 5 guest walkthrough) — not-found pages appear in the guest journey when invalid slugs are followed.
- **Date:** 2026-05-03

### ADR-044: Defer F005 — `/admin/moderation` orphan route not linked from admin sidebar (ПППД-F/G/H P2)
- **Context:** T033 audit found `/admin/moderation` renders a valid "Очередь модерации" empty-state page but no sidebar navigation entry links to it. Reachable only by typing the URL directly.
- **Decision:** Deferred. Two fix options: (A) add "Модерация" entry to the admin sidebar nav component; (B) delete `admin/moderation/page.tsx` if listings moderation fully covers the use-case. Defer to Alex for product decision on whether moderation queue is a distinct admin surface or a sub-feature of listings. Assign as DECISION/EDIT after Alex reviews.
- **Trigger:** Admin polish pass or explicit Alex direction.
- **Date:** 2026-05-03

### ADR-045: Defer F006 — `/admin/bookings` shows truncated UUIDs instead of user names (ПППД-F/G/H P2)
- **Context:** T033 audit found each booking row in `/admin/bookings` displays "Турист: 15d43286", "Гид: f42a16ec" — UUID prefixes with no display names or emails. Admin cannot identify parties without cross-referencing the guide list.
- **Decision:** Deferred. Fix: extend the bookings query to JOIN `profiles` (or `guide_profiles`) and surface `display_name` + email in each row. Admin-only surface; no traveler-facing impact. Assign as DISPATCH in the next admin-polish session before launch.
- **Trigger:** Pre-launch admin readiness pass.
- **Date:** 2026-05-03

### ADR-046: Defer F007 — admin dashboard "Всего бронирований" card links to `/admin/disputes` instead of `/admin/bookings` (ПППД-F/G/H P2)
- **Context:** T033 audit found `provodnik.app/src/app/(protected)/admin/dashboard/page.tsx` line ~22 has `{ key: "totalBookings", label: "Всего бронирований", href: "/admin/disputes" }` — wrong `href`, sends admin to disputes queue instead of bookings list.
- **Decision:** Deferred. One-line fix: change `href: "/admin/disputes"` → `href: "/admin/bookings"` for the `totalBookings` stat card. Admin-only surface; no user impact. Assign as EDIT in the next cleanup pass.
- **Trigger:** Pre-launch admin readiness pass.
- **Date:** 2026-05-03

### ADR-047: Defer F008 — `/settings/contact-visibility` renders without site header or navigation (ПППД-F/G/H P2)
- **Context:** T033 audit found `/settings/contact-visibility` (under `(guide)` route group) renders correct content but has no header, sidebar, or back-link. A guide landing on this page via a deep link has no UI affordance to navigate elsewhere.
- **Decision:** Deferred. Fix options: (A) add a `<Link href="/guide/settings">← Настройки</Link>` back-link at the top of the page component; (B) ensure the `(guide)` layout includes the protected SiteHeader. Option (A) is a one-line EDIT; option (B) requires a layout audit. Assign as EDIT in the next cleanup pass.
- **Trigger:** Pre-launch UX polish pass.
- **Date:** 2026-05-03

### ADR-048: Defer F009 — `/admin/listings` untranslated `"general"` category key (ПППД-F/G/H P2)
- **Context:** T033 audit found the admin listings table shows the raw key `"general"` in the type column for one listing. Other listings show translated labels ("Культура", "Семейная прогулка"). A label map entry for "general" is missing in the admin listings component.
- **Decision:** Deferred. Fix: add `"general"` → e.g. `"Обзорная"` to the category label map in the admin listings component (locate via `grep -rn '"general"' provodnik.app/src/app/\(protected\)/admin/listings`). Admin-only display issue; no traveler impact. Assign as EDIT in the next admin-polish pass.
- **Trigger:** Pre-launch admin readiness pass.
- **Date:** 2026-05-03

### ADR-049: Accept F010 — `console.error(error)` in production error boundaries (ПППД-F/G/H P2)
- **Context:** T033 audit found `(protected)/error.tsx:14` and `(site)/error.tsx:13` both call `console.error(error)` unconditionally in a `useEffect`. In production this logs full error objects (including stack traces and file paths) to the browser console for any user with DevTools open.
- **Decision:** Accepted with a caveat. This is the standard Next.js error boundary pattern for development visibility. Production risk is low — stack traces rarely contain secrets, and the exposure is passive (requires DevTools open). Ideal fix is to gate behind `process.env.NODE_ENV === "development"` or route to a monitoring SDK (Sentry already integrated). Defer the code change; upgrade to P1 only if Sentry integration is removed or a real data-leak incident is reported.
- **Trigger:** Sentry config review or data-leak incident.
- **Date:** 2026-05-03

## ADR-050 — Monetization model deferred to post-launch (2026-05-02)

Status: deferred-with-trigger
Context: v1 launches with 0% commission, no money flow on platform. No
mention of commission, escrow, or in-platform payment in any public copy.

Trigger to revisit: 100 real traveler requests on platform OR 30 days
post-launch traffic, whichever is sooner.

Decision frame at trigger: choose model based on observed behavior —
- Spam offers per guide → pay-per-bid
- Off-platform settlement → lead-fee at contact reveal or contact-after-booking
- Daily inbox engagement → subscription
- Reliable lead-source for guides → freemium with N free offers per month

## ADR-051 — /tours activation deferred (2026-05-02)

Status: deferred-with-trigger
Context: v1 launches with /tours stubbed (notFound() under FEATURE_TR_TOURS=0).

Trigger to revisit: 50+ completed bookings via bid-flow AND ≥2 multi-day
guides willing to be alpha publishers.

Decision frame at trigger:
- Activate /tours (second business half)
- Or deepen /listings (more cities, more categories)
- Or extend /requests (multi-city, fixed-date group tours)

## ADR-052 — Anti-disintermediation softening deferred (2026-05-02)

Status: deferred-with-trigger
Context: v1 launches strict — no "contact this guide" button, guides without
listings hidden from /guides, no direct contact channel outside platform-mediated
chat.

Trigger to revisit: 6 months post-launch OR measurable rate of guides inviting
travelers to Telegram in first chat message (regex sweep over the first message
of each new chat thread).

Decision frame at trigger:
- Internal rating system (disincentive to leave)
- Contact reveal only after first booking (compromise)
- Stay strict (if guides are not leaving)

## ADR-053 — Push notification "fill specializations" deferred (2026-05-02)

Status: deferred-with-trigger
Context: Plan 50 T2 ships the cabinet editor without an outbound push or
email asking guides to fill their specializations. Rationale: the guide
without specs already gets every city request — no functional loss, only
no sort ordering. A push before they have any inbox experience has zero
product-pull.

Trigger to revisit: 30%+ of active guides have specs filled OR 50+ guides
on platform — whichever first. If neither in 60 days, introduce as a
profile-completion-checklist nudge (not a push).

Decision frame at trigger:
- Send push/email notification to guides without specializations filled
- Add profile-completion checklist nudge instead (gentler engagement)
- No action (if guides fill specs organically within 60 days)

## ADR-054 — Defer F03 — listing detail hero lazy-load at desktop (Phase 8 P2, T056)

Status: deferred — Plan 59 Task 59-4
Context: Phase 8 audit (T056) found the hero `<Image>` on `/listings/[slug]` lacks `priority`,
causing a visible blank zone until the browser fetches the image at desktop widths.
Decision: Include as Plan 59 Task 59-4 (P2). Does not block launch — hero loads correctly,
only slightly slower. Upgrade to P1 if Lighthouse LCP score drops below 2.5s on a real deployment.
Date: 2026-05-04

## ADR-055 — Defer F04 — broken Unsplash seed image URLs (Phase 8 P2, T056)

Status: deferred — Plan 59 Task 59-5
Context: Phase 8 audit (T056) found 2 seed listings share a broken Unsplash URL
(`photo-1520637836862-4d197d17c55a`) that returns 404. Cards render with broken image placeholder.
Decision: Include as Plan 59 Task 59-5 (P2). Seed data quality issue only. Does not block launch —
affected listings show placeholder image, not a 500 error. Fix before first marketing screenshots.
Date: 2026-05-04

## ADR-056 — Defer F05 — /listings search input missing id/name attribute (Phase 8 P2, T056)

Status: deferred — Plan 59 Task 59-6
Context: Phase 8 audit (T056) found the search input on `/listings` missing `id` and `name`
attributes, causing one browser a11y console warning.
Decision: Include as Plan 59 Task 59-6 (P2). Low impact — screen reader UX degraded but not broken.
Does not block launch.
Date: 2026-05-04

## ADR-057 — Accept F003 — /guide/inbox empty-state with no conversations (Phase 8, T058)

Status: accepted
Context: Phase 8 audit (T058) noted `/guide/inbox` renders an empty conversation list for the demo
guide account. Demo guide has no private-message conversation threads started by travelers.
Decision: Correct product behaviour. The empty state is intentional — the inbox renders request
cards (not private messages), and the demo account has no active threads. No code change needed.
Date: 2026-05-04

## ADR-058 — Defer G-F002 — guide test-credential mismatch in audit task spec (Phase 9, T066.2)

Status: accepted (deferred — audit-tooling concern, not a product defect)
Context: T066.2 spec named login `guide@provodnik.app` / `SeedPass1!`. That account does not
exist in production; the actual guide test account is `dev+guide@rgx.ge`. The auditor reset the
password to `AuditPass1!` and patched `app_metadata.role: "guide"` via the Supabase Admin API to
proceed. The mismatch is in the row spec, not in product code — no traveler or guide ever sees it.
Decision: Deferred. Future browser-audit task specs that target the guide cabinet must reference
`dev+guide@rgx.ge` (or a freshly provisioned `guide@provodnik.app` if one is created later) and
must instruct the auditor to verify both `user_metadata.role` AND `app_metadata.role` are set to
`"guide"` before testing role-gated routes. Tracked here so the next time someone reads
`SeedPass1!` in a row body they know the credentials are stale, not the product.
Date: 2026-05-04

## ADR-059 — Hybrid codebase-awareness in orchestrator RESEARCH (Phase 7, 2026-05-11)

**Context.** Pre-Phase-7 RESEARCH passed only HOT.md + CLAUDE.md + ticket text to the model.
Any moderately specific ticket ("test the homepage", "add a comment to the homepage entry")
escalated for missing source paths the stage never provided. ERR-060 made every real ticket
a manual file-paste exercise for the submitter, defeating mission asymmetry #2 (codified taste,
applied infinitely).

**Decision.** Hybrid architecture:

1. **PROJECT_MAP + PATTERNS-SUMMARY inlined.** The RESEARCH user prompt embeds the project's
   `.claude/sot/PROJECT_MAP.md` plus a ≤2 KB distillation of `.claude/sot/PATTERNS.md` produced
   by `summarizePatterns()` (H2 heading + first non-code-fence prose line of each pattern).
   PROJECT_MAP is the curated **codified taste**: owner-maintained tree of where things live.
   PATTERNS-SUMMARY is the **interpretation defaults** index.

2. **Tool access via `--allowed-tools` + `--add-dir`.** The claude CLI runs with
   `--allowed-tools "Read,Grep,Glob" --add-dir <projectPath>` for RESEARCH (only). The model
   can self-discover files that PROJECT_MAP didn't curate, or whose path drifted since the map
   was last edited. Feasibility verified by `orchestrator/scripts/spike-claude-tools.mjs` —
   sentinel test wrote a random value 5s before the call; the CLI returned the exact value
   from `structured_output`, proving real Read happened (no hallucination).

3. **Escalation kind split.** `ResearchOutSchema.kind` is optional `'missing_info' | 'ambiguous_ticket'`.
   `missing_info` means the model lacked source context the orchestrator can recover by retrying
   with a tool-use directive; the driver routes this to `RESEARCH_RETRY` (new self-loop on the
   state machine, capped by `RETRY_MAX`). `ambiguous_ticket` means submitter intent is unclear
   and only the human can resolve; escalate immediately to the clarification topic. No `kind`
   set ⇒ legacy "escalate" behaviour preserved.

**Alternatives considered.**

- *REPO_MAP-only* (no tools). Cheap and predictable but stays stale; PROJECT_MAP drift caught
  the validation session — actual homepage is at `src/app/(home)/page.tsx`, the map said `(site)/`.
  Without tools, RESEARCH would have escalated.
- *Tool-only* (no map). Forces the model to Glob from zero on every ticket. Costs more, slower,
  loses the owner's curation pass.
- *Hybrid (chosen).* PROJECT_MAP encodes taste, tools deliver coverage. Best-of-both.

**Cost.** Spike: ~$0.06/call on a single small-file Read. Production session
`20260510-add-one-line-top-pdpr` total RESEARCH stage cost stayed under $0.10 (cache reads
dominate the input-token side). Acceptable for the leverage gained.

**Drawbacks.** (a) PROJECT_MAP path drift can mislead the model into a wasted tool call before
it self-corrects — refresh discipline matters. (b) Per-stage cost rises ~$0.05 per tool-enabled
RESEARCH. (c) Adds a new FSM self-loop (RESEARCH → RESEARCH) — covered by tests but it's the
first non-gate state with self-retry.

**Closes:** ERR-060.
**Related:** Phase 7 plan `docs/superpowers/plans/2026-05-11-phase-7-codebase-aware.md`,
ERR-061/062/063 closures, AP-021 (cursor-agent still does no git/bun).
**Date:** 2026-05-11
