# PPFS Stage 1 — admin audit registry

Walk **blocked** by the credential-failure P0 documented in `traveler.md`: `admin@provodnik.test / Admin1234!` and `admin@provodnik.app / Demo1234!` both reject on the live `provodnik.app` deployment with «Неверный email или пароль.»

No machine path exists in this session to walk `/admin/*` routes. The admin namespace is also the most security-sensitive surface (role escalation, listing moderation, user takeovers) and should not be approximated by signed-up self-registration even if the signup form happened to allow «Админ» as a role (it does not — the role toggle only shows «Путешественник / Гид»).

| route | row_type | steps | expected | actual | screenshot | fact-or-question-for-PM | criticality |
| --- | --- | --- | --- | --- | --- | --- | --- |
| /admin (login attempt) | SERVER-ERROR | 1. `/auth` with `admin@provodnik.test / Admin1234!`. 2. `/auth` with `admin@provodnik.app / Demo1234!`. | Either credential should authenticate per LEGEND. | Both reject with «Неверный email или пароль.» — confirming the seed-not-deployed P0 also blocks admin walk. | N/A | Pending P0 fix in `traveler.md`: re-seed live admin or expose a Supabase Management API path to create a one-shot audit admin. | **P0 (blocker)** |
| /admin | UX | (Deferred until credential is reissued.) | Admin dashboard. | Deferred. | N/A | — | — |
| /admin/users | UX | (Deferred.) | User list / moderation. | Deferred. | N/A | — | — |
| /admin/users/[userId] | UX | (Deferred.) | User detail / role editor. | Deferred. | N/A | — | — |
| /admin/listings | UX | (Deferred.) | Listing moderation queue. | Deferred. | N/A | — | — |
| /admin/listings/[listingId] | UX | (Deferred.) | Listing review detail. | Deferred. | N/A | — | — |
| /admin/requests | UX | (Deferred.) | Cross-traveler request browser. | Deferred. | N/A | — | — |
| /admin/requests/[requestId] | UX | (Deferred.) | Request detail / dispute review. | Deferred. | N/A | — | — |
| /admin/bookings | UX | (Deferred.) | Cross-booking inspector. | Deferred. | N/A | — | — |
| /admin/bookings/[bookingId] | UX | (Deferred.) | Booking detail. | Deferred. | N/A | — | — |
| /admin/disputes | UX | (Deferred.) | Disputes queue. | Deferred. | N/A | — | — |
| /admin/disputes/[disputeId] | UX | (Deferred.) | Dispute detail / resolution UI. | Deferred. | N/A | — | — |
| /admin/payouts | UX | (Deferred.) | Payouts (placeholder pre-monetisation). | Deferred. | N/A | — | — |
| /admin/audit-log | UX | (Deferred.) | System audit log. | Deferred. | N/A | — | — |
| /admin/feature-flags | UX | (Deferred.) | Feature-flag dashboard. | Deferred. | N/A | — | — |
| /admin/seed | UX | (Deferred.) | Seed/dev tooling page. | Deferred. | N/A | — | — |

## Cross-cutting / themed observations (admin)

- **P0 blocker — no admin credential on live:** end-to-end admin coverage cannot start without a valid live admin login. Suggested unblock paths, in order: (a) re-deploy the seed migration; (b) Supabase Management API one-shot `auth.admin.createUser` for an audit admin; (c) flag the failing seed routine in CI so this doesn't recur.
- **Security implication if `/admin/users/[id]` allows role edits:** once the credential is in hand, the very first admin pass must confirm that the route enforces RLS / role checks at the API layer, not just at the UI layer.
- **Anti-disintermediation overlap:** the `/admin/users/[userId]` and `/admin/listings/[listingId]` surfaces will need rules-of-engagement updates from ticket #4 (anti-dez) before contact-masking patches land — admin should see unmasked contacts, the rest of the surface should not.
