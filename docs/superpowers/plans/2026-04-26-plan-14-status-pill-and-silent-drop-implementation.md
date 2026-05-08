# Plan 14 — BEK status pill + silent-drop guard

**Spec:** `docs/superpowers/specs/2026-04-26-bek-status-pill-design.md`
**Date:** 2026-04-26
**Owner:** orchestrator
**Total effort:** ~75 min across 4 tasks

---

## Goal

Ship three coupled improvements to BEK's user-facing reliability:

1. **Status pill** — placeholder Telegram message with spinning Braille frame + elapsed time, deleted when first `TELEGRAM` signal arrives. Visibility during 30s–2min Claude runs.
2. **Silent-drop fallback** — if `runClaude` exits successfully but emitted no `TELEGRAM` signals, treat the accumulated assistant text as the reply.
3. **System-prompt tightening** — surgical edits making the `TELEGRAM_START`/`END` requirement harder to ignore.

Driven by the 2026-04-26 18:40:31 incident: Claude ran 56s, answered "Plan 14" in plain text, never wrapped it; daemon dropped the answer; user waited indefinitely.

## Non-goals

- No app-code changes
- No new persona text or privacy rule changes
- No retry-Claude on silent-drop (cheaper to ship the buffer once + log incident)
- No phase/tool data in the pill (privacy rule)

## Task summary

| # | Task | Files | Effort | Depends |
|---|------|-------|--------|---------|
| 1 | Status pill module | `status-pill.ts` (NEW) | 25 min | — |
| 2 | Silent-drop helper + IncidentKind | `silent-drop.ts` (NEW), `test/silent-drop.test.ts` (NEW), `types/incident.ts` | 20 min | — |
| 3 | System prompt tightening | `system-prompt.ts` | 5 min | — |
| 4 | Daemon wiring | `bek-daemon.ts` | 25 min | T1, T2 |

## Dependency DAG

```
T1 (status-pill)   ┐
T2 (silent-drop)   ├─→ T4 (daemon wiring)
T3 (prompt tighten) ┘ (T3 ships independently; T4 doesn't depend on T3)
```

**Wave A** (parallel): T1, T2, T3
**Wave B** (after T1 + T2): T4

For manual sequential implementation: T1 → T2 → T3 → T4.

## Collisions

**None.** Each task owns a disjoint file set:
- T1: only `status-pill.ts` (NEW)
- T2: only `silent-drop.ts` (NEW), `test/silent-drop.test.ts` (NEW), `types/incident.ts`
- T3: only `system-prompt.ts`
- T4: only `bek-daemon.ts`

Imports cross task boundaries but no two tasks edit the same file. Clean DAG.

## Per-task prompt files

- `_archive/bek-frozen-2026-05-08/prompts/out/plan-14-task-1.md` — status pill module
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-14-task-2.md` — silent-drop helper
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-14-task-3.md` — system prompt tightening
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-14-task-4.md` — daemon wiring

## Verification (whole plan)

After all 4 tasks merge:
- [ ] `bun run typecheck` clean
- [ ] `bun test` all green (was 195 → 199 with 4 new silent-drop tests)
- [ ] BEK daemon restarts cleanly with new modules
- [ ] Manual smoke 1: send text message, status pill appears, frame advances every ~3s, pill disappears before first content chunk
- [ ] Manual smoke 2: force-kill daemon mid-run, observe frozen pill frame remains visible
- [ ] Manual smoke 3 (silent-drop simulation): trigger a Claude response without TELEGRAM markers (e.g. via brief prompt that bypasses persona); verify fallback path delivers the buffer + incident logged

## Self-review

- [x] Every cited file path verified (3 existing + 3 new explicitly marked)
- [x] Every task scoped 5–25 min
- [x] No collisions (disjoint file sets)
- [x] DAG produces total ordering
- [x] Verification block mixes mechanical (typecheck/tests) + observable (live smoke)
- [x] Incident-driven justification for Components 2+3 cited verbatim from stream log

## Approval gate

User reviews this plan + spec. On approval → orchestrator implements directly (~150 LOC across 6 files; same shape as Plan 13).
