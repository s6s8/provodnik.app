# BEK Mission-Minimal Rewrite — Implementation Plan (Plan 28)

> **Numbering note:** Plan 27 is already taken by `2026-04-29-group-a-crash-protection-implementation.md` (READY FOR DISPATCH at the time of writing). This plan claims **Plan 28**.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Dispatch convention (this project):** Per `.claude/CLAUDE.md` §22 and HOT/ADR-025, all implementation tasks dispatch via `node .claude/logs/cursor-dispatch.mjs <prompt>`. Cursor-agent prompts contain ZERO `git`/`bun`/shell commands. Orchestrator runs typecheck + lint + tests + git after every dispatch.

**Goal:** Collapse BEK from 3283 lines / 24 files / 8 persistence files / 228-line system prompt to ~700-800 lines / ~14 files / 2 persistence files / ~50-line system prompt that serve only the four functions in `_archive/bek-frozen-2026-05-08/MISSION.md`. Active Telegram conversation must keep working through every phase.

**Architecture:** Replace claude-CLI subprocess with direct Anthropic SDK using tool calls (`send_telegram`, `write_plan`, `add_memory`) instead of TELEGRAM:/STATE:/LEARN: regex protocol. Replace conversation.md + auto-archive + summarizer with append-only `conversation.jsonl` + rolling window (last 50 turns or 50K tokens, whichever smaller). Demolish state machine, watchdog, heartbeat, incidents, status-pill, CONCEPT LEDGER infrastructure. Keep mechanical honesty rails: sandbox boundaries in system prompt + foreign-path BLOCK in reply-linter + path-validator wrapper for file tools.

**Tech Stack:** Node 24 + TypeScript + tsx + `@anthropic-ai/sdk` (new) + gramio (existing) + p-queue (existing) + PM2 (process supervisor).

**Design spec:** [`docs/superpowers/specs/2026-04-29-bek-mission-minimal-design.md`](../specs/2026-04-29-bek-mission-minimal-design.md)

---

## Dependency DAG

```
Task 1 (SDK runner stub)  ──┐
                            ├─> Task 2 (wire behind use_sdk_runner flag, default OFF)
Task 7 (linter foreign-path) ┘                                                 │
   (parallel with Task 1)                                                      │
                                                                               │
                                       ┌───────────────────────────────────────┘
                                       v
                              Task 3 (claude-tools.ts: 3 tool defs + dispatch)
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        v                              v                              v
Task 4 (sysprompt SDK block)   Task 5 (conversation-jsonl)   Task 8 (path-validator + tool wrap)
                                       │
                                       v
                              Task 6 (wire jsonl into daemon for SDK runner path)
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        v                                                             v
Task 9 (system-prompt-minimal.ts + wiring)                  Task 10 (commands.ts /execute → ack)
        │                                                             │
        └──────────────────────────────┬──────────────────────────────┘
                                       v
                              Task 11 (flip use_sdk_runner default to true)
                                       │
                                       v
                       [Orchestrator smoke gate — SOT.md checklist]
                                       │
                                       v
                              Task 12 (delete legacy modules)
                                       │
                                       v
                              Task 13 (collapse session.json schema + final cleanup)
```

## Merge order

1. **Task 1** — `feat/plan-28-task-1-sdk-runner-stub` (parallel-safe with Task 7)
2. **Task 7** — `feat/plan-28-task-7-foreign-path-linter` (parallel-safe with Task 1)
3. **Task 2** — `feat/plan-28-task-2-wire-sdk-flag` (depends on Task 1 merged)
4. **Task 3** — `feat/plan-28-task-3-claude-tools` (depends on Task 2 merged)
5. **Task 4** — `feat/plan-28-task-4-sysprompt-sdk-block` (depends on Task 3 merged) (parallel-safe with Tasks 5, 8)
6. **Task 5** — `feat/plan-28-task-5-conversation-jsonl` (depends on Task 3 merged) (parallel-safe with Tasks 4, 8)
7. **Task 8** — `feat/plan-28-task-8-path-validator` (depends on Task 3 merged) (parallel-safe with Tasks 4, 5)
8. **Task 6** — `feat/plan-28-task-6-wire-jsonl` (depends on Task 5 merged)
9. **Task 9** — `feat/plan-28-task-9-sysprompt-minimal` (depends on Tasks 4, 6, 8 merged) (parallel-safe with Task 10)
10. **Task 10** — `feat/plan-28-task-10-execute-ack` (depends on Task 9 merged — no, just depends on Task 6) (parallel-safe with Task 9)
11. **Task 11** — `feat/plan-28-task-11-flip-default` (depends on Tasks 9, 10 merged)
12. **[Orchestrator smoke gate]** — manual SOT.md checklist run; blocks Tasks 12-13
13. **Task 12** — `feat/plan-28-task-12-demolish-legacy` (depends on smoke gate pass)
14. **Task 13** — `feat/plan-28-task-13-collapse-session-schema` (depends on Task 12 merged)

