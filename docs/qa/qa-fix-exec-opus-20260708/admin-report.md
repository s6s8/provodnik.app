# Admin role QA report — provodnik.app (live production)

Date: 2026-07-08
Tester: Claude Code (autonomous QA agent), Playwright MCP against https://provodnik.app
Account: qa-admin@example.com (demo admin account, password from repo audit harness `AUDIT_PW`/`QA_SEED_PASSWORD`, not printed)
Viewports: 1280×900 (desktop), 375×812 (mobile)
Screenshots: `/tmp/provodnik-role-qa-20260708/admin-screens/admin-01..13-*.png`

## Scope covered

1. Login/logout and admin route protection — ✅ tested
2. Admin dashboard overview — ✅ tested
3. Admin guides list and guide detail — ✅ tested
4. Guide approval/moderation controls incl. availability controls/status display — ✅ tested
5. Admin bookings list/detail and approval/status visibility — ✅ tested (detail view is missing, see Issues)
6. Admin users list/detail — ✅ tested
7. Admin listings/moderation/audit/disputes pages — ✅ tested
8. QA guide visibility + availability override — ✅ tested end-to-end (paused → confirmed hidden from public `/guides` → resumed)
9. Empty/error states and console/network errors — ✅ tested (all pages clean)
10. Mobile layout for highest-risk admin page — ✅ tested (guide verification detail w/ availability override, 375px)

## Routes tested

| Route | Result |
|---|---|
| `/admin` (unauthenticated) | Redirects to `/auth?next=%2Fadmin` — route protection works |
| `/admin/dashboard` | Loads, stats correct, no console errors |
| `/admin/guides` (verification queue) | Empty state correct ("Нет заявок на проверке") |
| `/admin/guides?view=drafts` | Empty state correct ("Нет черновиков анкет гидов") |
| `/admin/guides/[id]` (guide verification detail) | Loads full profile, docs, decision panel, **availability override** |
| `/admin/users` | List loads, 9 users, filters (role/status/verification/guide type/demo) present, pagination correct |
| `/admin/users/[id]` | QA Guide detail loads: account info, guide profile summary, audit journal panel, account status (block/archive), role change, danger zone (delete demo account) |
| `/admin/bookings` | List loads, 2 confirmed bookings shown (amounts, parties, status) — **no detail drill-down**, see Issues |
| `/admin/listings` | Empty state correct ("В очереди нет объявлений") |
| `/admin/moderation` | Empty, two tabs (listings/review-replies), both 0 |
| `/admin/disputes` | Empty, stat tiles (Открыт/В работе/Решён/Закрыт) all 0, clear empty state |
| `/admin/audit` | Log loads, 2 entries (both guide-approval events for another demo guide), filters for object/action/note-search present |
| `/guides` (public) | Used to verify availability-override cascade |

## Booking/approval coverage

- **Guide approval controls**: verification queue empty (QA Guide already approved); decision panel present with Одобрить/Запросить изменения/Отклонить buttons and mandatory-comment textbox for reject/changes — not exercised further since no guide was pending (would have required destroying real approved-guide state, out of scope).
- **Availability override** (the feature under test for this branch): confirmed full round-trip.
  1. QA Guide default state: "Текущий статус: принимает заявки".
  2. Clicked "Приостановить приём заявок" → POST 200, status flipped to "приём приостановлен", confirmation text "Приём заявок приостановлен." shown, persisted across reload.
  3. Verified on public `/guides` (unauthenticated fetch check): QA Guide no longer appears in the catalog while paused — override correctly cascades to visibility.
  4. Clicked "Возобновить приём заявок" → status flipped back to "принимает заявки", confirmation "Гид снова принимает заявки." — restored to original state before finishing.
