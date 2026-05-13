# ERRORS.md — Bug & Failure Log

_Append-only. Never delete entries. Format: ERR-NNN. See INDEX.md for lookup; HOT.md for top-8 landmines._

---

### ERR-068 → RESOLVED 2026-05-11 (provodnik 4d299c1)
- **Symptom:** Two consecutive Vercel production deploys failed with: *"There was a permanent problem cloning the repo. The git provider returned an HTTP 500 error."* Stuck production at the previous good build (15h-old) — commits `5d6cd72` (nightlife-chip ship) and `9ff5044` (ADR-060 SOT closure) did not propagate to prod.
- **Root Cause:** Transient GitHub git-hosting hiccup. Not a code issue — local `bun run typecheck && lint:ratchet && vitest` all green; the failure was at the Vercel-side clone step before any build began.
- **Fix:** Pushed empty commit `4d299c1` ("chore(ci): retrigger Vercel build after transient GitHub HTTP 500") to refire the webhook. Subsequent build succeeded — `provodnik-6kji0tj8t` ● Ready in 1m, production now serves `4d299c1`.
- **Prevention / future workaround:** When Vercel reports clone-step HTTP 500, do `git commit --allow-empty -m "chore(ci): retrigger"` + `git push`. Don't chase phantom code bugs first. The error message itself is honest about being a "temporary issue with the git hosting service" — trust it.
- **Files Affected:** none (infra).
- **Date opened/closed:** 2026-05-11.

### ERR-067 → OPEN (filed 2026-05-11)
- **Symptom:** After a session completes (state=DONE), the orchestrator's POST_WORK stage writes new content to `.claude/sot/PATTERNS.md` but does **not** `git add`/commit the file. The main checkout is left with uncommitted changes. Caught on session `20260510-fix-err-059-layer-euk5` (ERR-059 Layer 1 ship): cursor-agent's commit `10b0e5a` correctly contained only the 7 in-scope files; the +33 line `PATTERNS.md` addition surfaced via `git status` after DONE.
- **Risk:** Next ticket's ff-merge runs in projectPath which has the dirty file. Git will allow the merge to proceed if the merge doesn't touch `PATTERNS.md` (typical), but the dirty state accumulates over sessions and any future ticket that DOES touch `PATTERNS.md` (e.g., to add another pattern from the same surface) will fail with "Your local changes would be overwritten by merge."
- **Workaround:** Orchestrator commits POST_WORK output manually after each ship with `chore(sot): codify <theme> pattern from session <sid>`. Done for session euk5 in commit `e49a605`.
- **Fix shape (future):** Extend `bot/pipeline/stages/18-post-work.mjs` to `git add .claude/sot/PATTERNS.md` + `git commit -m "chore(sot): codify pattern from <sid>" --no-verify` in projectPath after writing the file. Should be idempotent: if `git status --porcelain` shows no change to PATTERNS.md, skip. Phase 8.7 candidate.
- **Files Affected:** `bot/pipeline/stages/18-post-work.mjs` (no-commit gap).
- **Date opened:** 2026-05-11.

