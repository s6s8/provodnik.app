# Overnight Autonomous Ledger Loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Per CLAUDE.md §7 intercept:** "dispatch implementer subagent" steps go via `cursor-dispatch.mjs`, not via Task tool.

**Goal:** Build the supervisor + brain prompts so `node .claude/logs/overnight-loop.mjs` runs the 44-row launch-readiness ledger end-to-end overnight, hands-off, with crash recovery.

**Architecture:** Node 24 parent supervisor (`.mjs`) with durable JSONL event log spawns per-iteration `claude --dangerously-skip-permissions` child processes. Each child reads the operator manual + a per-TYPE template + its assigned ledger row and executes one row to completion. Library modules in `.claude/lib/overnight/` are unit-tested with `node:test`.

**Tech Stack:** Node 24 LTS, ES modules (`.mjs`), `node:test` built-in runner, existing `claude` CLI on PATH, existing `.claude/logs/cursor-dispatch.mjs`, `.claude/logs/slack-devnote.mjs`, `.claude/logs/telegram-devnote.mjs`.

---

## Source-of-truth pointers

| Artifact | Location |
|---|---|
| Design spec (parent) | `docs/superpowers/specs/2026-05-02-overnight-loop-design.md` |
| Target ledger | `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md` |
| Existing dispatch wrapper | `.claude/logs/cursor-dispatch.mjs` |
| Existing Slack wrapper | `.claude/logs/slack-devnote.mjs` |
| Existing Telegram wrapper | `.claude/logs/telegram-devnote.mjs` |
| HOT landmines | `_archive/bek-frozen-2026-05-08/sot/HOT.md` |
| Project rules | `.claude/CLAUDE.md` |
| Orchestrator card v7 | `~/.claude/CLAUDE.md` |

---

## File structure

```
.claude/
├── logs/
│   ├── overnight-loop.mjs           ← Phase 3 entry point (~150 lines)
│   ├── overnight-events.jsonl       ← runtime, supervisor creates
│   └── cursor-dispatch.mjs          ← existing, unchanged
├── lib/
│   └── overnight/
│       ├── ledger.mjs               ← parse, pick, claim, reconcile, atomic write
│       ├── state.mjs                ← retry counters, last errors, kickoffSha
│       ├── events.mjs               ← append-only JSONL log with fsync
│       ├── cluster.mjs              ← parallel cluster detection
│       ├── prompt.mjs               ← compose brain prompt from manual + template + row
│       ├── spawn.mjs                ← spawn claude -p, capture exit, timeout
│       ├── models.mjs               ← model selection per TYPE × retry count
│       ├── preflight.mjs            ← preflight checks + event-log replay recovery
│       ├── ledger.test.mjs
│       ├── state.test.mjs
│       ├── events.test.mjs
│       ├── cluster.test.mjs
│       ├── prompt.test.mjs
│       ├── models.test.mjs
│       └── preflight.test.mjs
└── ...

_archive/bek-frozen-2026-05-08/
├── sot/
│   └── overnight-operator-manual.md  ← Phase 1 static content
├── prompts/
│   ├── overnight-types/
│   │   ├── edit.md                   ← Phase 1
│   │   ├── migration.md              ← Phase 1
│   │   ├── dispatch.md               ← Phase 1
│   │   ├── check.md                  ← Phase 1
│   │   ├── browser-audit.md          ← Phase 1
│   │   ├── decision.md               ← Phase 1
│   │   └── cluster-dispatch.md       ← Phase 1
│   └── overnight-finale.md           ← Phase 1
├── sessions/active/
│   └── overnight-state.json          ← runtime, supervisor creates
└── sot/
    └── launch-readiness-tasks.md     ← target ledger, unchanged
```

Module responsibilities (one job per file, all under 250 lines):

| File | Exports | Depends on |
|---|---|---|
| `ledger.mjs` | `parseLedger`, `pickNextReady`, `claimAtomic`, `reconcileRow`, `revertClaim`, `findOrphans` | `node:fs/promises`, `node:os` |
| `state.mjs` | `loadState`, `saveState`, `incrementRetry`, `recordLastError`, `markCompleted` | `node:fs/promises` |
| `events.mjs` | `appendEvent`, `replayEvents`, `tailEvents` | `node:fs/promises` |
| `cluster.mjs` | `detectParallelCluster` | (pure) |
| `prompt.mjs` | `composePrompt`, `loadTemplate`, `loadOperatorManual` | `node:fs/promises` |
| `spawn.mjs` | `spawnBrain`, `withTimeout` | `node:child_process` |
| `models.mjs` | `pickModel`, `pickTimeout` | (pure) |
| `preflight.mjs` | `runPreflight`, `replayAndRecover` | all of above |

---

## Pre-flight (apply before Phase 1 dispatches)

### PF-1: Verify the spec is committed

- [ ] **Step 1: Confirm spec file exists**

```
test -f docs/superpowers/specs/2026-05-02-overnight-loop-design.md && echo OK
```

Expected: `OK`.

- [ ] **Step 2: Commit the spec if not yet committed**

```bash
git status --short docs/superpowers/specs/2026-05-02-overnight-loop-design.md
```

If `??` (untracked) or ` M` (modified):

```bash
git add docs/superpowers/specs/2026-05-02-overnight-loop-design.md
git commit -m "spec: overnight autonomous ledger loop design (Option B, no-halt mode)"
```

If empty output: spec already committed, skip.

---

## Phase 1 — Static content (operator manual + 7 templates + finale)

These are markdown files. The content lives in the spec sections §13 (operator manual), §14.1–14.7 (templates), §15 (finale). Orchestrator pastes from spec to file path. ONE bundled commit.

### Task 1: Scaffold all brain prompt files

**Files:**
- Create: `_archive/bek-frozen-2026-05-08/sot/overnight-operator-manual.md` (from spec §13)
- Create: `_archive/bek-frozen-2026-05-08/prompts/overnight-types/edit.md` (from spec §14.1)
- Create: `_archive/bek-frozen-2026-05-08/prompts/overnight-types/migration.md` (from spec §14.2)
- Create: `_archive/bek-frozen-2026-05-08/prompts/overnight-types/dispatch.md` (from spec §14.3)
- Create: `_archive/bek-frozen-2026-05-08/prompts/overnight-types/check.md` (from spec §14.4)
- Create: `_archive/bek-frozen-2026-05-08/prompts/overnight-types/browser-audit.md` (from spec §14.5)
- Create: `_archive/bek-frozen-2026-05-08/prompts/overnight-types/decision.md` (from spec §14.6)
- Create: `_archive/bek-frozen-2026-05-08/prompts/overnight-types/cluster-dispatch.md` (from spec §14.7)
- Create: `_archive/bek-frozen-2026-05-08/prompts/overnight-finale.md` (from spec §15)

