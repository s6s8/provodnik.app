# ANTI_PATTERNS.md — Failure Blacklist

_Things tried and failed. Subagents must not repeat these. Format: AP-NNN. See INDEX.md for lookup; HOT.md for top-8 landmines._

---

### AP-001: Using slug directly in ilike data column queries
- **What was tried:** `getListingsByDestination` queried `.or('city.ilike.%kazan-tatarstan%')` using the URL slug directly
- **Why it failed:** The `city` column contains Russian text ('Казань'), not the URL slug. ilike match fails → 0 results returned.
- **Correct approach:** Always resolve slug → destination record first (`select name, region where slug = ?`), then use the actual name/region values in the data query.

### AP-002: Storing image URLs inside text/description columns as JSON
- **What was tried:** `description` field contains plain Russian text. `parseImageFromJson(description)` always throws, falls back to mountain photo.
- **Why it failed:** Description is human text, not JSON. Parsing always fails.
- **Correct approach:** Use a dedicated `image_url` column for image URLs.

### AP-003: Using HTML `required` attribute on inputs with custom JS validation
- **What was tried:** Auth form inputs had `required` HTML attributes alongside JS `handleSubmit` validation
- **Why it failed:** Browser's native validation runs before JS handler — shows browser tooltip instead of styled error UI
- **Correct approach:** Remove `required` from inputs. Rely entirely on JS validation which shows the styled red error box.

### AP-005: Creating git worktrees in the parent workspace repo
- **What was tried:** `git worktree add /mnt/rhhd/projects/provodnik/.claude/worktrees/feat-X` — created worktrees in the PARENT repo
- **Why it failed:** The parent repo at `/mnt/rhhd/projects/provodnik/` contains only docs and workspace files. `provodnik.app/` is a SEPARATE git repo. Worktrees from parent contain no `src/` tree.
- **Correct approach:** All git ops for the app must use `git -C /mnt/rhhd/projects/provodnik/provodnik.app`. Worktrees must be created in provodnik.app, not the parent.

### AP-004: Seed listings assigned to wrong guide_id
- **What was tried:** Test guide account (guide@provodnik.test, ID: 30000000-...-001) had no seed listings because all listings used seed guide IDs (10000000-...-101, 10000000-...-102)
- **Why it failed:** Login as test guide → empty listings page, misleading for QA
- **Correct approach:** Ensure test accounts have corresponding seed data. When adding listings, verify guide_id matches a real test account UUID.

### AP-010: Local-time `Date` arithmetic for any value persisted to or compared against server-time
- **What was tried:** `new Date().toISOString().slice(0,10)` to compute "today" for the booking form's `min` date attribute
- **Why it failed:** UTC-anchored. Server and client TZ differ → SSR/CSR hydration mismatch + "yesterday" appearing as the minimum near midnight UTC. See ERR-022.
- **Correct approach:** Pin TZ explicitly with `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(new Date())`. Wrap in a single helper (`todayMoscowISODate` in `src/lib/dates.ts`). Never compute calendar dates without a TZ.

### AP-011: Silent `catch {}` blocks anywhere a Supabase error could occur
- **What was tried:** `catch (e) { setError("Не удалось отправить запрос"); }` with no discrimination on the underlying error code
- **Why it failed:** Users see one identical message for auth expiry, validation failure, draft listing, missing price — they have no idea what to fix. Support tickets up. See ERR-027.
- **Correct approach:** Server actions return discriminated `{ error: "auth_expired" | "validation" | "listing_unavailable" | "listing_no_price" | "internal" }`; UI maps codes via a single helper (`userMessageForError`). Never throw from actions for non-fatal flows; never swallow the code.

### AP-013: Using 'qa' as thread_subject enum value
- **What was tried:** Querying `conversation_threads` with `.eq('subject_type', 'qa')` for Q&A threads
- **Why it failed:** The `thread_subject` DB enum is `'request' | 'offer' | 'booking' | 'dispute'` — there is NO 'qa' value. Query returns 0 rows silently.
- **Correct approach:** Q&A threads linked to an offer use `subject_type = 'offer'` with `offer_id` set. Always check the actual DB enum before writing queries.

### AP-014: Importing async server components directly into 'use client' components
- **What was tried:** `import { GuideOfferQaPanel } from './guide-offer-qa-panel'` inside a `'use client'` file, wrapped in `<Suspense>`
- **Why it failed:** Next.js bundles the server component into the client bundle. `createSupabaseServerClient` calls `cookies()` which is server-only — throws at runtime. TypeScript does NOT catch this at compile time.
- **Correct approach:** If the data-fetching component's key prop (e.g. offerId) is determined by client state: (a) make it a client component that fetches via server action, OR (b) have a server component parent own the Suspense boundary and pass pre-rendered nodes as children. Option (b) only works if the key is known server-side.

