# Task: req-cards dev playground — layout "Variant A"

File: `src/app/dev/req-cards/page.tsx` ONLY. Do not touch the production card (`src/components/shared/request-card-final.tsx`) or anything else.

Rework the `RequestCardThemesTopPrototype` card into a clean vertical row layout ("Variant A"). Target rows top→bottom:

1. **Line 1:** location (city) on the LEFT, truncated. On the RIGHT, a status cluster containing BOTH badges together: the group-type badge (`CountPrototypeGroupTypeBadge` → «Открытая» / «Своя группа») AND the guide-status badge (`GuideStatusBadge` → «Ждёт гида» / «Гид найден»). The open-group badge moves UP here out of the bottom row.
2. **Line 2:** date/time text on the left; if `datesFlexible` is true, the «Гибкие даты» chip next to it on the same row.
3. **Lines 3–4:** theme chips (`ThemeLabelChip`, icon + label), wrapping to a 2nd line only when there are more than 2 themes. Keep `interests.slice(0, 3)`.
4. **Line 5 (bottom, mt-auto):** `ParticipantStack` (avatars + count) on the LEFT, price on the RIGHT. Nothing else in this row — it must be just these two anchors.

Implementation requirements:
- Replace the current `absolute right-4 top-4` positioning of the status badge with a normal flex layout (`flex items-start justify-between gap-2`) so the city truncates and the right cluster wraps gracefully. The right cluster: `flex shrink-0 flex-wrap items-center justify-end gap-1.5`. Remove the now-unneeded `pr-24` on the location `<p>` and the `relative` absolute wrapper if no longer used (keep `relative` on the article only if still needed — it is not, but leaving it is harmless; prefer removing the absolute status div).
- Keep the `Link` wrapping the clickable area (location + meta). It's fine for the Link to wrap location only, or location+meta — keep the whole upper block clickable as before; do not regress the focus-visible ring.
- **Counter overlap fix:** in `ParticipantStack`, the participant-count badge currently can be partially covered by the last avatar. Make the count badge always render fully on top by adding `relative z-10` to its className. The count badge must never be visually clipped by an avatar.
- Update the page heading/description text if it still says "themes-чипы сверху" so it matches the new layout (status row up top, themes own rows, clean bottom). Keep it short.
- Keep all existing sample data, group-type colors, and status colors unchanged.

Verify before finishing:
- `bun run typecheck && bun run lint && bun run test:run`
- Confirm the diff touches ONLY `src/app/dev/req-cards/page.tsx`.

Do NOT push. Commit only.