Parallel groups:
- After Task 3: Tasks 4, 5, 8 can be dispatched in parallel (3 separate worktrees, 3 background Agents)
- After Task 6: Tasks 9, 10 can be dispatched in parallel
- Tasks 1 and 7 at the start can be dispatched in parallel

---

## Task summary

### Task 1 — SDK runner stub
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-1.md`
Branch: `feat/plan-28-task-1-sdk-runner-stub`
Summary: Add `@anthropic-ai/sdk` to `_archive/bek-frozen-2026-05-08/src/package.json` dependencies. Create `_archive/bek-frozen-2026-05-08/src/claude-sdk-runner.ts` exporting `runClaudeSDK(opts): Promise<void>` with the same signature as `runClaude` from `claude-runner.ts` — same `Signal` event emissions for backward compat, but driven by `client.messages.stream()` from the Anthropic SDK instead of CLI subprocess. No tool support yet; this task just wires text streaming + transient-error handling + signal parsing using existing `parseSignals` from `claude-runner.ts`. Add `_archive/bek-frozen-2026-05-08/src/test/claude-sdk-runner.test.ts` covering the happy path with a mocked SDK client.

### Task 2 — Wire SDK runner behind config flag
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-2.md`
Depends on: Task 1 merged
Summary: Add `use_sdk_runner: boolean` field to `BekConfig` in `_archive/bek-frozen-2026-05-08/src/config.ts` (default `false`). In `_archive/bek-frozen-2026-05-08/src/bek-daemon.ts`, branch on `config.use_sdk_runner` to call either `runClaude` (existing) or `runClaudeSDK` (new). All other behavior unchanged. Update `_archive/bek-frozen-2026-05-08/src/bek.config.template.json` with the new field. Default OFF — production behavior unchanged.

### Task 3 — Tool definitions + dispatch in SDK runner
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-3.md`
Depends on: Task 2 merged
Summary: Create `_archive/bek-frozen-2026-05-08/src/claude-tools.ts` exporting `BEK_TOOLS: Anthropic.Tool[]` (the three tools: `send_telegram`, `write_plan`, `add_memory`) and `executeTool(toolUse, ctx): Promise<string>` that dispatches each tool to side effects matching today's signal emissions (`send_telegram` → emit `Signal.TELEGRAM`; `write_plan` → write file + emit informational log; `add_memory` → call `appendMemory` + emit `Signal.LEARN`). Wire `BEK_TOOLS` and `executeTool` into `claude-sdk-runner.ts` so SDK calls run a manual tool-use loop (per Anthropic SDK docs: parse `tool_use` blocks, execute, append `tool_result` user message, re-call until `stop_reason: end_turn`). Add `_archive/bek-frozen-2026-05-08/src/test/claude-tools.test.ts` covering each tool's execution and the loop termination.

### Task 4 — System-prompt SDK-mode block
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-4.md`
Depends on: Task 3 merged. Parallel-safe with Tasks 5, 8.
Summary: In `_archive/bek-frozen-2026-05-08/src/system-prompt.ts`, add an exportable constant `BEK_SYSTEM_PROMPT_SDK_BLOCK` (~30 lines) instructing tool-call-based output: every user-visible reply via `send_telegram` tool, plans via `write_plan`, facts via `add_memory`. In `buildFirstPrompt` and `buildContinuationPrompt`, when called with a new `sdkMode: true` flag, append the SDK block and OMIT the legacy TELEGRAM:/STATE:/LEARN: signal protocol section. SDK runner passes `sdkMode: true`; CLI runner passes `sdkMode: false` (default). Update `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` test snapshot.

