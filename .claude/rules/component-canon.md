---
paths:
  - "src/**"
---

# Component canon + reuse-first gate

Root cause on record: 24 duplication clusters and 39 dead components (docs/COMPONENT_AUDIT.md,
2026-07-06) came from agents creating instead of finding. These rules close that path.

## Before creating anything

1. Check `.claude/sot/CANON_COMPONENTS.md` — if the concept has a canonical row, import it. Done.
2. No row? Grep for a sibling before writing: `rg -il "<concept>" src/components src/features`
   and grep the distinctive class string you're about to write. A near-match = extend it (props/cva
   variant), not a second copy.
3. Still nothing? Create it in the right home (`ui/` primitive, `shared/` cross-domain,
   `features/<domain>/components/` domain-owned) and add a row to CANON_COMPONENTS.md in the same PR.

## Hard rules

- Server actions return `{ ok: boolean; error?: string; data?: T }` via `createAction`
  (`src/lib/actions/create-action.ts`). No new result dialects.
- Client/server validation limits for one domain object come from one shared constants module —
  never re-declare a zod bound (the request budget floor drifted 100× this way).
- One concept, one component: extending an existing component with a cva variant beats a boolean
  prop, which beats a new file.
- Wiring is part of the task: a component with zero importers at commit time fails `lint:dead`.

## Mechanical enforcement (don't fight it, fix the code)

- `bun run lint:canon` — bans re-implementations of money/date formatting, `window.confirm`,
  inline glass/container class strings, raw `<select>`/`<textarea>` outside `ui/`. Allowlists are
  frozen legacy (audit W1–W6 shrinks them) — extending an allowlist requires operator approval.
- `bun run lint:dead` — fails on new zero-importer components (baseline freezes the known backlog).
- Both run in `bun run check` and the pre-commit hook.