**Approach:** orchestrator applies directly (pure file writes, no logic). Cursor-agent NOT used here — no codebase reasoning needed, just paste from spec.

- [ ] **Step 1: Create the directories**

```bash
mkdir -p D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/overnight-types
mkdir -p D:/dev2/projects/provodnik/.claude/lib/overnight
mkdir -p D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/sessions/active
```

- [ ] **Step 2: Open the spec, copy each section's content into its file**

For each of the 9 files above, open `docs/superpowers/specs/2026-05-02-overnight-loop-design.md`, find the matching section, copy the markdown body inside the triple-backtick fence (from line after the opening ` ```markdown` to the line before the closing ` ``` `), paste into the target file path.

For the operator manual (§13): the operator manual contains a placeholder `[VISION BLOCK FROM §12 EMBEDDED HERE VERBATIM]` — replace it with the actual vision block from spec §12 verbatim before saving.

- [ ] **Step 3: Verify all 9 files exist with non-trivial content**

```bash
for f in \
  _archive/bek-frozen-2026-05-08/sot/overnight-operator-manual.md \
  _archive/bek-frozen-2026-05-08/prompts/overnight-types/edit.md \
  _archive/bek-frozen-2026-05-08/prompts/overnight-types/migration.md \
  _archive/bek-frozen-2026-05-08/prompts/overnight-types/dispatch.md \
  _archive/bek-frozen-2026-05-08/prompts/overnight-types/check.md \
  _archive/bek-frozen-2026-05-08/prompts/overnight-types/browser-audit.md \
  _archive/bek-frozen-2026-05-08/prompts/overnight-types/decision.md \
  _archive/bek-frozen-2026-05-08/prompts/overnight-types/cluster-dispatch.md \
  _archive/bek-frozen-2026-05-08/prompts/overnight-finale.md; do
  wc -l "$f"
done
```

Expected: every file ≥ 30 lines. If any is shorter, content was truncated during paste — re-paste from spec.

- [ ] **Step 4: Verify the operator manual has the vision block embedded (not the placeholder)**

```bash
grep -c "PROVODNIK PRODUCT VISION" _archive/bek-frozen-2026-05-08/sot/overnight-operator-manual.md
```

Expected: ≥ 1.

```bash
grep -c "VISION BLOCK FROM" _archive/bek-frozen-2026-05-08/sot/overnight-operator-manual.md
```

Expected: 0 (placeholder fully replaced).

- [ ] **Step 5: Commit**

```bash
git add _archive/bek-frozen-2026-05-08/sot/overnight-operator-manual.md _archive/bek-frozen-2026-05-08/prompts/overnight-types/ _archive/bek-frozen-2026-05-08/prompts/overnight-finale.md
git commit -m "feat(overnight): scaffold operator manual + 7 TYPE templates + finale prompt

Pasted from docs/superpowers/specs/2026-05-02-overnight-loop-design.md
sections 13, 14.1-14.7, 15. These are read by the per-iteration brain
during the overnight loop. Vision block embedded verbatim in operator
manual."
```

---

## Phase 2 — Library modules with TDD

Each module: write failing test → run, see fail → implement → run, see pass → commit. One module per task, dispatched to cursor-agent.

### Task 2: Ledger module — parse, pick, claim, reconcile

**Files:**
- Create: `.claude/lib/overnight/ledger.mjs` (~250 lines)
- Create: `.claude/lib/overnight/ledger.test.mjs` (~200 lines)
- Test: same

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-ledger`, branch `overnight/ledger-module`. Single file pair, no cross-module deps.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-ledger -b overnight/ledger-module
```

- [ ] **Step 2: Compose cursor-agent prompt**

Prompt file at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-ledger.md`. Use `_archive/bek-frozen-2026-05-08/prompts/skeleton.md`. Inline:

- **CONTEXT:** the ledger format from `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md` (paste a 5-row sample including a row with `commit:`/`evidence:`/`depends-on:`/`status-note:` continuation lines and a `-GATE` row).
- **SCOPE:** create `.claude/lib/overnight/ledger.mjs` and `.claude/lib/overnight/ledger.test.mjs` only. Do NOT modify the ledger file itself.
- **API the module must export:**

```js
// ledger.mjs API
export async function parseLedger(filePath: string): Promise<LedgerRow[]>;
export async function pickNextReady(rows: LedgerRow[]): Promise<LedgerRow | null>;
export async function claimAtomic(filePath: string, rowId: string): Promise<void>;
export async function reconcileRow(filePath: string, rowId: string): Promise<RowState>;
export async function revertClaim(filePath: string, rowId: string): Promise<void>;
export async function findOrphans(filePath: string): Promise<string[]>;

// LedgerRow shape:
//   id: string                    // "T001", "T015-GATE", "T044.1"
//   phase: string                 // "PRE" | "P1" | ... | "DECISIONS"
//   type: string                  // "EDIT" | "MIGRATION" | ... | "DECISION"
//   title: string                 // first line after ID + brackets
//   state: ' ' | '~' | 'x' | '!' | '-'
//   commit: string | null
//   evidence: string | null
//   dependsOn: string[]           // ["T009", "T010", "human:Anzor"]
//   statusNote: string | null
//   rawBlock: string              // verbatim multi-line block for atomic rewrite

