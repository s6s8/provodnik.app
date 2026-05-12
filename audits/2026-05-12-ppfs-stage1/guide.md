# PPFS Stage 1 — guide audit registry

Primary credential: `dev+guide@rgx.ge` (not `guide@provodnik.test` — account does not exist, ADR-058). Run **Pre-Guide-Route Gate** in `LEGEND.md` before any `/guide/*` URL. Logout via `window.location.href = '/api/auth/signout'`.

| route | row_type | steps | expected | actual | screenshot | fact-or-question-for-PM | criticality |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PRE-GATE | UX | Open DevTools > Application > Auth session; in the stored session JSON verify `user_metadata.role` and `app_metadata.role` both equal `guide` before opening any `/guide/*` route. | — | — | — | — | — |
| /guide | UX | — | — | — | — | — | — |
| /guide/onboarding | UX | — | — | — | — | — | — |
| /guide/verification | UX | — | — | — | — | — | — |
| /guide/profile | UX | — | — | — | — | — | — |
| /guide/portfolio | UX | — | — | — | — | — | — |
| /guide/listings | UX | — | — | — | — | — | — |
| /guide/listings/new | UX | — | — | — | — | — | — |
| /guide/listings/[id] | UX | — | — | — | — | — | — |
| /guide/listings/[id]/edit | UX | — | — | — | — | — | — |
| /guide/inbox | UX | — | — | — | — | — | — |
| /guide/orders | UX | — | — | — | — | — | — |
| /guide/bookings | UX | — | — | — | — | — | — |
| /guide/bookings/[bookingId] | UX | — | — | — | — | — | — |
| /guide/calendar | UX | — | — | — | — | — | — |
| /guide/reviews | UX | — | — | — | — | — | — |
| /guide/stats | UX | — | — | — | — | — | — |
| /guide/settings | UX | — | — | — | — | — | — |
