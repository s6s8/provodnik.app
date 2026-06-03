# Task: invert the participant-count badge on the req-cards polygon (П.1 only — NO "+")

File: `src/app/dev/req-cards/page.tsx` only. This is the dev polygon page. Do NOT touch the production card component (`src/components/shared/req-card`).

## Context
The participant count is shown as the last circle in the avatar stack (`ParticipantStack`, `data-testid="participant-count-badge"`, around lines 181–188). Right now it uses `bg-surface-low` + `text-ink-2` — the SAME light style as the avatar fallbacks (`bg-surface-low`). So the count circle looks like just another avatar / a login id. We need it to read clearly as a COUNTER, not a person.

## Change (exactly ONE thing)

1. **Invert the count circle (П.1).** Keep the same size, round shape, overlap and ring as the avatars (`size-6 -ml-1.5 rounded-full border-2 border-surface-high`) so the stack stays one cohesive object. But flip the fill/text:
   - Avatars are light fill + dark initials.
   - Counter must be the OPPOSITE: a dark / graphite filled circle with light text.
   - Use a NEUTRAL dark token, NOT the primary accent color (it must not pull attention away from the price). Pick the appropriate existing design-system token (e.g. a graphite/ink fill like `bg-ink-2` or `bg-foreground`) with a light text token (e.g. `text-surface-high` / `text-background`) — choose whichever pair in this project's theme gives a graphite (not pure-black, not accent) circle with clearly readable light text. Keep font size/weight readable (`text-[0.625rem] font-semibold` is fine).

**Do NOT add a "+" prefix.** The badge must keep rendering `{participantCount}` exactly as now. Rationale: the number means TOTAL people going (stack of 3 → "3", stack of 40 → "40"), so a "+" would read as "N more besides those shown" — the opposite meaning. Number only, no plus.

Solo (participantCount === 1) keeps showing ONE avatar and NO counter badge — that logic already exists, do not change it.

## Constraints
- Change ONLY the count-badge span styling (fill + text color). Do NOT change its text content (`{participantCount}` stays). Do not restructure `ParticipantStack`, the card, or the page.
- Do not add a new section or variant. The page must remain a single section.
- No custom CSS classes — tailwind + existing theme tokens only.

## Verify before finishing
- `bun run typecheck && bun run lint && bun run test:run`
- Confirm the page still has exactly one section and `git diff` touches only `src/app/dev/req-cards/page.tsx`.
- Report which exact tokens you chose for the circle fill and text.
