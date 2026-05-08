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