### Task 5 — `conversation-jsonl.ts` module
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-5.md`
Depends on: Task 3 merged. Parallel-safe with Tasks 4, 8.
Summary: Create `_archive/bek-frozen-2026-05-08/src/conversation-jsonl.ts` exporting `appendTurn(path, turn)` and `readWindow(path, opts): Promise<Turn[]>`. `Turn` matches Anthropic SDK message shape (`{ role: 'user' | 'assistant', content: string | Block[] }`) plus a `ts: string` field. `readWindow` returns last `maxTurns` (default 50) or fewer if cumulative token estimate exceeds `maxTokens` (default 50_000). Token estimate via `Math.ceil(JSON.stringify(content).length / 4)`. No file deletion ever. Atomic append (open + write + close per turn). Add `_archive/bek-frozen-2026-05-08/src/test/conversation-jsonl.test.ts` covering append, window read, token-cap truncation, and empty-file handling.

### Task 6 — Wire jsonl persistence for SDK runner path
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-6.md`
Depends on: Task 5 merged
Summary: In `_archive/bek-frozen-2026-05-08/src/bek-daemon.ts`, when `config.use_sdk_runner === true`, write each user message AND each assistant turn to `_archive/bek-frozen-2026-05-08/sessions/active/conversation.jsonl` via `appendTurn`. When building the prompt for SDK runner, read window via `readWindow` and pass as the `messages` array to the SDK call (in `claude-sdk-runner.ts` — extend its signature to accept `messages: Message[]` array directly, replacing single-string `message`). Existing `conversation.md` writes (via `sessions.appendConversation`) still happen for both runners — coexistence is fine, jsonl is additive. `summarizeIfNeeded` still runs for CLI runner; SDK runner skips it (no summarization in new architecture).

### Task 7 — Foreign-path BLOCK rule in reply-linter
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-7.md`
Branch: `feat/plan-28-task-7-foreign-path-linter`
Summary: Extend `_archive/bek-frozen-2026-05-08/src/reply-linter.ts` with a new rule `'foreign-path'` (severity `'reject'`) that matches the four foreign-path regexes from the design spec. Add `'foreign-path'` to the `LinterRule` union. Wire into `lintReply()` array. Extend `_archive/bek-frozen-2026-05-08/src/test/reply-linter.test.ts` with cases: `C:\Users\BOSTON\Desktop\file.txt` rejected, `D:\dev2\projects\provodnik\foo.ts` accepted, `~/Downloads/file` rejected, `/home/alex` rejected, `D:\dev2\projects\provodnik\.bek\sessions\active\session.json` accepted (forward slashes too).

### Task 8 — Path-validator + file-tool wrappers
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-8.md`
Depends on: Task 3 merged. Parallel-safe with Tasks 4, 5.
Summary: Create `_archive/bek-frozen-2026-05-08/src/path-validator.ts` exporting `validatePath(p: string): { ok: boolean; reason?: string }` per the design spec (resolve to absolute, case-insensitive prefix match against `ALLOWED_ROOTS`). In `_archive/bek-frozen-2026-05-08/src/claude-tools.ts`, when constructing the tool list for the SDK runner, ALSO declare native file tools (`Read`, `Write`, `Edit`, `Glob`, `Grep`) with `input_schema` that includes a `path` (or `file_path`) field. In `executeTool`, before running any of these tools, call `validatePath` on every path argument; if `ok: false`, return the rejection `reason` as the tool result content with `is_error: true`. Bash tool deliberately NOT included. Add `_archive/bek-frozen-2026-05-08/src/test/path-validator.test.ts` and extend `_archive/bek-frozen-2026-05-08/src/test/claude-tools.test.ts` with rejection paths.

### Task 9 — Minimal system prompt + wiring
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-9.md`
Depends on: Tasks 4, 6, 8 merged. Parallel-safe with Task 10.
Summary: Create `_archive/bek-frozen-2026-05-08/src/system-prompt-minimal.ts` exporting `BEK_SYSTEM_PROMPT_MINIMAL` (~50 lines) per the design spec — identity + four functions + tool list + sandbox boundaries + authority model + output rules. NO state machine, NO PLAN_READY gate, NO CONCEPT LEDGER, NO Anzor Defense, NO status report format, NO plan naming convention. Build a parallel `buildFirstPromptMinimal(userMessage, memory): string` and `buildContinuationPromptMinimal(...)` that use the minimal prompt and skip legacy context blocks (no `brief`, no `plan`, no `checkpoints`, no `ledger`). Wire `bek-daemon.ts`: when `config.use_sdk_runner === true`, use the minimal builders; else use the legacy builders. Add `_archive/bek-frozen-2026-05-08/src/test/system-prompt-minimal.test.ts` snapshot test.

### Task 10 — `/execute` becomes ack-only
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-10.md`
Depends on: Task 6 merged. Parallel-safe with Task 9.
Summary: In `_archive/bek-frozen-2026-05-08/src/commands.ts`, when `config.use_sdk_runner === true`, the `/execute` handler simply posts "Принято. Передаю CarbonS8." and returns — no `sessions.archive()`, no state mutation. State machine is irrelevant in SDK mode. The CLI-runner branch keeps the existing behavior. Update `_archive/bek-frozen-2026-05-08/src/test/commands.test.ts` to cover both branches. Note: `/done`, `/abort`, `/plan`, `/status` keep their current CLI-mode behavior; the SDK-mode equivalents land in Task 12 cleanup.

