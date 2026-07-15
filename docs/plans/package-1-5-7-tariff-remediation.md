# Targeted remediation: tariff price wording

A controller source review found an unresolved package requirement: when tariff rows exist, `TariffsList` still prints a raw numeric amount plus a separate group range. It does not use the shared group-price wording used by card/detail, so a private tariff can omit `за группу` and its tier cap.

## Scope
- Inspect actual tariff types and callers first.
- Make the smallest safe correction so **every displayed RUB tariff row** uses the established shared price wording and uses that tier's `max_persons` for the capacity text.
- Preserve correct non-RUB currency behavior; do not fabricate a ruble label for other currencies.
- Do not change card/detail behavior, queries, dependencies, data/schema, flags, or unrelated formatting.
- Add/adjust focused tests proving private/group/combo tariff rendering, including a tier capacity and a non-RUB case when supported by current types.
- Run focused tests, `bun run typecheck`, `bun run lint`, `bun run test:run`, `bun run build`, and `git diff --check`.
- Update `docs/qa/package-1-5-7-opus-report.md` accurately and create a human-format commit only after checks pass. Never push.

## Required disciplines
Use Superpowers, Ponytail full, and Context7 only when needed for a relied-upon external API. Trace all callers before editing any shared formatter.
