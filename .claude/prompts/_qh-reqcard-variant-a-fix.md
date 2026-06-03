# Task: req-cards dev playground — fix line 1 city truncation (Variant A refinement)

File: `src/app/dev/req-cards/page.tsx` ONLY. Do not touch anything else.

Problem: in `RequestCardThemesTopPrototype`, line 1 currently holds the location PLUS two badges on the right (group-type `CountPrototypeGroupTypeBadge` + `GuideStatusBadge`). In the 4-column grid at 1280px the card is narrow, so both badges crush the city name down to "М..." / "Т...". The city must stay readable.

Fix:
- **Line 1:** keep location (left, `min-w-0 truncate`) and ONLY the `GuideStatusBadge` on the right. Remove the `CountPrototypeGroupTypeBadge` from line 1.
- **Line 2 (meta row):** put the date text, then the `CountPrototypeGroupTypeBadge` («Открытая»/«Своя группа»), then the «Гибкие даты» chip (when `datesFlexible`) — all in one wrapping flex row (`flex flex-wrap items-center gap-1.5`). The date `<p>` keeps `truncate`/`min-w-0` safe behavior but should not force the badges off; let the row wrap naturally.
- Themes rows (lines 3–4) and the bottom row (avatars+count / price) stay exactly as they are now.
- Do not change the participant-count badge `relative z-10` fix.
- Keep headings/test-observed copy intact so existing `page.test.tsx` still passes; you may tweak the section description text to match (short).

Verify:
- `bun run typecheck && bun run lint && bun run test:run`
- Diff touches ONLY `src/app/dev/req-cards/page.tsx`.

Do NOT push. Commit only.
