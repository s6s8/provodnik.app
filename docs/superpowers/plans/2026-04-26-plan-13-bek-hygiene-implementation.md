# Plan 13 — BEK hygiene (audit follow-up)

**Spec:** `docs/superpowers/specs/2026-04-26-bek-full-audit-and-refactor.md`
**Date:** 2026-04-26
**Owner:** orchestrator
**Total effort:** ~4 hrs across 6 tasks

---

## Goal

Implement items 1–10 from the audit's prioritized fix list (§8). Bring BEK from "operational" to "polished autonomous system" without changing architecture. Items 11–13 (GramIO typed errors, system-prompt split, ecosystem.config refactor) deferred.

## Non-goals

- No architectural changes (no GramIO `.onError` migration, no system-prompt split).
- No `provodnik.app/` code changes.
- No DB schema changes.

## Task summary

| # | Task | Audit IDs | Effort | Files |
|---|------|-----------|--------|-------|
| 1 | Observability SSE tail rewrite | B1 | 35 min | `observability/server.ts` |
| 2 | Logrotate install + extended stream-purge | R1, R2 | 25 min | shell + `bek-daemon-helpers.ts` |
| 3 | Concepts substring fix + zod config schema | B4, R4 | 40 min | `concepts.ts`, `test/concepts.test.ts`, `config.ts`, `test/config.test.ts` |
| 4 | Share `enqueueIncoming` helper + collapse retry rules | S2, S3 | 50 min | `attachments.ts`, `voice.ts`, `retry.ts`, `test/retry.test.ts` |
| 5 | Fix double-log to conversation.md (skipAppend flag) | B2 | 35 min | `bek-daemon.ts`, `attachments.ts`, `voice.ts` |
| 6 | Incidents observability hardening | R3, R5, R6 | 50 min | `heartbeat.ts`, `attachments.ts`, `voice.ts`, `incidents.ts`, `types/incident.ts` |

## Dependency DAG

```
T1 (SSE tail)        ┐
T2 (logrotate+purge) ├─→ all parallel-safe: independent file targets
T3 (concepts+config) ┘
                          
T4 (helper + retry refactor) ──→ T5 (uses helper) ──→ T6 (incidents in updated paths)
```

**Wave A** (parallel): T1, T2, T3, T4
**Wave B** (after T4): T5
**Wave C** (after T5): T6

For manual implementation sequential order: T1 → T2 → T3 → T4 → T5 → T6.

## Collision resolutions

| File | Touched by | Resolution |
|------|------------|------------|
| `attachments.ts` | T4 (refactor to `enqueueIncoming`), T5 (skipAppend), T6 (recordIncident on error) | T4 first establishes new shape; T5 adds opt-out flag in shared helper; T6 adds incident-recording inside the helper. |
| `voice.ts` | T4, T5, T6 | Same as attachments — T4 → T5 → T6 in that order. |
| `bek-daemon.ts` | T5 (handleMessage signature gets `skipAppend`), T6 (no daemon edits — incidents fire inside attachment/voice paths) | T5 only. |
| `incidents.ts` | T6 (sanitize error.message before persist) | T6 only. |
| `types/incident.ts` | T6 (add `attachment_error`, `voice_error`, `heartbeat_write_failed`) | T6 only. |
| `bek-daemon-helpers.ts` | T2 (extend purge) | T2 only. |

## Sequencing decisions

- **T1, T2, T3 are independent** — different files, can run in parallel or any order.
- **T4 before T5** — T5 needs the consolidated `enqueueIncoming` helper to add `skipAppend` cleanly. Reverse order would require T5 to edit the duplicate code in two places, then T4 to consolidate; net more diff churn.
- **T5 before T6** — T6 adds `recordIncident` calls inside attachment/voice error paths. Cleaner once those paths have settled into their final shape from T4 + T5.
- **T2 logrotate is one-time pm2 setup**, not a code change; documented in the task prompt and gated for user confirmation.

## Verification (whole plan)

After all 6 tasks:
- [ ] `bun run typecheck` clean
- [ ] `bun test` — all green (was 183 + ~10 new tests)
- [ ] `pm2 list` shows logrotate module installed (`pm2-logrotate`)
- [ ] One end-to-end Telegram message round-trip with image attachment confirms no duplicate conversation.md lines
- [ ] `/incidents` endpoint returns sanitized error messages (no Windows paths)
- [ ] BEK daemon restart clean

## Per-task prompt files

- `_archive/bek-frozen-2026-05-08/prompts/out/plan-13-task-1.md` — observability SSE tail
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-13-task-2.md` — logrotate + stream-purge extension
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-13-task-3.md` — concepts substring + zod config
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-13-task-4.md` — enqueueIncoming + retry rules
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-13-task-5.md` — fix double-log
- `_archive/bek-frozen-2026-05-08/prompts/out/plan-13-task-6.md` — incidents hardening

## Self-review

- [x] Every cited file path verified to exist (audit already grep-confirmed)
- [x] Every task scoped 25–50 min
- [x] Collisions enumerated with explicit per-task carve-outs
- [x] DAG produces total ordering
- [x] Verification block is observable, not LLM-attestation
- [x] No new files except tests
- [x] No app-code changes
