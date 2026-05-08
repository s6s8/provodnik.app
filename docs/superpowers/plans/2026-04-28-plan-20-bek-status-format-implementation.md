# Plan 20 — BEK status report format + /done polish

**Spec:** `docs/superpowers/specs/2026-04-28-bek-status-format-and-done-polish-design.md`
**Date:** 2026-04-28
**Owner:** orchestrator
**Total effort:** ~20 min across 2 tasks

---

## Goal

Two surgical changes to BEK so the Telegram status-check + `/done` workflow is reliable and consistent:

1. **Status report format** — a prompt-level rule + procedure that turns free-text status queries into a deterministic ✅/⏳/❌ table per plan.
2. **`/done` polish** — small upgrade to the existing `/done` command: refuse on already-IDLE session, refine reply text.

Driven by the 2026-04-28 conversation where Alex described the canonical workflow: brainstorm → orchestrator implements → ask BEK status → if all ✅, type `/done`.

## Non-goals

- No code-level archive gate on `/done` (Alex is the gate).
- No separate `/abandon` command.
- No daemon-side git/plan parsing.
- No upgrade to the existing `/status` slash command.

## Task summary

| # | Task | Files | Effort | Depends |
|---|------|-------|--------|---------|
| 1 | STATUS REPORT FORMAT prompt block | `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` | 15 min | — |
| 2 | `/done` idle guard + reply text update | `_archive/bek-frozen-2026-05-08/src/commands.ts` | 5 min | — |

## Dependency DAG

```
T1 (prompt block)   ┐
                    ├─ both independent — disjoint files, no collision
T2 (/done polish)   ┘
```

**Wave A** (parallel-safe): T1, T2.

For sequential implementation: T1 → T2 (or any order).

## Collisions

**None.** T1 only touches `system-prompt.ts`; T2 only touches `commands.ts`.

## Per-task prompt files

- `_archive/bek-frozen-2026-05-08/prompts/out/plan-20-task-1.md` — STATUS REPORT FORMAT block
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-20-task-2.md` — `/done` polish

## Verification (whole plan)

After both tasks:

- [ ] `bun run typecheck` clean
- [ ] `bun test` all green (199 → 199, no test changes)
- [ ] `pm2 restart quantumbek` — daemon boots clean, "QuantumBEK online" in logs
- [ ] Smoke 1: send `проверь статус plan 14` → table renders with ✅ + commit shas
- [ ] Smoke 2: send `что было в плане 12` (non-status query) → prose response, NOT the table
- [ ] Smoke 3: send `проверь` with no plan in session → `Какой план?` clarification
- [ ] Smoke 4: type `/done` from IDLE state → `Нечего закрывать.`
- [ ] Smoke 5: brainstorm a tiny plan → type `/done` → `Сессия закрыта. Готов к новому брейнсторму.` + state transitions to IDLE

## Self-review

- [x] Every cited file path exists (verified `system-prompt.ts`, `commands.ts`)
- [x] Both tasks scoped under 20 min
- [x] No collisions (disjoint file sets)
- [x] DAG produces total ordering (or full parallel)
- [x] Verification mixes mechanical (typecheck/tests) + observational (5 manual smokes)
- [x] Spec scope held — `/done` polish stays small (idle guard + 4-word reply tweak), no archive-gate creep

## Approval gate

User reviews spec + plan. On approval → orchestrator implements directly (~30 LOC; same shape as Plan 14.1 hotfix). No cursor-agent or subagent dispatch needed for this size.
