# BEK bloat railguards + brainstorm quality gates — design spec

**Date**: 2026-04-26
**Status**: Draft, awaiting user review
**Owner**: orchestrator (Carbon)
**Audience**: cursor-agent (executor)
**Related artifacts**:
- `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` — current persona + Кодекс anchor
- `_archive/bek-frozen-2026-05-08/sessions/memory.md` — current LEARN sink (showing bloat symptoms)
- `_archive/bek-frozen-2026-05-08/sessions/active/conversation.md` — 2026-04-26 transcript that exposed the failures
- `_archive/bek-frozen-2026-05-08/sot/HOT.md`, `_archive/bek-frozen-2026-05-08/sot/INDEX.md` — landmines + ID lookup

---

## 1. Goal

Stop BEK from drifting in two ways that surfaced in the 2026-04-26 brainstorming session:

1. **File bloat** — `memory.md` already shows duplicate-date prefixes (`[2026-04-22] [2026-04-22]`), encoding rot (cp1252→UTF-8 mis-decode on Cyrillic), topic duplication (request types appear twice in different words), and freeform-prose entries that can't be mechanically dedup'd. Adding new state files (concept ledger, etc.) reproduces the anti-pattern unless schema-on-write + compact pattern is built in from the start.

2. **Brainstorm quality** — at 10:25 BEK declared "Все планы дня финализированы". At 10:35 Alex caught a defect: Plan 11 Task 2 was "save groupSizeMax" — but the form already had that field, only the action wiring was missing. Кодекс Rule 1 («Самопроверка перед вопросом») forbids this exact failure but BEK has no enforcement. Persona discipline alone is not reliable.

Four components, sequenced. Each independently shippable.

## 2. Non-goals

- No changes to `provodnik.app/` code.
- No new Telegram persona text; Кодекс «Протуберанец» v1 stays as the source of truth.
- No retroactive rewrite of garbled cp1252 lines in current `memory.md` — irreversible without source data.
- Not building a general-purpose LLM-output linter; rules are BEK-specific and Кодекс-derived.

## 3. Architecture overview

```
Alex → Telegram → daemon → claude-runner
                              ↓
                  prompt assembly:
                    system-prompt + memory + CONCEPT LEDGER + conversation tail
                              ↓
                  Claude generates reply
                              ↓
                  parse emissions (TELEGRAM, STATE, LEARN)
                              ↓
              ┌──────────────┼──────────────────────┐
              ↓              ↓                       ↓
            LEARN          STATE:PLAN_READY       TELEGRAM
              ↓              ↓                       ↓
          memory.ts       checklist intercept    sanitizer
        (schema +         (component 4)              ↓
         dedup +                                 reply-linter
         hard cap)                              (component 3)
                                                     ↓
                                                send / retry
                              ↓
                  concepts ledger update from outgoing+incoming text
                              ↓
                  on session-archive → bek-compact (component 1)
```

Four components map onto this flow. Data direction is one-way; no cycles.

## 4. Component 1 — `memory.md` schema + `bek-compact` CLI

### 4.1 Problem
`_archive/bek-frozen-2026-05-08/sessions/memory.md` is freeform prose. Symptoms today (2026-04-26):
- Encoding rot on ~15 entries (Cyrillic written as cp1252, re-read as UTF-8, irreversibly garbled)
- Doubled date prefixes (`[2026-04-22] [2026-04-22]`) on ~10 entries
- Topic duplication (lines 10 + 11 both describe request-type terminology)
- 92 lines now, growing every session, no cap, no schema

### 4.2 Schema for new entries

Every new LEARN entry conforms to one line:

```
[YYYY-MM-DD] [tag] subject — fact
```

- `tag`: lowercase, single token, from enum `{misc, schema, ux, business, content, process, paths, product, style, constraints, communication}`. New tags require a system-prompt update.
- `subject`: 1–6 words naming the thing this fact is about (canonical noun phrase).
- `fact`: one sentence, ≤ 200 chars.

Multi-line LEARN_START/LEARN_END entries get rejected unless the first line still conforms. Rejection logged to `incidents.jsonl`; daemon does not silently drop.

