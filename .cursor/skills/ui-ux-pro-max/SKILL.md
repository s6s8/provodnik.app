# Provodnik UI research helper

This bundled search tool is optional evidence for a genuinely design-led task. It does not define the product design system and never overrides the task packet, current UI, `src/app/globals.css`, shared components, accessibility, or Cursor rules.

## Use it only when

- The orchestrator explicitly asks for a new visual direction, a page-level redesign, or comparative design research.
- Reading the target route, neighboring screens, shared primitives, and semantic Tailwind tokens does not already provide an adequate pattern.

Do not invoke it for copy changes, wiring, data/state work, small layout fixes, bug fixes, or routine component composition.

## Safe workflow

1. Read the affected end-to-end flow and existing responsive UI first.
2. Use the Python interpreter already available on the host. Do not install or upgrade system tooling.
3. Run searches from the current worktree root:

```bash
python3 -B .cursor/skills/ui-ux-pro-max/scripts/search.py "<product and task keywords>" --design-system
python3 -B .cursor/skills/ui-ux-pro-max/scripts/search.py "<implementation topic>" --stack nextjs
python3 -B .cursor/skills/ui-ux-pro-max/scripts/search.py "<component topic>" --stack shadcn
```

4. Add a focused `--domain ux`, `--domain web`, or `--domain chart` query only when the task needs that evidence.
5. Treat results as suggestions. Select only guidance compatible with installed dependencies, current tokens, Russian product canon, and the scoped acceptance criteria.

## Boundaries

- Do not use `--persist` or create `design-system/` files unless those exact files are in task scope.
- Do not add packages, fonts, icon sets, custom CSS classes, raw colors, or speculative variants because the search suggested them.
- Reuse Lucide and existing shadcn/shared primitives. Preserve semantic HTML, keyboard behavior, focus, contrast, reduced motion, and responsive layout.
- Report the exact queries used and the decisions they influenced. Browser acceptance remains governed by `60-ui-and-browser.mdc` and `90-verification-and-reporting.mdc`.
