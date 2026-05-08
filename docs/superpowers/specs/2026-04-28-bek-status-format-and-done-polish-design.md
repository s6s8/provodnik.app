# Plan 20 — BEK status report format + /done polish

**Date**: 2026-04-28
**Status**: Draft, awaiting user approval
**Owner**: orchestrator
**Audience**: orchestrator-direct (small enough — same shape as Plan 14.1)
**Related**:
- `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` (target for STATUS REPORT FORMAT block)
- `_archive/bek-frozen-2026-05-08/src/commands.ts` (existing `/done` at lines 83–90; small polish)
- Plan 14 for the placement-pattern precedent (CRITICAL RULES + final REMINDER)

---

## 1. Workflow this plan supports

```
Alex + BEK         brainstorm in Telegram          → plan (in BEK's session)
       ↓
orchestrator       implements + commits             → [plan-N] task-M: <description>
       ↓
Alex asks BEK      "проверь статус"                 → BEK responds with task table
       ↓
Alex types         /done                            → BEK archives session, returns to IDLE
       ↓
loop
```

BEK is the recordkeeper for what was *agreed*. Orchestrator is the recordkeeper for what was *shipped*. The status table reconciles them. `/done` closes the cycle.

## 2. Failure modes this plan fixes

1. **Status replies inconsistent.** Free-text "проверь статус" sometimes returns a table, sometimes prose, sometimes wrong task counts. No prompt-level rule defines the format or the data-gathering procedure.
2. **`/done` archives unconditionally.** Even an already-IDLE session gets re-archived. Misclick = silent no-op instead of feedback. Reply text ("Готов к следующей задаче") doesn't reflect the brainstorm-loop intent.

## 3. Non-goals

- No auto-blocking `/done` on incomplete plans (Alex is the gate; the status table is the audit record).
- No separate `/abandon` (`/done` archives regardless of completeness — see §6).
- No daemon-side git/plan parsing (Claude does the gathering with Bash + Read).
- No upgrade to the existing `/status` slash command — it stays as terse state-machine indicator. Free text is the path for the per-task table.
- No multi-plan disambiguation in `/done` — archives whatever's current.

## 4. Component 1 — STATUS REPORT FORMAT

### 4.1 Where it lives

New section in `BEK_SYSTEM_PROMPT` placed after `PHASE UPDATE TEMPLATES` and before the final `REMINDER`. Single placement, no REMINDER reinforcement (specialized scenario, not a global rule — over-placement dilutes the wrapper-rule attention budget).

### 4.2 Triggers

Free-text phrases (Russian + English). Slash `/status` is unaffected — it keeps its terse state-machine output via `commands.ts`.

Russian: «статус», «проверь работу», «всё готово», «всё доделал», «как дела с планом», «что готово».
English: `check status`, `is it done`, `what's the status`, `check progress`, `are we done`.

### 4.3 Format

```
**Plan {N} — статус по задачам:**

✅ T1 — короткое описание ({commit_sha})
✅ T2 — короткое описание ({commit_sha})
🔄 T3 — короткое описание (in progress)
⏳ T4 — короткое описание (pending)
❌ T5 — короткое описание (blocked: {причина})

Всё. {done} из {total}.
```

Always inside `TELEGRAM_START` / `TELEGRAM_END`. Standard sanitizer runs as on every TELEGRAM block — no new code path.

### 4.4 Rules

- **`✅` requires commit_sha.** No sha → status is `⏳` or `🔄`, never `✅`. Forces honest reporting.
- **Plan selection.** If Alex specified a number, use that. Otherwise pick the most recently discussed plan in the session. If multiple plans are equally recent, ask «Какой план?». If no plan was discussed, ask the same.
- **Data gathering (procedural).** Before answering:
  1. Run `git log --grep "\[plan-N\]" --oneline -30` to enumerate shipped commits.
  2. If a plan file exists at `docs/superpowers/plans/*plan-N*`, Read it and parse the task table.
  3. Otherwise fall back to session memory + recent conversation for the agreed task list.
  4. Match each `T{n}` to a commit by parsing `task-N:` prefix in commit messages.
