# Opus self-healing visual fix — report (2026-07-08)

Branch: `fix/visual-audit-self-heal-20260708`
Source of truth: `docs/qa/visual-audit-20260708/FABLE_VISUAL_AUDIT.md` + `findings.json`

## Summary

All 20 audit findings were triaged and addressed. 16 are fully fixed in code, 1 improved,
2 confirmed as full-page-screenshot artifacts (code already correct), and 1 is intentional
by an existing owner spec and left unchanged (documented).

Root-cause fixes were preferred over per-page patches: the desktop request-detail hero,
the notifications-card overflow, and the tab overlap were all fixed once in shared
primitives (`immersive-hero`, `list-row`, `ui/tabs`) so every consumer benefits.

Verification chain (final state, harness removed):

| Command | Result |
|---|---|
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 errors (21 pre-existing warnings, all in `src/data/guide-*` files I did not touch — Supabase data-access-boundary warnings) |
| `bun run test:run` | ✅ 226 files / 1155 tests pass (+4 new for the QA-guide filter) |
| `bun run build` | ✅ production build succeeds |
| Playwright screenshots | ✅ captured at 1280px + 375px, console clean (0 errors) |

## Finding-by-finding status

| ID | Sev | Status | What changed / why |
|---|---|---|---|
| F-01 | High | **Fixed** | Desktop hero collapse: the inner rail had `md:min-h-0` while both children were `md:absolute`, so it collapsed to 0px and `bottom-12` anchored to the top → huge empty gradient. Replaced the fragile absolute positioning with in-flow `md:flex-row md:items-end md:justify-between`. Title bottom-left, panel bottom-right, no gap. |
| F-02 | High | **Fixed** | `/account/notifications` was a `"use client"` page calling `notFound()` during render → cabinet-404 + React #419. Moved the flag gate to a server component that `redirect("/account")`s when the feature is off; extracted the interactive UI to `notification-preferences-client.tsx`. #419 eliminated. |
| F-03 | High | **Fixed** | `/destinations` & `/listings` called `notFound()` while metadata already streamed 200 → soft-404. Swapped to `redirect("/guides")` (temporary 307) so they land on the live catalog. Verified live: both now redirect. |
| F-04 | Med | **Verified — no code defect** | Guide bottom-nav "overlap" is a full-page-screenshot artifact of a `position:fixed` bar. The content wrapper already has `pb-[calc(64px+env(safe-area-inset-bottom)+12px)]` matching the 64px nav (`guide/layout.tsx`). Padding is present and correct; no change needed. Live-auth re-verification blocked (no local Supabase). |
| F-05 | Med | **Verified — no code defect** | Guide profile form fields already use `space-y-2` (label→input gap) inside a `space-y-6` fieldset. The "cramped" look is a screenshot artifact; classes are correct. Live-auth re-verification blocked. |
| F-06 | Med | **Fixed** | `/trips` tab overlap: long single-word label "Подтверждённые" overflowed its `grid-cols-3` cell and the active pill bled onto the neighbour. Added `min-w-0` to the shared `TabsTrigger` and wrapped each label in `truncate`. Verified live — active pill contained, ellipsis, no overlap. |
| F-07 | Med | **Fixed** | `/notifications` card overflowed on mobile because `ListRow` forced title + two `shrink-0` blocks (badges, actions) onto one row. Gave the title `basis-full sm:basis-0` so badge/actions wrap below the title on mobile and restore inline layout at `sm+`. Covered by existing `list-row` tests. |
| F-08 | Med | **Fixed** | Request cards showed bare dark gradients when a request has no photo. Added a designed fallback (map-pin icon + city name) on the cover, shown when `imageUrl` is not a real photo. Verified live. |
| F-09 | Med | **Fixed** | Mobile breadcrumb rode under the fixed 88px header on the short hero variant. Added `pt-[calc(var(--nav-h)+16px)] md:pt-0` to the hero rail so content always clears the header. Verified live. |
| F-10 | Low | **Fixed** | QA seed guide (`qa-guide-test-*`) was public. Added `isQaGuideSlug` + a guard in `applyGuideFilters` (hides from every catalog/destination list) and a `notFound()` guard in the `/guides/[slug]` profile route. 4 new unit tests. NB: app-level hide only — the seed row still exists in the DB (no migration per scope). |
| F-11 | Low | **Improved** | Desktop category chip clipped with no scroll hint. The rail is intentionally single-row ("never wraps"); added a right-edge fade mask + `pr-6` as a scroll affordance so the clip reads as scrollable. |
| F-12 | Low | **Fixed** | `/ai` hero placeholder was clipped by the send button. Shortened the placeholder to `Москва, завтра, вдвоём, 5000 ₽` so it fits mobile width. Verified live. |
| F-13 | Low | **Fixed** | Footer "Поддержка" read as an unstyled orphan. Added a `border-t` separator to the bottom bar and gave the mailto link visible link styling (`underline`, `/60` → `/85` on hover). Verified live. |
| F-14 | Low | **Fixed** | Guide profile: ~full-viewport gap when a guide has no excursions (two stacked `py-sec-pad` sections). Excursions section now drops its bottom padding (`pt-sec-pad pb-0`) when empty. |
| F-15 | Low | **Fixed** | Removed the orphan unlabeled `<` chevron button next to "Создать экскурсию" on `/guide/listings`; cleaned up the now-unused `ChevronLeft`/`Link` imports. |
| F-16 | Low | **Fixed** | "Добавить документ" was a default primary button → washed out at `disabled:opacity-50` (white-on-pale-blue). Switched this secondary action to `variant="outline"` for legible contrast in both states. |
| F-17 | Low | **Blocked — by design** | `/account` "Профиль заполнен" tied only to `full_name` is an explicit owner decision (code comment: "Owner-requested wording (Excel row 14)"). Left unchanged to respect the agreement; documented here. Other traveler fields are optional by design. |
| F-18 | Low | **Fixed** | Booking detail showed placeholder "Маршрут" twice + a ~130px dead gap. "Маршрут" (the app-wide default label) now only appears once — the trip-details card heading is hidden unless a distinct listing title exists. Merged the two split left-column grid rows into one contiguous column so the tall sticky aside no longer stretches an empty row (gap gone). |
| F-19 | Low | **Fixed** | Mobile sticky price/join bar had `px-4` and no safe-area. Bumped to `px-5` (matches page gutter) + `pb-[max(0.75rem,env(safe-area-inset-bottom))]`. |
| F-20 | Low | **Fixed** | Home hero "Сборные группы" scroll cue was `text-white/75` — illegible on the photo. Changed to solid `text-white` + `drop-shadow-lg` (token-safe utility). Verified live. |