Existing freeform entries stay (we don't rewrite history) — they age out via compact (§4.4).

### 4.3 Dedup-on-write

Before append, `memory.ts`:
1. Reads file, parses entries by line
2. Normalizes the new entry's `[tag] subject` (lowercase + Unicode NFC + collapse whitespace)
3. If a matching entry exists → replace in place (newest fact wins)
4. Else → append at end of correct tag section

### 4.4 Encoding lock

`memory.ts` reads/writes with `{ encoding: 'utf8' }` exclusively. One-time audit pass: try `iconv -f cp1252 -t utf-8 -c` on garbled lines; lines that round-trip cleanly are replaced inline, the rest stay until they age out.

### 4.5 `bek-compact` CLI

New file: `_archive/bek-frozen-2026-05-08/src/cli/bek-compact.ts`. Executable via `tsx`.

Behavior:
1. Read `memory.md`, parse entries
2. Group by `[tag] subject`, keep newest per group
3. Sort by tag (alphabetical), then by date desc within tag
4. Move entries with date older than 60 days to `memory-archive.md` (append-only)
5. Write rebuilt `memory.md`
6. Print summary: `kept N · dropped M · archived K · bytes before/after`

Triggers:
- **Manual**: `bun run _archive/bek-frozen-2026-05-08/src/cli/bek-compact.ts`
- **Auto**: on session-archive (when `active/` is moved to `archive/<session>/`)
- **Auto**: on hard-cap hit (§4.6 — daemon refuses LEARN writes until operator runs compact)

### 4.6 Hard cap

200 lines in `memory.md`. Past cap, `appendLearn()` throws `MemoryCapExceededError` and writes incident. Operator runs `bek-compact`. No silent overflow, no append-and-truncate.

### 4.7 Files touched
- `_archive/bek-frozen-2026-05-08/src/memory.ts` — schema validator, dedup-on-write, encoding lock, hard-cap check
- `_archive/bek-frozen-2026-05-08/src/cli/bek-compact.ts` — new
- `_archive/bek-frozen-2026-05-08/sessions/memory.md` — one-time audit pass for encoding (no new entries written by this task)

---

## 5. Component 2 — `concepts.md` (per-session ledger)

### 5.1 Problem
Within one session (2026-04-26 transcript), BEK referred to one block as «Запросы путешественников» / «блок с карточками реальных запросов» / «блок Запросы путешественников». Three names for one thing. Alex's stated #1 product pain (memory line 15) is "duplication of functions under different names" across years of the codebase. BEK is reproducing the disease in real-time dialogue.

### 5.2 File
`_archive/bek-frozen-2026-05-08/sessions/active/concepts.md` — lives only for active session. Archived with session into `archive/<session>/concepts.md`.

### 5.3 Schema

One entry per line:

```
[HH:MM] term — variants: a, b, c — context: short
```

- `term`: canonical form, taken from Alex's first naming
- `variants`: ad-hoc renamings used same session, comma-separated, dedup'd
- `context`: 1 short noun phrase (block / field / mode / page-element / etc.)

### 5.4 Lifecycle

1. **Extraction**: daemon parses every Telegram message (Alex's incoming + BEK's outgoing) for *quoted nouns* — text in «...» or markdown bold.
2. **Append-or-augment**:
   - New term not in ledger → append entry, `term` = first occurrence verbatim
   - Term already in ledger but message used a non-canonical phrasing → add to `variants`
3. **Prompt augmentation**: before each `claude-runner` call, ledger is rendered as a `[CONCEPT LEDGER]` block in the prompt assembly (see `renderContextBlocks` in `system-prompt.ts`).
4. **Prompt rule** (new, added to `system-prompt.ts`):
   > "When referring to a concept present in CONCEPT LEDGER, use the exact `term` string. If a synonym is needed, it must already be in that entry's `variants`. Otherwise you are introducing a new concept — flag it with «новое: ...» so the operator can decide."

### 5.5 Edit-not-append on rename

If Alex explicitly renames («теперь это X, не Y» / «называем X» / «переименовываем в X»), daemon detects the keyword + neighboring quoted noun, finds the matching ledger entry, rewrites `term` (old becomes a `variant`). Daemon does NOT auto-detect implicit renames — only explicit keyword triggers.

### 5.6 Hard cap

80 entries. Past cap, daemon strips oldest entries (FIFO). Short session lifetime makes FIFO acceptable; no compact CLI needed for this file.

### 5.7 Files touched
- `_archive/bek-frozen-2026-05-08/src/concepts.ts` — new module: extract / append-or-augment / render
- `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` — add `[CONCEPT LEDGER]` to `renderContextBlocks` + new prompt rule
- `_archive/bek-frozen-2026-05-08/src/claude-runner.ts` — wire ledger update before/after each turn

---

## 6. Component 3 — reply pre-flight linter

### 6.1 Problem
2026-04-26 BEK shipped:
- "1200px / 672px / 960px" in Telegram (Кодекс Rule 3 violation: visual landmarks only for non-technical PO)
- "Разобрался. Отвечаю по двум вопросам." (persona violation: no warm-up preambles)
- "Добавляю в Plan 11 как задачу 2 ... Или хочешь отдельный план?" (two-question close, forces compound answer)
- "был непрочным" (unproofread Russian — "непрочный" = fragile, meant "непонятный")

System prompt has these rules. BEK does not enforce them on itself when generating fast.

### 6.2 Module
`_archive/bek-frozen-2026-05-08/src/reply-linter.ts` — pure function, no I/O.

```ts
export interface LinterFinding {
  rule: string;            // rule id, e.g. 'pixel-without-landmark'
  severity: 'reject' | 'warn';
  match: string;           // offending substring
  hint: string;            // Russian hint to BEK on how to fix
}

export function lintReply(
  text: string,
  ctx: { ledger: ConceptLedger; lastAlexMessage: string }
): LinterFinding[];
```

### 6.3 Rules (v1)

1. **`pixel-without-landmark`** — regex `\b\d{2,4}\s*px\b` not in same paragraph as a token from `{форма, блок, полоска, панель, колонка, ряд, карточка, кнопка}`. Severity: **reject**.
2. **`dev-jargon`** — any of `{шапка, сайдбар, хедер, футер, tabs|табы, апи|API, компонент, проп|пропс, стейт}` present. Severity: **reject**.
3. **`two-question-close`** — last paragraph contains > 1 `?`. Severity: **reject**.
4. **`literal-question-not-answered`** — previous Alex turn ends with `?` AND none of the question's content nouns/interrogatives appear in BEK's first 2 sentences. Severity: **reject**. (Heuristic, will have false positives — see §10.)
5. **`fabricated-stats`** — `\b(\d{1,3}\s*%|в \d+ раз|большинство|всегда|никогда)\b` without an adjacent code/file citation. Severity: **warn**.
6. **`non-ledger-noun`** — quoted noun «...» not in `concepts.md` ledger AND not in last Alex message. Severity: **warn** (might be Alex introducing it via image — daemon decides).

### 6.4 Hook into pipeline

`sanitizer.ts` pipeline (current order: extract signals → sanitize Telegram blocks → send) gets a new stage between sanitize and send: **lint**.

- Any `reject` finding → reply NOT sent. Daemon prepends `[REJECTED REPLY — fix these violations: <findings>]` to next prompt and re-runs `claude-runner` once. Up to **2 retry attempts**.
- All `warn` findings → logged to `incidents.jsonl`, message sends.
- After 2 retries fail → original message sends with `[linter-failed]` flag in `incidents.jsonl`. Bounded loop, no infinite regen.

### 6.5 Files touched
- `_archive/bek-frozen-2026-05-08/src/reply-linter.ts` — new
- `_archive/bek-frozen-2026-05-08/src/sanitizer.ts` — add lint stage
- `_archive/bek-frozen-2026-05-08/src/claude-runner.ts` — handle reject + retry path
- `_archive/bek-frozen-2026-05-08/src/test/reply-linter.test.ts` — new, ≥ 6 tests (one per rule)

---

## 7. Component 4 — `PLAN_READY` verification gate

### 7.1 Problem
At 10:25 on 2026-04-26 BEK emitted `STATE: PLAN_READY` with "Все планы дня финализированы". At 10:35 Alex caught the defect (Task 2 fixed something already in the form). Кодекс Rule 1 («Самопроверка перед вопросом») demands self-verification but it never runs unless Alex prompts it.

### 7.2 Mechanism

Two-layer (belt and suspenders):

**Prompt layer** — new mandatory section in `system-prompt.ts` between EXECUTION BOUNDARY and STATE MACHINE:

> "Before emitting `STATE: PLAN_READY`, you MUST output a checklist block in TELEGRAM_START/END with one yes/no per Кодекс rule (1–7) that applies to plan finalization. If any answer is no, you may NOT emit PLAN_READY — downgrade to BRAINSTORMING and explain in plain Russian which check failed and what's needed to resolve."

**Code layer** — emission parser in `claude-runner.ts`. If it sees `STATE: PLAN_READY` without a preceding checklist block matching the schema, it intercepts:
- Demote state back to `BRAINSTORMING`
- Inject forced retry: `[VERIFICATION GATE — you emitted PLAN_READY without the checklist. Run it now in Russian, then decide.]`
- Up to 1 retry then ship as `BRAINSTORMING` regardless (don't loop)

### 7.3 Checklist schema (what BEK emits)

```
ПРОВЕРКА ПЕРЕД PLAN_READY:
1. Самопроверка: ни одна задача не дублирует уже сделанное — да / нет [+ обоснование если нет]
2. Описание UI: визуальные ориентиры, без жаргона — да / нет
3. Числа: только из кода/измерений — да / нет
4. Один вход: ни одна задача не создаёт второй вход в существующую функцию — да / нет
5. Терминология: ключевые слова из CONCEPT LEDGER — да / нет
6. Обязательства: проверены commitments из предыдущих планов (`archive/*/plan.md`) — да / нет
```

If any "нет" → BEK explains in next paragraph + downgrades. **No autofix.** Alex is in the loop, by design. Auto-fixing silent plan revisions behind Alex's back is exactly the failure mode we're trying to prevent.

### 7.4 Files touched
- `_archive/bek-frozen-2026-05-08/src/system-prompt.ts` — new mandatory section
- `_archive/bek-frozen-2026-05-08/src/claude-runner.ts` — emission parser intercept + forced retry path
- `_archive/bek-frozen-2026-05-08/src/test/verification-gate.test.ts` — new, ≥ 4 tests (PLAN_READY without checklist intercepted; checklist with all "да" passes; checklist with one "нет" demotes; retry budget respected)

---

## 8. Sequencing

Order if all four are green-lit:

1. **Component 1** (memory schema + bek-compact) — establishes the schema-on-write + compact-or-error pattern that every other component relies on. ~1.5 hrs.
2. **Component 2** (concepts.md) — depends on 1 (schema discipline). ~1.0 hrs.
3. **Component 3** (reply linter) — depends on 2 (one rule reads the ledger). ~1.5 hrs.
4. **Component 4** (PLAN_READY gate) — depends on 2 (checklist Rule 5 reads ledger). ~1.5 hrs.

Total: ~5.5 hrs of cursor-agent work, splittable across 4 tasks.

Components 1 and 2 can run in parallel if the agent reads schema-discipline-pattern from this spec. Components 3 and 4 must serialize after 2.

---

## 9. Decisions made (not asking again)

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Garbled cp1252 lines in memory.md | Leave as-is, age out via 60d compact | Irreversible without source data; fabricating recovery is worse than aging out |
| 2 | bek-compact triggers | Auto on archive + manual CLI + auto on hard-cap | Three triggers, one binary; no surprise overflow |
| 3 | Linter on FAIL | Hard reject + 2 retries with feedback, then ship-with-warning | Bounded loop, no infinite regen, no silent drops |
| 4 | Verification gate on FAIL | Downgrade to BRAINSTORMING + explain to Alex; **no autofix** | Silent plan revisions behind Alex's back is the failure we're preventing |
| 5 | Concept ledger lifetime | Session-scoped (active/), archived with session | Fresh ledger per brainstorm; cross-session canonical terms live in memory.md `[product]` |
| 6 | Encoding fix scope | Forward-only UTF-8 enforce; existing rot ages out | Minimal-blast-radius change |
| 7 | New tags for memory.md | Closed enum (extendable but requires prompt update) | Prevents tag-drift `[misc] / [Misc] / [other]` triplet bloat |
| 8 | Linter rule 4 false positives | Accepted — heuristic, retry loop is bounded | Better noisy-rejects than silent persona drift |

## 10. Known weaknesses (operator should be aware)

- **Linter rule 4 (literal-question-not-answered)** is a heuristic. Will false-reject when Alex's question is rhetorical or when the answer is implicit. Mitigation: 2-retry budget then ship-with-warning.
- **Concept ledger extraction** depends on Alex/BEK using «...» or **bold** to name things. Plain-prose nouns slip past. Acceptable for v1; tighten later if needed.
- **Verification gate Rule 1 (Самопроверка)** still depends on BEK reading old plan archives and answering honestly. Code can verify the checklist *exists*, not whether each "да" is truthful. Hard limit of LLM self-attestation; partial mitigation only.
- **Hard caps (200 / 80) are guesses.** Operator should adjust after 2–3 sessions of real data. No automated tuning.

## 11. Spec self-review

- Placeholders / TBDs: none
- Internal consistency: §3 data flow matches §4–§7 component descriptions
- Scope: 4 components, ~5.5 hrs, single plan — does not need decomposition
- Ambiguity: every FAIL path has a concrete, named behavior (§9 decision table)
- Forbidden-term check: no "шапка" / "сайдбар" / etc. in spec body (would be ironic)

## 12. Approval gate

User reviews this file. On approval → `/writing-plans` consumes this spec and produces `docs/superpowers/plans/2026-04-26-bek-bloat-railguards-implementation.md` + per-task prompts in `_archive/bek-frozen-2026-05-08/prompts/out/plan-NN-task-K.md`.

Note: approving this spec lifts the "no more modifying BEK for now" freeze stated earlier in this session.
