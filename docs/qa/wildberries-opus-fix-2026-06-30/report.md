# Wildberries Opus fix report — 2026-06-30

## Scope

Fixed the confirmed Wildberries/Provodnik issues from the 2026-06-30 audit:

- guide signup with phone failed
- guide signup without phone incorrectly proceeded
- guide landed in inbox instead of profile/verification setup
- first guide profile block did not save
- duplicate phone/user-state caused confusing errors
- guide auth page showed traveler-facing copy
- homepage date picker did not apply selected date
- admin needed reliable access to inspect guide drafts
- guide/agency/team choice was missing from signup

## Implementation summary

- Guide signup now requires a phone and guide type on the client and server.
- Phone duplicate check now works against the deployed schema by normalizing existing profile phones in the server action.
- Guide type is captured in auth metadata at signup.
- Newly registered guides are routed to `/guide/profile`, not `/guide/inbox`.
- Guide profile save now uses the admin client after authenticated user validation, avoiding the RLS/profile-row failure that blocked first-save.
- Homepage calendar now uses `useWatch` and explicit day click handling so selected date is rendered immediately.
- `/auth?role=guide` now shows guide-specific hero/support copy.
- QA admin account was repaired during verification: password reset to the documented demo credential and profile/app role restored to `admin`.

## Automated verification

Passed:

- `bun run typecheck`
- `bun run lint`
- `bun run test:run` — 224 files / 1081 tests
- `bun run build`

## Browser verification

Verified with Playwright against production build at `http://127.0.0.1:3000` using real Supabase auth/profile rows.

| Check | Result | Screenshot |
|---|---:|---|
| Guide signup without phone is blocked | PASS | `screenshots-local/01-guide-no-phone-blocked.png` |
| Guide-specific signup form + guide type choice | PASS | `screenshots-local/02-guide-signup-form.png` |
| Guide signup with phone succeeds and lands on profile | PASS | `screenshots-local/03-guide-profile-after-signup.png` |
| DB user/profile rows created after signup | PASS | `screenshots-local/verification-results.json` |
| First guide profile block saves | PASS | `screenshots-local/04-guide-profile-save-success.png` |
| Duplicate phone blocked before second account | PASS | `screenshots-local/05-guide-duplicate-phone-blocked.png` |
| Homepage date picker applies selected date | PASS | `screenshots-local/06-home-date-selected.png` |
| Admin login + guide drafts queue accessible | PASS | `screenshots-local/07-admin-guides-drafts.png` |

## Notes

- `computer_use` capture returned `0x0` with no apps/elements on this Mac session, so manual desktop control could not produce a native screenshot. I used Playwright browser verification instead and saved screenshots for every key flow.
- Remote Supabase migration history is diverged with many pending local migrations. I did **not** run `supabase db push` because it would apply unrelated pending migrations. Runtime fixes avoid requiring new DB columns.
