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