Status counts: **Fixed 16 · Improved 1 · Verified-no-defect 2 · Blocked/by-design 1** (total 20).

## Files changed

22 modified + 1 new file:

- `src/components/shared/immersive-hero.tsx` — F-01, F-09
- `src/components/shared/open-group-card.tsx` — F-08
- `src/components/shared/list-row.tsx` — F-07
- `src/components/shared/discovery-shell.tsx` — F-11
- `src/components/shared/site-footer.tsx` — F-13
- `src/components/ui/tabs.tsx` — F-06
- `src/app/(site)/destinations/page.tsx` (+ `page.test.tsx`) — F-03
- `src/app/(site)/listings/page.tsx` (+ `page.test.tsx`) — F-03
- `src/app/(site)/guides/[slug]/page.tsx` — F-10
- `src/app/(protected)/account/notifications/page.tsx` — F-02
- `src/app/(protected)/account/notifications/notification-preferences-client.tsx` — **new** (F-02)
- `src/features/requests/components/request-detail-screen.tsx` — F-19
- `src/features/requests/traveler-requests-screen.tsx` — F-06
- `src/features/bookings/components/booking-detail-screen.tsx` — F-18
- `src/features/guide/components/excursions/guide-excursions-screen.tsx` — F-15
- `src/features/guide/components/public/guide-profile-screen.tsx` — F-14
- `src/features/homepage-classic/components/homepage-hero-form-classic.tsx` — F-20
- `src/features/homepage/components/hero-conversation.tsx` — F-12
- `src/features/profile/components/LicenseAddButton.tsx` — F-16
- `src/lib/supabase/queries-core.ts` (+ `queries-core.test.ts`) — F-10

## Commands run (results)

```
bun install                → ok
bun run typecheck          → 0 errors
bun run lint               → 0 errors, 21 pre-existing warnings (src/data/guide-* boundary; untouched)
bun run test:run           → 226 files, 1155 tests pass (was 1151; +4 QA-filter tests)
bun run build              → success
```

## Screenshot evidence (`docs/qa/visual-fix-20260708/screenshots/`)

- `desktop/preview_hero_cards_tabs.png` — F-01 (hero title + panel, no gap), F-08 (card fallbacks), F-06 (tabs, no overlap)
- `mobile/preview_hero_cards_tabs.png` — F-01 mobile, F-08 mobile, F-06 mobile, F-09 (top clearance)
- `desktop/home_hero.png` — F-20 (legible scroll cue)
- `mobile/ai_page.png` — F-12 (placeholder fits), F-13 (footer link styled)
- `desktop/listings_check.png` — F-03 (`/listings` → `/guides` redirect)

The desktop/mobile `preview_*` shots were rendered from a temporary `dev/visual-fix-preview`
harness that mounts the real `ImmersiveHero`, `OpenGroupCard`, and `Tabs` components with
representative props (local env has no Supabase, so live data pages can't render real
content). The harness was removed after capture — it is not in the final build or diff.

## Remaining risks / blockers

1. **No local Supabase** in this worktree — data-driven surfaces (guide cabinet F-04/F-05,
   traveler notifications F-07, booking detail F-18, guide profile F-11/F-14/F-16,
   `/account/notifications` F-02 which is auth-gated) could not be re-verified against live
   data. Those fixes are verified by typecheck + lint + unit tests + component-level render;
   recommend a staging pass with real accounts before ship.
2. **F-10 is an app-level hide only.** The QA guide row still exists in the DB. If a future
   query bypasses `applyGuideFilters` / the profile guard, the seed could resurface — the
   durable fix is to remove/flag the seed row in prod data (out of scope: code-only mission).
3. **F-17 left as-is by design.** If the owner later wants completion tied to more fields,
   `getTravelerProfileSection2Checklist` in `src/lib/profile/traveler-profile-completion.ts`
   is the single place to extend.
4. **F-04/F-05** were judged screenshot artifacts from code review, not live re-render.