// RowState: same as state field above.
```

- **TASK (numbered for cursor-agent):**

1. Write `.claude/lib/overnight/ledger.test.mjs` first using `node:test`. Tests:
   - `parseLedger` returns the right number of rows for a fixture file with 5 rows.
   - `parseLedger` parses `[ ]`/`[~]`/`[x]`/`[!]`/`[-]` correctly.
   - `parseLedger` parses multi-line continuation (commit/evidence/depends-on/status-note).
   - `pickNextReady` returns the lowest-ID row with state `[ ]` whose `dependsOn` is satisfied (all deps state `x`, or `none`, or `human:Anzor` (treated as satisfied per overnight mode override)).
   - `pickNextReady` returns null when nothing ready.
   - `claimAtomic` flips a `[ ]` row to `[~]` via temp-file-rename (verify temp file does NOT linger).
   - `claimAtomic` is a no-op (does not throw) on already-claimed rows.
   - `reconcileRow` returns the current state of the named row.
   - `revertClaim` flips `[~]` back to `[ ]`.
   - `findOrphans` returns IDs of rows in `[~]` state.
2. Run: `node --test .claude/lib/overnight/ledger.test.mjs` — expect ALL tests fail (no implementation yet).
3. Write `.claude/lib/overnight/ledger.mjs` to pass every test.
4. Run: `node --test .claude/lib/overnight/ledger.test.mjs` — expect ALL pass.
5. Commit: `feat(overnight): ledger module — parse/pick/claim/reconcile`.

- **KNOWLEDGE (paste verbatim into prompt):** ADR-025 (no git/bun in cursor-agent prompts) — the prompt must contain ZERO git/bun commands. Cursor-agent's job is the code; orchestrator handles git verification.

- **VERIFICATION (orchestrator runs after cursor-agent claims DONE):**
  - `git -C D:/dev2/worktrees/overnight-ledger log main..HEAD --oneline` shows ≥1 commit.
  - `git -C D:/dev2/worktrees/overnight-ledger diff main..HEAD --name-only` lists only the two ledger files.
  - From workspace root: `node --test .claude/lib/overnight/ledger.test.mjs` exits 0.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-ledger.md \
  --workspace "D:\\dev2\\worktrees\\overnight-ledger" \
  --timeout 900
```

- [ ] **Step 4: Verify cursor-agent committed**

```bash
git -C D:/dev2/worktrees/overnight-ledger log main..HEAD --oneline
```

Expected: ≥1 commit on `overnight/ledger-module`.

If 0: apply directly per ERR-049 — do NOT re-dispatch. Read the prompt's TASK section, write the files yourself in the worktree, commit there.

- [ ] **Step 5: Run tests**

```bash
cd D:/dev2/worktrees/overnight-ledger && node --test .claude/lib/overnight/ledger.test.mjs
```

Expected: all tests pass.

- [ ] **Step 6: Merge to main**

```bash
git checkout main
git merge --ff-only overnight/ledger-module
git push origin main
git worktree remove D:/dev2/worktrees/overnight-ledger
git branch -d overnight/ledger-module
```

### Task 3: State module — retry counters, last errors, kickoffSha

**Files:**
- Create: `.claude/lib/overnight/state.mjs` (~120 lines)
- Create: `.claude/lib/overnight/state.test.mjs` (~100 lines)

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-state`, branch `overnight/state-module`.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-state -b overnight/state-module
```

- [ ] **Step 2: Compose prompt at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-state.md`**

Inline:

- **CONTEXT:** state file lives at `_archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json`. Format defined in spec §10 — paste it verbatim into the prompt.
- **SCOPE:** create `.claude/lib/overnight/state.mjs` and `.claude/lib/overnight/state.test.mjs` only.
- **API:**

```js
export async function loadState(filePath: string): Promise<State>;
export async function saveState(filePath: string, state: State): Promise<void>;
export async function incrementRetry(filePath: string, rowId: string): Promise<number>;
export async function recordLastError(filePath: string, rowId: string, err: { stage, summary, fullTrace, modelAtFailure }): Promise<void>;
export async function markCompleted(filePath: string, rowId: string): Promise<void>;
export async function initializeIfMissing(filePath: string, kickoffSha: string): Promise<State>;

// State shape from spec §10.
```

- **TASK (numbered):**
  1. Write the test file. Tests:
     - `loadState` reads + parses valid JSON.
     - `loadState` returns null when file missing.
     - `saveState` writes via temp-file-rename (no partial-write window).
     - `incrementRetry` increments and persists; returns the new count.
     - `recordLastError` stores the error trace under `lastErrors[rowId]`.
     - `markCompleted` appends `rowId` to `completedRows` and clears its `lastErrors` entry.
     - `initializeIfMissing` writes a fresh state with the given `kickoffSha` if no file exists; reads the existing one if present.
  2. Run tests, see fail.
  3. Implement `state.mjs`. Use `os.tmpdir()` for temp file or write to `<filePath>.tmp` then `rename`.
  4. Run tests, see pass.
  5. Commit: `feat(overnight): state module — retry counters, last errors`.

- **KNOWLEDGE:** ADR-025 (no git/bun in prompt body).

- **VERIFICATION:** identical pattern — git log ≥1 commit, only two files in diff, tests pass.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-state.md \
  --workspace "D:\\dev2\\worktrees\\overnight-state" \
  --timeout 600
```

- [ ] **Step 4: Verify + Step 5: Run tests + Step 6: Merge**

Same pattern as Task 2. Tests command:

```bash
cd D:/dev2/worktrees/overnight-state && node --test .claude/lib/overnight/state.test.mjs
```

Then merge per Task 2 Step 6.

### Task 4: Events module — append-only JSONL log

**Files:**
- Create: `.claude/lib/overnight/events.mjs` (~80 lines)
- Create: `.claude/lib/overnight/events.test.mjs` (~80 lines)

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-events`, branch `overnight/events-module`.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-events -b overnight/events-module
```

- [ ] **Step 2: Compose prompt at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-events.md`**

- **CONTEXT:** event log path `.claude/logs/overnight-events.jsonl`. Schema from spec §9 — paste verbatim.
- **SCOPE:** events.mjs + events.test.mjs only.
- **API:**

```js
export async function appendEvent(filePath: string, event: object): Promise<void>;
export async function replayEvents(filePath: string): Promise<object[]>;
export async function tailEvents(filePath: string, n: number): Promise<object[]>;
```

- **Behavior:** every `appendEvent` writes one line of JSON + newline, then calls `fsync` on the file descriptor before resolving. This guarantees durability across crashes.

- **TASK:**
  1. Write tests:
     - `appendEvent` appends a line with valid JSON.
     - `appendEvent` is durable across simulated crash (write, close, reopen, replay sees it).
     - `replayEvents` returns all events in order.
     - `tailEvents` returns the last N events.
     - Auto-creates parent dir if missing.
     - Robust to a partial last line (truncated mid-write): replay skips it.
  2. Implement.
  3. Run tests, commit: `feat(overnight): events module — durable JSONL log`.

- **KNOWLEDGE:** ADR-025.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-events.md \
  --workspace "D:\\dev2\\worktrees\\overnight-events" \
  --timeout 600
```

- [ ] **Step 4–6: Verify, test, merge** — same pattern as prior tasks.

### Task 5: Cluster module — parallel cluster detection

**Files:**
- Create: `.claude/lib/overnight/cluster.mjs` (~60 lines)
- Create: `.claude/lib/overnight/cluster.test.mjs` (~80 lines)

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-cluster`, branch `overnight/cluster-module`.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-cluster -b overnight/cluster-module
```

