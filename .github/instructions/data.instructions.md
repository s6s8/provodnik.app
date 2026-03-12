---
applyTo: "src/lib/supabase/**,src/lib/env.ts,src/data/**,src/features/shared/**"
---

Treat this area as the source of truth for shared data contracts and backend access patterns.

Do not hardcode secrets, keys, or environment fallbacks.

Missing Supabase env is a valid local shell state. Fail only at the point a backend-dependent flow is actually used.

Prefer central schemas, helpers, and typed contracts over duplicating request or response shapes inside features.
