# Overnight Autonomous Ledger Loop — Design

**Status:** READY FOR PLANNING
**Date:** 2026-05-02
**Author:** orchestrator (Opus 4.7) via brainstorming
**Parent ledger:** `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md` (44 rows, 21 commit-producing)
**Parent plan:** `docs/superpowers/plans/2026-05-02-provodnik-launch-readiness-implementation.md`

---

## 1. Purpose

One command kicks off an overnight, fully autonomous run that ticks the entire 44-row launch-readiness ledger end to end. Operator runs `node .claude/logs/overnight-loop.mjs` before sleep; in the morning the ledger is fully `[x]`, every commit-producing row has shipped to `main`, Vercel deploys are `READY`, Slack and Telegram dev-notes are posted, the SOT is updated, the session is archived and memory is saved. No human gate between kickoff and the morning summary.

## 2. Non-goals

- **No human approvals during the run.** Pre-authorization is one-click at kickoff, scoped to the entire run.
- **No real-time UI.** Observability is post-hoc via the event log + tail.
- **No multi-night continuity.** One overnight run targets one ledger. Crash mid-run is resumable; deliberate pause-and-resume across sleeps is out of scope.
- **No multi-machine parallelism.** Single host, single supervisor process.
- **No token / cost tracking.** Operator has Claude Max sub and cursor-agent unlimited plan; cost is not constrained.
- **No ledger generalization.** This spec targets `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md` and the row TYPE vocabulary defined there. Future ledgers can reuse the supervisor only if they obey the same TYPE schema.

## 3. Architecture (Option B)

Parent supervisor (`.mjs`) + per-iteration child Claude invocations + durable append-only event log for crash recovery.

```
┌────────────────────────────────────────────────────────────────┐
│ overnight-loop.mjs (parent supervisor — runs until ledger done)│
│                                                                │
│  preflight()                                                   │
│  while (pending rows or active claims):                        │
│    row = pickNextReady() OR cluster = pickParallelCluster()    │
│    claim atomically: [ ] → [~] in ledger (temp-file rename)   │
│    appendEvent(claim)                                          │
│    prompt = build(operatorManual + typeTemplate + rowText      │
│                  + visionBlock + retryHistory + lastError)    │
│    child = spawn("claude -p --dangerously-skip-permissions    │
│                   --model <opus|sonnet>")                      │
│    appendEvent(spawn, pid)                                     │
│    code = await child.exit                                     │
│    appendEvent(brain_exit, code, durationMs)                   │
│    state = readLedger(row)                                     │
│    if state == "x": appendEvent(complete); continue            │
│    else: revert [~]→[ ], inc retry, append failure trace,     │
│          appendEvent(revert)                                   │
│  finale() — items.json, slack, telegram, SOT, archive, memory  │
│  appendEvent(loop_end)                                         │
└────────────────┬───────────────────────────────────────────────┘
                 │ spawns
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ child: claude -p --dangerously-skip-permissions                │
│         --model claude-opus-4-7 | claude-sonnet-4-6            │
│   reads in order:                                              │
│     1. overnight-operator-manual.md (global rules)             │
│     2. per-TYPE template for this row's TYPE                   │
│     3. row text (verbatim from ledger)                         │
│     4. vision block (Provodnik product vision)                 │
│     5. retry history + last error trace (if retry > 0)         │
│     6. CLAUDE.md global protocol                               │
│   executes ONE row to completion                               │
│   marks ledger [~] → [x] with commit/evidence/status-note      │
│   exits 0                                                      │
└────────────────────────────────────────────────────────────────┘
```

Why Option B over A or C:
- **vs A (single-process loop):** durable event log lets the run survive a supervisor crash; pre-flight replay reconciles any orphaned `[~]` claim.
- **vs C (PM2 single-iteration):** single coherent process owns multi-row coordination (parallel clusters, escalation rules, finale trigger) instead of fragmenting that across PM2 + ledger + restart hooks.

## 4. Components

| Path | Purpose | New / existing |
|---|---|---|
| `.claude/logs/overnight-loop.mjs` | Parent supervisor (~450 lines) | new |
| `.claude/logs/overnight-events.jsonl` | Append-only event log, fsynced per write | runtime |
| `_archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json` | Iteration counter, retries, last errors | runtime |
| `_archive/bek-frozen-2026-05-08/sot/overnight-operator-manual.md` | Static global brain rules (mode overrides, hard rules, ledger semantics) | new |
| `_archive/bek-frozen-2026-05-08/prompts/overnight-types/edit.md` | EDIT row template | new |
| `_archive/bek-frozen-2026-05-08/prompts/overnight-types/migration.md` | MIGRATION row template | new |
| `_archive/bek-frozen-2026-05-08/prompts/overnight-types/dispatch.md` | DISPATCH row template (Opus) | new |
| `_archive/bek-frozen-2026-05-08/prompts/overnight-types/check.md` | CHECK row template | new |
| `_archive/bek-frozen-2026-05-08/prompts/overnight-types/browser-audit.md` | BROWSER-AUDIT row template | new |
| `_archive/bek-frozen-2026-05-08/prompts/overnight-types/decision.md` | DECISION row template | new |
| `_archive/bek-frozen-2026-05-08/prompts/overnight-types/cluster-dispatch.md` | Parallel-cluster template (Opus) | new |
| `_archive/bek-frozen-2026-05-08/prompts/overnight-finale.md` | Post-work finale prompt | new |
| `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md` | The ledger | existing, unchanged |
| `.claude/logs/cursor-dispatch.mjs` | Cursor-agent wrapper | existing, unchanged |
| `.claude/logs/slack-devnote.mjs` | Slack wrapper | existing, unchanged |
| `.claude/logs/telegram-devnote.mjs` | Telegram wrapper | existing, unchanged |

## 5. Row state machine

| State | Meaning | Set by |
|---|---|---|
| `[ ]` | Pending — eligible when `depends-on:` met | initial / supervisor revert |
| `[~]` | Claimed — child is running | supervisor (claim) |
| `[x]` | Done — `commit:` and `evidence:` populated | brain |
| `[!]` | Brain self-blocked after exhausting recipes | brain (rare); supervisor escalates to Opus and retries |
| `[-]` | Skipped | reserved for human; **never set in overnight mode** |

Transitions (supervisor + brain):
- `[ ]` → `[~]` — supervisor claim, atomic write via temp-file rename + fsync
- `[~]` → `[x]` — brain success
- `[~]` → `[!]` — brain self-blocked (writes detailed `status-note`)
- `[~]` → `[ ]` — supervisor revert on orphan/non-zero exit, increments retry counter
- `[!]` → `[ ]` — supervisor escalation (next attempt forces Opus + injects full failure history)

In overnight mode `[-]` is never set programmatically. The loop never abandons a row; persistent failure goes through escalation cycles indefinitely (operator can manually mark `[-]` next morning if they want to stop a doomed retry loop).

## 6. Lifecycle

### 6.1 Pre-flight (every supervisor start, fresh or resumed)

1. Open `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md`. If missing or has zero `[ ]`/`[~]` rows → exit 0 with "nothing to do".
2. `git -C provodnik.app status --short`. If non-empty → exit 1 with `dirty-main` error printed (operator must clean before sleeping).
3. `git -C provodnik.app log -1 --format=%H` → save as `kickoffSha` to `overnight-state.json` (only on first kickoff; preserved across resumes).
4. `git -C provodnik.app fetch origin && git rev-list --count HEAD..origin/main` → must be 0 (local main is up to date with remote).
5. Scan for orphan worktrees in `D:/dev2/worktrees/provodnik-*`; for each, run `git -C <worktree> status` — if stale-no-commits, `git worktree remove --force`; if has commits not on main, halt and print "manual review needed" (this is the only refuse-to-start gate).
6. Replay `overnight-events.jsonl` if present:
   - Find last `claim` with no matching `complete` or `revert` → that's an orphan.
   - For each orphan: revert ledger row `[~]` → `[ ]`, increment retry counter in state, append `recovery` event.
7. Read state file → reconstruct retry counters and last-error map.
8. Append `preflight_pass` event with summary.

### 6.2 Main loop (per iteration)