- [ ] **Step 2: Compose prompt at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-cluster.md`**

- **CONTEXT:** cluster detection rules from spec §8 — paste verbatim. Known clusters in current ledger: `{T011,T012,T013,T014}` and `{T017,T018}`.
- **SCOPE:** cluster.mjs + cluster.test.mjs only.
- **API:**

```js
export function detectParallelCluster(rows: LedgerRow[]): LedgerRow[] | null;
// Returns array of 2+ rows that form a cluster (all DISPATCH, identical dependsOn,
// none depend on another in the candidate, all listed in the next gate's dependsOn),
// or null if no cluster ready right now.
```

- **TASK:**
  1. Write tests using fixture rows that mimic the real ledger:
     - Detects T011-T014 cluster when T010 is `[x]` and T011-T014 are all `[ ]`.
     - Detects T017-T018 cluster when T016 is `[x]` and T017-T018 are `[ ]`.
     - Returns null if any cluster row is `[x]`/`[~]` (mixed states → no cluster).
     - Returns null when only one DISPATCH row is ready (not a cluster).
     - Returns null when DISPATCH rows have different `dependsOn` sets.
  2. Implement.
  3. Commit: `feat(overnight): cluster module — parallel cluster detection`.

- **KNOWLEDGE:** ADR-025.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-cluster.md \
  --workspace "D:\\dev2\\worktrees\\overnight-cluster" \
  --timeout 600
```

- [ ] **Step 4–6: Verify, test, merge.**

### Task 6: Models module — model + timeout selection

**Files:**
- Create: `.claude/lib/overnight/models.mjs` (~50 lines)
- Create: `.claude/lib/overnight/models.test.mjs` (~60 lines)

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-models`, branch `overnight/models-module`.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-models -b overnight/models-module
```

- [ ] **Step 2: Compose prompt at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-models.md`**

- **CONTEXT:** model selection table from spec §7. Timeout per TYPE from spec §6.2.
- **SCOPE:** models.mjs + models.test.mjs only.
- **API:**

```js
export function pickModel(rowType: string, retryCount: number): 'claude-opus-4-7' | 'claude-sonnet-4-6';
export function pickTimeout(rowType: string): number; // milliseconds
export function shouldEscalate(retryCount: number): boolean;
export function shouldEnableScopeCritique(retryCount: number): boolean;
```

- **TASK:**
  1. Tests:
     - `pickModel('DISPATCH', 0)` → `claude-opus-4-7`.
     - `pickModel('CHECK', 0)` → `claude-sonnet-4-6`.
     - `pickModel('EDIT', 5)` → `claude-opus-4-7` (escalation).
     - `pickModel('CHECK', 5)` → `claude-opus-4-7` (universal escalation at retry≥5).
     - `pickTimeout('EDIT')` → 600_000.
     - `pickTimeout('DISPATCH')` → 1_800_000.
     - `pickTimeout('Cluster')` → 1_800_000.
     - `shouldEscalate(5)` → true; `shouldEscalate(4)` → false.
     - `shouldEnableScopeCritique(10)` → true; `shouldEnableScopeCritique(9)` → false.
  2. Implement (pure function, no I/O).
  3. Commit: `feat(overnight): models module — model + timeout selection`.

- **KNOWLEDGE:** ADR-025.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-models.md \
  --workspace "D:\\dev2\\worktrees\\overnight-models" \
  --timeout 300
```

- [ ] **Step 4–6: Verify, test, merge.**

### Task 7: Prompt module — assemble brain prompt

**Files:**
- Create: `.claude/lib/overnight/prompt.mjs` (~150 lines)
- Create: `.claude/lib/overnight/prompt.test.mjs` (~100 lines)

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-prompt`, branch `overnight/prompt-module`.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-prompt -b overnight/prompt-module
```

- [ ] **Step 2: Compose prompt at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-prompt.md`**

- **CONTEXT:** the brain reads, in order: operator manual + per-TYPE template + row text + retry context + vision (already inside operator manual). The composer assembles all this into a single string piped via stdin to `claude -p`.
- **SCOPE:** prompt.mjs + prompt.test.mjs only.
- **API:**

```js
export async function loadOperatorManual(): Promise<string>;
export async function loadTemplate(typeOrName: string): Promise<string>;
// typeOrName: "EDIT" | "MIGRATION" | "DISPATCH" | "CHECK" | "BROWSER-AUDIT" |
//             "DECISION" | "cluster-dispatch" | "finale"

export async function composePrompt(opts: {
  rows: LedgerRow[],          // 1 row, or N for cluster
  typeOrName: string,
  retries: { rowId: number },
  lastErrors: { rowId: ErrorTrace | null },
  iteration: number,
  scopeCritique?: boolean
}): Promise<string>;
```

- **TASK:**
  1. Tests:
     - `loadOperatorManual` returns content of `_archive/bek-frozen-2026-05-08/sot/overnight-operator-manual.md` (use a fixture path in test, set via env var or argument).
     - `loadTemplate('EDIT')` returns content of `_archive/bek-frozen-2026-05-08/prompts/overnight-types/edit.md`.
     - `loadTemplate('cluster-dispatch')` returns content of `_archive/bek-frozen-2026-05-08/prompts/overnight-types/cluster-dispatch.md`.
     - `loadTemplate('finale')` returns content of `_archive/bek-frozen-2026-05-08/prompts/overnight-finale.md`.
     - `loadTemplate('UNKNOWN')` throws.
     - `composePrompt` returns a string containing: operator manual content, the template, every row's `rawBlock`, the iteration counter, and (when retries > 0) the prior error trace.
     - When `scopeCritique: true`, the composed prompt includes a header line "SCOPE CRITIQUE MODE — you may rewrite this row's verify clause if it advances the vision".
  2. Implement. The prompt structure (the literal output of `composePrompt`):

```
# OVERNIGHT BRAIN — iteration <N>

## Section 0 — load these files (already pasted below; do NOT re-read from disk during this iteration)

[operator manual content]

## Section 1 — your TYPE recipe

[per-TYPE template content]

## Section 2 — your assigned row(s) — verbatim from _archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md

[row 1 raw block]
[row 2 raw block, if cluster]
...

## Section 3 — retry context

Iteration: <N>
Retry count for this row(s): <K>
Last error: <stage> · <summary>
Full trace:
<truncated to last 100 lines>

[if scopeCritique:]
## Section 4 — SCOPE CRITIQUE MODE
You may rewrite this row's verify clause if it advances the vision.
Document the rewrite in status-note.