### Task 11 — Flip `use_sdk_runner` default to true
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-11.md`
Depends on: Tasks 9, 10 merged
Summary: In `_archive/bek-frozen-2026-05-08/src/bek.config.template.json`, change `use_sdk_runner` default from `false` to `true`. Update `_archive/bek-frozen-2026-05-08/src/SOT.md` to document the new architecture (one paragraph, link to design spec). No code changes beyond the config flip — the runner code path is already exercised in dev. After this lands, orchestrator runs the SOT.md "Smoke Verification" checklist as a manual gate before Tasks 12-13.

### Task 12 — Delete legacy modules
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-12.md`
Depends on: Task 11 merged + orchestrator smoke gate pass
Summary: Delete files: `_archive/bek-frozen-2026-05-08/src/concepts.ts`, `_archive/bek-frozen-2026-05-08/src/heartbeat.ts`, `_archive/bek-frozen-2026-05-08/src/incidents.ts`, `_archive/bek-frozen-2026-05-08/src/bek-watchdog.ts`, `_archive/bek-frozen-2026-05-08/src/bek-watchdog-run.ts`, `_archive/bek-frozen-2026-05-08/src/status-pill.ts`, `_archive/bek-frozen-2026-05-08/src/silent-drop.ts`, `_archive/bek-frozen-2026-05-08/src/metrics.ts`, `_archive/bek-frozen-2026-05-08/src/stream-log.ts`, and corresponding test files. Delete summarizer + auto-archive code from `_archive/bek-frozen-2026-05-08/src/session-manager.ts` (keep only minimal session.json read/write + memory.md helpers if needed). In `_archive/bek-frozen-2026-05-08/src/bek-daemon.ts`, remove all imports and call sites for the deleted modules. Update `_archive/bek-frozen-2026-05-08/src/test/daemon-wiring.test.ts` to reflect the slimmer wiring. Update `_archive/bek-frozen-2026-05-08/src/SOT.md` source-files section.

