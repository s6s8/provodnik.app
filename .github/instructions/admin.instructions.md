---
applyTo: "src/features/admin/**,src/app/(protected)/admin/**"
---

Admin scope is moderation and operations: review queues, disputes, refunds, supply controls, and marketplace oversight.

Favor explicit state, auditability, and operator clarity over decorative UI complexity.

Keep admin-only logic in `src/features/admin`.

Cross-cutting contracts and shared mutations belong in the data layer.