```
while (true):
  ledger = readLedger()
  if no rows in [ ] or [~]: break  # → finale

  cluster = detectParallelCluster(ledger)  # see §8
  if cluster:
    rows = cluster
    template = "cluster-dispatch.md"
    model = "opus"
  else:
    row = pickNextReady(ledger)            # lowest T### with deps satisfied
    if row is null: sleep(30); continue    # all pending rows blocked on [~] siblings — wait
    rows = [row]
    template = templateForType(row.type)
    model = modelForRow(row, retries[row.id])  # see §7

  for r in rows:
    writeLedger atomically: r.checkbox " " → "~"
    appendEvent("claim", r, model, retries[r.id])

  prompt = compose(
    operatorManual,
    template,
    rowsText,                              # verbatim from ledger
    visionBlock,
    retryHistory[rows],
    lastErrors[rows],
    claudeMd,
    sotIndexPointer
  )

  child = spawn("claude", [
    "-p", "--dangerously-skip-permissions",
    "--model", model,
    "--input-format", "stdin"
  ], { stdin: prompt, timeout: timeoutForType(row.type) })
  appendEvent("spawn", { pid: child.pid })

  result = await child.exit
  appendEvent("brain_exit", { code: result.code, signal: result.signal, durationMs })

  ledgerAfter = readLedger()
  for r in rows:
    state = ledgerAfter[r.id].checkbox
    if state == "x": appendEvent("complete", r); continue
    if state == "!": handleSelfBlock(r); continue   # see escalation rule
    # still [~] (brain crashed/timed out without writing)
    writeLedger atomically: r.checkbox "~" → " "
    retries[r.id] += 1
    lastErrors[r.id] = readBrainStderr() OR "no-output"
    appendEvent("revert", r, retries[r.id])

  saveState()
```

Timeout per TYPE:
- EDIT, CHECK, DECISION: 600 s
- MIGRATION: 900 s (SQL apply + types regen)
- DISPATCH: 1800 s (cursor-agent has internal 900 s timeout per `cursor-dispatch.mjs`; brain may need 2× that for compose + dispatch + verify + merge)
- BROWSER-AUDIT: 1800 s (multiple route audits with chrome-devtools-mcp)
- Cluster: 1800 s (parallel agents finish around same time; brain coordinates)
- Finale: 1800 s

If child hits the timeout, supervisor sends SIGTERM, then SIGKILL after 10s grace, treats as crash → revert + retry.

### 6.3 Finale (when no `[ ]` and no `[~]` rows remain)

Single Opus brain invocation, prompt at `_archive/bek-frozen-2026-05-08/prompts/overnight-finale.md` (full text in §15 below). Steps the brain executes:

1. Read git log from `kickoffSha` to `HEAD` on main → list every merged commit.
2. Read state file → completedRows, retries, blocked.
3. Read all findings files produced by BROWSER-AUDIT rows (`_archive/bek-frozen-2026-05-08/sot/findings-*.md`).
4. Compose `items.json` per CLAUDE.md schema; expansion rule mandatory (typically 12–20 items for a 44-row ledger).
5. Compose `capabilities` (3–5 plain Russian sentences about new user journeys; vision-aligned).
6. Compute `hours_override` from commit count + complexity (do not shrink — full disclosure of work).
7. Run validator: `node .claude/logs/slack-devnote.mjs items.json --dry`.
8. If pass → drop `--dry`, post Slack. If reject → revise per validator output, retry up to 5 times, then minimize to one-line shipped post that mechanically passes.
9. `node .claude/logs/telegram-devnote.mjs items.json` — post Telegram.
10. Update SOT: METRICS, ERRORS, ANTI_PATTERNS, DECISIONS, NEXT_PLAN, INDEX, HOT (per `Post-Work Protocol` in CLAUDE.md).
11. Save memory under `~/.claude/projects/D--dev2-projects-provodnik/memory/` per auto-memory rules.
12. Archive session: rotate `_archive/bek-frozen-2026-05-08/sessions/active/*` → `_archive/bek-frozen-2026-05-08/sessions/archive/2026-05-02-overnight-launch-readiness/`.
13. Print Russian morning summary to stdout (operator reads this in `overnight-events.jsonl` tail or terminal scrollback).
14. Append `finale_end` event, then `loop_end`, then exit 0.

## 7. Model selection

| Row TYPE | Attempt 1 | Attempt 2 | Attempt 3+ |
|---|---|---|---|
| DISPATCH | Opus | Opus | Opus |
| Parallel cluster | Opus | Opus | Opus |
| EDIT | Sonnet | Sonnet | Opus |
| MIGRATION | Sonnet | Sonnet | Opus |
| CHECK | Sonnet | Sonnet | Sonnet |
| BROWSER-AUDIT | Sonnet | Sonnet | Sonnet |
| DECISION | Sonnet | Sonnet | Sonnet |
| Phase gate (`-GATE`) | Sonnet | Sonnet | Opus |
| Audit followup (`-followup`) | Opus | Opus | Opus (these mutate the ledger by appending new rows — needs judgment) |
| Finale | Opus | Opus | Opus |

**Universal escalation:** any row at retry count ≥ 5 → force Opus regardless of TYPE; at retry ≥ 10 → Opus + scope-critique mode (template adds a "if you cannot satisfy the verify clause, consider rewriting it against the vision and proceeding" instruction).

Model IDs: `claude-opus-4-7`, `claude-sonnet-4-6`. Pinned to current latest per the knowledge-update injection.

## 8. Concurrency — parallel cluster detection

A parallel cluster is a set of rows where:
- All rows share an identical `depends-on:` set.
- All rows are TYPE = DISPATCH.
- No row in the candidate cluster depends on any other in the cluster.
- The next phase gate (`-GATE`) lists ALL cluster rows in its `depends-on:`.

In the current ledger the eligible clusters are:
- **{T011, T012, T013, T014}** — share `depends-on: T009, T010`, all DISPATCH, all blocking `T015-GATE`.
- **{T017, T018}** — share `depends-on: T016`, all DISPATCH, both blocking T019.

When detected, supervisor:
1. Atomically claims all cluster rows (`[ ]` → `[~]` in one ledger write).
2. Spawns ONE Opus brain with the cluster-dispatch template.
3. Brain reads CLAUDE.md §4 ("Parallel dispatch from native Agents"), spawns N native `Agent` subagents in ONE batched message with `run_in_background: true`. Each Agent owns one worktree + one cursor-dispatch invocation + verification + merge.
4. Brain waits for all Agent reports, reconciles each row independently.
5. Partial success (some `[x]`, some still `[~]`): supervisor reverts the unfinished and retries each as a SOLO row in subsequent iterations. Cluster mode does not retry — too risky to re-cluster after a partial fail.

## 9. Event log schema

`.claude/logs/overnight-events.jsonl` — one JSON object per line, fsync after each write.

Common fields: `ts` (ISO-8601 with milliseconds), `iter` (iteration counter), `event` (kind).

Kind-specific fields:
- `preflight_pass` — `kickoffSha`, `pendingCount`, `recoveredOrphans:[T###]`
- `recovery` — `row`, `reason`
- `claim` — `row` or `cluster:[T###]`, `model`, `retry`
- `spawn` — `pid`, `cmd`, `templateVersion`
- `brain_exit` — `code`, `signal?`, `durationMs`
- `reconcile` — `row`, `rowState` (`x`/`~`/`!`), `commitSha?`
- `complete` — `row`, `commitSha?`
- `revert` — `row`, `reason` (`timeout`/`non-zero-exit`/`brain-no-write`), `newRetryCount`
- `escalate` — `row`, `from`, `to`, `reason`
- `hard_stop_caught` — `row`, `kind` (`vercel-error`/`new-sentry`/`secret-leak`/`bek-sql-fail`/`scope-creep`/`zero-commit`/`destructive-needed`/`validator-reject`), `action` (`revert`/`apply-direct`/`fix-forward`/`block`)
- `cluster_partial_success` — `cluster:[T###]`, `succeeded:[T###]`, `revertedToSolo:[T###]`
- `finale_start`
- `finale_step` — `step` (1–13 from §6.3)
- `finale_end`
- `loop_end` — `kickoffSha`, `endSha`, `commitsLanded`, `iterationsTotal`, `wallClockMs`

## 10. State file schema

`_archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json`:

