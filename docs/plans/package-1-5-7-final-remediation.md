# Final remediation — verified gaps before HTML delivery

## North Star
Deliver the owner-approved package correctly, then produce a truthful dated HTML verification report. A report never substitutes for fixing an in-scope, proven defect.

## Fixed scope from independent review
Complete only after the current tariff remediation has committed; do not run competing writers.

1. **Destination suggestions**
   - The request combobox must include both published-listing **cities and regions**, approved-guide base cities, and guide-declared regions/directions.
   - Preserve a unique cmdk value and display strategy for locations sharing a name in different regions. The existing home-card destinations/counts must remain listing-backed and unaffected.
   - Keep existing keyboard, selection, ARIA, and free-text behavior.
   - Add focused regressions for a listing-only region and same-named locations in distinct regions.

2. **Footer/social rule**
   - The accepted package requires bottom logos/icons to be **visual-only and non-interactive**: no external social navigation, share action, social login, OAuth, or click handler.
   - Remove or replace any existing clickable social-icon control that violates this exact rule. Do not add new social destinations or invent URLs.
   - Preserve accessible labeling for decorative visuals and avoid a fake interactive element.

## Constraints
- Before changing a shared function/component, trace callers and reuse the smallest existing mechanism.
- No dependency, schema/migration, seed/data/flag change, push, deploy, or unrelated cleanup.
- Use relevant Superpowers/Ponytail/Context7 only where required by a relied-upon external API.
- Update focused tests. Run `bun run typecheck`, `bun run lint`, `bun run test:run`, `bun run build`, and `git diff --check`.
- Update the QA report accurately, commit with a human-format message, never push.
