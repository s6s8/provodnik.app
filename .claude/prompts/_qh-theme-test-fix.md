# Task: update req-cards test — theme icons now render in BOTH section 4 and section 5

File: `src/app/dev/req-cards/page.test.tsx` (and only this file).

## Context
Section 5 ("5 · Контур: цвет рамки = тип") now renders theme chips as ICON-ONLY chips
(ThemeIconChip), same as section 4's "Иконки-only" block. This is intended. As a result the
third test ("renders theme icon-only chips with accessible labels and tap-open tooltips") now
finds 6 buttons named "История" globally instead of 3, and fails:

```
const historyButtons = screen.getAllByRole("button", { name: "История" });
expect(historyButtons).toHaveLength(3);   // now 6 — fails
```

## Fix
Scope the assertion to section 4 so it stays meaningful and independent of section 5. Use the
same `closest("section")` + `within(...)` pattern the second test already uses for section 5.

Change the third test to:
1. Get section 4's `<section>` via `screen.getByRole("heading", { name: "4 · Темы: текст vs иконки-only" }).closest("section")` and assert it is not null.
2. Query `within(section4!).getAllByRole("button", { name: "История" })` and expect length 3.
3. Keep the existing class assertion (`rounded-full`, `text-ink-2`), the `.lucide-landmark` query,
   the `not.toHaveTextContent("История")` check, the `fireEvent.click`, and the tooltip assertion —
   but run them against the section-4-scoped buttons (`historyButtons[0]`).

Do NOT change the other two tests, the component, or any counts elsewhere. The goal is a green
`bun run test:run` with the assertion correctly scoped to section 4.

## Constraints
- Edit ONLY `src/app/dev/req-cards/page.test.tsx`. No other files.
- NO shell commands (no git, no bun). Use only Read/Edit/Write/Glob/Grep.
- The orchestrator runs the test suite + git after you finish.

## DONE report
State the exact edit made. Do not run or report any commands.
