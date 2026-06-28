# Remaining page refactor — progress (2026-06-28)

Autonomous loop executing `docs/plans/2026-06-28-autonomous-remaining-page-refactor-tasks.md`.
Homepage is the design SOT (cleanliness + token discipline). No homepage redesign. No push.

## Status

| Task | Priority | Status |
|---|---|---|
| A — admin `/account` role handling | P0 | ✅ done (commit) |
| B — feature-gated linked pages (hide nav links) | P0/P1 | ✅ done (commit) |
| C — `/ai` visual polish | P1 | ✅ done (commit) |
| D — `/search` hero density | P1 | ✅ done (commit) |
| E — `/admin` loading heading | P2 | ✅ done (commit) |
| F — demo seed note | P2 | ✅ done (doc note) |

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
- Verified visually: footer "Помощь" link no longer renders (see `ai-1280.png`).

### Task C — /ai visual polish
- Issue: muddy, low-res blurred background (`blur(13px)` on a scaled raster) felt weaker
  than the homepage.
- Fix: render `/hero-valley.jpg` via optimized `next/image` (crisp, `priority`) at low
  opacity with a light 5px frost instead of the heavy 13px blur; strengthen the central
  light wash and the input-bar contrast/focus (white 0.62→0.82, focus ring + lift shadow).
  Conversation flow / server action untouched.
- File: `src/features/homepage/components/hero-conversation.tsx`.
- Screenshots: `ai-1280.png`, `ai-375.png`. No app console errors (only dev HMR ws noise),
  no 375px overflow.

### Task D — /search hero density
- Issue: large navy `ListHero` had dead right-side space; page also had no text-search UI
  (the `q` param was only reachable via deep links — FilterBar only has type/format/sort).
- Fix: add a server-rendered GET search form into the hero's `children` slot. Fills the
  dead space and adds the missing text-search affordance; preserves active
  region/type/format/sort via hidden inputs. Shared `ListHero` and other catalog pages
  untouched.
- File: `src/app/(site)/search/page.tsx`.
- Screenshots: `search-1280.png`, `search-375.png`. Search page tests still pass; no overflow.

### Task E — /admin loading heading
- Issue: admin dashboard loading skeleton had only an sr-only label, no visible h1 mid-load.
- Fix: render the real `PageHeader` (eyebrow "Администрирование" + h1 "Обзор" + subtitle) in
  `loading.tsx`, skeletonizing only the data blocks below → stable heading, no layout shift
  vs. the loaded page. `/admin` itself already redirects to `/admin/dashboard`.
- Files: `src/app/(protected)/admin/dashboard/loading.tsx` (+ `loading.test.tsx`).

### Task F — demo seed scope note (doc only)
- Touching seed SQL is schema-sensitive and out of scope for a safe bounded run.
- Deliverable: `seed-scope-notes.md` in this folder — concrete, schema-aware seed TODOs for
  the thin areas the audit flagged (zero category counts, empty messages/reviews/bookings,
  sparse admin queues). No seed scripts modified.