### Task 13 — Collapse session.json schema + final cleanup
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-28-task-13.md`
Depends on: Task 12 merged
Summary: Update `_archive/bek-frozen-2026-05-08/src/types/session.ts`: drop `state`, `claude_session_id`, `task_slug`, `started_at` fields; keep only `created_at`, `group_id`, `last_active`, `schema_version`. In `_archive/bek-frozen-2026-05-08/src/session-manager.ts`, update read/write to handle the v1→v2 migration (if `schema_version` is missing or `1`, drop the dropped fields and stamp `schema_version: 2`). Delete the old `claude-runner.ts` (CLI subprocess wrapper) and rename `claude-sdk-runner.ts` → `claude-runner.ts`. Delete the old `system-prompt.ts` (228-line) and rename `system-prompt-minimal.ts` → `system-prompt.ts`. Update all imports across the codebase. Update `_archive/bek-frozen-2026-05-08/src/SOT.md` final source-files section.

---

## End-to-end verification (run after all tasks merged)

- BEK responds to a Telegram message in Russian within 10s.
- BEK can write a plan via `write_plan` tool — file appears at `_archive/bek-frozen-2026-05-08/prompts/out/plan-NN.md`.
- BEK can persist a fact via `add_memory` tool — appears in `memory.md` under the named tag.
- A user-visible message containing `C:\Users\BOSTON\Desktop\foo.txt` is BLOCKED by the linter and Bek is asked to rephrase.
- A `Read` tool call to `C:\Windows\System32\anything` is rejected by `path-validator` with a tool error; Bek receives the error and responds honestly.
- `_archive/bek-frozen-2026-05-08/sessions/active/conversation.jsonl` exists and grows by one user line + one assistant line per Telegram exchange.
- `_archive/bek-frozen-2026-05-08/sessions/active/conversation.md` is no longer written (after Task 12 demolition).
- `_archive/bek-frozen-2026-05-08/sessions/active/session.json` contains only the 4 fields (`schema_version`, `created_at`, `group_id`, `last_active`).
- `bun run typecheck` passes from `_archive/bek-frozen-2026-05-08/src/`.
- `node --import tsx --test test/*.test.ts` passes from `_archive/bek-frozen-2026-05-08/src/`.
- `pm2 restart quantumbek` brings BEK back up cleanly with the new code.
- `wc -l _archive/bek-frozen-2026-05-08/src/*.ts` total ≤ 800 lines (target).

---

## Self-review checklist (blocks "done" — every box must be ticked)

- [x] Every gap in the design spec's gap list has a task that fixes it. Mapping table:
  | Gap | Task |
  |-----|------|
  | Auto-archive cliff (provoda #1, #2, #3 from 04-29) | Tasks 5+6+11+12 (jsonl rolling window replaces archive) |
  | Cross-machine file hallucination (provoda #4) | Tasks 7 (linter) + 8 (validator) + 9 (sandbox in prompt) |
  | 228-line system prompt | Task 9 (minimal prompt) |
  | TELEGRAM:/STATE:/LEARN: regex protocol fragility | Tasks 3+4 (tool calls replace it) |
  | claude-CLI subprocess complexity | Tasks 1+2+12+13 (SDK direct, then delete CLI) |
  | 8 persistence files | Tasks 5+12+13 (collapse to 2) |
  | State machine relic | Tasks 10+13 (delete state field, /execute → ack) |
  | Watchdog/heartbeat/incidents (PM2 covers) | Task 12 (delete) |
- [x] Every cross-file collision has an explicit resolution sentence in every affected task prompt. Collisions: `bek-daemon.ts` is touched by Tasks 2, 6, 9, 10, 12, 13 — each task lists its scope as additive (Tasks 2, 6, 9, 10) or pure deletion (Tasks 12, 13). Each task prompt explicitly states "do not modify wiring outside the SDK runner branch" or equivalent. `system-prompt.ts` touched by Tasks 4, 9, 13 — Task 4 adds a constant + flag, Task 9 creates a separate file, Task 13 deletes the original.
- [x] Every file path referenced in any task prompt has been Glob-verified.
- [x] Every Context7 citation has a real URL: <https://context7.com/anthropics/anthropic-sdk-typescript/llms.txt>
- [x] DAG above matches the SCOPE dependency declarations in every task prompt.
- [x] Each task VERIFICATION section has ≥3 observable-state items (filled in per task prompt).
- [x] Each task DONE CRITERIA names exact branch + file count + return string.
- [x] IF the design spec declares terminology locks: `rg` across `docs/superpowers/specs/2026-04-29-*` and `_archive/bek-frozen-2026-05-08/prompts/out/plan-27-*` returns zero drift hits for the 7 forbidden terms (verified at Phase V).
- [x] IF the design spec declares out-of-scope items: no task prompt references `voice.ts`, `whisper.ts`, `attachments.ts`, `gramio`, `pm2`, or historical archives in modification scope.

---

## Risks and rollback

| Risk | Mitigation |
|------|-----------|
| Anthropic SDK behaves differently from CLI subprocess (rate limits, error shapes, streaming) | Dual-runner phase (Tasks 1-10 keep both); flip-back `use_sdk_runner: false` if cutover surfaces new failures |
| Tool calls less reliable than text signals — Bek forgets `send_telegram` | System prompt explicit; daemon detects "no send_telegram in turn" and falls back to assistant text content (parallel to current `silent_drop_recovered` logic in `bek-daemon.ts:347`) |
| Long jsonl read slow at 10K+ turns | Read-tail-only via stream; benchmark in Task 5; mitigate with `recent.jsonl` mirror if pathological |
| Active Telegram session breaks during cutover | Task 11 gated on SOT.md smoke checklist passing on local pre-deploy run |
| `path-validator` rejects legitimate write to `_archive/bek-frozen-2026-05-08/prompts/out/plan-NN.md` due to case quirk on Windows | Case-insensitive normalize in validator (Task 8); explicit unit test for `D:\dev2\projects\provodnik\.bek\prompts\out\plan-27.md` write |

Rollback: each task is a single branch + commit, single-commit revert per task. Tasks 12-13 (demolition) revertable by re-cherry-picking deleted files from the branch point.

---

## Out of scope (deferred)

Per design spec § "Out of scope for this plan":
- Multimedia handling changes (voice + photo + PDF stay as-is)
- Telegram client (`gramio`) changes
- PM2 process management changes
- Migration of historical archive sessions
- Building a state.json / world.json reconcile system (rejected during brainstorm — auto-archive cliff doesn't exist in new architecture)