## Section 5 — exit when done
Mark the row(s) [x] or [!] in the ledger. Exit 0.
```

  3. Run tests, commit: `feat(overnight): prompt module — assemble brain prompt from manual + template + row + retries`.

- **KNOWLEDGE:** ADR-025.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-prompt.md \
  --workspace "D:\\dev2\\worktrees\\overnight-prompt" \
  --timeout 600
```

- [ ] **Step 4–6: Verify, test, merge.**

### Task 8: Spawn module — run claude -p with timeout

**Files:**
- Create: `.claude/lib/overnight/spawn.mjs` (~120 lines)
- Create: `.claude/lib/overnight/spawn.test.mjs` (~120 lines)

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-spawn`, branch `overnight/spawn-module`.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-spawn -b overnight/spawn-module
```

- [ ] **Step 2: Compose prompt at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-spawn.md`**

- **CONTEXT:** the supervisor spawns `claude -p --dangerously-skip-permissions --model <id>` with the composed prompt piped to stdin. We capture: pid, exit code, signal, stdout (one terminal line we care about), stderr (full, for last-error capture), wall clock.
- **SCOPE:** spawn.mjs + spawn.test.mjs only.
- **API:**

```js
export async function spawnBrain(opts: {
  prompt: string,
  model: 'claude-opus-4-7' | 'claude-sonnet-4-6',
  timeoutMs: number
}): Promise<{
  pid: number,
  code: number | null,
  signal: string | null,
  stdoutTail: string,    // last 20 lines
  stderrTail: string,    // last 100 lines
  durationMs: number,
  timedOut: boolean
}>;
```

- **TASK:**
  1. Tests (mock the spawn — do NOT actually invoke claude):
     - When child exits 0, `code` is 0, `timedOut` false.
     - When child exits non-zero, `code` is the non-zero value.
     - When child runs longer than `timeoutMs`, parent sends SIGTERM, then SIGKILL after 10s grace, returns `timedOut: true`.
     - Stdout is captured (last 20 lines).
     - Stderr is captured (last 100 lines).
     - `pid` is set after spawn.
  2. Use `node:child_process.spawn`. For tests, use a small Node script as the "child" (e.g., `node -e 'process.exit(0)'`, `node -e 'setTimeout(()=>{},60000)'`) — actual claude CLI not invoked in tests.
  3. Wire stdin: write `prompt`, close stdin.
  4. Implement timeout via `AbortController` + setTimeout.
  5. Commit: `feat(overnight): spawn module — child process with timeout + capture`.

- **KNOWLEDGE:** ADR-025. Also: on Windows, `spawn` should use `{ shell: false }` and pass argv directly; for `claude.cmd` / `claude.exe` resolution, use `process.env.CLAUDE_BIN` if set, otherwise `'claude'` (relies on PATH).

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-spawn.md \
  --workspace "D:\\dev2\\worktrees\\overnight-spawn" \
  --timeout 900
```

- [ ] **Step 4–6: Verify, test, merge.**

### Task 9: Preflight module — checks + recovery

**Files:**
- Create: `.claude/lib/overnight/preflight.mjs` (~150 lines)
- Create: `.claude/lib/overnight/preflight.test.mjs` (~120 lines)

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-preflight`, branch `overnight/preflight-module`.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-preflight -b overnight/preflight-module
```

- [ ] **Step 2: Compose prompt at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-preflight.md`**

- **CONTEXT:** spec §6.1 (preflight steps) + §6.2 reference. Recovery replays the event log to find orphan claims (last `claim` event for a row without matching `complete` or `revert`).
- **SCOPE:** preflight.mjs + preflight.test.mjs only. **No invocations of git here** — preflight calls helpers from other modules but the actual git commands run in `overnight-loop.mjs` Phase 3 entry. The preflight module's job: read state files, replay events, detect orphans, return a `PreflightResult`.
- **API:**

```js
export async function runPreflight(opts: {
  ledgerPath: string,
  statePath: string,
  eventsPath: string
}): Promise<PreflightResult>;

// PreflightResult:
//   ok: boolean
//   refusalReason?: string         // "ledger-missing" | "ledger-empty" | etc
//   orphans: string[]              // row IDs that were [~] without complete/revert
//   recoveredOrphans: string[]     // row IDs we reverted to [ ] this run
//   pendingCount: number
//   kickoffSha: string             // from state, OR caller-provided
//   resumed: boolean               // true if state file existed before this run
```

- **TASK:**
  1. Tests using fixture ledger + fixture event log + fixture state file in temp dirs:
     - Returns `ok: false, refusalReason: 'ledger-missing'` when ledger doesn't exist.
     - Returns `ok: false, refusalReason: 'ledger-empty'` when ledger has 0 `[ ]`/`[~]` rows.
     - Replays events: detects orphans (claim without complete/revert), reverts them, returns IDs in `recoveredOrphans`.
     - Initializes fresh state when no state file exists.
     - Loads existing state when present.
     - Returns `pendingCount` of `[ ]` rows in ledger.
  2. Implement using `ledger.mjs`, `state.mjs`, `events.mjs`. Pass `kickoffSha` in via opts; do NOT shell out to git inside this module (caller handles it).
  3. Commit: `feat(overnight): preflight module — checks + event-log replay recovery`.

- **KNOWLEDGE:** ADR-025.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-preflight.md \
  --workspace "D:\\dev2\\worktrees\\overnight-preflight" \
  --timeout 900
```

- [ ] **Step 4–6: Verify, test, merge.**

---

## Phase 3 — Supervisor entry point

### Task 10: overnight-loop.mjs — wire all modules together

**Files:**
- Create: `.claude/logs/overnight-loop.mjs` (~250 lines)

**Approach:** dispatch via cursor-agent in worktree `D:/dev2/worktrees/overnight-loop`, branch `overnight/loop-entry`. This wires the seven library modules into the actual runnable loop.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/overnight-loop -b overnight/loop-entry
```

- [ ] **Step 2: Compose prompt at `_archive/bek-frozen-2026-05-08/prompts/out/overnight-loop.md`**

- **CONTEXT:** spec §3 (architecture diagram), §6 (lifecycle), §6.2 main loop pseudocode. Paste these verbatim into KNOWLEDGE.
- **SCOPE:** create `.claude/logs/overnight-loop.mjs` only. Use the existing modules under `.claude/lib/overnight/`.
- **CLI flags:**
  - default: full loop until ledger empty
  - `--preflight-only`: run preflight, print result, exit
  - `--max-rows=N`: stop after N successfully completed rows (for smoke testing)
  - `--no-post`: in finale, run validator but do NOT actually post Slack/Telegram
  - `--help`: print usage, exit
- **TASK:**

```js
// Pseudocode — implement this exactly:

#!/usr/bin/env node
import { runPreflight } from '../lib/overnight/preflight.mjs';
import { parseLedger, pickNextReady, claimAtomic, reconcileRow, revertClaim } from '../lib/overnight/ledger.mjs';
import { detectParallelCluster } from '../lib/overnight/cluster.mjs';
import { composePrompt } from '../lib/overnight/prompt.mjs';
import { spawnBrain } from '../lib/overnight/spawn.mjs';
import { pickModel, pickTimeout, shouldEnableScopeCritique } from '../lib/overnight/models.mjs';
import { loadState, saveState, incrementRetry, recordLastError, markCompleted, initializeIfMissing } from '../lib/overnight/state.mjs';
import { appendEvent } from '../lib/overnight/events.mjs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.env.OVERNIGHT_ROOT ?? 'D:/dev2/projects/provodnik';
const LEDGER = path.join(ROOT, '_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md');
const STATE = path.join(ROOT, '_archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json');
const EVENTS = path.join(ROOT, '.claude/logs/overnight-events.jsonl');
const REPO = path.join(ROOT, 'provodnik.app');

const flags = parseFlags(process.argv);

// 1. Get current main HEAD as kickoffSha
const kickoffSha = execSync(`git -C ${REPO} log -1 --format=%H`, { encoding: 'utf8' }).trim();

// 2. Refuse if main is dirty
const status = execSync(`git -C ${REPO} status --short`, { encoding: 'utf8' });
if (status.trim().length > 0) {
  console.error('Refusing to start: provodnik.app working tree is dirty.');
  console.error(status);
  process.exit(1);
}

// 3. Preflight (replays events, recovers orphans, initializes state)
await initializeIfMissing(STATE, kickoffSha);
const pf = await runPreflight({ ledgerPath: LEDGER, statePath: STATE, eventsPath: EVENTS });
if (!pf.ok) {
  if (pf.refusalReason === 'ledger-empty') {
    console.log('No pending rows. Triggering finale.');
    await runFinale();
    process.exit(0);
  }
  console.error(`Preflight refused: ${pf.refusalReason}`);
  process.exit(1);
}
await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'preflight_pass', ...pf, kickoffSha });

if (flags.preflightOnly) {
  console.log(JSON.stringify(pf, null, 2));
  process.exit(0);
}

// 4. Main loop
let completedThisRun = 0;
let iteration = 0;
while (true) {
  iteration += 1;
  const rows = await parseLedger(LEDGER);

  // exit when nothing pending and nothing claimed
  const hasPending = rows.some(r => r.state === ' ');
  const hasClaimed = rows.some(r => r.state === '~');
  if (!hasPending && !hasClaimed) break;

  // detect parallel cluster first
  let claim;
  let template;
  let model;
  let scopeCritique = false;

  const cluster = detectParallelCluster(rows);
  if (cluster) {
    claim = cluster;
    template = 'cluster-dispatch';
    model = 'claude-opus-4-7';
  } else {
    const next = pickNextReady(rows);
    if (!next) {
      // all pending blocked behind [~] siblings — wait
      await sleep(30_000);
      continue;
    }
    claim = [next];
    template = next.type;
    const state = await loadState(STATE);
    const retry = state.retries[next.id] ?? 0;
    model = pickModel(next.type, retry);
    scopeCritique = shouldEnableScopeCritique(retry);
  }

  // claim atomically
  for (const r of claim) await claimAtomic(LEDGER, r.id);
  await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'claim', iter: iteration, rows: claim.map(r=>r.id), model });

  // compose prompt
  const state = await loadState(STATE);
  const prompt = await composePrompt({
    rows: claim,
    typeOrName: template,
    retries: Object.fromEntries(claim.map(r => [r.id, state.retries[r.id] ?? 0])),
    lastErrors: Object.fromEntries(claim.map(r => [r.id, state.lastErrors[r.id] ?? null])),
    iteration,
    scopeCritique
  });

  // spawn
  const timeoutMs = pickTimeout(template === 'cluster-dispatch' ? 'Cluster' : claim[0].type);
  await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'spawn', iter: iteration });
  const result = await spawnBrain({ prompt, model, timeoutMs });
  await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'brain_exit', iter: iteration, code: result.code, signal: result.signal, durationMs: result.durationMs });

  // reconcile
  const after = await parseLedger(LEDGER);
  for (const r of claim) {
    const newState = after.find(x => x.id === r.id)?.state ?? '~';
    if (newState === 'x') {
      await markCompleted(STATE, r.id);
      await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'complete', iter: iteration, row: r.id });
      completedThisRun += 1;
    } else {
      // brain crashed or didn't finish; revert
      await revertClaim(LEDGER, r.id);
      const newRetry = await incrementRetry(STATE, r.id);
      await recordLastError(STATE, r.id, {
        stage: 'brain-exit',
        summary: `code=${result.code} signal=${result.signal} timedOut=${result.timedOut}`,
        fullTrace: result.stderrTail,
        modelAtFailure: model
      });
      await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'revert', iter: iteration, row: r.id, newRetry });
    }
  }

  if (flags.maxRows && completedThisRun >= flags.maxRows) {
    console.log(`--max-rows=${flags.maxRows} reached; exiting.`);
    process.exit(0);
  }
}

// 5. Finale
await runFinale();
await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'loop_end' });
process.exit(0);

async function runFinale() {
  // Build the finale prompt and spawn one Opus brain
  const finalePrompt = await composePrompt({
    rows: [],
    typeOrName: 'finale',
    retries: {},
    lastErrors: {},
    iteration: 0
  });
  // Inject --no-post flag into finale prompt context if set
  const promptWithFlags = flags.noPost
    ? finalePrompt + '\n\n## DRY-RUN MODE\nDo NOT actually call slack-devnote.mjs or telegram-devnote.mjs without --dry. Run validators only.\n'
    : finalePrompt;
  await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'finale_start' });
  const result = await spawnBrain({ prompt: promptWithFlags, model: 'claude-opus-4-7', timeoutMs: 1_800_000 });
  await appendEvent(EVENTS, { ts: new Date().toISOString(), event: 'finale_end', code: result.code });
}