### AP-015: Using 'submitted' or 'offers_received' as traveler_requests status values
- **What was tried:** Filtering requests with `.eq('status', 'submitted')` or `.eq('status', 'offers_received')`
- **Why it failed:** The `request_status` DB enum is `'open' | 'booked' | 'cancelled' | 'expired'` — 'submitted' and 'offers_received' do not exist. Queries return 0 rows silently.
- **Correct approach:** Use `'open'` for active/pending requests. Always verify enum values from the schema migration before writing status filters.

### AP-012: Currency arithmetic via inline `* 100` / `/ 100` outside the centralised helpers
- **What was tried:** Inline `budget_minor: input.budgetPerPersonRub` (write path) and inline `record.budget_minor / 100` (read path) scattered across feature folders
- **Why it failed:** Easy to miss the `* 100` somewhere — entire wizard write path was 100× too small (ERR-025). No type-system guarantee, no round-trip test, no single source of truth.
- **Correct approach:** All RUB ⇄ kopecks crossings go through `rubToKopecks` / `kopecksToRub` in `src/data/money.ts`. Round-trip Vitest test guards the invariant. `grep '\* 100\|/ 100\|_minor'` should return zero matches outside `src/data/money.ts` and the helper consumers.

### AP-014: Importing values (not just types) from a server-only module into a 'use client' component
- **What was tried:** `offer-qa-sheet.tsx` ('use client') imported `QA_MESSAGE_LIMIT` (value) and `QaThread` (type) from `qa-threads.ts`. The type import is safe; the value import is not.
- **Why it failed:** A value import forces the module into the client bundle. `qa-threads.ts` → `server.ts` → `next/headers` → Turbopack build error for all 5 consecutive deployments.
- **Correct approach:** Separate types/constants (that are safe for client) into `*-types.ts` with no server imports. Client components import from `*-types.ts`. Server modules import + re-export from `*-types.ts`. Pattern: `qa-threads-types.ts` (client-safe) + `qa-threads.ts` (server-only).

### AP-016: Adding queue.busy guard in front of a queue
- **What was tried:** `if (queue.busy) return` on all BEK message handlers to prevent concurrent Claude calls
- **Why it failed:** MessageQueue already serialises jobs via #drain(). The guard prevented new jobs from being enqueued at all — defeating the queue's purpose. User's natural text+image workflow (200ms apart) caused the image to always be dropped.
- **Correct approach:** Let the queue absorb concurrent arrivals. Only reject when queue depth exceeds a cap (e.g., size ≥ 4). The queue IS the concurrency mechanism — don't bypass it.

