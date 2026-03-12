---
applyTo: "src/features/traveler/**,src/app/(protected)/traveler/**"
---

Traveler scope is demand-side UX: request creation, joining, bookings, favorites, and traveler account flows.

Keep traveler-specific components in `src/features/traveler`.

Avoid creating traveler-only data contracts inline in pages. Shared contracts belong in the data layer.

Prefer compositions that can be tested and reused over page-local monoliths.