function parseFlags(argv) {
  const out = { preflightOnly: false, maxRows: null, noPost: false, help: false };
  for (const a of argv.slice(2)) {
    if (a === '--preflight-only') out.preflightOnly = true;
    else if (a.startsWith('--max-rows=')) out.maxRows = parseInt(a.split('=')[1], 10);
    else if (a === '--no-post') out.noPost = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  if (out.help) {
    console.log(`Usage: node overnight-loop.mjs [--preflight-only] [--max-rows=N] [--no-post]`);
    process.exit(0);
  }
  return out;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

  Implement this. Add a `#!/usr/bin/env node` shebang at the top.

  Commit: `feat(overnight): supervisor entry point — full loop wiring`.

- **KNOWLEDGE:** ADR-025.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/overnight-loop.md \
  --workspace "D:\\dev2\\worktrees\\overnight-loop" \
  --timeout 1200
```

- [ ] **Step 4: Verify cursor-agent committed**

```bash
git -C D:/dev2/worktrees/overnight-loop log main..HEAD --oneline
```

≥1 commit. ZERO_COMMIT fallback per ERR-049 if needed.

- [ ] **Step 5: Smoke-test that it parses (no execution yet)**

```bash
cd D:/dev2/worktrees/overnight-loop && node .claude/logs/overnight-loop.mjs --help
```

Expected: prints usage, exits 0.

- [ ] **Step 6: Merge to main**

```bash
git checkout main
git merge --ff-only overnight/loop-entry
git push origin main
git worktree remove D:/dev2/worktrees/overnight-loop
git branch -d overnight/loop-entry
```

---

## Phase 4 — Smoke tests on main

After Phase 3 merges, run smoke tests directly on main. These are operator-driven (orchestrator runs them; no cursor-agent dispatch). Each smoke test that uncovers a bug → fix-row added inline below the failing smoke and dispatched.

### Task 11: Preflight-only smoke test

- [ ] **Step 1: Run preflight against current ledger**

```bash
cd D:/dev2/projects/provodnik && node .claude/logs/overnight-loop.mjs --preflight-only
```

Expected output (JSON):

```json
{
  "ok": true,
  "orphans": [],
  "recoveredOrphans": [],
  "pendingCount": 44,
  "kickoffSha": "<some-sha>",
  "resumed": false
}
```

- [ ] **Step 2: Verify state file was created**

```bash
test -f D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json && cat D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/sessions/active/overnight-state.json
```

Expected: file exists, contains `kickoffSha`, `iteration: 0`, empty `retries`.

- [ ] **Step 3: Verify event log was created**

```bash
test -f D:/dev2/projects/provodnik/.claude/logs/overnight-events.jsonl && wc -l D:/dev2/projects/provodnik/.claude/logs/overnight-events.jsonl
```

Expected: ≥1 line (the `preflight_pass` event).

If any expected output is missing → file a fix-task for the relevant module, re-dispatch, re-run smoke.

### Task 12: One-row smoke test (T001 = PRE EDIT)

This actually executes ONE ledger row end-to-end. T001 is the lowest-deps row (drops `adventure`+`nightlife` from `interests.ts`). Sonnet model per the EDIT TYPE rule.

- [ ] **Step 1: Confirm T001 is `[ ]`**

```bash
grep -E '^\- \[ \] \*\*T001\*\*' D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md
```

Expected: 1 line. If `[x]` already, this smoke can't run — pick T002 instead.

- [ ] **Step 2: Run loop with --max-rows=1**

```bash
cd D:/dev2/projects/provodnik && node .claude/logs/overnight-loop.mjs --max-rows=1
```

Expected: brain spawns, executes T001, marks `[x]`, supervisor exits with `--max-rows=1 reached; exiting.`.

Wall clock: 1–5 minutes typically.

- [ ] **Step 3: Verify ledger updated**

```bash
grep -E '^\- \[x\] \*\*T001\*\*' D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md
```

Expected: 1 line, with `commit:` populated.

- [ ] **Step 4: Verify the actual code change landed**

```bash
grep -c "adventure\|nightlife" D:/dev2/projects/provodnik/provodnik.app/src/data/interests.ts
```

Expected: 0 (both dropped).

```bash
grep -c "id:" D:/dev2/projects/provodnik/provodnik.app/src/data/interests.ts
```

Expected: 8 (canonical 8 chips remain).

- [ ] **Step 5: Verify event log contains the iteration**

```bash
tail -20 D:/dev2/projects/provodnik/.claude/logs/overnight-events.jsonl
```

Expected: `claim` → `spawn` → `brain_exit` → `complete` events for T001.

- [ ] **Step 6: Verify commit is on main**

```bash
git -C D:/dev2/projects/provodnik log -3 --oneline
```

Expected: latest commit subject matches `fix(interests): drop adventure+nightlife...` (per the row's commit message in the parent plan PF-1 Step 3).

If any step fails → diagnose, file fix-row, re-dispatch the responsible module, re-merge, re-run smoke.

### Task 13: Crash recovery smoke test

- [ ] **Step 1: Manually flip T002 in the ledger to `[~]` to simulate orphan**

Open `_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md`, find T002, change `- [ ]` to `- [~]`. Save.

- [ ] **Step 2: Manually append a `claim` event (no matching complete/revert)**

```bash
echo '{"ts":"2026-05-02T00:00:00.000Z","event":"claim","iter":99,"rows":["T002"],"model":"claude-sonnet-4-6"}' >> D:/dev2/projects/provodnik/.claude/logs/overnight-events.jsonl
```

- [ ] **Step 3: Run preflight-only, confirm orphan detected**

```bash
cd D:/dev2/projects/provodnik && node .claude/logs/overnight-loop.mjs --preflight-only
```

Expected output includes:

```json
"orphans": ["T002"],
"recoveredOrphans": ["T002"]
```

- [ ] **Step 4: Confirm ledger now shows T002 as `[ ]`**

```bash
grep -E '^\- \[ \] \*\*T002\*\*' D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md
```

Expected: 1 line (orphan reverted).

If recovery fails → bug in `preflight.mjs` or `events.mjs`. File fix-row.

### Task 14: Cluster detection smoke test

This validates `detectParallelCluster` on the live ledger AFTER PRE phase ticks (T009 + T010 must be `[x]` for the cluster to be detected). At the start of the build, this test won't fire — defer until later in the sequence OR seed manually for the smoke.

- [ ] **Step 1: If T015-GATE is still `[ ]`, manually flip T009 + T010 to `[x]` for the test**

Edit ledger, mark `T009` and `T010` as `[x]` with `commit: smoke-test`, `evidence: smoke`, `status-note: SMOKE-TEST`.

- [ ] **Step 2: Run preflight + one cluster iteration**

```bash
cd D:/dev2/projects/provodnik && node .claude/logs/overnight-loop.mjs --max-rows=4
```

Expected: detects T011-T014 cluster (logs `claim` event with `rows: ["T011","T012","T013","T014"]`). One Opus brain spawned. Brain runs cluster-dispatch template, spawns 4 native Agents, dispatches cursor-agent for each. Wall clock: 15–30 minutes (real cursor-agent invocations).

- [ ] **Step 3: Verify all 4 rows ticked**

```bash
grep -cE '^\- \[x\] \*\*T01[1234]\*\*' D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/sot/launch-readiness-tasks.md
```

Expected: 4.

- [ ] **Step 4: Verify all 4 commits on main**

```bash
git -C D:/dev2/projects/provodnik log -10 --oneline | grep -E '(plan-51|plan-46|plan-47)'
```

Expected: ≥3 lines (Plans 51, 46, 47 commits).

If any row stuck `[~]`: cluster brain partial-success path triggered correctly per spec §8. Supervisor's next iteration should retry the stuck row as SOLO. Run `node overnight-loop.mjs --max-rows=1` again, confirm completion.

If cluster detection failed entirely (4 separate iterations instead of 1): bug in `cluster.mjs`. File fix-row.

### Task 15: Failure escalation smoke test

This is the highest-value smoke test — confirms the no-halt mode actually works.

- [ ] **Step 1: Pick a row that's currently `[ ]` (e.g., T031 BROWSER-AUDIT in Phase 4)**

If your ledger state has progressed past T031, pick the next available BROWSER-AUDIT row.

- [ ] **Step 2: Temporarily corrupt the row's verify clause**

Edit the ledger row T031, change its `verify:` clause to reference a non-existent path:

```
verify: file `_archive/bek-frozen-2026-05-08/sot/findings-IMPOSSIBLE-PATH.md` exists with all routes covered
```

Save.

- [ ] **Step 3: Run loop with --max-rows=1**

```bash
cd D:/dev2/projects/provodnik && node .claude/logs/overnight-loop.mjs --max-rows=1
```

Expected timeline (roughly):
- Brain (Sonnet) tries the audit, can't satisfy the corrupted verify, marks `[!]` with reason → revert, retry counter → 1.
- Supervisor's next iteration retries → Sonnet again → `[!]` → retry counter → 2.
- Retry 5+ → escalates to Opus. Opus reads vision, critiques scope, attempts fix.
- Retry 10+ → SCOPE CRITIQUE MODE — Opus may rewrite the verify clause (write `SCOPE-REWRITE` status-note) and proceed.

Because we set `--max-rows=1`, the supervisor exits after the first successful completion. With a corrupted clause, completion may take 10+ retries OR the brain may rewrite the clause.

- [ ] **Step 4: Inspect the event log**

```bash
tail -50 D:/dev2/projects/provodnik/.claude/logs/overnight-events.jsonl | grep -E '(escalate|revert|brain_exit|complete)'
```

Expected: multiple `revert` events for T031, eventually `escalate` (model upgrade), eventually `complete`.

- [ ] **Step 5: Restore the original verify clause**

After the smoke completes, manually revert the ledger row's verify clause back to the original from this plan.

If the brain never escalates (stays on Sonnet despite retries ≥ 5): bug in `models.mjs` `pickModel` or in the supervisor's retry-count plumbing. File fix-row.

If the brain hard-loops on the same error (no scope critique at retry≥10): the prompt module isn't injecting the SCOPE CRITIQUE header correctly. File fix-row.

---

## Self-review

### Spec coverage check

| Spec section | Plan task(s) | Status |
|---|---|---|
| §1 purpose | Plan goal + smoke tests | ✓ |
| §2 non-goals | Plan does not exceed scope | ✓ |
| §3 architecture | Tasks 2–10 (lib modules + supervisor) | ✓ |
| §4 components inventory | Tasks 1 (static) + 2–10 (code) | ✓ |
| §5 row state machine | Task 2 (ledger module — state field parsing + transitions) | ✓ |
| §6.1 preflight | Task 9 (preflight module) + Task 10 (loop wires it in) | ✓ |
| §6.2 main loop | Task 10 (overnight-loop.mjs main while loop) | ✓ |
| §6.3 finale | Task 10 (`runFinale()` function) + Task 1 (finale prompt template) | ✓ |
| §7 model selection | Task 6 (models module) | ✓ |
| §8 cluster detection | Task 5 (cluster module) | ✓ |
| §9 event log schema | Task 4 (events module) + Task 10 (emits events) | ✓ |
| §10 state file schema | Task 3 (state module) | ✓ |
| §11 hard-stop reconciliation | encoded in Phase 1 prompt templates (per-TYPE self-healing sections) | ✓ |
| §12 vision block | Phase 1 — pasted into operator manual | ✓ |
| §13 operator manual | Phase 1 Task 1 — operator-manual.md | ✓ |
| §14 per-TYPE templates | Phase 1 Task 1 — 7 template files | ✓ |
| §15 finale prompt | Phase 1 Task 1 — overnight-finale.md | ✓ |
| §16 smoke test plan | Phase 4 Tasks 11–15 | ✓ |
| §17 out-of-scope | Plan does not include any out-of-scope items | ✓ |
| §18 anti-pattern scan | mitigations encoded in modules + templates | ✓ |
| §19 operator pre-flight checklist | Smoke Task 11 effectively runs this | ✓ |

### Placeholder scan

Searched for: `TBD`, `TODO`, `implement later`, `Similar to Task N`, `add appropriate error handling`, `fill in details`. None found. Every `Step` block contains either a literal command or a code block.

### Type / API consistency

- `LedgerRow.state` is `' '|'~'|'x'|'!'|'-'` everywhere it's used (Task 2 defines, Tasks 5/7/9/10 consume).
- `pickModel` returns `'claude-opus-4-7'|'claude-sonnet-4-6'` everywhere (Task 6 defines, Tasks 7/8/10 consume).
- `composePrompt` opts shape matches what Task 10 calls with.
- `spawnBrain` return shape matches what Task 10 reads (`code`, `signal`, `durationMs`, `stderrTail`, `timedOut`).
- `appendEvent` event objects have consistent `ts` + `event` keys; kind-specific fields per spec §9.

### Scope check

This plan covers ONE focused infrastructure build: the supervisor + brain prompts. It does NOT include:
- Running the launch-readiness ledger itself (that's the operator's overnight kickoff after this build ships).
- Any launch-readiness fix-rows from audits (those are dynamically appended by the loop during the run).
- Generalizing the supervisor for other ledgers (out-of-scope per spec §17).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-02-overnight-loop-implementation.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Per CLAUDE.md §7 intercept, "dispatch implementer subagent" steps go via `cursor-dispatch.mjs`, NOT via Task tool.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review.

Which approach?
