# Release-blocking price-path completion

Controller final-source review found two remaining shared-price-path gaps. Correct before release.

1. In `TariffsList`, a RUB tariff row currently passes only `t.max_persons` to the shared formatter. Preserve the tier capacity when present, but fall back to the listing-wide `maxGroupSize` when a private tariff tier has no max. Add a focused regression.
2. `TourShapeDetail` invokes `TariffsList` without `format` and `maxGroupSize`, leaving its no-tariff fallback bare. Trace the exact listing type/callers and pass the real format and overall capacity so this detail route uses the same shared pricing semantics.

Constraints: minimal root-cause diff, no dependency/schema/data/flag changes, no push/deploy. Update focused tests and QA report. Run typecheck, lint, full test suite, build, and diff check. Commit human-format only after all pass.