### AP-017: Manually creating or deleting `bek-restart.flag` while the daemon is processing
- **What was tried:** Touch `_archive/bek-frozen-2026-05-08/logs/restart.flag` to "force restart" the daemon during debugging, or `rm` it to "clean up".
- **Why it failed:** The flag is the watchdog → daemon restart channel (ADR-022). Manual creation tells the daemon to exit on its next 5s poll, then PM2 waits 62s (ERR-038) before restart — dropping in-flight work for no reason. Manual deletion mid-poll is harmless but pointless: the daemon deletes the flag itself before exiting, and the watchdog re-creates it via idempotent `writeFile('')`.
- **Correct approach:** For a manual restart, use `pm2 restart quantumbek` (or `pm2 restart bek-watchdog` to reset the watchdog's circuit breaker after a `GIVING_UP` line). The flag is internal plumbing — leave it alone.

### AP-018: PM2-managed Node ESM script using `import.meta.url`/`process.argv[1]` self-detection on Windows
- **What was tried:** Standard ESM self-execution pattern `if (pathToFileURL(process.argv[1]).href === import.meta.url) await main()` so the same module can be both imported by tests AND run as the entrypoint.
- **Why it failed:** PM2's Windows fork wrapper produces a `process.argv[1]` that doesn't match `import.meta.url` even after `pathToFileURL` round-tripping. Possibly drive-letter case / 8.3 short-name / trailing-separator differences. The module loaded fine, no error was thrown, but `main()` never ran and PM2 saw a "healthy" no-op process. See ERR-044.
- **Correct approach:** Split entrypoint from module. Export `main` from `<module>.mjs`. Create `<module>-run.mjs` containing only `import { main } from './<module>.mjs'; await main();`. PM2's `script:` points at the run shim. Tests import the module directly with no top-level execution. Pattern lives in `_archive/bek-frozen-2026-05-08/src/bek-watchdog-run.mjs`.

### AP-019: [SUPERSEDED by AP-020 + ADR-024] Relying on `--dangerously-skip-permissions` alone for `.claude/**` writes
> **Superseded note:** the originally-proposed fix (`permissions.allow` rules in settings.json) was empirically tested and FAILED. The correct approach is path migration — see AP-020. Original entry preserved below for forensic reference.
- **What was tried:** Spawn Claude CLI with `--dangerously-skip-permissions` and assume all tool calls are unblocked, including `Write`/`Edit` against `.claude/**` (BEK's plan files, session state, SOT updates).
- **Why it failed:** Claude CLI 2.1.119+ self-protects `.claude/**` paths regardless of the skip flag — the flag suppresses interactive prompts but the CLI now treats its own config directory as always-protected unless an explicit `permissions.allow` rule grants it. Symptom: `Claude requested permissions to edit ...` error from a Write tool call (see ERR-045).
- **Original (incorrect) approach:** Add explicit `permissions.allow` rules to project-level `.claude/settings.json` for any path under `.claude/**` the agent legitimately needs to write. Include both relative (`Write(.claude/**)`) and absolute (`Write(D:/.../.claude/**)`) patterns since the matcher compares against the literal tool input. The skip flag is a convenience for prompts, not a permission grant. **— this approach DOES NOT work; allow rules don't override the hardcoded protect.**
- **Actual fix:** Path migration (ADR-024 / BEK v2). Move the writeable target out of `.claude/` to `_archive/bek-frozen-2026-05-08/`. See AP-020.

### AP-020: Trying to bypass `.claude/**` self-protect from a non-interactive Claude session
- **What was tried:** Five sequential approaches to bypass Claude CLI 2.1.119's `.claude/**` write protection while keeping BEK files at their original `.claude/` paths:
  1. `permissions.allow` rules with both relative and absolute path patterns
  2. `--permission-mode acceptEdits` instead of `--dangerously-skip-permissions`
  3. Bash heredoc redirect (`cat > .claude/...`)
  4. Plain Bash `touch` of `.claude/...` files
  5. PreToolUse hook returning `permissionDecision: 'allow'` (designed but not shipped — research showed allow rules don't override the hardcoded protect anyway)
- **Why each failed:** The protection is hardcoded at the CLI level, evaluated before `permissions.allow` rules and across all permission modes. The exempt subdirs (`commands/`, `agents/`, `skills/`) are the only writeable subpaths under `.claude/` for a non-interactive Claude session. Bash redirect to `.claude/` triggers the same self-protect via the Bash tool's compound-command checking.
- **Correct approach:** Move the target out of `.claude/`. For BEK we used `_archive/bek-frozen-2026-05-08/` at repo root. For any future tool with the same need: use `_archive/bek-frozen-2026-05-08/`, `bek-data/`, `runtime/`, or any sibling directory. The path is the fix, not the policy.

### AP-021: Putting `git` or `bun` commands in a cursor-agent prompt on Windows
- **What was tried:** Plan 08 Task 1 v3 prompt told cursor-agent to run `git add -A` then `git commit -m "..."` as the final step. Earlier v1 prompt also let cursor-agent run `bun run typecheck` and `git branch --show-current`.
- **Why it failed:** cursor-agent's Bash tool hangs indefinitely on `git` and `bun` invocations on Windows (ERR-047) — confirmed reproducible even without `cd /d/...` chaining. The whole agent event loop blocks waiting for the bash response, eating the wrapper timeout (600s+) and producing zero progress. Pre-existing hang patterns (chained `cd && ...`, `bunx vitest run`) are special cases of this broader issue.
- **Correct approach:** "No bash at all" hard rule in every cursor-agent prompt: cursor-agent uses ONLY native Read, Edit, Write, Glob, Grep tools. Orchestrator runs all git operations (branch, add, commit, push, merge, checkout) and all verification (typecheck, lint, build). Final commit message goes in the prompt as documentation; orchestrator executes it. cursor-agent's DONE report lists files edited + unexpected findings; no SHA. See ADR-025 for the codified policy.

### AP-022: Authoring plans from memory without a fresh grep audit
- **What was tried:** Plan 08 Task 1 v1 KNOWLEDGE section listed "expected callers" of `COPY.zeroCommissionShort` based on author memory: `for-guides/page.tsx` (deleted) and "possibly `homepage-discovery.tsx`". The plan did not anticipate a 5th caller.
- **Why it failed:** A fresh `grep -rn "zeroCommissionShort" src/` (run by cursor-agent during dispatch) found 3 references in `src/components/layout/guide-kpi-strip.tsx` that the plan author missed. Without the orchestrator pausing to update scope, deleting the COPY key would have left `guide-kpi-strip.tsx` typecheck-broken on main after Task 2's "expected residuals" cleanup, requiring an emergency unscoped fix. We caught it because cursor-agent stalled on the next bash call (ERR-047) rather than because the plan was correct.
- **Correct approach:** Before writing a plan that removes a COPY key, named export, or symbol, run `grep -rn "<symbol>" src/` and list ALL callers in the plan's KNOWLEDGE section. Reconcile with SCOPE: every caller must either be deleted or edited by the plan. If the symbol is referenced from a file the plan doesn't intend to touch, either expand SCOPE or leave the symbol in place. Memory-based caller lists are guesses; grep is ground truth.

### AP-023: Deleting a route file without grepping for dynamic imports
- **What was tried:** Plan 45 spec listed `src/app/(public)/listings/[id]/transfer/page.tsx` for deletion, treating it as orphaned (V1-gated, returns `notFound()` in prod). The spec assumed nothing else referenced it.
- **Why it failed:** `(public)/listings/[id]/page.tsx` line 53 dynamically imported `./transfer/page` whenever `listing.exp_type === "transfer"` — a pattern that static `grep "from \"./transfer\""` misses because dynamic imports use `await import("./transfer/page")` syntax. Typecheck failed after the deletion landed; the orchestrator caught it pre-commit, expanded scope to replace the dispatch with `notFound()`, and shipped. Had the typecheck not been run before commit, the build would have broken on Vercel.
- **Correct approach:** When authoring a plan that deletes a route file (`page.tsx`, `route.ts`) or any module that could be a dynamic-import target, grep for BOTH static (`from "<path>"`) AND dynamic (`import("<path>")`) references. The dynamic pattern catches Next.js feature-flag dispatchers like `if (flag) { const { default: X } = await import("./x"); ... }`. Run typecheck against the deletion BEFORE committing — `tsc --noEmit` resolves dynamic imports and surfaces breaks the grep didn't find.

### AP-024: Calling `api.answerCallbackQuery` without try/catch, or running grammY without `bot.catch`
- **What was tried:** Every `onCallbackQuery` handler in `quantumbek/orchestrator/bot/bot.mjs` (15 call sites) called `api.answerCallbackQuery(cb.id, ...)` directly without wrapping. The bot was started with a bare `await bot.start()` and no `bot.catch` registration.
- **Why it failed:** Telegram callback_query objects expire ~15 min after creation. When a user taps a gate button after the previous FSM stage took longer than that (typical PLAN+DISPATCH+VERIFY block: 5–10 min on its own; a paused or interrupted session can sit hours), `answerCallbackQuery` returns `400: Bad Request: query is too old and response timeout expired or query ID is invalid`. grammY surfaces this as a thrown `GrammyError`. Without per-call try/catch the throw escapes the handler; without `bot.catch` the default grammY behavior is `Stopping bot` — polling halts but the Node process keeps running, so pm2 sees nothing wrong and never restarts. The bot becomes silently dead under a healthy-looking pm2 entry. 2026-05-13: orch-provodnik silent for 3h 26min on exactly this pattern (ERR-078).
- **Correct approach:**
  1. Every `await api.answerCallbackQuery(...)` call goes through a tiny try/catch helper (e.g. `ackCb`) that logs the description and swallows the throw — stale-callback 400s are normal Telegram behaviour, not bugs.
  2. Every grammY bot registers `bot.catch((err) => console.error(...))` BEFORE `bot.start()`. Any throw from any middleware path logs and the polling loop survives.
  3. For pm2-hosted bots: consider calling `process.exit(1)` inside `bot.catch` for truly unrecoverable errors so pm2 restarts the process; but only after logging context. Silent-stop under pm2 is the worst failure mode because nothing alerts.
- **Sibling APIs to audit for the same pattern:** any `api.<verb>` call that touches Telegram's mutable surface (`pinChatMessage`, `editMessageText`, `setMessageReaction`, `closeForumTopic`) can throw on stale or invalid state. Either wrap each call individually or rely on the `bot.catch` net — but never both unregistered.

### AP-025: Terminal state transition without a worker-visible notification
- **What was tried:** `/override <sid> abort` and `/resume <sid> abort` handlers in `bot/bot.mjs` wrote `state='ABORTED'` and called `continuePipeline`. `drivePipeline` cleaned the worktree and, **only if `session.parentEpicId` was set**, posted a back-report to the parent epic topic. For orphan sessions (created via `/new` or `/think`, no parent epic) no message ever reached the session's own forum topic.
- **Why it failed:** Workers don't read audit-topic — that's owner territory. Their only visible signal is messages in their own session topic. When the bot silently moves the session to ABORTED, the worker can't tell whether the bot is thinking, stuck, dead, or done. Anti-mission failure: forces the worker to become PM-of-the-bot, exactly what we built the orchestrator to avoid (Mission v3: less of a forced architect / less of the team's bottleneck). 2026-05-13 Alex hit this on K4 `ypwv` topic 370 and had to manually compose a multi-paragraph analysis decoding the bot's silence into a/b/c options for the owner.
- **Correct approach:**
  1. **Every terminal state must produce a worker-visible signal in `session.topicId`** (or for child-of-epic, in the parent epic topic via back-report — which already worked). DONE → existing `runDone`. ESCALATED → existing clarification/safety prompts. ABORTED/ABANDONED → new ERR-079 block in `driver.mjs`. CANCELLED → existing `/think-cancel` message in `bot.mjs:833`.
  2. **Capture the human reason at the abort surface.** Both `/override <sid> abort [reason]` and `/resume <sid> abort [reason]` now take an optional trailing reason and stash it to `session.abortReason` so the worker sees WHY, not just THAT.
  3. **Idempotency on terminal notifications.** Add a `terminalNotifiedAt` field; check before re-posting. Recovery / repeated /override re-enter the same code; the field prevents spam.
- **Sibling APIs to audit for the same anti-pattern:** any state write that's terminal or quasi-terminal (DONE, PAUSED long-tail, ABANDONED, KILLED, CANCELLED) must check whether the session topic gets a notification on the path leading to that write. If the path includes `continuePipeline`, the `driver.mjs` block handles it. If a handler writes terminal state and bypasses `continuePipeline`, that handler must post its own message.
- **Defense pattern for new optional session fields:** any new field declared in the bot but NOT registered in `SessionSchema` Zod will be silent-stripped on load (ADR-061 / `feedback_zod_session_schema_strip.md`). Whenever you add a state-carrying field, declare it as `z.<type>().optional()` in `bot/pipeline/state/session-schema.mjs` in the SAME commit. ERR-079 declares both `abortReason` and `terminalNotifiedAt` for exactly this reason.

### AP-026: Gate buttons without visible message feedback
- **What was tried:** `bot.mjs:onCallbackQuery` only called `answerCallbackQuery` after a successful FSM transition. The toast (`Advancing`) is brief and easy to miss on mobile; the gate message kept its inline keyboard so it visually looked unanswered.
- **Why it failed:** Workers re-tapped PROCEED because nothing visible changed → duplicate FSM events, stale-callback 400s (ERR-078), and a sense that the bot is broken. Alex 2026-05-13 15:30: "я всегда нажимаю PROCEED, но я не понимаю принята команда или нет, визуально ничего не происходит".
- **Correct approach:** After applying the reducer, edit the gate message: append a `✅ <action> · @<user>` stamp line in italic and omit `reply_markup` from the editMessageText call (Telegram removes the keyboard when reply_markup is absent on edit). Best-effort wrap with try/catch; ignore "message is not modified" 400s — they mean the user double-tapped and we already stamped.

### AP-027: Triple-backtick code blocks for short paste-and-run commands
- **What was tried:** The model used ` ``` ` multi-line code blocks for every command it asked the worker to paste, regardless of length.
- **Why it failed:** Mobile Telegram clients render triple-backtick blocks with a "Copy" button — but on some Android builds the copy target is an image, not text. Worker pastes garbage. Alex 2026-05-13 14:42: "проблема в том, что блок текста, который ты даёшь мне как готовую команду копируется как картинка или что-то в этом роде и ты не видишь команду".
- **Correct approach:** Single-backtick `inline code` for any command that fits on one line. Reserve `` ``` `` only for genuinely multi-line code/config snippets. Combined with italic for explanatory prose and bold reserved for "the one thing to do" emphasis. Codified in epic-runner.mjs and think-runner.mjs system prompts as the "Telegram formatting" section.

### AP-028: Long sessionIds shown to workers
- **What was tried:** Worker-facing messages referenced sessions by full ID like `20260513-160-px-96-px-g00m` — date + slug + random suffix, 30+ chars.
- **Why it failed:** Workers cannot keep these IDs in working memory across multiple tickets. Alex 2026-05-13 16:07 invented his own scheme on the fly: "Т1, Т2 .... так лучше. Нумерация будет идти до конца проекта". He started using T-numbers for his own bookkeeping, but the bot kept echoing back the long form — two parallel ID systems competing.
- **Correct approach:** Bot allocates a worker-facing short ID at intake time (T-NN for sessions, E-NN for epics) using a single per-app monotonic counter at `<app>/.short-id-counter` guarded by file-mutex. Topic names lead with the short ID. The full sessionId stays in JSON state for owner debugging and git correlation, but never leads in worker-facing copy. New module: `bot/lib/short-id.mjs`.

### AP-029: Sending worker-facing Telegram messages from operator scripts without the sanitize+format pipeline
- **What was tried:** Operator-level scripts (`scripts/owner-digest.mjs`, retroactive notification scripts, my own `curl sendMessage` for ship-recaps/coaching) called `api.sendMessage` directly with raw text — typically a mix of markdown, HTML tags, internal jargon (stage names, error IDs, implementation references), and owner identifiers.
- **Why it failed:** The bot's privacy/persona rules live in two automatic layers — model-time system prompt guidance (in `epic-runner.mjs` / `think-runner.mjs`) and deterministic post-process strip (`bot/lib/sanitize-reply.mjs`). Both run only on MODEL-generated FSM replies. Operator scripts bypass the model and therefore bypass both layers. Result: internal jargon leaks into worker-visible artifacts. Owner caught msg 849 in Alex board on 2026-05-14: pipeline stage names, `cursor-agent`, owner's first name all visible to a worker who isn't supposed to know these exist.
- **Correct approach:**
  1. Use `bot/lib/worker-comms.mjs` for every worker- or owner-facing send from operator scripts: `sendWorkerMessage({ api, chatId, threadId, text, audience })` and `editWorkerMessage({ api, chatId, messageId, text, audience })`. Both internally apply `sanitizeReply` → `markdownToTelegramHTML` → api with `parse_mode: 'HTML'`.
  2. `audience: 'submitter'` strips and redacts (for worker-facing); `'owner'` lets debug-friendly text pass but still logs leaks to pm2 so the operator notices regressions.
  3. Bot's own FSM stages (`bot/pipeline/stages/19-notify`, `bot/lib/epic-handlers`, gate prompts) ALREADY route through `markdownToTelegramHTML` and sometimes `sanitizeForTelegram` inline — they're OK. The new helper standardises the rule for code outside the FSM.
  4. Direct `api.sendMessage(...)` / `api.editMessageText(...)` from any script in `scripts/` is a regression — flag in code review.
- **Sibling APIs to audit for the same anti-pattern:** any new operator-side script that needs to talk to Telegram (incident notifier, weekly digest, audit summary, retroactive correction). Same rule: use the helper. Skipping it is how msg 849 happened.

### AP-030: Comparing inbound Telegram message_thread_id without `?? 0` normalization
- **What was tried:** Inline routing guards `if (ctx.message_thread_id !== cfg.topics.general && ctx.message_thread_id !== 0) return;` at bot.mjs:227 (/new) and :311 (/think) — and any equivalent strict comparison anywhere a handler decides "this command is only valid in the General topic".
- **Why it failed:** Telegram forums send `message_thread_id: undefined` for messages in the General topic (it's the chat root; only sub-topics carry a thread_id). Strict inequality vs both a concrete topic id and 0 fails open in opposite direction — undefined matches neither, guard returns, command drops silently. Worker has no signal that the bot ignored the command. /kodex didn't suffer because its handler never gated on a specific thread_id.
- **Correct approach:** Use the chokepoint helper `isCommandAllowedInTopic(threadId, generalTopicId)` from bot/lib/routing.mjs, which normalizes `threadId ?? 0` before comparison. Apply at every site that decides "is this message coming from General?" or that compares thread_id to a specific id from cfg.topics. If extending for a new gating clause, the helper is the single point to update; never re-inline the strict comparison.
- **Sibling APIs to audit:** any handler reading ctx.message_thread_id and branching on a strict-equality match. Pre-existing bot.mjs sites (e.g. line 1463, 1496) already used the `?? 0` pattern — the bug was specifically the gating clauses for /new and /think that came in with M2/M3.
- **Cycle:** 2026-05-15 (ERR-083 fix).

### AP-031: Decomposing an epic with specifics baked into ticket titles before the audit/research dep has run
- **What was tried:** /epic conversation arrived at a feature plan including "create a canonical list of 8 theme slugs". Decomposition emitted node #1 ("Audit theme vocabularies") followed by node #2 ("Create canonical themes module — 8 slugs + labels + icons"). The number 8 was baked into the title before #1 had a chance to find a different answer. Audit later found 7 distinct listing labels + a drifted religion slug on the homepage form — but the canon ticket had already been written against "8". cursor-agent shipped exactly 8 chips. Plan-critique PASSed because the model never compared the diff against the audit doc.
- **Why it failed:** Two reinforcing failures. (1) The decomposition prompt allowed specific counts and identifier lists in titles even when dependent on research-typed nodes. (2) The audit doc (#1's ship artifact) was not auto-propagated into the canon ticket's KNOWLEDGE context — neither plan-critique nor prompt-build saw its findings. So the audit's value (cross-surface contradictions, drift, dual-column trigger) sat in a markdown file nobody read at the next stage.
- **Correct approach:** Two structural fixes both required.
  1. **Decomposition validator:** bot/lib/epic-runner.mjs validateDecomposition() hard-rejects any tree node whose deps include a research/audit/inventory/survey-titled node AND whose own title contains numeric counts (e.g. "8 slugs", "5 buttons") or literal identifier lists. 3-retry loop feeds violations back to the model. Placeholder phrasing required: "canonical chip list", "audited slug set".
  2. **KNOWLEDGE auto-promotion:** bot/lib/epic-back-report.mjs captures shippedArtifacts from `git show --stat` (filtered to docs/audits/data/config files). bot/pipeline/stages/11-prompt-build.mjs walks dep shippedArtifacts and inlines them under a "Dep-shipped artifacts" section in cursor-agent's prompt (6K char total cap with truncation marker). bot/lib/audit-coverage-check.mjs runs at plan-critique time: extracts file mentions from audit-style sections ("Cross-Surface Contradictions", "Findings", "Affected Files"), checks plan.fileScope coverage + rationale acknowledgment, escalates on gap.
- **Sibling APIs to audit:** any future plan-stage critique or pre-dispatch validator. The "model said PASS confidence=1 concerns=[]" claim is not enough for high-stakes paths; always second-source via deterministic check.
- **Cycle:** 2026-05-15 (ERR-082 root cause).

### AP-032: Auto-shipping a verify-green ticket with confidence=1 / concerns=[] when fileScope touches a high-stakes path
- **What was tried:** 15-verify-decide.mjs returned the deterministic PASS shortcut whenever all verify steps were green: `{status:'PASS', confidence:1.0, summary:'all checks green', concerns:[], next:'ship-gate'}`. SHIP_GATE auto-approves at confidence≥0.7 — so a clean verify on a schema-affecting ticket bypassed owner review entirely. E-4 #2 hit exactly this path: canon-without-audit shipped to main, then plan-critique on the next ticket noticed the missing fileScope (but #2 was already on main).
- **Why it failed:** Verify steps test correctness of code-as-written, not coverage of code-as-needed. A ticket can be "all checks green" while shipping a wrong canon, a missing column write, or a stale trigger reference. confidence=1 expresses the model's confidence in verify, not in completeness.
- **Correct approach:** New bot/lib/high-stakes-paths.mjs classifier matches supabase/migrations/, src/data/, *.config.*, bot/pipeline/state/, bot/lib/*-store.mjs. In 15-verify-decide.mjs, when the deterministic PASS would fire AND plan.fileScope contains any high-stakes path, force confidence=0.7 and append a concern: "high-stakes path touched with no concerns flagged — second-source review required: <list>". The confidence drop routes the ship through manual SHIP_GATE; owner reviews and decides.
- **Sibling APIs to audit:** SHIP_GATE auto-approve thresholds in cfg. Any path that converts "verify green" into "ship green" without a fileScope check.
- **Cycle:** 2026-05-15 (ERR-082 follow-on).

### AP-033: Operator scripts that bypass FSM gates without an audit trail
- **What was tried:** scripts/nudge-session.mjs (and predecessor scripts/nudge-g00m.mjs) imported drivePipeline directly and called it with `gateSimulator: () => ({ specGate: 'PROCEED', planGate: 'PROCEED', shipGate: 'PROCEED' })`. The operator ran them from the macmini shell when sessions got stuck at owner-tap gates — they auto-PROCEED'd every gate (SPEC, PLAN, SHIP) without consent prompts, audit-log entries, or worker-visible notification.
- **Why it failed:** Same class as ERR-081 (operator-script Telegram sends that bypass sanitize+format). Operator scripts sitting in scripts/ are invisible to the FSM's audit trail — any operator (or stray cron) can run them. The /override <sid> proceed command (in-bot) does the same per-gate advance with a logged audit entry; nudge-session bypassed that on grounds of convenience (it advanced through ALL three gates without re-prompting).
- **Correct approach:** Delete the operator scripts. /override <sid> proceed is the canonical path — one tap per gate, audit-logged, with classifyOverride() safety bar for HARD_STOP / cap / safety escalations. For multi-gate auto-advance, owner taps each gate (now visible via F1 button-stamp) OR opts into per-epic policy.autoFire (T-L) which auto-fires only when verify-decide is genuinely clean (confidence≥0.85, concerns=[], status=PASS) AND high-stakes-path sanity-check (T-I) hasn't downgraded confidence.
- **Sibling APIs to audit:** scripts/sweep-idle-epics.mjs (legitimate — different concern; idle epics get marked ABORTED with reason after 14 days). Any future operator script that touches FSM state or sends to Telegram must go through bot/lib/worker-comms.mjs (ERR-081) and avoid driver-state mutations (this AP).
- **Cycle:** 2026-05-15 (T-E deletion of nudge-session.mjs).

### AP-034: Cron job for bot-internal housekeeping (stall detection, state sweeps, etc.)
- **What was tried:** Considered cron-scheduling a stall-sweeper script alongside scripts/owner-digest.mjs (F7 daily digest, currently cron'd at 20:00 mini local) and scripts/sweep-idle-epics.mjs (legitimate 14-day-idle epic sweep).
- **Why it failed (in design review, before shipping):** Cron entries are invisible — they're configured per-machine in `crontab -e` with no version control, no test coverage, and no observability when the bot itself is down. They require SSH access to change. They duplicate dependency-bootstrap (each script re-instantiates Bot, ConfigLoader, SessionStore, etc. — ~30 LOC of the same scaffolding that ERR-081 was about). Most critically, the "cron survives bot restart" argument is hollow because if the bot is wedged, the cron sweep can'd act on its findings anyway — it can only send DMs.
- **Correct approach:** In-bot setInterval. bot/lib/stall-sweeper.mjs runs as a setInterval(5 * 60_000) wired in bot.mjs main() with an isSweeping overlap guard and .unref() so it doesn't keep the event loop alive at shutdown. NODE_ENV=test skips so test runs are deterministic. Shares the bot's auth, telegram api instance, sanitize-reply pipeline, audit-log. Changes ship via a one-file edit + pm2 restart (vs SSH + crontab edit + cron-vs-pm2 env divergence).
- **Sibling APIs to audit:** scripts/owner-digest.mjs (F7) could be re-housed in-bot the same way next time someone touches that area. scripts/sweep-idle-epics.mjs is borderline (runs daily, just marks ABORTED — low blast radius); leave alone unless reasons accumulate.
- **Cycle:** 2026-05-15 (ERR-084 design decision).

### AP-035: Propagating an inherited canon/constant without examining whether the constant itself is correct
- **What was tried:** E-10 consolidated five scattered theme dictionaries onto the canonical `themes.ts`. Every ticket (T1–T5), every spec, every critique examined *how* to consolidate onto the canon — none questioned whether the canon's 8 slugs were the right 8. The canon (and the audit that blessed it) were treated as fixed ground.
- **Why it failed:** The canon was wrong at its source (ERR-091 — built from the Guides vocabulary, not the agreed traveler-request-form vocabulary). Consolidating *onto* a wrong canon doesn't surface the error — it cements and spreads it. E-10 made the bug worse: it eliminated the correct value (`religion`) from every surface and even made the request schema reject it.
- **Correct approach:** When work consolidates onto, derives from, or trusts an existing constant / audit / "source of truth", spend the first step *validating the constant itself* against the originally-agreed intent — not just planning the consolidation. Ask: where did this value come from, was that the authoritative surface, does it match what was actually agreed? An inherited audit's classifications ("X is drift") are claims to verify, not facts. If a decision was recorded earlier ("take the request-form list"), check the artifact actually honours it. Derive secondary lists from the canon (never hand-copy) so they cannot silently diverge.
- **Cycle:** 2026-05-16 (ERR-091 — worker caught the wrong canon after a full 5-ticket epic shipped on it).