- **Bookings**: 2 confirmed bookings visible in the admin list, including one QA Traveler ↔ QA Guide booking (#465201b5, 10 000 ₽, "Подтверждено") and one real-demo-guide booking (#854b1723, 31 500 ₽). No admin action (approve/cancel/refund) is exposed on this list — see Issues #1.
- **Disputes**: none open; could not exercise dispute resolution flow (no dispute data in QA fixtures — documented as skipped, not a defect).

## Issues found

| # | Severity | Category | Steps | Expected | Actual | Evidence |
|---|---|---|---|---|---|---|
| 1 | Medium | Missing feature / gap | Open `/admin/bookings`, try to click a booking row | Row opens a detail view with full booking info and admin actions (cancel/refund/status change) | Rows are plain non-interactive `<div>`s (confirmed via DOM inspection: no `href`, no click handler) — there is no way to drill into a booking from the admin UI at all | `admin-08-bookings-list.png` |
| 2 | Medium | Audit/observability gap | On `/admin/guides/[id]`, click "Приостановить приём заявок" or "Возобновить приём заявок", then check "История модерации" on the same page, the "Журнал аудита" panel on `/admin/users/[id]`, and `/admin/audit` | The availability override is a state-changing admin action ("админ может переопределить" per the UI's own copy) and should be recorded somewhere an admin can review who paused a guide and when | None of the three audit surfaces record the action. `/admin/audit`'s action filter only offers Одобрено/Отклонено/Запрошены правки — availability overrides aren't a tracked event type at all | `admin-06/07-*.png`, `admin-12-audit-log.png` |
| 3 | Low | Data visibility | View `/admin/users` list | — | Full list includes the site owner's real production admin account (`alexeytlt@gmail.com`) alongside demo/QA accounts, with no visual distinction beyond the missing "демо-аккаунт" tag (which QA accounts do have) — informational only, not a bug, but worth confirming this is intended before any bulk-action feature is added to this table | `admin-04-users-list.png` |

No blocking bugs found. No console errors or warnings on any tested page. No failed/4xx/5xx network requests observed on any tested route (all requests in the `browser_network_requests` log returned 200).

## Console/network errors

Zero across all 13 pages/states tested (checked via `browser_console_messages(level: "warning")` after every navigation — 0 errors, 0 warnings every time). Network requests filtered for the guide-availability POST and general navigation all returned `200`.

## Skipped / unreachable areas

- **Guide reject/request-changes flow**: not exercised — would require a guide in "На проверке" status; none existed in the QA fixture set at test time, and creating one would have meant knocking a real or QA guide back to pending (out of scope for a read-mostly admin sweep).
- **Booking detail/cancel/refund actions**: could not test — no such view exists (see Issue #1).
- **Dispute resolution workflow**: no open disputes in QA fixtures; empty-state only.
- **Bulk user actions** (checkbox column in `/admin/users`): visible but not exercised — no bulk-action toolbar appeared to activate; treated as low-risk, not explicitly in scope.
- **Role-change and block/archive/delete-demo-account controls** on `/admin/users/[id]`: visible and read-verified but **not clicked**, since they are destructive/hard-to-reverse against the QA Guide account`s working state.
- Traveler-side and guide-side effects of the availability override beyond the public `/guides` catalog (e.g., existing offer/inbox behavior for the paused guide) are covered by the parallel guide/traveler QA agents, not duplicated here.

## Recommendations

1. **Add a booking detail view** in `/admin/bookings` (or at minimum make rows link to `/admin/bookings/[id]`) so admins can inspect/cancel/refund a specific booking without dropping to Supabase directly.
2. **Log availability overrides to the audit trail** — same mechanism already used for guide approve/reject, so the "who paused this guide and when" question is answerable from the UI instead of only from `guide_profiles.updated_at`.
3. Consider tagging the audit-log action filter with an "Доступность" (availability) option once #2 lands, for consistency with the existing Одобрено/Отклонено/Запрошены правки filter.
4. No urgent visual/console fixes needed — the admin surface is clean at both 1280px and 375px.