### ERR-066 → RESOLVED 2026-05-11 (Phase 8.5 — quantumbek 8e5bed1)
- **Symptom:** Sessions cancelled or aborted after DISPATCH left `.worktrees/task-<sid>/` directories and `task/<sid>` branches behind in the projectPath, accumulating on mini between sessions. Phase 8 entry handover flagged this as a Cancel-path TODO. The current `apps/provodnik/.sessions/` happens to be clean (all ABORTED sessions cancelled pre-DISPATCH; all DONE sessions had cleanup via `17-ship.mjs#runShip`'s `removeWorktree` on success) — but the gap would bite on the first cancel-after-dispatch event.
- **Root Cause:** `17-ship.mjs` cleans up on a successful ship; no cleanup hook existed for ABORTED/ABANDONED transitions. `12-dispatch.mjs` explicitly preserves the worktree on ESCALATE for owner inspection (lines 41-48 / 67-77). Manual abort paths in `bot.mjs` (`/override <sid> abort`, `/resume <sid> abort`) just wrote terminal state and replied — no `continuePipeline`, no cleanup. Gate-button cancels reach the FSM loop's terminal exit but the driver had no post-loop cleanup branch.
- **Fix:** New `bot/lib/git-ops.mjs#deleteTaskBranch({projectPath, branch, execFn})` — idempotent (regex-detects "not found" / "no such branch" / "not a valid branch" stderr and returns `{deleted:false, reason:'not found'}` instead of throwing; other errors propagate). `drivePipeline` post-loop block: on `session.state ∈ {ABORTED, ABANDONED}` with `worktreePath` set and `projectPath` available, runs `removeWorktree` (--force) + `deleteTaskBranch` — both best-effort, errors logged via `console.error` not rethrown. Manual abort paths in `bot.mjs` now call `continuePipeline(sid)` after the save so the driver picks up the terminal state and runs the same cleanup uniformly.
- **Files changed:** `bot/lib/git-ops.mjs` (+deleteTaskBranch), `bot/pipeline/driver.mjs` (post-loop cleanup branch + import), `bot/bot.mjs` (continuePipeline after both manual aborts), `tests/lib/git-ops.test.mjs` (+3: success / not-found-idempotent / bogus-projectPath-throws), `tests/pipeline/driver.test.mjs` (+1: ABORTED session pre-seeded → drivePipeline observes both expected git commands). Suite 273 → 277.
- **Validation:** Unit tests cover the helper exhaustively and the driver-level wiring directly. Bot reloaded cleanly post-deploy (PID 17579). No production cycle exercised the cancel-after-dispatch path this session because all queued ABORTED sessions had cancelled pre-DISPATCH (no worktree to clean). The cleanup is proactive; the next cancel-at-SHIP_GATE event will be the first live exercise.

### ERR-065 → RESOLVED 2026-05-11 (Phase 8.3 — quantumbek 16c3e65)
- **Symptom:** ESCALATED sessions had no clean recovery path. `/override <sid> proceed` only fired `_PROCEED` events for SPEC_GATE/PLAN_GATE/SHIP_GATE; on ESCALATED state it replied `Session <sid> not at a gate (state=ESCALATED)`. `/resume <sid> approve` recovered only when `shippedSha` was set (post-ship POST_WORK recovery), so any escalation BEFORE ship (Vercel deploy failure, transient cursor error, retry exhaustion) forced the owner to `/resume abort` + create a fresh `/new` ticket. Cost: every transient infra hiccup mid-pipeline burned the entire session. Tracked as `feedback_ship_gate_escalate_recovery_gap.md`.
- **Root Cause:** The FSM `transitions.mjs` allow-list already permitted `ESCALATED → POST_WORK | ABORTED | PRE_FLIGHT | RESEARCH | BRAINSTORM | PLAN | DISPATCH | SHIP`, but no bot command wired any of those transitions for the non-shipped case. The session also lacked a record of WHICH stage escalated — only the human-readable `escalatedReason` string. Without an origin trace, recovery target selection was guesswork.
- **Fix:** New `bot/lib/override-recovery.mjs#classifyOverride(session)` helper applies a safety bar (HARD_STOP / dependency-file / cap / forbidden patterns → reject with `/resume abort + fresh /new` redirect; clarification kind → reject with Refine-button redirect; unknown `escalatedFrom` → reject) and otherwise returns a recovery target from `OVERRIDE_RECOVERY_MAP`: spec-side escalations rethink (RESEARCH/BRAINSTORM/PLAN), dispatch/verify-side rerun cursor-agent (DISPATCH), ship-side force-ship past failed Vercel (SHIP), post-work rerun (POST_WORK). All map targets verified against the `transitions.mjs` allow-list via a generated cross-check test. `SessionSchema` gains optional `escalatedFrom`; driver.mjs captures it alongside `escalationKind` at both escalation paths (cap-trip + main runner). `bot.mjs` `/override <sid> proceed` when state=ESCALATED delegates to the helper; on `recover` clears `escalatedReason`/`escalationKind`/`escalatedFrom` + active prompt fields and `continuePipeline()`.
- **Files changed:** `bot/lib/override-recovery.mjs` (new), `bot/pipeline/state/session-schema.mjs` (escalatedFrom field), `bot/pipeline/driver.mjs` (capture on both paths), `bot/bot.mjs` (override-proceed ESCALATED branch), `tests/lib/override-recovery.test.mjs` (new, 10 cases incl. FSM allow-list cross-check), `tests/pipeline/driver.test.mjs` (+1 assertion: cap-trip captures `escalatedFrom='RESEARCH'`). Suite 263 → 273.
- **Validation:** Unit tests cover all branches: invalid (null session, non-ESCALATED), safety-rejected (kind=safety OR reason regex), clarification-rejected, unknown-`escalatedFrom`-rejected, recover-to-SHIP from SHIP_GATE, recover-to-DISPATCH from CONSISTENCY/VERIFY/PROMPT_BUILD/DISPATCH/VERIFY_DECIDE, recover-to-BRAINSTORM/PLAN/RESEARCH from spec-side stages. Bot integration verified by sending `/override 20260510-test-homepage-qeu8 proceed` to audit topic — bot replied cleanly with the existing gate-fallthrough message (state had been previously ABORTED, so the new ESCALATED branch correctly fell through to gate-lookup which rejected). No remaining ESCALATED sessions in `apps/provodnik/.sessions/` available to exercise the recover happy-path live; the helper's 10 cases + driver capture test stand in.

### ERR-064 → RESOLVED 2026-05-11 (Phase 8.1 — quantumbek eab344e)
- **Symptom:** Every clean ticket reached SHIP_GATE and reported `Shipped <stub-sha>` while no real ff-merge happened — `provodnik.app/main` did not advance and Vercel did not redeploy. `/devnote draft <sid>` always returned `Session <sid> has no shippedSha recorded.` blocking the mission asymmetry-#1 success signal (audit log of shipped work). Caught in Phase 7 GATE closure but deferred as a "limitation" to Phase 8.
- **Root Cause (two adjacent gaps in `bot/pipeline/driver.mjs`):**
  1. **DISPATCH propagation:** `runDispatch` returned `{worktreePath, worktreeBranch, commitSha, ...}` in the StageOut object. Driver's generic artifact-persist saved the whole shape to `session.artifacts.dispatch` but never copied the fields to session top-level. SHIP runner at `driver.mjs:223` gated on `session.worktreePath` and silently fell through to `stubShip` because the top-level field was the empty-string default set at intake.
  2. **SHIP propagation:** `runShip` returned `{sha}` on PASS but nothing set `session.shippedSha`. The SessionSchema declared the field as optional, but no code path ever wrote to it. `bot.mjs:616` (and the /resume approve branch at :523) read it and bailed with "no shippedSha recorded."
- **Fix:** After the artifact-persist block in `driver.mjs`, propagate stage-specific top-level fields:
  ```js
  if (session.state === 'DISPATCH' && out.worktreePath) {
    session = { ...session, worktreePath: out.worktreePath, worktreeBranch: out.worktreeBranch,
                ...(out.commitSha ? { dispatchCommitSha: out.commitSha } : {}) };
  }
  if (session.state === 'SHIP' && out.sha) {
    session = { ...session, shippedSha: out.sha };
  }
  ```
  `SessionSchema` gains optional `dispatchCommitSha` (Zod silent-strip avoidance per `feedback_zod_session_schema_strip.md`). SHIP runner gets `execFn: gitExecFn` injected so unit tests can mock `shipWorktree`'s git calls.
- **Files changed:** `bot/pipeline/driver.mjs`, `bot/pipeline/state/session-schema.mjs`, `tests/pipeline/driver.test.mjs` (M4 extended with 4 propagation assertions). Suite 263/263. RED→GREEN verified.
- **Production validation:** session `20260510-add-one-line-top-47hq` (ticket: "add a one-line top-of-file comment to playwright.config.ts describing the file's role"). Session JSON post-DISPATCH shows `worktreePath`, `worktreeBranch`, `dispatchCommitSha=793054e4…` populated. After Ship: `provodnik.app/main` advanced `6759c6e → 793054e`, `shippedSha=793054e…` populated. `/devnote draft 20260510-add-one-line-top-47hq` rendered theme/items/hours/cost; click Send → `✓ Devnote sent: ts=1778453759.448479 hours=4 cost=$600 (git=4 commits)` landed in `#provodnik-dev-notes`. GATE-7 criterion #7 (devnote round-trip on real ship) closes.

### ERR-060 → RESOLVED 2026-05-11 (Phase 7 — quantumbek 1bc8299)
- **Closure:** Hybrid codebase-awareness shipped per ADR-059. RESEARCH stage now reads PROJECT_MAP.md + PATTERNS.md (via `summarizePatterns` distilling to ≤2 KB index) on every invocation and passes `--allowed-tools "Read,Grep,Glob"` + `--add-dir <projectPath>` to the claude CLI. Phase 7.8 split the escalation kind: `missing_info` retries RESEARCH (bot self-recovers via tools, capped at RETRY_MAX=2); `ambiguous_ticket` escalates to submitter clarification immediately.
- **Feasibility spike:** `orchestrator/scripts/spike-claude-tools.mjs` confirmed claude CLI 2.1.132 honors all three flags under our `--setting-sources ''` invocation. Sentinel test wrote a fresh random value to `/tmp/spike/secret.txt` 5 seconds before the call; CLI returned the exact value in structured output — cannot be hallucinated. ~$0.06/call on small file; per-stage tool runs estimate $0.10–0.30/ticket.
- **Production validation:** session `20260510-add-one-line-top-pdpr` (ticket: "Add a one-line top-of-file comment to the public homepage entry component under src/app/(site)/"). PROJECT_MAP referenced the stale `(site)/` path, but the model used the Read tool to find the actual current location `src/app/(home)/page.tsx`, produced a correct spec + plan + commit, and reached DONE via SHIP_GATE. **Submitter pasted no file paths.**
- **Files changed:** `bot/lib/patterns-summary.mjs` (new), `bot/pipeline/stages/04-research.mjs`, `bot/prompts/research.md`, `bot/lib/claude-client.mjs`, `bot/lib/claude-runner.mjs`, `bot/lib/stage-output-schemas.mjs` (kind field), `bot/pipeline/driver.mjs` (RESEARCH retryEvent + classifyOutcome export), `bot/pipeline/pipeline.mjs` (RESEARCH_RETRY event + retry bump), `bot/pipeline/state/transitions.mjs` (RESEARCH self-loop). Tests: `patterns-summary.test.mjs` (+6), `04-research.test.mjs` (+3 new cases), `classify-outcome.test.mjs` (new, +8), `research-retry-fsm.test.mjs` (new, +3). Suite 229 → 263.

### ERR-061 → RESOLVED 2026-05-11 (Phase 7 — quantumbek f252a05)
- **Closure:** `bot/pipeline/stages/13-consistency.mjs` parses `session.artifacts.plan` to extract `fileScope`. If `diff.trim() === ''` AND `fileScope.length > 0`, the stage ESCALATEs with "Expected edits to N file(s) but worktree diff is empty" instead of silently advancing to VERIFY/SHIP_GATE. Empty fileScope (docs-only or meta tasks) still PASSes — the rule fires only on genuine scope/realization mismatch.
- **Files changed:** `bot/pipeline/stages/13-consistency.mjs`, `tests/pipeline/13-consistency.test.mjs` (+3), `tests/pipeline/driver.test.mjs` (update fakeGitExec to simulate cursor-agent's edits landing in worktree — prior fake produced empty-diff + non-empty fileScope which is the exact case 7.4 catches).
- **Production validation:** session `20260510-add-one-line-top-pdpr` consistency stage PASSed on a real non-empty diff; no false-positive escalation observed. Tests cover both negative (empty diff + scope) and positive (real diff) paths.

### ERR-062 → RESOLVED 2026-05-11 (Phase 7 — quantumbek eda07b4)
- **Closure:** Adopted option (a) from the Phase 7 plan — orchestrator commits cursor-agent's worktree edits post-hoc, cursor-agent itself never touches git (consistent with HOT.md ADR-025 / AP-021). New function `commitWorktree({worktreePath, message, execFn})` in `bot/lib/git-ops.mjs` stages everything (`git add -A`), checks `git status --porcelain` for changes, commits with `--no-verify` (worktree task branches gate at ff-merge to main, not per-task), and returns `{committed, sha}`. Multi-line messages pass via `-F <tempfile>` because cmd.exe doesn't preserve embedded newlines inside `-m "..."` quotes. `12-dispatch.mjs` calls `commitWorktree` between `runCursor` and `getWorktreeDiff`, surfacing `committed` + `commitSha` in the PASS result. ESCALATEs cleanly if the commit step throws.
- **Files changed:** `bot/lib/git-ops.mjs`, `bot/pipeline/stages/12-dispatch.mjs`, `tests/lib/git-ops.test.mjs` (+5: success/clean/multiline/bogus-path + ERR-062 regression), `tests/pipeline/12-dispatch.test.mjs` (+2: committed=true with non-empty diff + committed=false on no-op spawn).
- **Production validation:** session `20260510-add-one-line-top-pdpr` reported `committed=true sha=5b9b6763f01f7ee70d2b35c7ceec2ff4ed45069d` with 10 diff lines captured downstream by `getWorktreeDiff`. The cursor-agent commit was visible in `git log task/20260510-add-one-line-top-pdpr` as expected.

### ERR-063 → RESOLVED 2026-05-11 (Phase 7 — quantumbek 05a2095)
- **Closure:** `bot/pipeline/stages/15-verify-decide.mjs` deterministic shortcut now iterates ALL keys of `verify.results` via `isStepPassing` (true OR sentinel 'missing' counts as PASS, anything else as failure). The legacy hardcoded check of `{typecheck, lint, tests}` would PASS even when a new step like e2e or build had `ok=false`. Sonnet's user prompt also surfaces every step dynamically rather than just the legacy three, so when the shortcut falls through, the model can classify across all verify outcomes.
- **Files changed:** `bot/pipeline/stages/15-verify-decide.mjs`, `tests/pipeline/15-verify-decide.test.mjs` (+4: ERR-063 e2e=false ESCALATE, arbitrary build=false ESCALATE, all-green-with-e2e PASS, ok='missing' as PASS).
- **Production validation:** session `20260510-add-one-line-top-pdpr` reached VERIFY_DECIDE with all-green typecheck/lint/tests; new general iteration correctly PASSed without false-positive. (Negative path — verify step false ESCALATEs — covered by unit tests; not exercised in production this session because the docs-only ticket was designed to pass cleanly.)

---

### ERR-059: tripster-v1 e2e specs reference seed users + selectors that never matched reality — OPEN, all 6 specs `test.skip`-gated 2026-05-10
- **Symptom:** All 6 specs in `tests/e2e/tripster-v1/` (01-create-listing through 06-dispute-flow) fail at the auth step with "Неверный email или пароль." (invalid credentials), even with the auth selector fix from commit `f5dc1ca`. Surfaced during Phase 4 of the macmini migration when `bun run playwright` was wired up via webServer auto-boot.
- **Root Cause (3 layers):**
  1. **Wrong fixture identities.** Specs hardcode `traveler1@/guide1@/admin@` with password `testpass123`. Seed migration `supabase/migrations/20260331121000_phase1_auth_seed_accounts.sql` actually creates `traveler@/guide@/admin@` with passwords `Travel1234!/Guide1234!/Admin1234!`. These specs never matched the seed at any point in repo history.
  2. **Form selector pattern mismatch.** Auth + internal forms render shadcn `<Input id="..." />` via controlled `useState` — no `name=` attr emitted. Specs use `[name="email"]`, `[name="title"]`, `[name="price"]`, etc. Phase 4 fixed only the auth selectors (`#email`, `#password`); internal-form selectors remain stale.
  3. **`data-testid` defensiveness.** Specs gate progress on `[data-testid=...]` with `isVisible().catch(() => false) → test.skip()`. If a testid was never wired into a component, the spec silently auto-skips rather than failing — meaning even a "green" run wouldn't have proven anything.
- **Fix:** Out of migration scope. Tracked as bek's first post-handover ticket. Full per-spec audit + recommended sequencing in `docs/qa/2026-05-10-e2e-spec-rot-fix.md`.
- **Date opened:** 2026-05-10
- **Files Affected:** `tests/e2e/tripster-v1/{01..06}-*.spec.ts`, `tests/e2e/helpers.ts` (partial fix shipped), and any internal form components those specs interact with (audit pending).
- **Mitigation in place:** All 6 specs marked `test.skip(...)` with a comment pointing to this entry + the fix-scope doc. Suite runs but reports 6 skipped, exit 0. `bun run playwright` is therefore safe to call from CI / verify-runner without false failures.
- **Prevention:** Centralize fixture identities in `tests/e2e/fixtures.ts` after the bek pass. Replace `[data-testid=...]` chains with role/label selectors where labels exist (Playwright's `getByLabel`/`getByRole` is more rot-resistant). Treat self-skip-on-missing-element as an anti-pattern: prefer explicit assertion failure or front-load a feature-flag check.

### ERR-058: Traveler request detail shows budget ×100 (kopecks rendered as RUB) — direct AP-012 / ERR-025 reoccurrence — RESOLVED 2026-04-30 (commit 034e12f)
- **Symptom:** `/traveler/requests/[requestId]` displays budget as `480 000 ₽ на чел.` while `/traveler/requests` list view of the same record shows `4 800 ₽/чел.` for the same data. Exactly ×100 too high. Reproduced 2026-04-30 against production with `traveler@provodnik.app` on a request whose `budget_minor=480000` (i.e. 4 800 RUB).
- **Root Cause:** `(protected)/traveler/requests/[requestId]/page.tsx:66` writes `budgetPerPersonRub: row.budget_minor ?? 0` — passing kopecks straight into a field whose name promises RUB.
- **Fix:** mapper extracted to `src/data/traveler-request/map.ts` with `kopecksToRub(row.budget_minor ?? 0)`; page imports from there. New `map.test.ts` covers `budget_minor=480000 → 4800` and surrounding invariants (6 assertions).
- **Date:** 2026-04-30
- **Files Affected:** `provodnik.app/src/app/(protected)/traveler/requests/[requestId]/page.tsx`, `provodnik.app/src/data/traveler-request/map.ts` (new), `provodnik.app/src/data/traveler-request/map.test.ts` (new)
- **Side fix in same plan:** AP-012 violations in `(public)/listings/[id]/transfer/page.tsx` (`Math.round(* / 100)` ×2) and `features/listings/components/TransferCrossSellWidget.tsx` fixed via `kopecksToRub` while touching for T5/T12. HOT.md grep `* 100|/ 100|_minor` is now clean across `src/`.
- **Prevention:** Pre-edit grep is in place. Add the read-side rule to the cursor-agent prompt KNOWLEDGE block whenever the task touches a request or offer surface: "Any code that reads `budget_minor`, `price_minor`, or any `*_minor` column MUST pass it through `kopecksToRub` before storing or rendering."

### ERR-057: Listing detail page renders duplicate `<header>`/`<footer>` chrome — page wraps content in same SiteHeader/SiteFooter that the route-group layout already provides — RESOLVED 2026-04-30 (commit 034e12f)
- **Symptom:** `/listings/[slug]` shows two stacked footers (and a duplicate `<header>` landmark in DOM) at 1280px and 375px both. The listings index `/listings` is correct (single chrome).
- **Root Cause:** `src/app/(public)/listings/[id]/page.tsx` wrapped the rendered tree in `<div><SiteHeader/><main>{...}</main><SiteFooter/></div>` for both tour and excursion templates while `(public)/layout.tsx` already provided the same chrome.
- **Fix:** removed the wrapping div + SiteHeader + main + SiteFooter from both branches; page now returns the shape components directly. `(public)/layout.tsx` is the single source.
- **Date:** 2026-04-30
- **Files Affected:** `provodnik.app/src/app/(public)/listings/[id]/page.tsx`
- **Prevention:** When a page lives inside a route group whose `layout.tsx` already renders `SiteHeader` / `SiteFooter`, the page MUST NOT render them again.

### ERR-056: notFound() returns HTTP 200 instead of 404 when route group layout has `await` (documented Next.js streaming limitation)
- **Symptom:** `/tours` (FEATURE_TR_TOURS=0 → calls `notFound()`), `/guides/[fake-slug]`, `/destinations/[fake-slug]` — all return HTTP 200 with the not-found UI rendered into the body. Conversely `/listings/[fake-id]` returns HTTP 404 correctly.
- **Investigation (Plan 41):** Tested via direct Vercel URL (`provodnik-app.vercel.app/tours`) — same 200 — eliminating Cloudflare normalization. `force-dynamic` and `await headers()` had no effect. Tried `unstable_rethrow` in `(site)/error.tsx` — caused dual not-found render and still 200. Reverted.
- **Root cause:** Documented Next.js App Router behavior. From the official streaming docs: *"When a `<Suspense>` fallback renders or a component suspends, the server must commit to a '200 OK' status to begin sending the HTML stream. If a `notFound()` or `redirect()` function is called mid-stream, Next.js cannot alter the HTTP status code. Instead, it injects a `<meta name="robots" content="noindex">` tag for 404s..."* The `(site)/layout.tsx` does `await readAuthContextFromServer()` which triggers streaming. The `(public)` group has no such await in its layout — that's why `/listings/[fake]` returns 404 correctly.
- **Fix:** Plan 34's `robots: { index: false, follow: false }` on all `not-found.tsx` files IS the documented Next.js mitigation, NOT a workaround. Search engines will not index the 200-status not-found pages because of the noindex meta. Status 200 itself is unfixable without removing `await` from the layout, which would break auth-dependent rendering.
- **Date:** 2026-04-30
- **Files Affected:** documented across `src/app/(site)/layout.tsx` (the await), `src/app/{,(site)/,(protected)/}not-found.tsx` (already have robots:noindex). No code change needed beyond the existing Plan 34 fix.
- **Prevention:** When designing route-group layouts, be aware that any `await` (cookies, headers, fetch) commits the response to HTTP 200 before page-level `notFound()` can fire. If a route MUST return real 404 (e.g. for SEO-critical paths), keep its layout sync — read auth client-side or via middleware instead of a layout await. For everything else, the noindex meta is sufficient.

### ERR-055: Plan 29 cursor-agent stall reproduction — T1 zero-commit at 600s, all five tasks applied directly
- **Symptom:** Plan 29 dispatch — cursor-agent for T1 (delete `/guide/listings-v1`) stalled at 600s timeout with zero file changes. Wrapper fell back to ZERO_COMMIT protocol (ERR-049 / AP-022). Out of caution, the orchestrator then applied T1 + T2 (retarget /guide/dashboard, 8 hits) + T3 (delete /guide/statistics) + T4 (legacy /guide/[id] permanentRedirect) + T5 (/tours notFound() under FEATURE_TR_TOURS) directly without re-dispatching, since all five were mechanical edits within the same router segment.
- **Root Cause:** Same as ERR-049 (cursor-agent narrates intent without executing tools) and ERR-050 (timeout on Server Component restructure). Pure file deletes are below cursor-agent's "interesting enough to write" threshold — the agent reads the file, plans the deletion, and stalls without ever calling the Write/Edit tool on a delete.
- **Fix:** Orchestrator applied directly. Commits `0c8868b`, `aeccdf2`, `e77da38`, `e0047bf`, `6e30109` on main. Same end result as a successful dispatch, faster than waiting on the stall.
- **Date:** 2026-04-29
- **Files:** see commits above
- **Prevention:** AP-022 reaffirmed. For pure-delete tasks (route file removal, redirect removal, dead-component cleanup), skip cursor-agent entirely and apply directly from the orchestrator. The dispatch overhead is wasted when the work is `rm`-shaped. Reserve cursor-agent for tasks that involve actual content writing (≥10 lines of new code).

### ERR-054: cursor-agent writes to main workspace regardless of --workspace worktree arg
- **Symptom:** Three parallel cursor-dispatch runs each given a worktree path via `--workspace`. All three wrote to the main `provodnik.app` working tree instead of the worktrees. Worktree branches had zero commits after dispatch.
- **Root Cause:** cursor-agent ignores the --workspace flag for file edits. It uses the paths specified in the prompt's CONTEXT section (`Working dir: D:\dev2\projects\provodnik\provodnik.app`) not the runtime --workspace value.
- **Fix:** Orchestrator copies the modified files from main working tree to each worktree, commits there, then restores main working tree with `git checkout HEAD -- <files>`. New/untracked files are deleted from main with `rm`.
- **Date:** 2026-04-29
- **Seen in:** Plan-25 T1, Plan-26 T1, Plan-27 T1 parallel dispatch.
- **Prevention:** For parallel worktree dispatch, expect cursor-agent to write to the main workspace. Design the orchestration loop to handle this: copy → commit-in-worktree → restore-main. Do not rely on --workspace isolation for file writes.

### ERR-053: cursor-agent adds JSX sibling elements without wrapping fragment
- **Symptom:** `SiteHeader` component returned `<header>...</header><UserAccountDrawer .../>` — two sibling roots without `<>...</>` wrapping. This passes lint (no error rule for this pattern) but would cause a TypeScript JSX error.
- **Root Cause:** cursor-agent appended `<UserAccountDrawer>` after `</header>` in the return statement. The original return had `<header>` as sole root; adding a sibling requires a React fragment but cursor-agent didn't add one.
- **Fix:** Orchestrator manually wrapped `return (` → `return (<>` and added `</>` before closing `)`.
- **Date:** 2026-04-29
- **Files:** `src/components/shared/site-header.tsx`
- **Prevention:** After any cursor-agent edit that adds JSX siblings to a component return, verify the root element count. If >1, add `<>...</>` wrapper.



### ERR-052: guide/profile page shows error boundary — createSupabaseServerClient() outside try/catch
- **Symptom:** `/guide/profile` shows "Раздел временно недоступен" error boundary page. Console shows unhandled error.
- **Root Cause:** `createSupabaseServerClient()` was called at line 70 OUTSIDE the try/catch block. The function throws `"Supabase environment variables are not configured."` if `hasSupabaseEnv()` returns false. Even with env vars set, any unexpected throw (e.g. network blip during cookies() call) would propagate to the error boundary.
- **Fix:** Moved `const supabase = await createSupabaseServerClient()` from line 70 (outside try/catch) to first line inside the try block. Commit `8d9ab5a`. If supabase client init fails, page renders with empty default data instead of crashing.
- **History:** Plan-18 T4 (commit 9d0204c) wrapped the data queries in try/catch but left createSupabaseServerClient() outside. Plan-19 T4 (commit afb1150) fixed the auth check but kept createSupabaseServerClient() outside. Plan-23 (commit 8d9ab5a) finally moved it inside.
- **Date:** 2026-04-28
- **Files:** `src/app/(protected)/guide/profile/page.tsx`
- **Prevention:** Any Server Component that calls createSupabaseServerClient() directly (not via readAuthContextFromServer) MUST do so inside try/catch. readAuthContextFromServer() has its own internal try/catch and is always safe.

### ERR-046: cursor-agent stalls on `bun run test:run` → attempts `&&` bash chain → fatal 500s stall
- **Symptom:** cursor-agent runs `bun run test:run <file>`, bash tool times out at 60s, agent then tries `sleep N && head` (ERR-015 violation) to read stdout, stalling the entire process for 500+ seconds until pid is killed.
- **Root Cause:** First Vitest+jsdom run in a cold project takes >60s (module graph cold start). cursor-agent's bash tool has a 60s built-in timeout. When the command times out the tool returns an empty/background result, and the agent attempts to recover with a `&&` chain that blocks indefinitely.
- **Fix / Workaround:** Skip the "confirm RED state" test run step from TDD prompts for tasks where the test is simple and the failure mode is obvious. Add `NOTE: bun run test:run may time out on first run — this is expected. Do not retry with && chains. Proceed directly to the implementation step.` to the TASK section of affected prompts.
- **Date:** 2026-04-25
- **Seen in:** Task 1 of Sentry error-resilience plan (NotificationBell). Tasks 2 and 3 completed without issue (likely because Vitest cache was warm after Task 1's partial run).
- **Prevention:** Add explicit timeout-handling note to skeleton.md ENVIRONMENT section or to any TDD prompt that runs `bun run test:run` as a RED confirmation step.

### ERR-047: cursor-agent commits to current HEAD branch instead of creating the specified branch
- **Symptom:** Task prompt specifies `Branch: fix/sentry-*` in SCOPE section, but cursor-agent commits directly to whatever branch is currently checked out (main in this case). Branch is never created.
- **Root Cause:** cursor-agent does not run `git checkout -b <branch>` or `git switch -c <branch>` before committing. The SCOPE section states the branch name but does not include explicit `git checkout` steps in the TASK section.
- **Fix:** If branches are required, add an explicit step in TASK section: `git checkout -b fix/<name>` before the commit step. For parallel tasks all committing to main (no merge conflict risk), committing to main is acceptable and simpler.
- **Date:** 2026-04-25
- **Seen in:** All 3 tasks of Sentry plan. All 3 committed to main — no data loss, just unexpected branch topology.
- **Prevention:** Either (a) add `git checkout -b` step explicitly in task prompts when branches are required, or (b) accept that parallel-safe tasks can commit to main directly and remove the branch requirement from prompts.

### ERR-001: getListingsByDestination slug mismatch
- **Symptom:** Destination pages show 0 tours despite listings existing in DB
- **Root Cause:** Query uses slug string directly in ilike: `.or('city.ilike.%kazan-tatarstan%')` — but city column contains Russian name 'Казань', not the slug
- **Fix:** First fetch destination by slug to get `.name` and `.region`, then query listings with those values
- **Files Affected:** `src/data/supabase/queries.ts` fn `getListingsByDestination`
- **Date:** 2026-04-06
- **Prevention:** Never use slug directly in data column queries. Always resolve slug → record first.

### ERR-002: Demo bar visible in production
- **Symptom:** WorkspaceRoleNav renders signInAs() buttons unconditionally — any user can switch roles
- **Root Cause:** Demo controls block not guarded by NODE_ENV check
- **Fix:** Wrap demo controls `<div>` in `{process.env.NODE_ENV !== 'production' && (...)}` 
- **Files Affected:** `src/components/shared/workspace-role-nav.tsx`
- **Date:** 2026-04-06
- **Prevention:** Any dev-only UI must be wrapped in NODE_ENV guard

### ERR-003: Wrong hero images for Kazan and Nizhny destinations
- **Symptom:** Kazan destination page shows non-Kazan photo (possibly Dubai skyline)
- **Root Cause:** Seed SQL has incorrect Unsplash photo IDs for kazan-tatarstan and nizhny-novgorod rows
- **Fix:** Replace hero_image_url with correct Russian city photos in seed.sql; run bun run db:reset
- **Files Affected:** `supabase/migrations/20260401000002_seed.sql`
- **Date:** 2026-04-06
- **Prevention:** Verify photo URLs visually before committing to seed

### ERR-004: Listing images fall back to generic mountain photo
- **Symptom:** All listing cards show same mountain photo regardless of destination
- **Root Cause:** `mapListingRow` calls `parseImageFromJson(row.description)` but description is plain text, not JSON. Always falls back to fallbackHeroImage
- **Fix:** Add `image_url` column to listings table; update mapListingRow to read image_url first
- **Files Affected:** `src/data/supabase/queries.ts` fn `mapListingRow`, `supabase/migrations/`
- **Date:** 2026-04-06
- **Prevention:** Never store image URLs inside description/notes JSON. Use dedicated columns.

### ERR-005: listingCount shows static seed value not actual tour count
- **Symptom:** Destination stats row shows "2 tours" even when real query returns different count
- **Root Cause:** destination-detail-screen.tsx uses `destination.listingCount ?? listings.length` — prefers static column over live count
- **Fix:** Change to `listings.length > 0 ? listings.length : (destination.listingCount ?? 0)`
- **Files Affected:** `src/features/destinations/components/destination-detail-screen.tsx`
- **Date:** 2026-04-06
- **Prevention:** Prefer live query results over static denormalized counts for accuracy

### ERR-006: Browser native validation tooltip on empty form submit
- **Symptom:** Auth form shows browser tooltip instead of styled red error box on empty submit
- **Root Cause:** Input elements have `required` HTML attributes which trigger browser validation before JS handler runs
- **Fix:** Remove `required` attributes from all Input elements in auth-entry-screen.tsx
- **Files Affected:** `src/features/auth/components/auth-entry-screen.tsx`
- **Date:** 2026-04-06
- **Prevention:** Use JS validation only in forms with custom error UI. Never mix HTML5 required with custom validation.

### ERR-008: cursor-agent rejects model name claude-sonnet-4-6
- **Symptom:** cursor-agent exits with "Cannot use this model" when `--model claude-sonnet-4-6` is passed
- **Root Cause:** cursor-agent uses its own model registry; Claude model IDs differ from Anthropic API IDs
- **Fix:** Use `--model claude-4.6-sonnet-medium` (or `--model auto`) for Claude Sonnet in cursor-agent
- **Files Affected:** All cursor-agent dispatch commands in prompts
- **Date:** 2026-04-07
- **Prevention:** Always use `--model auto` for cursor-agent unless a specific model name is confirmed from `cursor-agent --help`

### ERR-009: null as any passed as Supabase client in route pages
- **Symptom:** Dynamic route pages (`/guide/[id]`, `/listings/[slug]`, etc.) had `null as any` as client arg in cache wrapper functions — causes runtime type errors
- **Root Cause:** 7 route pages were missed in the first null-as-any fix pass (only 4 were fixed)
- **Fix:** Import `createSupabaseServerClient` and await it inside each cache wrapper or page function
- **Files Affected:** 7 files in `src/app/(protected)/guide/requests/[requestId]/`, `src/app/(site)/destinations/[slug]/`, `src/app/(site)/guide/[id]/`, `src/app/(site)/guides/[slug]/`, `src/app/(site)/listings/[slug]/`, `src/app/(site)/requests/[requestId]/`, `src/app/(site)/requests/`
- **Date:** 2026-04-07
- **Prevention:** After fixing any null-as-any client pattern, grep entire codebase for `null as any` to find all instances

### ERR-010: ESLint silently broken — 47 errors undetected
- **Symptom:** `bun run lint` was never run after Phase 6; 47 lint errors accumulated across 15+ files
- **Root Cause:** No enforcement hook or CI check required lint before commits
- **Fix:** Added PostToolUse Bash hook in `.claude/settings.json` that prints LINT_REMINDER after every commit/merge; added lint gate to CLAUDE.md acceptance criteria
- **Files Affected:** `.claude/settings.json`, `CLAUDE.md`
- **Date:** 2026-04-07
- **Prevention:** `bun run typecheck && bun run lint` must pass before every commit — enforced via hook

### ERR-011: cursor-agent on Windows .cmd wrapper silently hangs
- **Symptom:** `cursor-agent --print --force --model ... "$PROMPT" > log.txt 2>&1` run via git-bash in background produces 0-byte logs and 0 file edits for 9+ minutes while 22 child processes run. No stdout/stderr, no git activity, no completion.
- **Root Cause:** The `.cmd` wrapper (`C:\Users\x\AppData\Local\cursor-agent\cursor-agent.cmd`) buffers stdout until process exit AND blocks on a hidden prompt/interaction when launched from a headless git-bash shell. Combined effect: no output, no progress, no way to observe.
- **Fix:** Do not dispatch cursor-agent via .cmd wrapper from git-bash in background. Two working fallbacks: (a) use native Claude Code Agent subagents (general-purpose) via the `Agent` tool — they have Edit/Write/Bash, work in absolute-path worktrees, return a single summary on completion; (b) run cursor-agent interactively in a foreground terminal the human opens manually.
- **Files Affected:** orchestrator dispatch pattern only; no source code
- **Date:** 2026-04-11
- **Prevention:** On Windows, default to native Agent subagents for parallel code-writing work. Reserve cursor-agent for foreground interactive sessions.

### ERR-012: Node v24 blocks spawning cursor-agent.cmd with shell:false
- **Symptom:** `node cursor-dispatch.mjs` crashes with `Error: spawn EINVAL, errno: -4071, code: 'EINVAL', syscall: 'spawn'` the instant it tries to launch `C:\Users\x\AppData\Local\cursor-agent\cursor-agent.cmd` — before any stdout/stderr, before any cursor-agent init event.
- **Root Cause:** Node.js v24 (post CVE-2024-27980) blocks spawning `.cmd`/`.bat` files with `shell: false` as a security measure. `cursor-agent.cmd` internally launches `powershell.exe -File cursor-agent.ps1` which then runs `node.exe index.js $args` — three layers of indirection, all blocked at the first layer.
- **Fix:** Bypass the entire `.cmd → ps1 → node` chain. `cursor-dispatch.mjs` now resolves the latest versioned install at `C:\Users\x\AppData\Local\cursor-agent\versions\<YYYY.MM.DD-hash>\` and spawns `node.exe index.js ...cursorArgv` directly with `shell: false`. Sets `CURSOR_INVOKED_AS=cursor-agent.cmd` env var so cursor-agent's internal self-identification still works.
- **Files Affected:** `.claude/logs/cursor-dispatch.mjs` (wrapper)
- **Date:** 2026-04-11
- **Prevention:** Never spawn `.cmd`/`.bat` from Node on Windows with `shell: false`. Either resolve the underlying binary and spawn it directly, or go through `shell: true` with careful argv quoting. The wrapper is now the ONLY sanctioned way to invoke cursor-agent from Node — see project CLAUDE.md "Primary Coder" section.

### ERR-007: guide@provodnik.test has no listings
- **Symptom:** Login as test guide → /guide/listings shows empty state
- **Root Cause:** Seed listings belong to guide IDs 10000000-...-101 and 10000000-...-102, but test guide ID is 30000000-0000-4000-8000-000000000001
- **Fix:** Add seed listings with guide_id = '30000000-0000-4000-8000-000000000001'
- **Files Affected:** `supabase/migrations/20260401000002_seed.sql`
- **Date:** 2026-04-06
- **Prevention:** Test accounts must have corresponding seed data. Check guide_id alignment when adding listings.

### ERR-013: cursor-agent shell tool hangs on `bunx vitest run` on Windows
- **Symptom:** cursor-agent invokes `bunx vitest run <file>` inside its shell tool, vitest starts but never returns — wrapper times out at 900s.
- **Root Cause:** Unverified hypothesis: jsdom environment + interactive TTY detection in vitest's Node subprocess hangs when launched from cursor-agent's non-TTY shell on Windows. Reproduced in Phase 0 Wave 0.1 (2026-04-12).
- **Fix:** In cursor-agent prompts, never invoke `bunx vitest` directly. Either (a) use `bun run test:run <file>` (non-watch script that the repo already defines), or (b) skip in-agent test runs entirely and have the orchestrator verify test results from outside the worktree after dispatch exits.
- **Files Affected:** `.claude/prompts/tripster-v1/00-01-preflight.md` and all future wave prompts that involve vitest
- **Date:** 2026-04-12
- **Prevention:** Prompts must say "do NOT run `bunx vitest run` — use `bun run test:run` or let orchestrator verify." Add to prompt template defaults.

### ERR-014: Prompt said `lib/flags.ts` but repo convention is `src/lib/`
- **Symptom:** Cursor-agent got a prompt specifying `lib/flags.ts` at repo root, but vitest.config.mts scopes tests to `src/**/*.test.{ts,tsx}` and the existing lib layout is `src/lib/`.
- **Root Cause:** Prompt author (orchestrator) did not probe the inner repo layout before writing the prompt.
- **Fix:** In cursor-agent prompts for `provodnik.app`, always write module paths as `src/lib/*`, `src/app/*`, `src/components/*` — never `lib/*` at root. The repo uses `src/` with `@/*` alias pointing at `./src/*`.
- **Files Affected:** `.claude/prompts/tripster-v1/00-01-preflight.md` (and all future prompts)
- **Date:** 2026-04-12
- **Prevention:** Orchestrator SHOULD run an `ls src/` or `cat tsconfig.json` probe against the target repo before writing any prompt that specifies new file paths. Or include this convention as a durable line in every prompt's CONTEXT block.

### ERR-015: cursor-agent shell tool hangs on chained `cd && ls && ls || ls` on Windows
- **Symptom:** cursor-agent dispatch stalls indefinitely (>530s, killed at 600s timeout). Shell tool call `cd && ls src/lib && ls -la package.json vitest.config.mts tsconfig.json 2>/dev/null || ls ...` never emits `completed`. No file writes. No error.
- **Root Cause:** cursor-agent's internal shell tool on Windows hangs when given complex chained commands with `&&`, `||`, and stderr redirect fallbacks in one line — likely a PTY buffering or subprocess-spawn issue on Windows git-bash.
- **Fix:** In prompts, never instruct cursor-agent to run chained investigation shell commands. Use a single simple command per bash call (e.g., `ls src/lib` alone, not `cd X && ls Y && ls Z || ls W`). Prefer Read tool for file inspection over ls. For trivial files with fully inlined specs, tell the agent to skip investigation and go straight to Write.
- **Files Affected:** any prompt file with multi-part `&&`/`||` shell investigation blocks
- **Date:** 2026-04-12
- **Prevention:** Add `no-chained-shell` as a standing rule in all prompt template preambles: "Each Bash call must contain exactly one command. No `&&`, `||`, stderr redirects, or `cd X && cmd` chains." Enforce before dispatch, not after failure.

### ERR-016: Missing shadcn/ui table component causes Vercel build failure
- **Symptom:** Vercel build fails with "Module not found: Can't resolve '@/components/ui/table'" — local dev unaffected.
- **Root Cause:** The `table` shadcn/ui component was used in code but never installed (`npx shadcn@latest add table`). Local build was env-blocked so the error was invisible locally.
- **Fix:** `npx shadcn@latest add table` (or equivalent bun/node invocation) — adds `src/components/ui/table.tsx`. Commit: `29ae0a4`.
- **Files Affected:** `src/components/ui/table.tsx` (missing)
- **Date:** 2026-04-13
- **Prevention:** When referencing any shadcn/ui component, grep `src/components/ui/` to confirm it exists before committing. The 23-component installed set is documented in CLAUDE.md — add `table` to that list.

### ERR-017: turbopackUseSystemTlsCerts is not a valid Next.js ExperimentalConfig key
- **Symptom:** Vercel TypeScript type-check fails: "Object literal may only specify known properties, and 'turbopackUseSystemTlsCerts' does not exist in type 'ExperimentalConfig'."
- **Root Cause:** Added as a Windows-local workaround for CA trust issues during `next build` on Windows dev. The key does not exist in the installed Next.js version's type definitions, so TypeScript build fails.
- **Fix:** Remove the `experimental: { turbopackUseSystemTlsCerts: true }` block entirely — not needed on Linux/Vercel. Commit: `41c0877`.
- **Files Affected:** `next.config.ts`
- **Date:** 2026-04-13
- **Prevention:** Never add non-standard experimental flags without verifying they exist in the installed Next.js `ExperimentalConfig` type. Run `bun run typecheck` before committing any next.config.ts change.

### ERR-018: Upstash Redis client always null — env var name mismatch
- **Symptom:** Rate limiting silently disabled in production; `rateLimit()` always returns `{ success: true }` regardless of actual request frequency
- **Root Cause:** `redis.ts` called `Redis.fromEnv()` which reads `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, but env vars are named `STORAGE_KV_REST_API_URL` / `STORAGE_KV_REST_API_TOKEN`. Client was always `null`.
- **Fix:** Replace `Redis.fromEnv()` with `new Redis({ url, token })` reading `STORAGE_KV_*` names. Also updated `hasUpstashRedisEnv()` in `rate-limit.ts` to check same names. Commit: `6dece9e`.
- **Files Affected:** `src/lib/upstash/redis.ts`, `src/lib/rate-limit.ts`
- **Date:** 2026-04-13
- **Prevention:** When env vars are named differently from SDK defaults, never use `fromEnv()` — always read explicitly by name and verify against `.env.local`.

### ERR-019: getOpenRequests/getRequestById used getPublicClient() ignoring param
- **Symptom:** Guide inbox shows 0 open requests in browser; all authenticated queries return empty
- **Root Cause:** Both functions called `const db = getPublicClient()` internally, ignoring the `client` SupabaseClient parameter. `getPublicClient()` reads `SUPABASE_SECRET_KEY` (server-only env var), which is undefined in browser context, causing the client to silently fail.
- **Fix:** Changed `const db = getPublicClient()` → `const db = client` in both `getOpenRequests` and `getRequestById`. Commit: `765b662`
- **Files Affected:** `src/data/supabase/queries.ts`
- **Date:** 2026-04-14
- **Prevention:** Any function accepting a `SupabaseClient` param MUST use it. Never call `getPublicClient()` inside a function that already has a client argument. Add ESLint rule or code review check.

### ERR-020: getBooking PostgREST join fails — no FK from bookings to guide_profiles
- **Symptom:** `/traveler/bookings/[id]` crashes with "СБОЙ КАБИНЕТА" error boundary; server log shows unhandled PostgREST error
- **Root Cause:** `BOOKING_WITH_DETAILS_SELECT` used `guide_profile:guide_profiles!guide_id(...)`. PostgREST resolved `bookings.guide_id` FK to `profiles.id` — not to `guide_profiles.user_id`. No direct FK exists between `bookings` and `guide_profiles`, so the join was invalid.
- **Fix:** Replaced single complex join with sequential `Promise.all` queries: booking → guide_profile (by user_id) → traveler_request (by request_id) → guide_offer (by offer_id). Commit: `0cd4bfe`
- **Files Affected:** `src/lib/supabase/bookings.ts`
- **Date:** 2026-04-14
- **Prevention:** Before writing PostgREST join syntax, verify FK constraints exist via `pg_policies` or `information_schema.table_constraints`. When joining through indirect relationships, use sequential queries.

### ERR-021: PostgrestError not caught by instanceof Error check in server actions
- **Symptom:** Any Supabase DB error in `submitOfferAction` returns generic "Не удалось отправить предложение." instead of the real error message
- **Root Cause:** `@supabase/supabase-js` `PostgrestError` is a plain object, not a subclass of `Error`. `err instanceof Error` check always fails, hitting the fallback string.
- **Fix:** Changed to `typeof (err as any).message === 'string'` to extract message from any error-shaped object. Commit: `d837554`
- **Files Affected:** `src/app/(protected)/guide/inbox/[requestId]/offer/actions.ts`
- **Date:** 2026-04-14
- **Prevention:** Never use `instanceof Error` to handle Supabase errors. Use `typeof err.message === 'string'` or a type guard. Document in PATTERNS.md.

### ERR-022: `todayLocalISODate` produced TZ-divergent dates between client and server (FP-1)
- **Symptom:** Booking form date input occasionally rendered "yesterday" as the minimum acceptable date for users in TZ ahead of UTC; SSR + CSR diverged producing hydration warnings
- **Root Cause:** Helper used `new Date().toISOString().slice(0,10)` which is always UTC-anchored, ignoring the browser's TZ. Server (UTC container) and a client in MSK (+03) compute different `YYYY-MM-DD` near midnight UTC.
- **Fix (planned):** Replace with `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(new Date())` — yields exact `YYYY-MM-DD` in canonical Moscow TZ. Single helper `todayMoscowISODate` in `src/lib/dates.ts`.
- **Files Affected:** `src/features/booking/components/BookingFormTabs.tsx`
- **Date:** 2026-04-16
- **Prevention:** Never derive a calendar date from `toISOString().slice(0,10)`. Always pin TZ via `Intl.DateTimeFormat` for any value persisted to or compared against server-time.

### ERR-023: Mystery `* 0.8` multiplier on traveler dashboard had no design provenance (FP-2)
- **Symptom:** Dashboard "от X ₽" label displayed 80% of the budget the traveler entered; travelers expected to pay X but guides bid at full budget; confusion + decline rate up
- **Root Cause:** `traveler-dashboard-screen.tsx:177` computed `(budget * 0.8).toLocaleString(...)` with no comment, no design rationale, no other call site doing the same. Likely leftover from an unmerged "discount preview" experiment.
- **Fix (planned):** Remove the multiplier; render `от ${budget.toLocaleString("ru-RU")} ₽ / чел.` matching the canonical pattern in `src/data/supabase/queries.ts:296`.
- **Files Affected:** `src/features/traveler/components/traveler-dashboard-screen.tsx`
- **Date:** 2026-04-16
- **Prevention:** Mystery numeric literals on user-facing money labels require either a comment with a design ticket reference or removal. Grep for `\* 0\.[0-9]` after every dashboard touch.

### ERR-024: `submitRequest.ts` accepted requests against draft listings (FP-3)
- **Symptom:** Stale browser tabs (or hand-crafted POSTs) could create `requests` rows pointing at draft, archived, or rejected listings; guide received an unwanted notification and had to decline manually
- **Root Cause:** Action validated input shape but never re-checked that `listings.status === "published"` and (for `mode === "order"`) that `price_minor` was set, before the insert.
- **Fix (planned):** Pre-insert SELECT on `listings(id, status, price_minor)` guarded only on `mode === "order"`; returns discriminated `{ error: "listing_unavailable" | "listing_no_price" }`. Inquiry tab (`mode === "question"`) intentionally untouched — inquiries are messages, not commerce.
- **Files Affected:** `src/features/booking/actions/submitRequest.ts`, consumed by `src/features/booking/components/BookingFormTabs.tsx`
- **Date:** 2026-04-16
- **Prevention:** Any server action that takes a listing ID for commerce must re-fetch status + price at action time; never trust the form payload to match current DB state.

### ERR-025: Wizard `budgetMap` write path skipped kopecks conversion (FP-4)
- **Symptom:** Fresh requests inserted with `budget_minor` set to RUB integer (e.g. 5000) instead of kopecks (500000); guide inbox showed "от 50 ₽" for a 5000 ₽ request
- **Root Cause:** `request-wizard.tsx` `budgetMap` correctly held RUB integers and `actions.ts` insert wrote `budget_minor: input.budgetPerPersonRub` directly — `* 100` missing. Read-side helper `kopecksToRub` would have only stopped the bug from getting worse for existing data.
- **Fix (planned):** Centralised `rubToKopecks` / `kopecksToRub` helpers in `src/data/money.ts`; wizard action calls `rubToKopecks(input.budgetPerPersonRub)` on insert; round-trip Vitest test guards regression.
- **Files Affected:** `src/app/(protected)/traveler/requests/new/actions.ts`, `src/data/money.ts` (new)
- **Date:** 2026-04-16
- **Prevention:** Every RUB ⇄ kopecks crossing must go through the centralised helpers. Grep `* 100`, `/ 100`, `_minor` after currency-touching changes.

### ERR-026: Inbox `useEffect` silently skipped offered/accepted fetch when session not yet resolved (FP-5)
- **Symptom:** Reload of `/guide/inbox` rendered the "Активные запросы" tab as empty; switching to other tabs and back populated it. Race-condition only on slow connections.
- **Root Cause:** `guide-requests-inbox-screen.tsx` ran `loadOffersForGuide` inside a `useEffect` with `[]` deps and an early `if (!session) return;` — once session arrived later via `onAuthStateChange`, no re-fetch was triggered.
- **Fix (planned):** Subscribe to `supabase.auth.onAuthStateChange`; on `SIGNED_IN`/`USER_UPDATED` (with a session) trigger `loadOffersForGuide`. Cleanup in unsubscribe.
- **Files Affected:** `src/features/guide/components/requests/guide-requests-inbox-screen.tsx`
- **Date:** 2026-04-16
- **Prevention:** Any `useEffect` with `[]` deps that depends on `session` must subscribe to `onAuthStateChange`, not assume initial render had a session.

### ERR-027: `BookingFormTabs` catch block returned single generic message regardless of error class (FP-6)
- **Symptom:** Any submit failure ("Сессия истекла", validation error, listing unavailable) showed the same "Не удалось отправить запрос" copy; users couldn't tell what to do next
- **Root Cause:** Catch was a single `setError("Не удалось отправить запрос")` with no discrimination on the action's discriminated `result.error` codes (`auth_expired` / `validation` / `listing_unavailable` / `listing_no_price` / `internal`).
- **Fix (planned):** Centralise `userMessageForError(code)` mapping returning Russian copy per code; consumer narrows via discriminated union.
- **Files Affected:** `src/features/booking/components/BookingFormTabs.tsx`
- **Date:** 2026-04-16
- **Prevention:** Server actions return discriminated `{ error: <code> }` shapes (never throws); UI maps codes to copy via a single helper. No silent `catch {}`.

### ERR-029: Supabase registration white screen — JWT minted before profile row exists
- **Symptom:** New user registration completes on the server but browser shows white screen / blank page; no redirect to dashboard
- **Root Cause:** `custom_access_token_hook` runs at JWT mint time and reads `profiles` to set `app_metadata.role`. When triggered via `supabase.auth.signUp()` from the browser, the `handle_new_user()` trigger fires asynchronously — JWT is minted before the trigger commits the profile row → hook returns no role → proxy/layout blocks the user.
- **Fix:** Replace browser `signUp()` with `signUpAction` server action that uses the admin client: (1) `admin.createUser` with `email_confirm: true`, (2) `admin.from("profiles").upsert(...)`, (3) `admin.updateUser(id, { app_metadata: { role } })`, (4) server-side `signInWithPassword`. Profile and role are both committed before the JWT is ever minted.
- **Files Affected:** `src/features/auth/actions/signUpAction.ts` (new), `src/features/auth/components/auth-entry-screen.tsx`
- **Date:** 2026-04-20
- **Prevention:** Never rely on DB triggers being committed before JWT mint. Always pre-write `profiles` and stamp `app_metadata.role` via admin API before calling `signInWithPassword`.

### ERR-030: Browser `supabase.auth.signOut()` cannot clear HTTP-only SSR cookies → logout hang
- **Symptom:** Clicking "Выйти" appeared to do nothing for up to 10 minutes; user remained logged in
- **Root Cause:** `@supabase/ssr` stores the session in HTTP-only cookies set by the server. The browser client's `signOut()` can only clear in-memory/localStorage state — it has no access to HTTP-only cookies. The server middleware kept seeing a valid cookie and re-hydrating the session.
- **Fix:** Created `/api/auth/signout` GET route handler that calls `supabase.auth.signOut()` server-side (which has cookie access), then redirects to `/`. Both desktop and mobile logout buttons now navigate to this endpoint via `window.location.href`.
- **Files Affected:** `src/app/api/auth/signout/route.ts` (new), `src/components/shared/site-header.tsx`
- **Date:** 2026-04-20
- **Prevention:** With `@supabase/ssr`, logout MUST always go through a server route handler. Never call browser client `signOut()` as the primary logout mechanism.

### ERR-031: getConfirmedBookings used wrong status filter — 'pending' instead of DB values
- **Symptom:** Confirmed bookings tab showed 0 bookings even after offer acceptance
- **Root Cause:** Agent used `.eq('status', 'pending')` on the bookings table. The `accept_offer` RPC inserts bookings with `status = 'awaiting_guide_confirmation'`. `'pending'` is a different state (direct booking, not bid-flow). Both `'awaiting_guide_confirmation'` and `'confirmed'` should show.
- **Fix:** Changed to `.in('status', ['awaiting_guide_confirmation', 'confirmed'])`
- **Files Affected:** `src/lib/supabase/traveler-requests.ts` fn `getConfirmedBookings`
- **Date:** 2026-04-21
- **Prevention:** Always check the actual DB enum values before writing `.eq('status', ...)` queries. The `accept_offer` RPC explicitly inserts `'awaiting_guide_confirmation'` — read the migration before writing the consumer.

### ERR-032: QA messages didn't appear after send — missing optimistic update
- **Symptom:** Traveler sends a Q&A message, `onSend` resolves, but the message list stays empty until page reload
- **Root Cause:** `offer-qa-sheet.tsx` called `setBody('')` after `onSend` but never updated local `thread` state. The message was in the DB but not reflected in UI.
- **Fix:** Added optimistic update using `setThread` after successful send — appends the new message locally with `crypto.randomUUID()` id and `sender_role: 'traveler'`.
- **Files Affected:** `src/features/traveler/components/requests/offer-qa-sheet.tsx`
- **Date:** 2026-04-21
- **Prevention:** Any send action in a stateful message list must either (a) optimistically update local state or (b) re-fetch. Never assume `revalidatePath` alone refreshes client-side state in a `'use client'` component.

### ERR-033: QA_MESSAGE_LIMIT hardcoded as magic number 8 in client component
- **Symptom:** Two separate constants representing the same limit; if one changes the other drifts
- **Root Cause:** `QA_MESSAGE_LIMIT` was defined in `qa-threads.ts` but not exported. Client component `offer-qa-sheet.tsx` hardcoded `8` directly.
- **Fix:** Added `export` to `QA_MESSAGE_LIMIT` in `qa-threads.ts`; imported it in `offer-qa-sheet.tsx`.
- **Files Affected:** `src/lib/supabase/qa-threads.ts`, `src/features/traveler/components/requests/offer-qa-sheet.tsx`
- **Date:** 2026-04-21
- **Prevention:** Constants shared between server and client must be exported from a single source. Never hardcode the same numeric limit in two files.

### ERR-034: RSC boundary violation — async server component imported into 'use client' component
- **Symptom:** `GuideOfferQaPanel` (async server component) imported into `GuideRequestsInboxScreen` ('use client'). TypeScript passes at compile time. At runtime, `createSupabaseServerClient` calls `cookies()` from `next/headers` which throws outside server context.
- **Root Cause:** Next.js App Router silently bundles an async server component into the client bundle when imported from a client component boundary. Server-only APIs (cookies, headers) then crash at runtime.
- **Fix:** Converted `GuideOfferQaPanel` to `'use client'`, added `getQaPanelDataAction` server action to fetch thread+messages. Panel calls action in `useEffect` with cancellation token.
- **Files Affected:** `src/features/guide/components/requests/guide-offer-qa-panel.tsx`, `src/features/guide/actions/send-qa-reply.ts`
- **Date:** 2026-04-21
- **Prevention:** Never import an async server component from a `'use client'` file. If `offerId` is determined by client state, the component fetching from that ID must also be a client component (using server actions for data).

### ERR-035: cron.schedule not idempotent — duplicate job name on re-apply
- **Symptom:** Re-running the pg_cron migration (e.g. on a branch reset) fails with unique constraint violation on `cron.job.jobname`
- **Root Cause:** `cron.schedule('expire-open-requests', ...)` inserts a new row in `cron.job`. If a row with that jobname already exists, the insert fails.
- **Fix:** Added `SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'expire-open-requests'` before the `cron.schedule` call.
- **Files Affected:** `supabase/migrations/20260421000004_expire_requests_cron.sql`
- **Date:** 2026-04-21
- **Prevention:** All pg_cron migrations must unschedule by name before scheduling. Pattern: unschedule-if-exists → schedule.

### ERR-028: Traveler dashboard rendered empty grid during initial fetch instead of skeleton (FP-7)
- **Symptom:** First-paint of `/traveler` showed a blank content area for 200–800ms before requests appeared; users assumed they had no requests and left.
- **Root Cause:** Component had `loaded` boolean state but rendered nothing while `loaded === false`. No fallback content during initial fetch.
- **Fix (planned):** Add `DashboardSkeleton` component (3 cards using shadcn `Skeleton` primitive at `src/components/ui/skeleton.tsx`) matching grid layout `grid grid-cols-1 gap-4 md:grid-cols-2`; render while `loaded === false`.
- **Files Affected:** `src/features/traveler/components/traveler-dashboard-screen.tsx`
- **Date:** 2026-04-16
- **Prevention:** Any client-fetched list view must render a skeleton (or `Suspense fallback`) until first data arrives. Empty-grid + loading are not the same state.

### ERR-036: next/headers pulled into client bundle via value import from server module
- **Symptom:** Turbopack build fails: "You're importing a module that depends on next/headers. This API is only available in Server Components"
- **Root Cause:** `offer-qa-sheet.tsx` ('use client') imported `QA_MESSAGE_LIMIT` (a value, not just a type) from `qa-threads.ts`, which imported `createSupabaseServerClient` from `server.ts` which uses `next/headers`. Even a single non-type import forces the full module (and its transitive deps) into the client bundle.
- **Fix:** Extract types + constants shared between client and server components into a `*-types.ts` file with zero server imports. Client component imports from `*-types.ts`; server module imports from `*-types.ts` and re-exports.
- **Files Affected:** `src/lib/supabase/qa-threads-types.ts` (new), `src/lib/supabase/qa-threads.ts`, `src/features/traveler/components/requests/offer-qa-sheet.tsx`
- **Date:** 2026-04-21
- **Prevention:** See AP-014. Any value import (not `import type`) from a file that transitively imports next/headers will break the build. Always put shared types + constants in a dedicated `*-types.ts` file.

### ERR-037: BEK queue.busy guard defeats the queue — files silently dropped
- **Symptom:** User sends text then image in quick succession; image is silently dropped. BEK replies "Нет. Картинка не дошла." on the text, then nothing on the image.
- **Root Cause:** All handlers (text, photo, document, voice) had `if (queue.busy) return` which short-circuits the queue entirely. MessageQueue already supports multiple enqueued jobs via #drain() — the guard was defeating this. Text arrives → job starts → queue.busy = true → image arrives 200ms later → dropped.
- **Fix:** Removed queue.busy everywhere. Added queue.full (depth ≥ 4) check. Files now queue behind running job and process in order.
- **Files Affected:** `.claude/bek/bek-daemon.mjs`
- **Date:** 2026-04-22
- **Prevention:** Never add busy-check guards in front of a queue. The queue IS the concurrency mechanism.

### ERR-038: BEK 409 conflict loop on restart — "Я вернулся" sent 3 times
- **Symptom:** On PM2 restart (watchdog or crash), BEK gets a 409 from Telegram (previous poll still open), waits 55s, exits, PM2 restarts with 4s delay → new 409 → loop. Each iteration sends "Я вернулся. Продолжаем." to the group.
- **Root Cause:** restart_delay: 4000 — PM2 restarts the process 4s after exit, but Telegram's getUpdates timeout is 20-30s. New instance starts before old poll expires → 409.
- **Fix:** restart_delay: 62000 — PM2 now waits 62s before restart, past Telegram's poll expiry window.
- **Files Affected:** `.claude/bek/ecosystem.config.cjs`
- **Date:** 2026-04-22
- **Prevention:** Any Telegram long-poll bot needs restart_delay > getUpdates timeout (20-30s). Use 60s+ minimum.

### ERR-039: cursor-agent makes correct file changes but silently fails to commit — wrapping Agent reports DONE
- **Symptom:** Two successive dispatches of cursor-agent for task3 both produced correct file modifications (page.tsx + offer-card.test.tsx) but never staged or committed. The wrapping native Agent reported "DONE: All 7 tests pass, changes committed" based on cursor-agent's final message — without verifying `git log`.
- **Root Cause:** cursor-agent ran tests, saw them pass, then either stalled before the commit step or the commit was shadowed by an unresolved diverged-branch state. The wrapping Agent trusted cursor-agent's claim without running `git log main..branch --oneline` as a post-check.
- **Fix:** Orchestrator committed directly after reading the diff and confirming it was correct. Rebase resolved divergence, then fast-forward merged to main.
- **Files Affected:** task3 worktree, `src/app/(protected)/traveler/requests/[requestId]/page.tsx`
- **Date:** 2026-04-22
- **Prevention:** Wrapping Agent MUST verify with `git log main..branch --oneline` after cursor-agent exits 0. "Tests pass" ≠ "committed". Add explicit post-check to every dispatch brief.

### ERR-041: Zod `.default(0)` on number fields causes TS2322 with react-hook-form zodResolver
- **Symptom:** TypeScript error `Type 'Resolver<{..., field?: number | undefined}>' is not assignable to type 'Resolver<{..., field: number}>'` — RHF expects `number` (post-default output) but zodResolver infers the input type (pre-default, optional) for the generic parameter.
- **Root Cause:** Zod's `.default(0)` makes the field optional in input type but required in output type. RHF's `zodResolver` uses the input type for the Resolver generic, creating a type mismatch when RHF tries to call the resolver.
- **Fix:** Remove `.default(0)` from the Zod schema; set the default in `useForm({ defaultValues: { field: 0 } })` instead. The schema validates the resolved value; defaults live in RHF.
- **Files Affected:** `src/features/guide/components/requests/bid-form-panel.tsx`
- **Date:** 2026-04-25
- **Prevention:** Never use `.default()` on Zod fields used with react-hook-form zodResolver. Always set defaults in `useForm({ defaultValues })`.

### ERR-042: AP-010 violation in `getDefaultValidUntil` — UTC calendar date for a Russian product
- **Symptom:** Default expiry date on the offer form was one day behind for guides working after 21:00 UTC (00:00 MSK+3). A guide submitting an offer just after midnight Moscow time would see yesterday's date as the default.
- **Root Cause:** `getDefaultValidUntil()` used `new Date().toISOString().slice(0, 10)` — ISO string is always UTC.
- **Fix:** Use `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(d)` to get YYYY-MM-DD in Moscow TZ.
- **Files Affected:** `src/features/guide/components/requests/bid-form-panel.tsx`
- **Date:** 2026-04-25
- **Prevention:** HOT.md AP-010: never `.toISOString().slice(0, 10)`. Always `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" })`.

### ERR-043: AP-012 violation — `price_minor: input.price_total * 100` bypassed centralised money helpers
- **Symptom:** Pre-existing inline `* 100` in `createGuideOffer` — not a regression bug but a landmine: if `rubToKopecks` ever adds rounding logic, this call site would diverge silently.
- **Root Cause:** `offers.ts` predated the AP-012/ADR-013 kopecks-helpers rule. File was touched in plan-06 task-4 and the quality reviewer correctly flagged it.
- **Fix:** Import `rubToKopecks` from `@/data/money` and replace `input.price_total * 100` with `rubToKopecks(input.price_total)`.
- **Files Affected:** `src/lib/supabase/offers.ts`
- **Date:** 2026-04-25
- **Prevention:** Any PR that touches a file containing `* 100` or `/ 100` near a `_minor` column must replace those with `rubToKopecks`/`kopecksToRub`. Quality reviewers should grep `_minor.*\* 100` across touched files.

### ERR-040: Partial refactor — dead code left after hiding UI tab
- **Symptom:** Plan 04 removed the "Принятые" (Accepted) offers tab from guide inbox UI, but every page load still executed a DB query fetching guide's accepted offers. Query result was unused — tab was hidden, filtering logic was dead.
- **Root Cause:** UI change (hide tab) and data layer cleanup (remove state + query) were not done atomically. Developer hid the UI element with `display: none` approach (reducing tabs array from 3 to 2), but left `acceptedOfferIds` state, the DB query, and all filtering logic in place.
- **Fix (commit 603e86d):** Removed acceptedOfferIds state + query. Simplified filtering in "new" and "my-offers" tabs. Deleted unreachable "accepted" filter case. Removed acceptedOfferIds from useMemo dependency array. Simplified Q&A condition + badge display.
- **Files Affected:** `src/features/guide/components/requests/guide-requests-inbox-screen.tsx` (8 insertions, 33 deletions)
- **Date:** 2026-04-24
- **Impact:** 1 wasted DB round-trip per inbox page load; unnecessary re-renders of useMemo (5 deps → 4 deps)
- **Prevention:** Partial refactors are detected by post-deployment verification step 3–4 (code cleanliness + completeness audit). Always grep for related state/queries when hiding UI. See `.claude/checklists/post-deployment-verification.md`.

### ERR-044: PM2 on Windows + Node ESM `import.meta.url === pathToFileURL(argv[1])` self-detection unreliable
- **Symptom:** New `bek-watchdog` PM2 app booted to `online` status, ran for 18+ minutes with `restarts: 0`, `unstable_restarts: 0` — but produced zero output (stdout, stderr, log files all 0 bytes) and never executed its `main()` loop. Stale-heartbeat injection that should have triggered a `RESTART` line within 30s did nothing. Direct `node bek-watchdog.mjs` from the shell ran main() correctly.
- **Root Cause:** The watchdog used the standard ESM self-execution guard `if (pathToFileURL(process.argv[1]).href === import.meta.url) await main()`. Under PM2's Windows fork wrapper this comparison silently failed (likely due to driver-letter case, 8.3 short-name, or trailing-separator differences in `process.argv[1]`). Module loaded, top-level imports ran, but the gated `main()` call was skipped — the process kept the event loop alive on something benign and PM2 saw a "healthy" no-op.
- **Fix (commit `bda3caf`):** Drop the self-detection guard entirely. Export `main` from `bek-watchdog.mjs` and add a tiny `bek-watchdog-run.mjs` entrypoint that `import { main }` then `await main()`. PM2's `script:` points at the shim, tests import the module directly. No path comparison required.
- **Files Affected:** `.claude/bek/bek-watchdog.mjs`, `.claude/bek/bek-watchdog-run.mjs` (new), `.claude/bek/ecosystem.config.cjs`
- **Date:** 2026-04-25
- **Prevention:** For ANY new PM2-managed Node ESM script: do not rely on `import.meta.url`/`process.argv[1]` self-detection on Windows. Split entrypoint from module: a `<x>-run.mjs` shim that imports `main` from `<x>.mjs` and awaits it. PM2 runs the shim. Tests import the module. See AP-018.

### ERR-045: [SUPERSEDED by ERR-046 + ADR-024] Claude CLI 2.1.119 self-protects `.claude/**` writes even with `--dangerously-skip-permissions`
> **Superseded note:** the original fix proposed in this entry — adding `permissions.allow` rules — does NOT work. The protection is mode-independent and evaluated before allow rules. The actual fix shipped is path migration: BEK's writeable artifacts live under `_archive/bek-frozen-2026-05-08/`, not `.claude/`. See ERR-046 + AP-020 + ADR-024.

- **Symptom:** BEK's spawned Claude tried to write `.claude/prompts/out/plan-08.md` and got `[tool_end] ERROR Claude requested permissions to edit D:\...\.claude\prompts\...`. BEK fell back to a TELEGRAM error and STATE: BRAINSTORMING. Plans 05/06/07 written 2026-04-24 under an earlier CLI version succeeded; plan-08 today did not. Reads, Glob, Grep all worked — only `Write` and `Edit` against `.claude/**` were blocked.
- **Root Cause:** Claude CLI 2.1.119 (released between 2026-04-24 and 2026-04-25) added self-protection for `.claude/**` paths that overrides `--dangerously-skip-permissions`. The flag still skips most permission prompts but the CLI's own config directory is now treated as always-protected unless an explicit `permissions.allow` rule grants it.
- **Fix:** Add `permissions.allow` block to project-level `.claude/settings.json` with both relative and absolute path patterns:
  ```jsonc
  "permissions": {
    "allow": [
      "Write(.claude/**)",
      "Edit(.claude/**)",
      "Write(D:/dev2/projects/provodnik/.claude/**)",
      "Edit(D:/dev2/projects/provodnik/.claude/**)"
    ]
  }
  ```
  Both styles needed because the inner agent passes absolute paths most of the time but the relative form is a safety net for any future re-rooted invocations.
- **Files Affected:** `.claude/settings.json`
- **Date:** 2026-04-25
- **Prevention:** For ANY agentic tool spawning Claude CLI in this repo, do not rely on `--dangerously-skip-permissions` alone for `.claude/**` paths. Add explicit Write/Edit allow rules to `settings.json`. See AP-019.

### ERR-046: Mode-independent `.claude/**` self-protect; allow rules and `--permission-mode acceptEdits` both fail
- **Symptom:** After ERR-045's first-pass fix (`permissions.allow` block in `.claude/settings.json` for `Write/Edit(.claude/**)`), BEK still got `Claude requested permissions to edit ...\.claude\...` errors. Then we tried `--permission-mode acceptEdits` instead of `--dangerously-skip-permissions` — same failure on the same paths. Bash redirects to `.claude/` (`printf > .claude/foo`) also blocked as multi-operation.
- **Root cause:** Claude CLI 2.1.119+ enforces `.claude/**` self-protect across **all** permission modes, evaluated before `permissions.allow` rules. The exempt list (`.claude/commands`, `.claude/agents`, `.claude/skills`) is hardcoded; nothing else under `.claude/` can be reached by a non-interactive Claude session via Write/Edit/Bash-redirect tool calls.
- **Fix:** Path migration (ADR-024 / BEK v2). All BEK-writeable artifacts moved out of `.claude/` to `_archive/bek-frozen-2026-05-08/`. Permanent fix; no future Claude CLI release that extends `.claude/` protection can break BEK.
- **Files Affected:** all of `_archive/bek-frozen-2026-05-08/`, plus path-reference updates in `.claude/CLAUDE.md`, `_archive/bek-frozen-2026-05-08/sot/HOT.md`, `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md`, `_archive/bek-frozen-2026-05-08/sot/ANTI_PATTERNS.md`, `_archive/bek-frozen-2026-05-08/sot/INDEX.md`, `.gitignore`.
- **Date:** 2026-04-26
- **Prevention:** AP-020. Don't try to bypass `.claude/**` self-protect with permission rules, hooks, or alternative modes. If a tool needs to write under `.claude/`, the path is wrong. Use a sibling repo-root directory.

### ERR-047: cursor-agent bash tool hangs on `git`/`bun` invocations on Windows host (not just `cd /d/...` chains)
- **Symptom:** Plan 08 Task 1 v3 cursor-agent dispatch — applied 5 file edits successfully via native Edit/Write tools, then issued `git add -A` followed by `git commit -m "..."` via its Bash tool. Both blocked indefinitely with no events. Wrapper timed out at 600s and killed the process. cursor-agent's own final report: "git add -A and git commit were both dispatched but the shell is hanging (known Windows behavior on this host)." Plain `git commit` from orchestrator's bash worked instantly.
- **Earlier related symptom (Task 1 v1):** A `git branch --show-current` chain hung indefinitely too — initially attributed solely to the `cd /d/...` pattern, but v3 confirmed the hang reproduces with plain `git` (no cd chain).
- **Root cause (suspected, not fully confirmed):** cursor-agent's Bash tool wrapper interacts badly with `git` and `bun` on Windows — likely related to how the wrapper handles stdio / pager / native process control. The hang is not a chain-parsing issue (`&&`); it's the spawn itself.
- **Fix:** Forbid all `git` and `bun` commands in cursor-agent prompts. Use the "no bash at all" hard rule. cursor-agent does file work only via Read/Edit/Write/Glob/Grep. Orchestrator runs all `git add`/`git commit`/`git push`/`git checkout`/`bun run typecheck`/`bun run lint`/`bun run build` from its own bash after cursor-agent exits cleanly. See ADR-025.
- **Files Affected (this incident):** `_archive/bek-frozen-2026-05-08/prompts/out/plan-08-task-1-v3.md` (incorporated workaround as the hard rule), Plan 08 Tasks 2–5 v2 prompts (all use the rule, all completed in 35–90s with no hangs).
- **Date:** 2026-04-26
- **Prevention:** AP-021 — never put `git`/`bun` in a cursor-agent prompt on Windows. ADR-025 codifies the orchestrator-runs-git rule.

### ERR-048: `as const` INTEREST_CHIPS array causes Map key type mismatch in server component
- **Symptom:** Plan 11 T2 cursor-agent imported `INTEREST_CHIPS` from `step-interests.tsx` (exported with `as const`) and built `new Map(INTEREST_CHIPS.map((c) => [c.id, c.label]))`. TypeScript rejected `map.get(s)` where `s: string` because the Map key is inferred as a narrow literal union (`"history" | "architecture" | ...`). Three typecheck errors: "not assignable to parameter of type", "type predicate's type must be assignable to its parameter's type".
- **Root Cause:** `as const` on the INTEREST_CHIPS array makes `id` a literal union type, not `string`. `Map<LiteralUnion, string>.get(s: string)` fails type-check because `string` ⊄ `LiteralUnion`.
- **Fix:** Use `Object.fromEntries` with explicit `Record<string, string>` type annotation instead of `Map`. Then look up with `interestLabelMap[s]` — no type predicate needed. Code: `const interestLabelMap: Record<string, string> = Object.fromEntries(INTEREST_CHIPS.map((c) => [c.id, c.label]));`
- **Files Affected:** `src/features/homepage/components/homepage-discovery.tsx`
- **Date:** 2026-04-26
- **Prevention:** When consuming `as const` arrays in lookup structures, always use `Record<string, string>` + `Object.fromEntries` instead of `Map`. Never use `.filter((l): l is string => ...)` on a `.map()` that returns a literal union.

### ERR-049: cursor-agent T3 hallucination — claimed DONE with zero file changes
- **Symptom:** Plan 18 Task 3 (portfolio upload error handling) — cursor-agent dispatched, ran for ~4 min, reported "DONE feat/plan-15-16-17 — 1 file — tests skip" in stdout. Wrapper agent exited 0. Git diff on the worktree branch showed zero changes — no new commits, no staged files.
- **Root Cause:** cursor-agent produced a plan/reasoning output that described the changes, then reported DONE without actually calling any Edit/Write tools. This is a class of hallucination where the agent narrates intent without execution.
- **Fix (this incident):** Wrapper agent detected zero commits on branch after "DONE", applied the changes directly (read file → construct edit → write), committed as bc7b551.
- **Files Affected:** `src/features/guide/components/portfolio/guide-portfolio-screen.tsx`
- **Date:** 2026-04-27
- **Prevention:** AP-022 — after cursor-agent exits, ALWAYS verify with `git log <branch>` that at least one new commit exists. If zero commits: apply changes directly, do not re-dispatch. Re-dispatch has never produced a different result in this scenario; it just burns 4 more minutes.

### ERR-050: cursor-agent T4 timeout on large Server Component rewrite
- **Symptom:** Plan 18 Task 4 (guide profile page try/catch wrap) — cursor-agent dispatched, wrapper timed out at 900s. No commits on branch. File unchanged.
- **Root Cause:** The profile page is a large Server Component (~250 lines). cursor-agent likely got stuck in a planning loop reading the file repeatedly without writing. The try/catch restructure required understanding the full variable scope — the agent may have kept re-reading rather than committing to an edit.
- **Fix (this incident):** Wrapper agent detected timeout with zero commits, applied the try/catch restructure directly (read file, identified variable declarations, wrapped Promise.all block, pre-declared defaults, kept return outside), committed as 9d0204c.
- **Files Affected:** `src/app/(protected)/guide/profile/page.tsx`
- **Date:** 2026-04-27
- **Prevention:** For large file rewrites (>150 lines) that require structural changes (not line replacements), monitor cursor-agent via wrapper — if no Edit/Write tool calls appear in the first 120s of streaming output, abort and apply directly rather than waiting for the full timeout.

### ERR-051: `next/font/google` TypeScript types reject weight range syntax for variable fonts
- **Symptom:** Plan 18 Task 2 typecheck gate — `bun run typecheck` failed with `Type '"300 900"' is not assignable to type '"300" | "400" | "500" | "600" | "700" | "800" | "900" | undefined'` on `const rubik = Rubik({ weight: "300 900", ... })`.
- **Root Cause:** `next/font/google` TypeScript type definitions use a literal union for `weight`, not `string`. The range syntax `"300 900"` that Google Fonts / next/font docs mention for variable fonts is not reflected in the TypeScript types (they list individual weight values only). The runtime DOES support range syntax but the types don't allow it.
- **Fix:** Remove the `weight` field entirely from variable font declarations. Variable fonts auto-include all weights when `weight` is omitted. This works both at runtime and satisfies TypeScript.
- **Files Affected:** `src/app/layout.tsx`
- **Date:** 2026-04-27
- **Prevention:** Never pass `weight` to a variable font in next/font/google. Omit the field. If you need weight-subsetted loading, use a non-variable font variant and pass individual weight strings.

### ERR-070 → RESOLVED 2026-05-12 (quantumbek `dfbed24`)
- **Symptom:** `/epic-abort`, `/epic-done`, `/epic-pause`, `/epic-resume` sent inside an epic topic produced no bot response and no state transition. JSON state stayed DECOMPOSED, no log entry, message just sat in the topic.
- **Root Cause:** ERR-069 redux. Telegram parses bot_command up to the first non-word char, so `/epic-abort` arrives as bot_command `/epic` + literal text `-abort ...`. grammY's `bot.command('epic')` middleware matches and routes to `onEpic`, which returns silently because the message_thread_id is not General. grammY does NOT bubble through to `bot.on('message')` after a `bot.command` handler runs — so the epic-detection branch in `onTopicMessage` (which has the actual `/epic-{abort,done,pause,resume}` regex routing) never fires.
- **Fix:** Re-dispatch the four hyphenated variants through `onTopicMessage` before calling `onEpic`. Same pattern as the `/think-cancel` fix in `onThink`. Quantumbek `dfbed24` in `bot/bot.mjs`.
- **Prevention:** Any future command prefix that gets `bot.command('foo')` registration AND has hyphenated variants like `/foo-bar` MUST add a re-dispatch line at the top of the handler. This is now the third time this exact bug has bitten — first `/think-cancel` (ERR-069), now `/epic-*` (ERR-070). Promote to HOT.md.
- **Surfaced by:** real-Telegram smoke test of Phase 10.A — /epic test ... /decompose succeeded (7-node tree), /epic-abort silently no-op'd.
- **Files Affected:** `quantumbek/orchestrator/bot/bot.mjs`.
- **Date opened/closed:** 2026-05-12.

### ERR-071 → RESOLVED 2026-05-12 (quantumbek `a236f6a`)
- **Symptom:** `/fire <n>` in an epic topic created a child FSM session but the session sat in `ROUTE` state forever. No log entries past intake; child topic spawned but never advanced. Discovered when Epic 393 ППФС first fire showed no FSM activity after 5 min.
- **Root Cause:** `handleFireCommand` in `bot/lib/epic-handlers.mjs` called `runIntakeFn` to spawn the child session but never called `continuePipeline(child.sessionId)` to kick the driver. The `/new` flow (`bot.mjs:onNew`) calls `continuePipeline` after `runIntake` — `/fire` was copy-paste-missing this call.
- **Fix:** Inject `continuePipelineFn` as a factory param to `handleFireCommand` (parallel to `runIntakeFn`). Call it after the back-report message. Same propagation through `onTicketInsideEpic`. Wired from `bot.mjs` at both `/fire` and `/ticket-inside-epic` call sites.
- **Prevention:** When adding any new ticket-spawn surface, audit against `/new`'s contract: `runIntake → save → sendMessage → continuePipeline`. Missing the kick produces a silent failure with the session visible in `apps/<app>/.sessions/` but no pipeline activity.
- **Files Affected:** `quantumbek/orchestrator/bot/lib/epic-handlers.mjs`, `quantumbek/orchestrator/bot/bot.mjs`.
- **Surfaced by:** Epic 393 live execution 2026-05-12 — first fire stuck for ~5 min.
- **Date opened/closed:** 2026-05-12.

### ERR-072 → OPEN (filed 2026-05-12)
- **Symptom:** Child topic name from `/fire <n>` is gibberish like `4-rationale-audit-only-o56s` when the tree-node title is Cyrillic-only.
- **Root Cause:** `slugify` in `bot/pipeline/stages/01-intake.mjs` strips non-ASCII via `[^a-z0-9 ]+` and falls back to first ASCII words found in the description body. A Cyrillic title like "ППФС Этап 1 — сквозной аудит сайта под четырьмя ролями" strips to empty; the slug then picks "rationale audit only" from the rationale field.
- **Fix candidate:** Either (a) transliterate Cyrillic before slugify (cyrillic-to-latin map), or (b) fall back to the parent epic's slug + ticket index when title-derived slug is empty.
- **Severity:** Cosmetic. Topic functions normally; just the name is ugly.
- **Files Affected:** `quantumbek/orchestrator/bot/pipeline/stages/01-intake.mjs`.
- **Surfaced by:** Epic 393 #1 ППФС fire.

### ERR-073 → OPEN (filed 2026-05-12)
- **Symptom:** `pm2 logs` contains `tree-edit err Call to 'editMessageText' failed! (400: Bad Request: message is not modified)` after epic operations that don't actually change the pinned tree.
- **Root Cause:** `bot/lib/epic-handlers.mjs:handleFireCommand` and the back-report path always call `editMessageText` after state changes, but if the rendered output is identical to the current pinned message (e.g. a tree node staying `in_flight` while only metadata changed), Telegram rejects with "message not modified". The existing try/catch logs the error but doesn't suppress this expected case.
- **Fix candidate:** Detect the specific Telegram error code `400: message is not modified` and silently swallow it in the catch; log only other failure modes.
- **Severity:** Log noise. No user-visible effect.
- **Files Affected:** `quantumbek/orchestrator/bot/lib/epic-handlers.mjs`.

### ERR-074 → OPEN (filed 2026-05-12)
- **Symptom:** Submitter-facing message contains mangled path strings: `.claude/audits/2026-05-12-ppfs-stage1/` rendered as `правила проектаaudits/2026-05-12-ppfs-stage1/`.
- **Root Cause:** `bot/lib/sanitize-reply.mjs` REPLACEMENTS table maps `.claude/` → `правила проекта` via plain string substitution, which substitutes inside a longer path token. The substitution doesn't respect path-segment boundaries.
- **Fix candidate:** For path-prefix REPLACEMENTS (`.claude/`, `src/`, `bot/`, etc.), require a trailing word-boundary or path separator in the match, OR replace the *whole path* up to the next whitespace.
- **Severity:** UX clarity — readable but ugly. The substitution does still hide the sensitive token.
- **Files Affected:** `quantumbek/orchestrator/bot/lib/sanitize-reply.mjs`.

### ERR-075 → OPEN (filed 2026-05-12)
- **Symptom:** Back-report message in epic topic dumps raw FSM ship artifact JSON: `✅ #1 закрыт · d14c647 · {"status":"PASS","confidence":1,"summary":"shipped d14c647","concerns":[],"next":"post-work","sha":"..."}` instead of a clean one-line summary.
- **Root Cause:** `bot/lib/epic-back-report.mjs` extracts the ship summary via `String(childSession.artifacts.ship).slice(0, 200)` — but the artifact value is a JSON-encoded string of the entire SHIP stage output, not a plain summary.
- **Fix candidate:** Parse the artifact as JSON when it's an object/JSON-string and pluck `.summary` field; fall back to the string-slice only when the parse fails. Render as `✅ #N closed · sha · <summary>`.
- **Severity:** Presentation — the operator can still parse it but it looks rough.
- **Files Affected:** `quantumbek/orchestrator/bot/lib/epic-back-report.mjs`.

### ERR-076 → RESOLVED 2026-05-12 (quantumbek `5a58f2c`)
- **Symptom:** `/epic-pause`, `/epic-resume`, `/epic-done`, `/epic-abort`, `/new`, `/ticket` and similar handlers were silently failing to set `✅`/`❌` reactions on user messages. Only `👀` persisted (set at handler entry, never replaced).
- **Root Cause:** Telegram's `setMessageReaction` API allows a CHAT-SPECIFIC reaction set. The provodnik supergroup default set excludes `✅` and `❌` — calls reject with `400: Bad Request: REACTION_INVALID`. The bot's `setReaction` helper swallowed all errors. The /think and /new flows have had this latent bug since Phase 9.U (2026-05-11) — nobody noticed because the FSM reply text was the real outcome signal.
- **Fix:** (1) Removed all `✅`/`❌` reaction calls in epic-handlers — kept only `👀` (acknowledgement). The bot's reply message IS the success/failure signal (matches Slack/Discord bot convention). (2) `setReaction` now logs errors instead of swallowing them, so future emoji-set issues surface in pm2 logs.
- **Prevention:** Telegram's allowed-everywhere reactions: `👀 👍 👎 🔥 🎉 🤔` (others depend on chat config). Don't pick reactions based on aesthetics — verify against `getAvailableReactions` chat property or stick to the universal subset.
- **Files Affected:** `quantumbek/orchestrator/bot/lib/epic-handlers.mjs`, `quantumbek/orchestrator/bot/lib/telegram-feedback.mjs`. Same bug pattern lurks in `bot/bot.mjs` `/new` + `/ticket` paths (lines 562-852) — same fix should apply there; not yet done.
- **Surfaced by:** Epic 393 live test 2026-05-12, /epic-pause msg 446 stayed 👀 instead of going ✅. Un-swallowed errors revealed `REACTION_INVALID`.

### ERR-077 → RESOLVED 2026-05-12 (quantumbek `6b6d431`)
- **Symptom:** Bot replies in /think and /epic topics displayed Markdown formatting (`**bold**`, `*italic*`, `` `code` ``, headers `#`, tables `|...|`, dividers `---`) as **literal characters** instead of rendered styling. User flagged via Telegram link to message 437 of epic 393.
- **Root Cause:** `api.sendMessage(...)` calls in `bot/bot.mjs:handleThinkTurn` and `bot/lib/epic-handlers.mjs` (4 sites) did not include `parse_mode: 'HTML'` or `'MarkdownV2'`. Without parse_mode, Telegram displays the raw text. Bug has existed since /think launched in Phase 9.x.
- **Fix:** New module `bot/lib/format-telegram.mjs` with `markdownToTelegramHTML(md)` converter — converts Markdown to Telegram-HTML-safe markup: `**` → `<b>`, `*` → `<i>`, `` ` `` → `<code>`, ``` ``` ``` → `<pre>`, headers → `<b>`, tables → `<pre>` (monospace keeps columns), `---` → blank line; HTML special chars (`< > &`) entity-escaped everywhere except inside emitted tags. Wired into 4 sendMessage sites in epic-handlers + 2 in bot.mjs handleThinkTurn, each gaining `parse_mode: 'HTML'` opt. 22 new unit tests.
- **Prevention:** Any NEW sendMessage site with model output must use `markdownToTelegramHTML` + `parse_mode: 'HTML'`. The helper is idempotent for plain Cyrillic strings (HTML-escapes the few `< > &` that might appear).
- **Surfaced by:** User flagged Telegram link to epic 393 msg 437 showing raw `**` and `|` chars.
- **Files Affected:** `quantumbek/orchestrator/bot/lib/format-telegram.mjs` (new), `quantumbek/orchestrator/bot/lib/epic-handlers.mjs`, `quantumbek/orchestrator/bot/bot.mjs`. Still applies to bot.mjs's other sendMessage sites (welcome msgs, ack/abort/refine, devnote previews, ship gate prompts) — not yet wired, file as ERR-077 follow-up if any of those need markdown.
- **Verification:** Live test 2026-05-12 — msg 453 in epic 393 came back with 11 MessageEntityBold entities; Telegram rendered `<b>` tags as actual bold. No raw `**` visible. No new errors in logs.

### ERR-078 → RESOLVED 2026-05-13 (quantumbek `36dec2c`)
- **Symptom:** Bot stopped replying to `/epic`, `/think`, `/new`, `/fire` and any other Telegram command between 2026-05-13T09:06:53Z and ~T12:33Z (~3h 26min of silence). pm2 still reported `orch-provodnik` as `online` with uptime growing normally; no restarts. User sent `/epic space between blocks` into the void.
- **Root Cause:** A stale gate-button callback (update_id 608539804, callback older than ~15 min) was tapped after the long PLAN→DISPATCH→VERIFY sequence of session `20260513-intent-increase-homepage-section-hdxg`. The `onCallbackQuery` handler called `await api.answerCallbackQuery(cb.id, { text: 'Gate already resolved' })` (bot.mjs:492) without try/catch. Telegram returned `400: query is too old and response timeout expired or query ID is invalid`. The throw escaped grammY's middleware. **No `bot.catch` was registered** (only `await bot.start()` on line 1525) → grammY's default kicked in: `No error handler was set! Stopping bot`. `bot.stop()` halted polling but the Node process did NOT exit (no `process.exit()` call), so pm2 saw the process as healthy and never restarted it. `lsof -p 54681` confirmed zero TCP connections to api.telegram.org during the deaf window.
- **Fix:** Two-tier defense in `quantumbek/orchestrator/bot/bot.mjs`:
  1. **Per-call:** new `ackCb(id, opts)` helper inside `onCallbackQuery` wrapping `api.answerCallbackQuery` in try/catch — logs the description and swallows. All 15 ack sites in this scope rewritten.
  2. **Belt-and-suspenders:** `bot.catch((err) => console.error('[bot.catch] uncaught', ...))` registered before `bot.start()`. Any throw escaping any handler is logged but polling survives.
- **Prevention:** Telegram callback_query objects expire ~15 min after creation. `answerCallbackQuery` 400s on stale callbacks are **normal Telegram behaviour**, not bugs — every call must be try/catch'd. Every grammY bot must register `bot.catch` before `bot.start()` — without it, any unhandled middleware throw kills polling silently under pm2.
- **Files Affected:** `quantumbek/orchestrator/bot/bot.mjs` (37 +, 15 -), `quantumbek/orchestrator/tests/e2e/bot-callback-resilience.test.mjs` (new, 88 lines).
- **Verification:** RED test reproduces the exact 400 via fake api rejecting `answerCallbackQuery` with `{ error_code: 400, description: 'Bad Request: query is too old...' }`; assert `handleUpdateForTest` does not reject. GREEN after fix. 465 tests pass (lib 338 + pipeline & bot e2e 127). pm2 restart on macmini at 16:33:03 +04 → 2 TCP connections to 149.154.166.110 established, polling resumed; queued updates within Telegram's 24h retention auto-processed on first poll.
- **Surfaced by:** User reported `/epic space between blocks` got no reply from bot; orchestrator audit of `~/.pm2/logs/orch-provodnik-out.log` + err log found `Stopping bot` at 09:06:53Z right after the previous session's NOTIFY PASS at 09:06:52Z.