```json
{
  "version": 1,
  "kickoffSha": "abc1234567890...",
  "kickoffTs": "2026-05-02T22:00:00.000Z",
  "iteration": 47,
  "currentClaim": null,
  "retries": {
    "T013": 2,
    "T024": 1
  },
  "lastErrors": {
    "T013": {
      "iter": 32,
      "stage": "verify-typecheck",
      "summary": "typecheck failed: Property 'specializations' does not exist on GuideProfileRow",
      "fullTrace": "[multi-line, redacted of secrets]",
      "modelAtFailure": "sonnet"
    }
  },
  "completedRows": ["T001","T002","T003","T004","T005","T006","T007","T008-GATE","T009","T010"],
  "blockedRows": [],
  "lastSuccessfulGate": "T008-GATE",
  "vercelLastReady": "https://provodnik-app-xyz.vercel.app",
  "lastSlackTs": null,
  "templateVersions": {
    "operator-manual": "1.0.0",
    "edit": "1.0.0",
    "migration": "1.0.0",
    "dispatch": "1.0.0",
    "check": "1.0.0",
    "browser-audit": "1.0.0",
    "decision": "1.0.0",
    "cluster-dispatch": "1.0.0",
    "finale": "1.0.0"
  }
}
```

State file is rewritten atomically (temp-file rename) on every supervisor write. `currentClaim` is set right before claim, cleared right after reconcile. If supervisor crashes between claim and clear, pre-flight replay catches it.

## 11. Hard-stop reconciliation table — no halts

Each ordinary CLAUDE.md / `auto-session` hard-stop becomes a row-level recovery action. Loop continues in every case.

