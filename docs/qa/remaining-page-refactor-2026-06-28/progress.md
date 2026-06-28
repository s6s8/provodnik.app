# Remaining page refactor — progress (2026-06-28)

Autonomous loop executing `docs/plans/2026-06-28-autonomous-remaining-page-refactor-tasks.md`.
Homepage is the design SOT (cleanliness + token discipline). No homepage redesign. No push.

## Status

| Task | Priority | Status |
|---|---|---|
| A — admin `/account` role handling | P0 | ✅ done (commit) |
| B — feature-gated linked pages (hide nav links) | P0/P1 | ✅ done (commit) |
| C — `/ai` visual polish | P1 | pending |
| D — `/search` hero density | P1 | pending |
| E — `/admin` loading heading | P2 | pending |
| F — demo seed note | P2 | pending |

## Log

### Task A — admin `/account` redirect
- Issue: logged-in admin opening `/account` saw "Войдите в аккаунт" (no admin branch).
- Fix: redirect authenticated `admin` role to `/admin/dashboard` at top of `PersonalSettingsPage`.
- File: `src/app/(protected)/account/page.tsx`.

### Task B — hide feature-gated nav/footer links
- Issue: footer "Помощь" (/help) + cabinet menu links to /favorites, /referrals rendered
  while their feature flags were off → users hit notFound() "не найдена" pages.
- Fix (product-safe link hiding):
  - `src/lib/navigation.ts`: `NAV_FLAG_BY_HREF` map + `hiddenNavHrefsForFlags()` +
    `filterNavItemsByHiddenHrefs()`. Flags resolved server-side, passed to client nav as
    a serializable `hiddenNavHrefs` list (env is server-only).
  - `site-footer.tsx` (server): filters `footerNav.support` directly via `flags`.
  - `site-header-server.tsx` → `site-header.tsx` → `user-account-drawer.tsx`: thread
    `hiddenNavHrefs` and filter the account menu.
  - `.env.example`: documented the demo feature flags + how gating now hides links.
- Tests: `src/lib/navigation.test.ts` (helpers + footer/menu filtering). Existing
  site-header / drawer tests still green.
- Note: `/account/notifications` settings is gated by FEATURE_TR_NOTIFICATIONS; the bell is
  already prop-gated via `notificationsEnabled` and the account menu links to `/notifications`
  (not gated), so no broken entry point there.
