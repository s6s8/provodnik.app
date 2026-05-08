# BEK bloat railguards + brainstorm quality gates — implementation plan

**Spec:** `docs/superpowers/specs/2026-04-26-bek-bloat-railguards-and-quality-gates-design.md`
**Date:** 2026-04-26
**Owner:** orchestrator (Carbon)
**Total effort:** ~5.5 hrs across 6 cursor-agent tasks

---

## Goal

Implement the four components from the design spec:

1. `memory.md` schema + `bek-compact` CLI (Tasks 1, 2)
2. `concepts.md` per-session ledger (Task 3)
3. Reply pre-flight linter (Tasks 4, 5)
4. `PLAN_READY` verification gate (Task 6)

Stop BEK from bloating its own state files and from emitting `STATE: PLAN_READY` without self-verification.

## Non-goals

- No changes to `provodnik.app/` code.
- No retroactive rewrite of garbled cp1252 lines in `memory.md`.
- No new persona text — Кодекс «Протуберанец» v1 stays the source of truth.

## Dependency DAG

```
T1 (memory schema+dedup+cap) ─┬─→ T2 (bek-compact CLI)
                              │
                              └─→ T3 (concepts ledger) ─┬─→ T5 (linter integration)
                                                        │
                                                        └─→ T6 (verification gate)
T4 (reply-linter pure) ───────────────────────────────→ T5
```

**Wave A** (parallel): T1, T4
**Wave B** (after T1): T2, T3
**Wave C** (after T3 + T4): T5, T6 — parallel

## Task summary

| # | Task | Files | Effort | Depends on |
|---|------|-------|--------|------------|
| 1 | memory.ts schema + dedup + hard-cap | `_archive/bek-frozen-2026-05-08/src/memory.ts`, `_archive/bek-frozen-2026-05-08/src/test/memory.test.ts` | ~50 min | — |
| 2 | bek-compact CLI + auto-trigger | `_archive/bek-frozen-2026-05-08/src/cli/bek-compact.ts` (new), `_archive/bek-frozen-2026-05-08/src/session-manager.ts` | ~45 min | T1 |
| 3 | concepts.ts module + prompt integration | `_archive/bek-frozen-2026-05-08/src/concepts.ts` (new), `_archive/bek-frozen-2026-05-08/src/system-prompt.ts`, `_archive/bek-frozen-2026-05-08/src/claude-runner.ts`, `_archive/bek-frozen-2026-05-08/src/test/concepts.test.ts` (new) | ~60 min | T1 |
| 4 | reply-linter.ts pure module | `_archive/bek-frozen-2026-05-08/src/reply-linter.ts` (new), `_archive/bek-frozen-2026-05-08/src/test/reply-linter.test.ts` (new) | ~50 min | — |
| 5 | linter integration into pipeline | `_archive/bek-frozen-2026-05-08/src/sanitizer.ts`, `_archive/bek-frozen-2026-05-08/src/claude-runner.ts` | ~45 min | T3, T4 |
| 6 | PLAN_READY verification gate | `_archive/bek-frozen-2026-05-08/src/system-prompt.ts`, `_archive/bek-frozen-2026-05-08/src/claude-runner.ts`, `_archive/bek-frozen-2026-05-08/src/test/verification-gate.test.ts` (new) | ~50 min | T3 |

## Collisions and resolutions

`system-prompt.ts` is touched by T3 and T6. **Resolution:** T3 adds the `[CONCEPT LEDGER]` block to `renderContextBlocks` and adds one rule about ledger usage. T6 adds the verification gate mandatory section between EXECUTION BOUNDARY and STATE MACHINE. They edit different parts of the file. Both task prompts call out the other's edits as out-of-scope.

`claude-runner.ts` is touched by T3, T5, T6. **Resolution:**
- T3 adds ledger-update calls (extract from outgoing/incoming, render into prompt assembly).
- T5 adds the linter retry loop in the post-emission pipeline.
- T6 adds the `STATE: PLAN_READY` interception in the emission parser.
- Each task prompt enumerates which functions it touches and forbids the others.

`memory.ts` is touched only by T1. No collision.

## Sequencing decisions

- **T1 before T3** — T3 inherits the schema-discipline pattern (read-before-write, dedup, hard-cap). Setting the pattern in T1 first reduces drift in T3.
- **T4 before T5** — linter must be a tested pure function before integration adds plumbing.
- **T3 before T5** — linter rule 6 (`non-ledger-noun`) reads the ledger; integration test needs it real.
- **T3 before T6** — gate's checklist Rule 5 references CONCEPT LEDGER.
- **T2 can run any time after T1** — independent of everything else; could be deferred without blocking the rest.

## Per-task prompt files

- `_archive/bek-frozen-2026-05-08/prompts/out/plan-12-task-1.md`
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-12-task-2.md`
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-12-task-3.md`
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-12-task-4.md`
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-12-task-5.md`
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-12-task-6.md`

(Plan numbering: counted archive sessions, this is Plan 12.)

## Verification (whole plan)

After all 6 tasks merge:
- [ ] `bun run typecheck` clean
- [ ] `bun run lint` clean
- [ ] `bun run test:run` all green (existing 140 + new tests)
- [ ] `memory.md` size cap triggers `MemoryCapExceededError` when exceeded (manual test)
- [ ] `bek-compact` CLI runs successfully on current `memory.md`
- [ ] BEK daemon restarts cleanly with new modules wired
- [ ] One end-to-end session with BEK confirms: ledger appears in prompt, linter rejects a forced violation, gate refuses bare PLAN_READY

## Self-review checklist

- [x] Every cited file path verified to exist (or marked new)
- [x] Every task scoped to ~45–60 min
- [x] Collisions resolved with explicit per-task carve-outs
- [x] DAG produces a total ordering (no cycles)
- [x] Verification block is observable, not LLM-attestation

## Sign-off

Operator approves this plan → cursor-dispatch the 6 prompts in waves per DAG.