| Trigger | Brain action | Loop continues |
|---|---|---|
| `cursor-dispatch.mjs` exits non-zero with ZERO_COMMIT | Apply edits directly per ERR-049 (read prompt's TASK section, edit files in worktree, commit, merge). Never re-dispatch on ZERO_COMMIT. | yes |
| Scope creep on cursor-agent diff (touches files outside SCOPE) | `git reset --hard main` in worktree, re-dispatch with tighter SCOPE block. Counts toward retry budget on the row. | yes |
| `bun run typecheck` fails post-merge | Read error, identify file + line, fix inline, commit fix, push. Repeat until clean (max 3 within one row). | yes |
| `bun run lint` new warnings | Fix inline. | yes |
| Test failure (`bun run test:run`) | Diagnose, fix code OR fix test fixture, retry. | yes |
| Vercel build ERROR after push | Fetch build logs via `mcp__plugin_vercel-plugin_vercel__get_deployment_build_logs`. Diagnose. Write fix, commit, push. If 2 attempts unclear → `git revert <sha> && git push`, mark row `[!]` with detailed reason, retry on next iteration with Opus. | yes |
| New Sentry issue post-deploy | Fetch issue + stack trace via Sentry API (token from memory `reference_sentry.md`). Write fix, commit, push. If 2 attempts can't fix → revert deploy, mark `[!]`, retry. | yes |
| BEK SQL fails (Supabase MCP) | Read error from MCP response. Modify SQL. Retry. If genuinely incompatible (e.g., column already exists, conflicting constraint) → reconcile by adapting the migration file to current state and re-applying, OR mark row `[!]` only if state is unrecoverable. | yes |
| Destructive git op needed (force push, `branch -D` of unmerged work, `reset --hard` past `kickoffSha`) | DO NOT EXECUTE. Find non-destructive alternative. If genuinely impossible → mark row `[!]` with detailed reason; on next iteration with Opus, brain critiques against vision and either finds another path or rewrites the row. | yes |
| Validator (`slack-devnote.mjs --dry`) rejects items.json (finale) | Read rejection output, address each violation (forbidden jargon → rephrase; under-expansion → split items; missing footer → fix), retry up to 5×. Final fallback: minimize to a single technically-conforming item that passes mechanically. | yes |
| Apparent secret leak in cursor-agent commit | `git revert <sha> && push` immediately. Mark row `[!]` with redacted summary. Append `secret-leak-handled` event. | yes |
| Same row retry ≥ 5 | Force Opus on next attempt (if not already). | yes |
| Same row retry ≥ 10 | Opus + scope-critique mode: brain may rewrite the row's verify clause against the vision if current scope is genuinely impossible. Document the rewrite in the ledger row's `status-note` and append a `decision-deviation` event for morning review. | yes |
| Supervisor itself crashes | Operator reruns `node overnight-loop.mjs`; pre-flight replays event log, recovers orphans, resumes. | yes (after manual rerun) |

The principle: **every recoverable failure becomes a fix-forward or fix-back action, executed by the brain. The loop never returns control to a human until ledger is empty.**

## 12. Vision context block (verbatim, embedded in every brain prompt)

```
PROVODNIK PRODUCT VISION (sole decision authority)

Provodnik is a two-sided marketplace for Russian-speaking travelers and local guides.

- Биржа — traveler posts a custom excursion request → guides bid with prices →
  traveler accepts → trip happens. Two-way price negotiation.
- Готовые туры — guide publishes fixed-price tour → traveler books directly.
  Tripster model.
- Zero commission in both modes.
- Honest product. No fiction, no fake data, no marketing about non-shipped features.
  Unfinished features hide behind feature flags rather than appear available.
- Direct competitor: Tripster. Parity reference at _archive/bek-frozen-2026-05-08/research/tripster/.
- Real verification. UI work isn't done until it's browser-verified at 375px and 1280px
  under the correct role.

Every decision the brain makes during this overnight run cites this vision. When the
recipe fails and the brain has to deviate, the deviation must advance both Биржа and
Готовые туры journeys without fiction. When in genuine doubt, the safest action is to
mark the row [!] with a vision-grounded reason and let the next iteration retry.
The vision never says "halt the loop"; the vision says "find a way that aligns".
```

## 13. Operator manual — full text

File: `_archive/bek-frozen-2026-05-08/sot/overnight-operator-manual.md`. Read by the brain on every iteration entry as Section 0 of its prompt.

```markdown
# Overnight Operator Manual — brain rules for every iteration

You are a single-row executor in a long-running overnight loop. The supervisor
spawned you with `claude --dangerously-skip-permissions` to do exactly ONE thing:
take the row(s) you were assigned, execute the recipe, mark the ledger, exit.

You have no memory of prior iterations beyond what the supervisor injected into
this prompt (last error, retry count, prior failure trace). You will not be asked
to remember anything for the next iteration. Persistence lives in:
- `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md` (the ledger — your I/O surface)
- `_archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json` (read-only for you; supervisor owns it)
- The git history (your work products land here)

## Section 0 — load these files before doing anything

1. `C:\Users\x\.claude\CLAUDE.md` — global orchestrator card v7
2. `D:\dev2\projects\provodnik\.claude\CLAUDE.md` — project rules (cursor-dispatch,
   post-work, slack-devnote wrapper)
3. `_archive/bek-frozen-2026-05-08/sot/HOT.md` — landmines (always grep your diff against these before commit)
4. `_archive/bek-frozen-2026-05-08/sot/INDEX.md` — SOT lookup table; read entries on-demand only
5. The per-TYPE template injected with this prompt — your recipe
6. The ledger row text injected with this prompt — your TASK

You do NOT load any other file unless the recipe explicitly directs you to.

## Section 1 — overnight mode overrides (apply these wherever they conflict
with default behavior in the files above)

| Default rule | Overnight override |
|---|---|
| 3-strike rule → STOP and report | retry indefinitely with escalation; supervisor handles model upgrade and scope critique |
| Phase gate → halt and wait for human ack | gate auto-passes when its CHECK criteria mechanically resolve; you tick it and exit |
| Hard-stops table → STOP entire session | every hard stop becomes a row-level recovery action (see §11 of the design spec injected below) |
| `human:Anzor` deps → block dependents | overridden — find a way to satisfy the dep yourself (run the SQL via Supabase MCP, rewrite the recipe to use a tool you have, etc.) |
| Ask user before destructive git op | NEVER ASK. NEVER EXECUTE a destructive op either. Find a non-destructive alternative (revert vs reset, branch creation vs deletion). If genuinely impossible → mark row `[!]` with reason. |
| Ask user before pushing to main | DO NOT ASK. Pushing to main is the standard ship cycle on this project; pre-authorization at kickoff covers it. |
| Ask user before posting Slack | DO NOT ASK during finale. Run validator first; if it passes, post. |

You do NOT add new override behaviors. The list above is exhaustive. Anything
not listed follows the default rules.

## Section 2 — the ledger is your I/O surface

You read your assigned row(s) from `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md`.
You write your result back to the same file.

Atomic ledger update protocol:
1. Read the entire file.
2. Find your row(s) by exact ID match (`**T001**`, `**T015-GATE**`, etc.).
3. Modify the row in memory:
   - `[ ]` or `[~]` → `[x]` on success (one of `[x]`, `[!]` always; never leave `[~]`)
   - Fill `commit:` with the merged SHA from `git -C provodnik.app log -1 --format=%H` if the row produces a commit, else `no-commit`
   - Fill `evidence:` with one of: command-output one-liner, file path produced, or `—` if not applicable
   - Fill `status-note:` with `DONE @ <UTC ISO>` on success or `BLOCKED @ <UTC ISO> — <reason>` on self-block
4. Write the entire modified file back. Use the Write tool — Claude Code's
   atomic write semantics handle the temp-file-rename for you.
5. Verify by reading the file again that your change is present.

If your assigned row is part of a parallel cluster, update ALL cluster rows
together in ONE Write call.

## Section 3 — your TYPE recipe is the contract

The per-TYPE template injected into this prompt (one of `edit.md`, `migration.md`,
`dispatch.md`, `check.md`, `browser-audit.md`, `decision.md`, `cluster-dispatch.md`)
tells you exactly what steps to run for THIS row's TYPE. The template is your
contract. Do not improvise off-recipe unless a recipe step explicitly says to.

If a recipe step fails, the recipe's "self-healing" subsection tells you what
to try next. Walk that ladder all the way down before giving up.

If you walk the entire self-healing ladder and still cannot proceed, mark the
row `[!]` with a precise `status-note:` line that names exactly what blocked
you, exit 0. The supervisor will retry on the next iteration — possibly with
Opus, possibly with scope-critique mode.

## Section 4 — the vision is the tiebreaker

[VISION BLOCK FROM §12 EMBEDDED HERE VERBATIM]

When two paths through a recipe are equally viable, pick the one that advances
both Биржа and Готовые туры journeys, with no fiction.

When the recipe says "do X but the file looks different than the plan
described", critique against the vision: would advancing X-as-described help
a real user, or would adapting to the actual file shape help more? Pick the
honest path.

## Section 5 — silence is the default

You do not greet the supervisor. You do not summarize at the end. You do not
chat. You do the work, mark the ledger, exit. The supervisor reads the ledger
to know what happened; chat output is wasted tokens.

Print one terminal line on entry: `iter <N> row <T###> model <M> retry <K>`.
Print one line on success: `done T### -> <commit-sha or "no-commit">`.
Print one line on self-block: `blocked T### -> <one-line reason>`.
Everything else goes silent unless an unrecoverable internal error.

## Section 6 — forbidden actions (hard rules; violation = supervisor halts)

You may NEVER:
- Spawn `cursor-agent` directly. Always go through `cursor-dispatch.mjs`.
- Call `chat.postMessage` / `chat.update` directly. Always go through
  `slack-devnote.mjs` or `telegram-devnote.mjs`.
- Run `git push --force`, `git push --force-with-lease`, `git branch -D` of
  an unmerged branch, `git reset --hard` past `kickoffSha`, `git rebase -i`,
  `git filter-branch`. (Recovery uses `git revert <sha>`.)
- Modify `.claude/settings.json` (file is locked; the brain that needs settings
  changes works around it instead of editing).
- Commit a file that contains a string matching a secret pattern (`sk_live_`,
  `whsec_`, `vca_`, `vcp_`, `xoxb-`, GitHub PAT pattern). If cursor-agent
  produces such a commit, immediately `git revert` it.
- Skip git hooks (`--no-verify`, `--no-gpg-sign`).
- Edit `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md` rows other than your own
  assignment. (Audit followup rows are an exception — see `check.md` template.)
- Edit the operator manual or any per-TYPE template during a run. They are
  immutable for the duration of the loop.

If a recipe step would require any of the above, mark `[!]` with reason
"forbidden-action-required: <which one>" and exit. Supervisor escalates.

## Section 7 — when you're done

After your atomic ledger update lands and you've verified the row reads `[x]`
or `[!]`, exit 0. Do not run additional cleanup. Do not read other files.
Do not optimize anything else you happened to notice. Single-purpose, exit.
```

## 14. Per-TYPE prompt templates

Each template is a self-contained prompt block. Supervisor concatenates: operator-manual + this template + row-text + vision + retry-context, then pipes the whole thing as stdin to `claude -p`.

### 14.1 `edit.md` — EDIT row template (Sonnet)

```markdown
# TYPE: EDIT

You are executing one EDIT row. The row's title and verify clause name a
small, mechanical edit to one or more files in this repo. EDITs do not
require cursor-agent — you apply the change directly.

## Recipe

1. Re-read your row's `title`, `file/scope hint`, and `verify:` clause.
2. Open every named file. Read enough context (~50 lines around the
   target) to understand the change.
3. Apply the change exactly as the row describes. If the row references
   the parent plan section (`per plan §PF-1 Step 2`), open the plan at
   `docs/superpowers/plans/2026-05-02-provodnik-launch-readiness-implementation.md`
   and read the named step verbatim.
4. Run the verify command(s) from the row. They must pass.
5. Stage the modified files: `git -C provodnik.app add <files>` (or
   `git add <files>` if the file is outside `provodnik.app/`).
   Stage by exact name; never `git add .` or `git add -A`.
6. Commit with the message format the row specifies (or, if the row
   doesn't specify, use Conventional Commits — `fix(scope): one-line`).
7. Push to origin/main: `git push origin main`.
8. Read git log: `git -C provodnik.app log -1 --format=%H`.
9. Update the ledger row to `[x]` with `commit:` = the SHA, `evidence:` =
   the verify command output (one line), `status-note:` = `DONE @ <UTC>`.
10. Exit 0.

## Verify clause execution

Verify clauses are written as one of:
- `cd provodnik.app && bun run typecheck` — exit 0
- `bun run test:run -- <name>` — 0 failures
- `grep -c "<pattern>" <file>` — returns specified count
- A natural-language assertion ("the wizard renders 8 chips")

For commands: run them. They must succeed.
For natural-language assertions: run a derived command that proves the
assertion (`grep -c "id:" provodnik.app/src/data/interests.ts` for the
wizard chip count). If you cannot derive a command, fall through to the
self-healing ladder.

## Self-healing ladder

If step 3 (apply change) is ambiguous because the file content has drifted
from what the row describes:
- Read the parent plan section in full.
- Read up to 100 lines around the target file's apparent intent area.
- Apply the smallest change that satisfies the verify clause.
- If still ambiguous → mark `[!]` with status-note
  "ambiguous-edit: <which file>, <which line>, <what's unclear>".

If step 4 (verify) fails:
- Read the failure output. Identify the gap.
- If the gap is a missed file or pattern, fix and retry verify.
- If the gap is a deeper issue (typecheck cascade across unrelated files),
  rollback your changes (`git checkout -- <files>`) and mark `[!]` with
  status-note "verify-cascade: <error summary>".

If step 6 (commit) fails because of pre-commit hook:
- Read hook output. Address each error.
- Re-stage, re-commit (a NEW commit, never `--amend` past the first attempt).
- Repeat up to 3 times. If still failing → mark `[!]` with hook output.

If step 7 (push) fails:
- `git fetch origin` and check whether main has advanced.
- If yes: `git pull --rebase origin main`, resolve any non-conflicting
  rebase, push again. If conflicts arise: do NOT auto-resolve. Mark `[!]`.
- If push is rejected for other reasons: mark `[!]` with full error.

## Ledger update — exact format

Replace the row block. Keep all other ledger content untouched.

Before:
- [ ] **T###** [PRE] [EDIT] <title> — <hint> — verify: <how>
  commit: <pending>
  evidence: —
  depends-on: none
  status-note:

After (success):
- [x] **T###** [PRE] [EDIT] <title> — <hint> — verify: <how>
  commit: <SHA>
  evidence: <one-line proof, e.g. "bun run typecheck → 0 errors">
  depends-on: none
  status-note: DONE @ <UTC ISO>

After (self-block):
- [!] **T###** [PRE] [EDIT] <title> — <hint> — verify: <how>
  commit: <pending>
  evidence: —
  depends-on: none
  status-note: BLOCKED @ <UTC ISO> — <reason>
```

### 14.2 `migration.md` — MIGRATION row template (Sonnet)

```markdown
# TYPE: MIGRATION

You are executing one MIGRATION row. This produces ONE commit that
contains:
- A new SQL migration file under `provodnik.app/supabase/migrations/`
- Regenerated TypeScript types at `provodnik.app/src/lib/supabase/types.ts`

You apply the SQL via Supabase MCP plugin (NOT cursor-agent). Project ID:
`yjzpshutgmhxizosbeef`.

## Recipe

1. Read your row's `title`, `file/scope hint`, and `verify:` clause.
2. Read the parent plan section for the row's task (e.g., Plan 50 T1 lives
   at `docs/superpowers/plans/...launch-readiness-implementation.md` §3.1).
3. Write the migration file at the exact path the row names (or the plan
   names). Filename: `YYYYMMDDHHMMSS_<short_slug>.sql`. Date is today UTC.
4. Apply the migration:
   ```
   mcp__plugin_supabase_supabase__apply_migration
     project_id: yjzpshutgmhxizosbeef
     name: <slug>
     query: <full SQL body>
   ```
   If MCP is not authenticated, call
   `mcp__plugin_supabase_supabase__authenticate` first; on success it
   returns a session and you proceed.
5. Verify the migration applied: run the SELECT from the row's `verify:`
   clause via `mcp__plugin_supabase_supabase__execute_sql`. The result
   must match what the row specifies.
6. Regenerate TypeScript types:
   ```
   cd provodnik.app && bun run db:types
   ```
   (If the script name differs, read `package.json` `scripts` to find the
   correct one. Common names: `db:types`, `gen:types`, `supabase:types`.)
7. Verify types updated: grep the regenerated file for the new column or
   table reference.
8. Stage both files: `git -C provodnik.app add supabase/migrations/<file> src/lib/supabase/types.ts`.
9. Commit with the message in the parent plan. Push.
10. Update ledger row to `[x]` with `commit:` = SHA, `evidence:` = the
    SELECT result snippet (e.g., `specializations | ARRAY | '{}' | NO`).
11. Exit 0.

## Self-healing

If step 4 returns an error like `column already exists`:
- Run the verify SELECT (step 5). If state matches what the migration would
  produce, treat as already-applied: skip step 4, continue from step 6.
- If state is partial (column exists but constraint missing), run only the
  missing pieces of the SQL via `execute_sql` and proceed.

If step 4 returns a syntax error:
- Read the error. Fix the SQL. Retry. Up to 3 attempts.
- If still failing after 3, mark `[!]` with full SQL + error.

If step 6 fails (script missing or fails):
- Look in `package.json` for any types-related script. If none exists, the
  type regeneration is not part of this project's flow — proceed without
  it (note in evidence: "no db:types script; types not regenerated").
- If a script exists but fails, mark `[!]` with output.

If step 7 (verify types) fails because regen didn't pick up the column:
- Re-run the regen.
- If still missing, mark `[!]` with diagnosis.

## Ledger update — exact format

Same shape as EDIT, with TYPE = MIGRATION and evidence containing the
verify SELECT result.
```

### 14.3 `dispatch.md` — DISPATCH row template (Opus)

```markdown
# TYPE: DISPATCH

You are executing one DISPATCH row — a non-trivial code change that goes
through cursor-agent (the blind junior coder) via `cursor-dispatch.mjs`.

This is the highest-judgment row type. You compose a fresh, self-contained
prompt for cursor-agent from `_archive/bek-frozen-2026-05-08/prompts/skeleton.md` (the orchestrator
composes by hand — no builder script). You dispatch. You verify. You
merge.

## Recipe

1. Read your row's `title`, `file/scope hint`, branch name, and `verify:`
   clause.
2. Read the parent plan section in full (the row points at it).
3. Read the existing brief at `_archive/bek-frozen-2026-05-08/prompts/out/<task>.md` if one exists
   (the row will reference it). Otherwise compose from skeleton.
4. Read every file in scope to understand what cursor-agent will edit.
   Capture exact patterns it must follow (existing component shapes, types,
   import paths, naming conventions).
5. Look up relevant SOT IDs from `_archive/bek-frozen-2026-05-08/sot/INDEX.md`. Pull HOT.md entries
   verbatim into the KNOWLEDGE section.
6. Compose the final prompt at `_archive/bek-frozen-2026-05-08/prompts/out/<task>-overnight-iter<N>.md`
   (use iteration suffix so multiple retries don't overwrite each other).
   The prompt MUST be self-contained — cursor-agent has zero MCP, zero
   memory, zero discovery. Inline every file path, every code excerpt,
   every API signature.
7. Token budget check: if your composed prompt exceeds 8000 tokens, split
   into smaller scope. (Approximate: 1 token ≈ 4 chars; 8000 tokens ≈ 32 KB.)
8. Create the worktree (the row names the path):
   ```
   git worktree add D:/dev2/worktrees/<name> -b <branch>
   ```
   If the worktree path already exists from a prior failed iteration:
   `git worktree remove --force D:/dev2/worktrees/<name>`, then create.
9. Dispatch via the wrapper. Use the Bash tool (PowerShell-compatible
   command):
   ```
   node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
     D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/<task>-overnight-iter<N>.md \
     --workspace "D:\\dev2\\worktrees\\<name>\\provodnik.app" \
     --timeout 900
   ```
   The wrapper streams `[init] → [tool_call] → [assistant] → [result]`
   events. Wait for it to exit. Read the dispatch log at
   `_archive/bek-frozen-2026-05-08/logs/cursor-dispatch-*.log` (latest).
10. Verify cursor-agent committed:
    ```
    git -C D:/dev2/worktrees/<name> log main..HEAD --oneline
    ```
    Must show ≥1 commit. If 0 → ZERO_COMMIT path (see self-healing).
11. Verify scope:
    ```
    git -C D:/dev2/worktrees/<name> diff main..HEAD --name-only
    ```
    Every file must appear in your prompt's SCOPE list. Out-of-scope =
    scope creep (see self-healing).
12. Verify quality gates IN THE WORKTREE:
    - `cd D:/dev2/worktrees/<name>/provodnik.app && bun run typecheck`
    - `cd D:/dev2/worktrees/<name>/provodnik.app && bun run lint -- <scoped-files>`
    - `cd D:/dev2/worktrees/<name>/provodnik.app && bun run test:run` if
       tests touched
    All must pass.
13. HOT.md grep on the diff:
    ```
    git -C D:/dev2/worktrees/<name> diff main..HEAD | grep -E "todayLocalISODate|\\* 100|\\/ 100|signUp\\(|signOut\\(\\)"
    ```
    Must return 0 hits (those are landmines from HOT.md).
14. Browser audit if the row's `verify:` clause names a route. Use
    chrome-devtools-mcp:
    - `new_page` → preview Vercel URL for the branch (or production URL if
       not yet merged) → `resize_page` to 1280×800 then 375×667.
    - `take_snapshot`, `take_screenshot`, `list_console_messages`.
    - Confirm every observable claim in the verify clause.
    - If preview deploy hasn't built yet, wait up to 5 minutes
       (poll `mcp__plugin_vercel-plugin_vercel__list_deployments`).
15. Merge to main, fast-forward only:
    ```
    git checkout main
    git -C provodnik.app merge --ff-only <branch>
    git -C provodnik.app push origin main
    ```
    If FF-only fails (main has advanced): `git fetch origin`, then
    `git rebase origin/main` IN THE WORKTREE, push, retry merge. Never
    force.
16. Post-deploy check (Vercel build + Sentry):
    - `mcp__plugin_vercel-plugin_vercel__list_deployments` → latest must
       become `READY` (poll up to 10 minutes).
    - Sentry: any new issue since `kickoffSha`? Use Sentry API.
17. Cleanup:
    ```
    git worktree remove D:/dev2/worktrees/<name>
    git branch -d <branch>
    ```
18. Update ledger row `[x]` with `commit:` = `git log -1 --format=%H` on
    main, `evidence:` = "preview verified at <url> + Vercel READY", exit 0.

## Self-healing — DISPATCH-specific ladders

ZERO_COMMIT (cursor-agent claimed DONE but didn't commit):
- Read the dispatch log to see if cursor-agent edited the main workspace
  by mistake (ERR-054). If so:
  `git -C provodnik.app status --short` — if expected diff is there, copy
  files into the worktree, commit there, then `git checkout -- <files>`
  in main to clean up.
- Otherwise, apply the edits directly per ERR-049 (read your prompt's
  TASK section, do the edits yourself in the worktree, commit, proceed).
- NEVER re-dispatch on ZERO_COMMIT.

Scope creep (out-of-scope file modified):
- `git -C <worktree> reset --hard main` (this is destructive but bounded
  to the worktree, not main, and the kickoffSha is unaffected — allowed).
- Re-compose prompt with TIGHTER SCOPE block: list ONLY the in-scope
  files; add a "DO NOT EDIT" list naming the file(s) the agent strayed to.
- Re-dispatch. Counts toward retry budget.

Typecheck / lint / test failure in worktree:
- Diagnose. If small (a missing import, a type cast), fix inline in the
  worktree, commit fix, proceed.
- If structural (missed a refactor in another file), apply the fix
  directly. Commit. Proceed. (You are no longer dispatching to cursor-
  agent for the fix; you do it.)

Browser audit reveals visual regression:
- Apply the smallest possible fix in the worktree, commit, proceed.
- If the regression is in a file outside SCOPE → revert the entire branch
  (`git reset --hard main` in worktree), re-dispatch with broader SCOPE.

Vercel build ERROR after push:
- Read build logs via Vercel MCP. Diagnose. Fix inline on main, commit,
  push. Repeat up to 2 attempts.
- If 2 attempts unclear → `git revert <sha> && push`, mark row `[!]` with
  full Vercel build log summary.

New Sentry issue:
- Read issue + stack trace. Fix inline on main, commit, push. Repeat up
  to 2 attempts.
- Same fallback as Vercel: revert + `[!]`.

Same row retry ≥ 5 (escalation already to Opus): you have full vision
context. Critique the row's verify clause:
- Is it impossible because the file shape changed since plan was written?
  Adapt the recipe (don't change the verify clause unless retry ≥ 10).
- Is it impossible because the dependency it assumes (a column, a route)
  doesn't exist? Walk dependency graph backwards — was a prior row
  supposed to create it but actually didn't?

Same row retry ≥ 10: scope-critique mode. You may rewrite the row's
`verify:` clause IF AND ONLY IF the rewrite advances both Биржа and
Готовые туры and is grounded in the vision. Document the rewrite in
`status-note: SCOPE-REWRITE @ <UTC> — <old verify> → <new verify> · why:
<reason>`. Then proceed with the new verify clause.

## Ledger update — exact format

Same shape as EDIT, with TYPE = DISPATCH and evidence including preview
URL + Vercel build status.
```

### 14.4 `check.md` — CHECK row template (Sonnet)

```markdown
# TYPE: CHECK

You are executing one CHECK row. CHECKs verify state without producing
commits. They never modify code. They produce ledger updates only.

## Recipe

1. Read your row's `title` and `verify:` clause.
2. Run the verify command(s) exactly as written.
3. Compare output to the expected result in the verify clause.
4. If pass: update ledger `[x]` with `commit: no-commit`, `evidence:` =
   one-line of command output.
5. If fail: this is the row's purpose — flag the gap. CHECK rows that
   represent phase gates (`-GATE`) auto-pass when criteria mechanically
   hold; if a gate criterion fails, mark `[!]` with the failing
   sub-criterion named, supervisor escalates and may force a fix-row.
6. CHECK rows that are followups (e.g., `T026`, `T028` — audit followups)
   work differently: see "Audit followup" subsection below.
7. Exit 0.

## Audit followup CHECK rows (e.g., T026, T028, T030, T032, T034)

These rows have body text like "review findings file, append per-finding
rows below this line as EDIT/DISPATCH". They MUTATE the ledger by adding
new rows.

Recipe for followup CHECKs:
1. Read the corresponding findings file (e.g., `_archive/bek-frozen-2026-05-08/sot/findings-plan-44.md`).
2. For each P0 or P1 finding:
   - Synthesize a new row of TYPE EDIT or DISPATCH.
   - Allocate a new ID: scan the ledger for the highest current `T###`
     and increment. Use suffix `.X` if needed to avoid renumbering
     (e.g., `T044.1`, `T044.2`, ...). Keep contiguous within the suffix.
   - Insert the new row(s) into the ledger immediately AFTER your CHECK
     row, before the next phase row. Each new row needs all four metadata
     fields (commit/evidence/depends-on/status-note) populated.
   - Set new row `depends-on: T<this-followup-id>`.
3. For P2 findings: append to `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md` as a deferred-with-reason
   block.
4. Mark this followup row `[x]` with `evidence:` = "appended N new rows:
   T<id>, T<id>, ..., to ledger".
5. Exit 0. The supervisor's next iteration will pick the new rows.

## Phase gate CHECK rows (e.g., T008-GATE, T015-GATE, ...)

Recipe:
1. Read the gate's `verify:` clause — it lists multiple criteria.
2. Run each criterion mechanically:
   - "all P1 commits FF-merged to main" → `git log <kickoffSha>..main --oneline | grep <P1-marker>`
   - "Vercel build status READY" → `mcp__plugin_vercel-plugin_vercel__list_deployments`, latest production must be READY
   - "Sentry shows zero new unresolved issues" → Sentry API since `kickoffSha`
   - "sweep tracker rows N marked compliant" → `grep -c "compliant.*2026-05-02" _archive/bek-frozen-2026-05-08/checklists/codex-protuberanets-sweep.md`
3. ALL criteria pass → mark `[x]`, evidence = "all <N> gate criteria
   passed".
4. ANY criterion fails → mark `[!]` with `status-note: GATE-FAIL <criterion>
   — <details>`. Supervisor escalates: forces an Opus iteration that
   walks back to identify which earlier row's "completion" was actually
   incomplete, may rewrite that row's status from `[x]` to `[ ]` to retry,
   or may insert a new fix-row before the gate.

## Self-healing

If a verify command fails to execute (tool unavailable, file missing):
- The CHECK is genuinely uncheckable. Mark `[!]` with reason; supervisor
  retries with Opus which may have access to a different tool path.

## Ledger update — exact format

Same shape as EDIT but with `commit: no-commit`. For audit followups, also
mention the appended rows in evidence.
```

### 14.5 `browser-audit.md` — BROWSER-AUDIT row template (Sonnet)

```markdown
# TYPE: BROWSER-AUDIT

You are executing one BROWSER-AUDIT row. The output is a findings file
under `_archive/bek-frozen-2026-05-08/sot/findings-*.md`. No code commit (unless fixes are bundled
in the row's body, which they are NOT in this ledger).

## Recipe

1. Read your row's `title` and `verify:` clause to find the output path
   (`_archive/bek-frozen-2026-05-08/sot/findings-<slug>.md`) and the route inventory.
2. If the route inventory is "discover via find":
   ```
   find provodnik.app/src/app -name page.tsx
   ```
   Filter per the row's scope description.
3. Login if needed: navigate to `/sign-in`, fill the credentials specified
   in the row (per `reference_provodnik_test_credentials.md` in memory).
4. For each route × each viewport:
   ```
   mcp__plugin_chrome-devtools-mcp__resize_page (width, height)
   mcp__plugin_chrome-devtools-mcp__navigate_page (url)
   mcp__plugin_chrome-devtools-mcp__take_snapshot
   mcp__plugin_chrome-devtools-mcp__take_screenshot
   mcp__plugin_chrome-devtools-mcp__list_console_messages
   ```
5. Inspect each snapshot for:
   - Visual breakage (overlapping elements, broken layout)
   - Fake data / fictional content (per vision: "honest product, no fiction")
   - Broken empty states
   - Console errors (filter from list_console_messages)
   - Accessibility / responsive issues
6. Write findings to the output path. Format per the row body's spec
   (typically: header with totals + severity breakdown, then per-finding
   blocks with route, viewport, screenshot path, severity, description).
7. Severity assignment:
   - P0 = breaks core flow (login, request submission, payment)
   - P1 = visible regression on a major route at default viewport
   - P2 = cosmetic, off-route, or only-on-edge-viewport
8. At the top of the findings file, write a "Closed" status block once
   you've covered all routes × viewports:
   ```
   Status: closed
   Audited: <ISO date>
   Routes: <count>
   Findings: <total> (P0: N, P1: N, P2: N)
   Top by priority: <ID list>
   ```
9. Update ledger row `[x]` with `commit: no-commit`, `evidence:` =
   "<findings-file> with N findings (P0: x, P1: y, P2: z)".
10. Exit 0.

## chrome-devtools-mcp availability fallback

If `mcp__plugin_chrome-devtools-mcp__*` tools are not available in this
session (e.g., T024 hasn't successfully unlocked them):
- Use the project's `webapp-testing` skill (Playwright-based) instead.
- If neither is available, use the Bash tool to script Chromium directly:
  - `npx playwright codegen <url>` to capture; or
  - Curl the route, parse HTML for obvious breakage signals.
- The user's vision is "do not stop". Find a way.

## Self-healing

If a route returns 500 or non-200:
- Log the failure as a P0 finding ("route 500 — server error: <message>").
- Continue with remaining routes. Do not abort the audit.

If login fails:
- Try the alternate credentials from memory.
- If both fail, log as P0 ("auth gate broken") and audit anonymous routes
  only. Mark the rest as `not-audited (auth-blocked)` in findings.

If a screenshot capture fails:
- Take a snapshot only (no screenshot). Note in findings.

## Ledger update — exact format

Same shape as CHECK with `commit: no-commit`.
```

### 14.6 `decision.md` — DECISION row template (Sonnet)

```markdown
# TYPE: DECISION

You are executing one DECISION row. The action is to append one ADR block
to `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md` and commit.

## Recipe

1. Read your row's `title` and `verify:` clause. The verify names the ADR
   block content (often via plan section reference).
2. Read the parent plan section (e.g., "Decision register entry 1" of the
   parent plan).
3. Read `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md` to find the highest existing ADR number.
   Use `<that + 1>` for this entry.
4. Append the ADR block to the bottom of `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md`. Format:
   ```
   ## ADR-NNN — <title> (<UTC date>)

   Status: deferred-with-trigger | adopted | superseded
   Context: <one paragraph>
   Trigger to revisit: <condition>
   Decision frame at trigger:
   - <option 1>
   - <option 2>
   - <option 3>
   ```
5. Update `_archive/bek-frozen-2026-05-08/sot/INDEX.md` with one line: `- ADR-NNN — <title> — <date>`.
6. Stage and commit: `git -C <repo-root> add _archive/bek-frozen-2026-05-08/sot/DECISIONS.md
   _archive/bek-frozen-2026-05-08/sot/INDEX.md && git commit -m "<row's commit message>"`. Push.
7. Update ledger row `[x]` with `commit:` = SHA, `evidence:` = "ADR-NNN
   appended".
8. Exit 0.

## Self-healing

If commit fails:
- Diagnose hook output. Fix. Retry NEW commit.

If you discover an existing ADR with the same title:
- The decision was already recorded. Update its date if older. Mark this
  ledger row `[x]` with evidence "duplicate-detected: ADR-NNN already
  exists, refreshed timestamp".

## Ledger update — exact format

Same shape as EDIT.
```

### 14.7 `cluster-dispatch.md` — Parallel cluster template (Opus)

```markdown
# TYPE: PARALLEL CLUSTER (multiple DISPATCH rows in one Opus invocation)

You are executing N DISPATCH rows IN PARALLEL. The supervisor pre-claimed
all N rows; your job is to spawn N native Agent subagents in ONE batched
message, each owning one worktree + one cursor-dispatch invocation, then
reconcile all N rows after all Agents report.

The cluster is one of:
- {T011, T012, T013, T014} — Phase 2 four parallel polish dispatches
- {T017, T018} — Phase 3 cabinet editor + inbox sort

## Recipe

1. Read each row's full body. Extract: branch, worktree path, prompt-file
   path, files in scope, verify clause.
2. For each row, compose its cursor-agent prompt the same way the
   single-row DISPATCH template does (read parent plan, pull existing
   brief at `_archive/bek-frozen-2026-05-08/prompts/out/<task>.md`, fill skeleton, save to
   `_archive/bek-frozen-2026-05-08/prompts/out/<task>-overnight-iter<N>.md`).
3. Create all N worktrees (sequentially — git worktree creation must be
   serial):
   ```
   git worktree add D:/dev2/worktrees/<name1> -b <branch1>
   git worktree add D:/dev2/worktrees/<name2> -b <branch2>
   ...
   ```
4. Spawn N native Agent subagents in ONE batched message via the Agent
   tool, with `run_in_background: true`. Each Agent's brief:
   ```
   You are dispatching cursor-agent for one task in a parallel cluster.

   Worktree:    <absolute path>
   Branch:      <branch>
   Prompt file: <absolute path>

   Run via Bash:
     node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
       <prompt-file> \
       --workspace "<worktree>\\provodnik.app" \
       --timeout 900

   Tail via Monitor. Report DONE only when wrapper exits 0 AND the [result]
   event shows success. Before reporting DONE, run inside the worktree:
     git -C <worktree> log main..HEAD --oneline
   Must show ≥1 commit. If 0, report ZERO_COMMIT — orchestrator handles.
   ```
5. Wait for all N Agents to complete (they run in background; you'll be
   notified).
6. For each Agent that returned DONE: run the same verification ladder as
   `dispatch.md` step 10–17 (commit existence, scope check, quality gates,
   HOT.md grep, browser audit, merge).
7. For each Agent that returned ZERO_COMMIT: apply the cluster row's edits
   directly per ERR-049, then run verification.
8. Merge each branch to main FF-only, sequentially (concurrent merges
   would race on origin/main).
9. Post-deploy check: latest Vercel deploy READY, no new Sentry.
10. Cleanup all worktrees + branches.
11. Update ALL N ledger rows in ONE atomic Write call to `[x]`.
12. Exit 0.

## Partial-success handling

If some Agents returned DONE and merged, but one or more failed:
- Mark the merged ones `[x]` (their commits already landed).
- Mark the failed ones still `[~]` (do not flip back to `[ ]` — the
  supervisor will see this and revert to `[ ]` itself).
- Exit 0 with a stdout line: `partial-cluster T### x of N done; T### still [~]`.
- The supervisor will retry the failed rows as SOLO rows (no longer
  treats them as a cluster).

## Self-healing

Agent never reports back (timeout, crash):
- After 1800 s wall clock from spawn, mark that row's status as
  unfinished. Proceed with the rest.

Two Agents both try to merge to main and one's FF fails:
- That's expected (they raced). Rebase the loser onto main, push, retry
  merge for the loser. Sequential merge inside reconciliation handles
  this naturally.

## Ledger update

Same shape as DISPATCH but writes N rows in one atomic Write call.
```

## 15. Finale prompt — full text

File: `_archive/bek-frozen-2026-05-08/prompts/overnight-finale.md`. Invoked once when ledger has zero `[ ]` and zero `[~]` rows. Opus model.

```markdown
# OVERNIGHT FINALE

The ledger is fully ticked. Your job is to ship the post-work chain,
post Slack + Telegram, update the SOT, archive the session, save memory,
and print the morning summary.

## Recipe

1. Verify ledger state: read `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md`. Confirm
   zero `[ ]` and zero `[~]` rows. (`[!]` rows may exist — log them in the
   morning summary as "needs review" but do not block the finale.)

2. Compute commits landed:
   ```
   git -C provodnik.app log <kickoffSha>..HEAD --oneline
   ```
   Save count and list.

3. Read `_archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json`. Save: total
   iterations, retry stats, blockedRows.

4. Read every findings file produced during the run:
   - `_archive/bek-frozen-2026-05-08/sot/findings-plan-44.md`
   - `_archive/bek-frozen-2026-05-08/sot/findings-pppd-c.md`
   - `_archive/bek-frozen-2026-05-08/sot/findings-pppd-e.md`
   - `_archive/bek-frozen-2026-05-08/sot/findings-pppd-a-residual.md`
   - `_archive/bek-frozen-2026-05-08/sot/findings-pppd-fgh.md`
   - `_archive/bek-frozen-2026-05-08/sot/findings-phase-5-{guest,traveler,guide}.md`
   Save total findings count and severity breakdown.

5. Compose `items.json` per the schema in
   `D:\dev2\projects\provodnik\.claude\CLAUDE.md` § "Update Slack dev-notes":
   - `theme`: a plain Russian topic ("Готовность к запуску — закрыли поляну").
   - `items`: 12–20 entries, expanded per the rule (every distinct effect
     = one item). Cover the new feature (specializations matching), the
     `/guides` filter UX, the homepage discovery polish, the how-it-works
     copy, the guide profile cleanup, the test-suite green, the migration
     + types regen, the CSV proposal, every browser audit cycle and its
     fix bundle, every ADR appended.
   - `capabilities`: 3–5 plain Russian sentences about new user journeys.
     Examples (calibrated to this run):
     - "Гид указывает темы своих экскурсий и видит сверху ленты те запросы, которые попадают в его специализацию."
     - "Путешественник на странице гидов фильтрует поиск по интересам — история, гастрономия, природа, фото."
     - "Запросы без интересов больше не теряются: гиды без специализации видят их в обычной хронологии."
   - `hours_override`: estimate from commit count + complexity. For a 21+
     commit run that closes the matching system + audit cycles + final
     walkthrough, expect 60–90 hours of work disclosed. Do not shrink.

6. Run validator:
   ```
   node D:/dev2/projects/provodnik/.claude/logs/slack-devnote.mjs items.json --dry
   ```

7. If validator passes: drop `--dry`, post:
   ```
   node D:/dev2/projects/provodnik/.claude/logs/slack-devnote.mjs items.json
   ```
   Capture the returned `slack_ts` and save to state.

8. If validator fails: read the rejection. Address each violation
   (forbidden jargon, under-expansion, missing footer). Retry up to 5×.
   Final fallback: a one-line items.json with theme="готовность к запуску"
   and one item="закрыли цикл готовности; смотри коммиты в main".

9. Telegram:
   ```
   node D:/dev2/projects/provodnik/.claude/logs/telegram-devnote.mjs items.json
   ```
   Always posts fresh. Failures here are non-fatal — log and continue.

10. Update SOT:
    - `METRICS.md` — append metrics for this run (commits, hours, retry
      counts, findings closed).
    - `ERRORS.md` — every retry that hit a hard-stop got an event log
      entry; promote any new error category to an ERR-NNN entry.
    - `ANTI_PATTERNS.md` — promote any newly-discovered landmine.
    - `DECISIONS.md` — confirm all four ADRs from this run (T041–T044)
      are present.
    - `NEXT_PLAN.md` — close current plan with STATUS block "launch-
      readiness-2026-05-02 — shipped overnight — <commits-count> commits".
    - `INDEX.md` — one-line entries for new IDs.
    - `HOT.md` — promote any landmine that recurred ≥2 times during this run.

11. Save memory under
    `C:\Users\x\.claude\projects\D--dev2-projects-provodnik\memory\`:
    - `project_overnight_loop_first_run.md` — what worked, what didn't,
      retry count distribution.
    - `feedback_overnight_mode.md` — any user-feedback-relevant patterns.
    - Update `MEMORY.md` index.

12. Archive session:
    ```
    mv _archive/bek-frozen-2026-05-08/sessions/active/conversation.md _archive/bek-frozen-2026-05-08/sessions/archive/2026-05-02-overnight-launch-readiness/
    mv _archive/bek-frozen-2026-05-08/sessions/active/session.json _archive/bek-frozen-2026-05-08/sessions/archive/2026-05-02-overnight-launch-readiness/
    cp .claude/logs/overnight-events.jsonl _archive/bek-frozen-2026-05-08/sessions/archive/2026-05-02-overnight-launch-readiness/
    cp _archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json _archive/bek-frozen-2026-05-08/sessions/archive/2026-05-02-overnight-launch-readiness/
    ```
    Reset active by writing fresh empty conversation.md and session.json.

13. Print morning summary to stdout (Russian, plain register, no skill
    names or file paths):
    ```
    Готовность v1 — закрыли поляну за ночь.

    Что теперь работает:
    • <user-facing outcome 1>
    • <user-facing outcome 2>
    • <user-facing outcome 3>
    • <user-facing outcome 4>

    Коммиты: <N> в main · Vercel: READY · Sentry: чисто (или N новых — список)
    Slack: <permalink>   Telegram: отправлен
    Время в работе: <hours>ч  · Итераций цикла: <N>

    Не закрыли (нужно посмотреть утром): <list of [!] rows or "ничего">

    Следующий шаг: запуск.
    ```

14. Append `finale_end` event to event log, then `loop_end` event with
    full stats. Exit 0.

## Self-healing

If items.json validator persistently rejects (5 attempts):
- Use the one-line minimal items.json fallback.
- Log full validator output to event log so morning operator can
  diagnose.

If Slack post fails (network, auth):
- Save items.json to disk for manual retry. Skip but log.

If Telegram post fails: skip but log.

If SOT update conflicts (file changed since the run started — unlikely
since you're the only writer):
- Read fresh, merge your changes, write. Never overwrite without merge.

If memory write fails: log, continue. Memory is best-effort.

If archive fails (target directory exists): use a suffix `-2026-05-02-2`.

## Forbidden in finale

- Direct `chat.postMessage` / `chat.update` / curl. Always wrappers.
- Skip SOT update before Slack. Wrappers depend on SOT being current.
- `git push --force` of any kind. Finale is read-only on git from this
  point.
- Modify the ledger. Finale only reads it.
```

## 16. Smoke test plan (run before kicking off the real overnight)

1. **Pre-flight only:**
   ```
   node .claude/logs/overnight-loop.mjs --preflight-only
   ```
   Runs §6.1, exits 0 with summary printed. No claims, no spawns. Verifies
   environment is clean.

2. **One-row test:**
   ```
   node .claude/logs/overnight-loop.mjs --max-rows=1
   ```
   Should claim T001 (PRE EDIT, lowest deps), spawn Sonnet brain with
   `edit.md` template, brain executes `interests.ts` cleanup, supervisor
   reconciles `[x]`, exits.

3. **Crash recovery test:**
   - Kill the supervisor process mid-iteration (`Ctrl+C` after `claim`,
     before `complete`).
   - Verify ledger has `[~]` for the in-flight row.
   - Rerun supervisor. Pre-flight should detect orphan, revert to `[ ]`,
     log `recovery` event, resume.

4. **Cluster test:** with T009 + T010 ticked manually, run
   `--max-rows=4`. Supervisor should detect T011–T014 as a cluster, spawn
   one Opus brain with `cluster-dispatch.md`, brain spawns 4 native
   Agents in parallel, all four merge to main.

5. **Failure escalation test:** temporarily corrupt the verify command in
   T002's row (point to a non-existent file). Run loop. Expect:
   retry 1 (Sonnet) → revert. retry 2 (Sonnet) → revert. retry 3 (Opus)
   → revert. retry 5 (Opus + escalation header). retry 10 (scope-critique
   mode) → row gets rewritten or marked `[!]` per recipe. Loop continues.

6. **Finale dry-run:** with all rows `[x]`, run loop. Should detect empty
   pending, invoke finale. Validate items.json composes correctly,
   `--dry` validator passes, no actual Slack post (use `--no-post` flag
   to skip wrappers in smoke mode).

After all six smoke tests pass: full overnight kickoff with no flags.

## 17. Out of scope

- Multi-night state continuity (one ledger = one run; resume across reboots
  is via pre-flight replay only).
- Real-time progress UI; observability is the event log + tail.
- Multi-machine parallelism.
- Token / cost tracking (Max sub + cursor-agent unlimited).
- Generalizing the supervisor to other ledgers (different TYPE schemas
  out of scope).
- Replacing `/auto-session` (this is additive — kept for plan-N runs).
- Slack / Telegram threading optimizations beyond what `slack-devnote.mjs`
  already supports (sidecar same-day merge, `--add-hours`, etc.).

## 18. Anti-pattern scan (self-review)

| Anti-pattern | Mitigation in this design |
|---|---|
| Brain reads stale CLAUDE.md | Operator manual §0 forces re-read on every entry |
| Brain improvises off-recipe | Per-TYPE templates are exhaustive; deviations only via explicit self-healing subsections |
| Loop halts on shared-state writes | §11 hard-stop reconciliation; pre-authorization extends to entire run |
| Double-claim race | Single supervisor process; atomic temp-file-rename writes; `currentClaim` field in state |
| Infinite retry on impossible row | Retry ≥ 10 enables scope-critique mode; row may be rewritten with vision-grounded justification |
| Silent prompt drift | Templates committed to git; brain logs `templateVersion` in claim event |
| Cluster races on merge | Merge step is sequential inside the cluster brain; retry with rebase if FF fails |
| Findings files not committed | Audit followups (`-followup` rows) commit findings + appended fix-rows together |
| Memory bloat in long brain prompt | Retry context capped: include last 3 errors, not full history |
| Vision drift | Vision block embedded verbatim in every brain prompt; not summarized, not paraphrased |

## 19. Open questions for the operator before kickoff

None for design. All architectural questions resolved during brainstorming.

Operational questions to confirm before the first real overnight run:
- Is `claude` CLI on PATH and authenticated? (`claude --version` should work.)
- Is the cursor-agent installation at `AppData/Local/cursor-agent/versions/` current?
- Is `git -C provodnik.app status` clean?
- Are the Supabase MCP, Vercel MCP, Sentry token, chrome-devtools-mcp all
  accessible from a fresh `claude --dangerously-skip-permissions` session?
  (Smoke test #1 covers the last one.)
- Are the test credentials in memory still valid?
  (`guide@provodnik.app/SeedPass1!`, `traveler@provodnik.app/Demo1234!`.)

If all yes → smoke tests → kickoff.
