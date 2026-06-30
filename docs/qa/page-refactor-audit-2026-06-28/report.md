# Provodnik page refactor/fix audit — 2026-06-28

## Scope

Production build audited at `http://127.0.0.1:3000` after resetting seeded QA users and logging into protected areas as:

- admin: `qa-admin@example.com`
- guide: `qa-guide@example.com`
- traveler: `qa-traveler@example.com`

Screenshots and machine-readable audit data are in this folder:

- `summary.json`
- `raw-results.json`
- `*.png` screenshots for desktop/mobile

Claude Opus was also run read-only with `--output-format stream-json --verbose`; stream log:

- `/tmp/provodnik-page-audit/claude-stream.jsonl`

## Baseline result

Healthy baseline:

- 47 routes / 94 viewport checks captured.
- Logged-in admin, guide, and traveler sessions worked.
- No console errors.
- No page errors.
- No broken images.
- No horizontal overflow at 1280px or 375px.
- Production build passed before the audit.

The app is close. Remaining work is concentrated in a small set of pages/states.

## Fix now

| Priority | Route / area | Type | Evidence | Recommendation |
|---|---|---|---|---|
| P0 | `/account` for logged-in admin | Functional bug | Admin opening `/account` sees “Войдите в аккаунт” even though the admin session is authenticated. Screenshot: `admin-_account-1280.png`. | Add admin handling in `src/app/(protected)/account/page.tsx`: either render an admin profile/account view or redirect admin to `/admin`. |
| P0 | `/help` | Demo-blocking broken link | Route exists but renders “Страница не найдена” with 200 because `FEATURE_TR_HELP` is off. Footer links to it sitewide. Screenshot: `public-_help-1280.png`. | For demo: enable `FEATURE_TR_HELP=1`. Longer-term: hide footer link when disabled. |
| P0 | `/favorites` | Demo-blocking broken cabinet page | Logged-in traveler sees “Страница кабинета не найдена” because `FEATURE_TR_FAVORITES` is off. Screenshot: `traveler-_favorites-1280.png`. | For demo: enable `FEATURE_TR_FAVORITES=1` or remove/hide entry point. |
| P1 | `/referrals` | Demo-blocking broken cabinet page | Logged-in traveler sees the same cabinet 404 because `FEATURE_TR_REFERRALS` is off. Screenshot: `traveler-_referrals-1280.png`. | Enable `FEATURE_TR_REFERRALS=1` for demo or hide link. |
| P1 | `/account/notifications` | Broken notification settings entry | Route is feature-gated by `FEATURE_TR_NOTIFICATIONS`; logged-in users can hit a cabinet 404. Screenshot: `traveler-_account_notifications-1280.png`. | Enable `FEATURE_TR_NOTIFICATIONS=1` if this page is needed for demo, otherwise hide settings link. |

## Verify / no longer considered blocker

| Route | Initial signal | Follow-up result |
|---|---|---|
| `/guide` / `/guide/inbox` | First quick capture showed “Загрузка запросов…” | 30-second live logged-in check reached real inbox data: 1 new request. Not a blocker. Screenshot: `guide-inbox-30s-check.png`. |

## Design / polish queue

| Priority | Route / area | Issue | Recommendation |
|---|---|---|---|
| P2 | `/ai` | Main conversion/funnel page has a muddy, low-res blurred background. It feels weaker than the polished homepage and catalog pages. Screenshot: `public-_ai-1280.png`. | Replace with cleaner homepage-aligned surface: light editorial/photo treatment, better contrast, clearer form focus. |
| P2 | `/search` | Large navy hero has too much dead right-side space. Screenshot: `public-_search-1280.png`. | Compress hero height or add useful search/filter affordance into the empty space. |
| P3 | `/admin` loading state | Admin index/loading skeleton has no h1 during mid-load. Dashboard itself works. Screenshot: `admin-_admin-1280.png`. | Add heading to loading/skeleton state or redirect faster to `/admin/dashboard`. |
| P3 | demo data | Seed data is thin: many category counts are zero, messages/reviews/bookings empty, only a few admin queue rows. | Seed richer demo data: listings per category, message thread, booking, review, dispute/moderation examples. |

## Pages that look okay now

Do not refactor these just for visual alignment unless a product issue appears:

- `/`
- `/become-a-guide`
- `/for-business`
- `/how-it-works`
- `/trust`
- `/policies/*`
- `/listings`
- `/destinations`
- `/guides`
- `/requests`
- guide calendar/profile/reviews/settings/stats pages
- admin guide/listing/moderation/dispute/bookings/audit pages
- traveler `/trips`, `/messages`, `/notifications`, `/account`

## Recommended next execution plan

1. Fix admin `/account` role handling.
2. Enable demo feature flags or hide links for `/help`, `/favorites`, `/referrals`, `/account/notifications`.
3. Re-run this audit and confirm no visible “не найдена” route appears for linked pages.
4. Polish `/ai` and `/search`.
5. Seed richer demo data.