- **Description.** Short Russian summary of the task's intent. No tool names, no file paths (sanitizer strips them anyway, but be pre-emptive).
- **No commentary between rows.** Just the list + the summary line. Format identical for 1-task and 20-task plans.

### 4.5 Why it works

The Plan 14 pattern proved this approach: a clearly-named section + an explicit procedure + a worked example moved BEK from "sometimes-correct" to "consistently correct" on the wrapper rule. Same shape applied here.

## 5. Component 2 — `/done` polish

### 5.1 Current behavior (commands.ts:83–90)

```ts
if (command === 'done') {
  const session = await sessions.readSession();
  const slug = session?.task_slug ?? 'session';
  await sessions.archive(slug);
  await sessions.writeSession({ state: 'IDLE', claude_session_id: null, group_id: config.group_id });
  await ctx.send(sanitize('Сессия закрыта. Готов к следующей задаче.'));
  await log(`[bek] /done — session archived (${slug}), reset to IDLE`);
  return;
}
```

### 5.2 Two changes

**A. Idle-state guard.** If session is missing or already IDLE, refuse:

```ts
if (!session || session.state === 'IDLE') {
  await ctx.send('Нечего закрывать.');
  return;
}
```

**B. Reply text update.** "Готов к следующей задаче" → "Готов к новому брейнсторму." More accurate — `/done` precedes the next brainstorm cycle, not arbitrary tasks.

### 5.3 Why minimal

Existing code already does the right thing (archive + reset). Only failure modes are (a) silent no-op on already-IDLE and (b) imprecise reply text. Both surface-level.

## 6. Why no auto-gate on `/done`

The user explicitly chose: Alex eyeballs the status table, then decides. Three reasons this is right:

1. **Not all tasks have commits.** Manual ops (DB migrations applied via Supabase API), deferred-with-evidence tasks, and hotfixes don't always have a clean `[plan-N] task-M:` mapping. A strict gate would block legitimate archives.
2. **Alex sometimes wants to abandon a plan.** Single command for both finish-and-abandon keeps the surface minimal. The chat history shows whether the plan was complete when archived — that's the audit.
3. **Adding a gate adds a code path with edge cases.** Sticking to the free-text inspection pattern means there's only one source of truth (Claude's reply, with the table) and one action (Alex types `/done`).

## 7. Tests

Observational only — neither component is unit-testable.

**Status format:**
- Send `проверь статус plan 14` → expect the table with shas.
- Send `is plan 14 done?` → same table, same data.
- Send `что было в плане 12` (NOT a status query) → expect prose, no table.
- Send `проверь` with no plan in session → expect «Какой план?», not a guess.

**`/done` polish:**
- `/done` after current session is IDLE → expect «Нечего закрывать.», state stays IDLE.
- `/done` after BRAINSTORMING/PLAN_READY → expect «Сессия закрыта. Готов к новому брейнсторму.», state → IDLE.

## 8. Files touched

| File | Change | LOC |
|------|--------|-----|
| `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` | NEW STATUS REPORT FORMAT block (between PHASE UPDATE TEMPLATES and final REMINDER) | +28 |
| `_archive/bek-frozen-2026-05-08/src/commands.ts` | Idle guard + reply text in `/done` block | +4 / -1 |

Total: ~30 LOC.

## 9. Effort

~20 min:
- T1 (prompt block + verification): 15 min
- T2 (commands.ts edits + verification): 5 min
- Restart pm2 + manual smoke: 5 min

## 10. Spec self-review

- [x] Triggers are concrete (listed verbatim, both languages).
- [x] Format is exact (template + emoji semantics + summary).
- [x] Rules are unambiguous (`✅` requires sha; plan selection algorithm; data sources in priority order).
- [x] Both components are scoped to disjoint files (no collision).
- [x] Non-goals enumerated (no gate, no `/abandon`, no daemon-side parsing).
- [x] Verification covers both happy paths and the failure modes the plan claims to fix.

## 11. Approval gate

User reviews spec + plan. On approval → orchestrator implements directly (~30 LOC, same shape as Plan 14.1; no cursor-agent or subagent dispatch needed).
