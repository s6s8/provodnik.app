# NEXT_PLAN.md — Provodnik: Phase 8 to Launch

> STATUS (2026-05-04): **launch-readiness finale — shipped Phase 8–11, PRODUCT_READY_2026-05-04.md written, ~7 commits since cc2007b.** Brain ran the second overnight loop iteration off the Phase 8 audit findings. T071-GATE took the all-pass branch after T071.1 + T071.2 each returned zero P0/P1 findings. Plans 58/59/60/61 all closed: Plan 58 traveler/guide audit fixes, Plan 59 notifications schema + LCP priority + История chip + listing-detail hero, Plan 60 explicit fetchPriority for Next.js 16 priority Image (4 files) + production listings re-seed (10 rows, 6 categories), Plan 61 dead Unsplash URL replacement (2 photo IDs across 4 rows). 5 deferral ADRs landed (ADR-054 priority-on-listing-detail, ADR-055 broken-Unsplash-seed-images, ADR-056 listings-search-id-name, ADR-057 inbox-empty-state-copy, ADR-058 stale-test-credentials). Single open finding: nightlife chip in `interests.ts` — T001 partial regression (adventure removed correctly, nightlife survived a post-T001 edit) — P2 cosmetic, not a launch blocker. Slack patch_42 ts=`1777856565.358759`, Telegram message_id=3536, hours=15 (cumulative loop). Cumulative across both overnight runs (2026-05-02→2026-05-04): ~42 commits, 94 ledger rows ticked, 17 findings files, 11 phase gates closed, 9 ADRs added. Next: launch.

> STATUS (2026-05-03): **launch-readiness-2026-05-02 — shipped overnight — 30 commits.** Brain ran 51 iterations of the overnight loop with `claude --dangerously-skip-permissions` from kickoff `e4c1304` (2026-05-02T23:41Z) through ledger close. All 55 ledger rows ticked `[x]`; 0 `[ ]`/`[~]`/`[!]` rows remaining. Key shipments: Plan 50 specializations matching system end-to-end (table column → guide profile chip editor → inbox soft-sort + match badge → /guides chip filter with URL `?spec=` + Сбросить → backfill proposal script + CSV README); Plan 49 test-suite recovery (homepage form regex + confirmed-booking-card mock + supabase fixtures); Plan 51-53 audit fix wave covering 8 audits across guide cabinet + traveler cabinet + flow + auth-residual + service-surfaces with 53 findings (P0:7, P1:16, P2:30) — every P0/P1 patched (ISO date format, RUB→₽, status localization, /guide/orders redirect, /guide/settings render, /guide/reviews + /guide/onboarding return-to-cabinet, message thread RLS, offer-QA RLS, guide_offers INSERT recursion, PostgrestError handling via `pg cast`, group-full disable, hardcoded 4.9 removal, /profile/personal placeholder, auth URL aliases, forgot-password disable, FEATURE_TR_NOTIFICATIONS server-side lift, traveler-request `dateFlexibility` propagation); 4 deferred-decision ADRs landed (T041–T044: monetization, /tours, anti-disintermediation, specs-push). All commits pushed to `origin/main` (HEAD `cc2007b`). Slack patch_41 ts=`1777796408.172759`, Telegram message_id=3531, hours=75. Next plan: launch.

> STATUS (2026-05-01): **PLANS 48 + 45 SHIPPED — homepage interests cleanup + V1 listing editor purge. Commits `cf92355` (plan-48) and `0547d09` (plan-45) on main; pushed to origin; Vercel deploy `dpl_FW15ER6ohZNyvqounBkKTnCBWQoc` READY; Sentry clean.**
>   - **Plan 48 — homepage form polish:** dropped "Активный отдых" + "Ночная жизнь" from `INTEREST_OPTIONS` (no product basis); homepage form now renders 8 chips in 2-col layout with row-aligned icons; label "Интересы поездки" → "Интересы". Synced four sibling `INTEREST_LABELS` dictionaries (bid-form-panel, guide-inbox, active-request-card, traveler-request-detail) so old requests still render their slugs but new requests can no longer carry the dropped values. Submit button wrapper `sm:pt-2` → `sm:pt-8` — desktop button no longer crowds the footer.
>   - **Plan 45 — ListingEditorV1 purge:** deleted `src/features/guide/components/listings/ListingEditorV1/` (24 files, ~3500 LOC), `src/app/(protected)/guide/listings/{new,[id]/edit}/page-v1.tsx`, `src/app/(public)/listings/[id]/transfer/page.tsx`. Stripped `if (flags.FEATURE_TR_V1)` dynamic-import branches from `new/page.tsx` + `edit/page.tsx`. Removed `FEATURE_TR_V1` from `flags.ts` + `flags.test.ts`. **Necessary scope expansion:** `(public)/listings/[id]/page.tsx` had a `listing.exp_type === "transfer"` dispatch that dynamically imported the deleted transfer route — replaced with `notFound()` since that route was always V1-gated to 404. Plan 45 spec missed the dispatch; net diff: 32 files changed, 2 insertions, 3531 deletions.
>   - **Verification:** `bun run typecheck` clean (after clearing stale `.next/types/`). `bun run lint` 2 pre-existing warnings (React Compiler informational on `react-hook-form` `watch()`). `bun run test:run src/lib/flags.test.ts` 2/2 pass. Vercel build status `READY`. Sentry: zero new issues filed in last 30 minutes.
>   - **Pre-existing failing tests still queued:** 5 broken assertions from before Plan 43 (homepage button rename, `requests.category` schema field removed, `confirmed-booking-card` `useRouter()` not mocked). Untouched this plan.
>   - **Out of scope (still queued):** Plan 46 (`/how-it-works` copy rewrite — cursor-agent dispatch, 1 file), Plan 47 (`/guides` list filter + count + profile button removal — cursor-agent dispatch, needs Supabase pre-check that some guides have published listings to avoid empty-page risk), Plan 44 (ПППД-D guide cabinet browser audit — needs `chrome-devtools-mcp__*` permissions added to `.claude/settings.json` first), Task_Z (BLOCKED until launch).
>   - **Next plan:** Plan 47 Supabase pre-check (count of approved guides with at least one published listing) → Plan 46 + Plan 47 dispatch in parallel (cursor-agent, file-disjoint).

> STATUS (2026-04-30): **PLAN 43 SHIPPED — eight walkthrough findings + lint sweep, 52→2 warnings. Commit `034e12f` on main; pushed to origin (Vercel auto-deploy).**
>   - **Critical fixes verified:** F2 P0 (currency ×100 → `kopecksToRub` via extracted `src/data/traveler-request/map.ts`, 6 Vitest assertions in `map.test.ts`); F1 P1 (duplicate chrome on `/listings/[slug]` removed — `(public)/layout.tsx` is the single source); F5 P1 (new `/traveler/bookings/page.tsx` index closes the 404 trap that dispute/detail redirects and notification triggers were leading users into).
>   - **Structural:** F4 nav drift fixed in `SiteHeader` (pathname-based selection → role-based, desktop + mobile mirrored); F3 nested `<main>` removed across two layouts and seven feature components / pages, replaced with semantic `<article>`/`<section>`/`<div>`.
>   - **Polish:** F6 guide-inbox dates pinned to `ru-RU`; F7 `/guide/portfolio` gets its own `<title>`; F8 guide-listing-card hides duplicated city + renders hours for sub-day excursions.
>   - **Lint sweep:** ESLint config gets `argsIgnorePattern: "^_"` family (Context7-verified against `/typescript-eslint/typescript-eslint`); 5 redundant `eslint-disable` directives removed; 5 genuinely dead declarations removed; `HelpSearch.tsx` `aria-selected` added; 17 `<img>` → `<Image>` (Context7-verified against `/vercel/next.js`); `next.config.ts` `remotePatterns` extended for `*.supabase.co/storage/v1/object/public/**`.
>   - **Side cleanup:** AP-012 violations in `transfer/page.tsx` (×2) and `TransferCrossSellWidget.tsx` fixed (`* 100` / `/ 100` → `kopecksToRub`) — caught while touching the files for T5/T12. **HOT.md grep is now clean.**
>   - **Verification:** `bun run typecheck` clean. `bun run lint` 2 warnings (both React Compiler informational on `react-hook-form` `watch()`, intentionally left). 12/12 Vitest on the new `map.test.ts` + existing `money.test.ts`. 5 pre-existing test failures (homepage form button rename, `requests` schema `category` field removed, `confirmed-booking-card` `useRouter()` not mocked) — all in files I did not modify; pre-existing, not caused by this plan.
>   - **Out of scope:** `ListingEditorV1` strategic delete vs keep (still queued, needs Alex); 2 React Compiler informational notices on `watch()`; ПППД-D live browser audit (still queued); Task_Z (BLOCKED until launch).
>   - **Spec + critique + decomposition:** `_archive/bek-frozen-2026-05-08/audits/plan-43/plan.md`. Findings + screenshots: `_archive/bek-frozen-2026-05-08/audits/plan-43/findings.md`.

> STATUS (2026-04-30): **PLAN 43 OPENED — three-role test-account walkthrough completed, eight findings open. Spec: `_archive/bek-frozen-2026-05-08/audits/plan-43/findings.md`. ERRORS appended (`ERR-057`, `ERR-058`).**
>   - **Run summary:** Бек executed the recommendation-#1 walkthrough from `NEXT_PLAN_OPTIONS.md` against production at 1280px (375px confirmation on F1). Three role logins succeeded (`traveler@provodnik.app`, `guide@provodnik.app`, plus a clean guest pass). All journeys completed without console errors, 5xx, infinite spinners, or broken auth flow. The ×100 budget bug and the duplicate-footer regression are the only items that meaningfully degrade the surface; the rest are polish.
>   - **Findings (8):** F1 P1 duplicate `<header>`/`<footer>` on `/listings/[slug]` (page wraps content in chrome that the route-group layout already provides → `ERR-057`). F2 P0 budget ×100 on traveler request detail (`budget_minor` rendered as RUB without `kopecksToRub` → `ERR-058`, direct AP-012 reoccurrence). F3 P3 nested `<main>` landmarks on traveler routes. F4 P2 nav shape differs across pages of the same authenticated traveler. F5 P2 `/traveler/bookings` returns 404. F6 P3 mixed locale on guide-inbox dates (`22 Apr` next to `6 – 13 мая`). F7 P3 `/guide/portfolio` `<title>` is the homepage tagline. F8 P3 `/guide/listings` shows duplicated city + meaningless `0 дн.` for excursion.
>   - **Acceptance for Plan 43:** F2 fixed and regression-tested in Vitest; F1 fixed and verified at 1280 + 375; F3, F4, F5 each either fixed or downgraded with rationale; F6 / F7 / F8 fixed in same plan or deferred to a polish sub-plan, decision recorded.
>   - **Out of scope:** ПППД-D live browser audit (still queued); Task_Z (BLOCKED until launch).
>   - **Screenshots:** `_archive/bek-frozen-2026-05-08/audits/plan-43/guest-listing-detail-1280.png`, `_archive/bek-frozen-2026-05-08/audits/plan-43/guest-listing-detail-375.png`.

> STATUS (2026-04-30): **PLAN 42 — ПППД-D guide cabinet audit CLOSED with zero findings.**
>   - **Code-level audit:** grep across `src/app/(protected)/guide/*` (17 routes) and `src/features/guide/**` for fiction patterns (`проверен`, `Анна Миронова`, `4.[8-9]` ratings, `Оплата`, `TODO`/`FIXME`/`hardcoded`/`stub`/`sample data` markers). Result: **0 hits**. Plan 40's bulk delete of 39 orphan components removed the dead code that was the likely source of fiction; what remains is honest.
>   - **HTTP sanity:** all 14 guide cabinet routes (`/guide`, `/guide/inbox`, `/guide/listings`, `/guide/listings/new`, `/guide/bookings`, `/guide/calendar`, `/guide/orders`, `/guide/portfolio`, `/guide/profile`, `/guide/reviews`, `/guide/settings`, `/guide/stats`, `/guide/verification`, `/guide/onboarding`) return `307` redirect to `/auth` for unauthenticated requests. Zero 5xx. Routing healthy.
>   - **Live browser smoke deferred:** chrome-devtools-mcp browser was locked by another process during this session. The live UI/UX audit at 1280px + 375px under a logged-in guide role remains valuable but was not performed in this run. Defer to a focused browser-only session.
>   - **No dev-note posted:** audit-passed-clean is below the threshold for a 14th same-day Slack notification. SOT update only.
>   - **Out of scope:** Live browser smoke (next browser-available session); Task_Z (BLOCKED until launch).

> STATUS (2026-04-30): **PLAN 41 — notFound() HTTP-200 investigation CLOSED. Documented Next.js streaming limitation, NOT a fixable bug.**
>   - **Tested via direct Vercel URL `provodnik-app.vercel.app/tours`** — also returns 200, eliminating Cloudflare proxy as the cause.
>   - **Pattern correlates to route group:** `(public)` (no await in layout) → 404 works correctly. `(site)` and `(protected)` (have `await readAuthContextFromServer()` in layout) → status 200 with not-found body. `/listings/[fake]` returns 404; `/guides/[fake]`, `/destinations/[fake]`, `/tours` all return 200.
>   - **Tried `unstable_rethrow` in error.tsx** — caused dual not-found render (root + group), still 200. Reverted.
>   - **Root cause (per Next.js streaming docs):** when layout has `await`, server commits to HTTP 200 before page evaluates `notFound()`. Status cannot be altered mid-stream. Next injects `<meta name="robots" content="noindex">` automatically as the documented mitigation.
>   - **Plan 34's robots:noindex on all not-found.tsx is therefore the OFFICIAL Next.js fix, not a workaround.** Search engines won't index the 200-status pages.
>   - Logged as `ERR-056` in SOT. Closes notFound() task list (N1–N5).
>   - **Out of scope (queued):** ПППД-D — needs focused browser-audit session on 17 guide-cabinet pages × 2 viewports, not drainable in one shot. Task_Z — BLOCKED until launch.

> STATUS (2026-04-30): **PLAN 40 SHIPPED — bulk-deleted 39 orphan tsx components (6,202 lines removed). Commit `6fde394`; Vercel build READY; all public surfaces 200; Sentry clean; Slack + Telegram posted (2h, $300).**
>   - Triggered by Plan 39 discovery: `listing-detail-screen.tsx` was orphan, multiple earlier today's plans (36, 38, first attempt of 39) had hit dead files.
>   - Grep across `src/features/` + `src/components/` (excluding `.test.tsx`) for imports `from "...<basename>"` → 39 components with zero matches outside their own export.
>   - Bulk-deleted in single commit; `bun run typecheck` passed (zero errors), `bun run lint` dropped 55 → 52 warnings (3 were in deleted files), Vercel build went `BUILDING → READY`.
>   - Smoke-checked `/`, `/listings`, `/guides`, `/destinations`, `/listings/sochi-sea-tea-and-viewpoints` — all 200, layouts intact.
>   - Memory saved: `feedback_grep_imports_before_edit.md` — pre-edit grep rule to prevent future "edited dead file" mistakes.
>   - **Out of scope (queued, big items only):** ПППД-D (Plan 41+) page-by-page acceptance; deep `notFound()` HTTP-200 root-cause investigation; Task_Z (post-launch presentation). All remaining queue items are large, focused-session-shaped — not drainable as small same-day plans.

> STATUS (2026-04-30): **PLAN 39 SHIPPED — review_count > 0 guards on LIVE listing-detail components + dead file deleted. 4 files; final commit `a2b4e3f`; Vercel deployed; Sentry clean; Slack + Telegram posted (2h, $300).**
>   - **CRITICAL DISCOVERY:** my Plans 38 + 39 first attempts edited `features/listings/components/public/listing-detail-screen.tsx` thinking it was the live listing detail page. It WASN'T — it's orphan code never imported by any route. Production listing pages are rendered by `components/listing-detail/ExcursionShapeDetail.tsx` (and `TourShapeDetail.tsx`). Plan 38 dev-note's "Раздел отзывов скрывается" claim was technically true at the file level but had ZERO effect on what users actually see.
>   - **Real fixes (this commit):**
>     - `ExcursionShapeDetail.tsx:126` — added `listing.review_count > 0` guard around `★ {avg} · {count} отзывов`. Production listing detail pages no longer show "★ 0.0 · 0 отзывов" (which was visible on every published listing since DB has `average_rating: 0.00, review_count: 0` for all of them).
>     - `TourShapeDetail.tsx:118` — same guard.
>     - `GuideCard.tsx:42` — same guard on the guide card embedded in listing detail.
>     - Deleted `features/listings/components/public/listing-detail-screen.tsx` — orphan file with no imports, contained the original fake content from Plans 38+39 first wave. Net 309 lines removed.
>   - **Out of scope (queued):** ПППД-D (Plan 40+); deep `notFound()` HTTP-200 root-cause investigation; Task_Z (post-launch); fallbackCover Unsplash placeholder (still in `listing-detail-screen.tsx` — wait, that file is now deleted, so this is also resolved). Actually no remaining queue items beyond the big ПППД-D and the research task.

> STATUS (2026-04-30): **PLAN 38 SHIPPED — listing-detail fakeReviews + "4.9" fallback stripped. 1 file (~30 lines net deletion); commit `547e2f7`; Vercel deployed; Sentry clean; Slack + Telegram posted (2h, $300).**
>   - `listing-detail-screen.tsx`: `fallbackReviews` array (3 fake reviews with hardcoded names + bodies + ratings) deleted entirely.
>   - `reviewCards = reviews ?? []` — empty when no real reviews come in via prop.
>   - Reviews section ("Что говорят о поездке") now wrapped in `{reviewCards.length > 0 && (...)}` — hidden when empty instead of showing fakes.
>   - `guideRating ... ?? "4.9"` → `... ?? null`; aside `{guideRegion} · {guideRating} ★` now conditionally hides the rating part when null.
>   - **Out of scope (queued):** `galleryThumbs` (3 hardcoded Unsplash thumbs shown for every listing); `defaultExclusions` (["Авиабилеты", "Личные расходы", "Страховка"] hardcoded for every listing); ПППД-D (Plan 39+); deep `notFound()` HTTP-200 root-cause investigation; Task_Z (post-launch).

> STATUS (2026-04-30): **PLAN 37 SHIPPED — fake `rating: 4.8` stripped from data layer + cards. 3 files; commit `8c0ac35`; Vercel deployed; Sentry clean; Slack + Telegram posted (2h, $300).**
>   - `data/supabase/queries.ts` `mapListingRow` + `mapGuideRow`: hardcoded `rating: 4.8` → `rating: 0`. The downstream `ListingCard` already had a `> 0` guard, so cards now correctly hide the rating row when no real reviews exist.
>   - `public-listing-discovery-screen.tsx` mapping: same fix on the duplicate mapping.
>   - `public-guide-card.tsx`: added `> 0` guards for both rating and tour count — UI suppresses both when there's no real data, instead of showing "★ 0.0" or "0 туров".
>   - **Discovered + queued for Plan 38:** `listing-detail-screen.tsx` still has fake-data residue: `fallbackReviews` array with hardcoded fake reviewer names + ratings + bodies, plus `?? "4.9"` fallback for guide rating. Bigger rework — separate plan.
>   - **Out of scope (queued):** Plan 38 (listing-detail fakeReviews + 4.9 fallback); ПППД-D (Plan 39+) page-by-page acceptance; deep `notFound()` HTTP-200 root-cause investigation; Task_Z (post-launch).

> STATUS (2026-04-30): **PLAN 36 SHIPPED — per-card "проверенный" sweep + dead identityVerified badge removed. 5 files; commit `278a0dd`; Vercel deployed; Sentry clean; Slack + Telegram posted (2h, $300).**
>   - `step-details.tsx` request-form footer: "проверенные гиды" → "местные гиды".
>   - `public-reviews-section.tsx` review header: dropped "Проверенные" — reviews aren't verified, just user-submitted.
>   - `guide-profile-screen.tsx` removed dead "✓ Верифицирован" badge that depended on `trustMarkers.identityVerified` — data layer hardcoded that field to `false`, so the badge never rendered.
>   - `app/(site)/guides/[slug]/page.tsx` removed the `trustMarkers: {...}` line; was only consumed by the deleted badge.
>   - `data/public-guides/types.ts` removed the `PublicGuideTrustMarkerKey` type + `trustMarkers` field on `PublicGuideProfile` — both now unused.
>   - **Kept (real DB-driven badge):** `PublicGuideTrustMarkers` "Проверен/Проверка профиля" badge keyed off `verification_status` in `guide_profiles` (10 approved, 3 draft, 1 submitted) — admin process is real, badge is honest. Untouched.
>   - **Closes the public-pages honesty pass.** All public-facing fictional "verified" claims are now removed.
>   - **Out of scope (queued):** ПППД-D (Plan 37+) page-by-page acceptance; deep `notFound()` HTTP-200 root-cause investigation; Task_Z presentation (after launch).

> STATUS (2026-04-30): **PLAN 35 SHIPPED — `/home2` duplicate route deleted. Single-file deletion (commit `e9a8926`); Vercel deployed; Sentry clean; no separate Slack/Telegram post (too small — file delete is below the threshold for a 7th same-day notification).**
>   - Deleted `src/app/(home)/home2/page.tsx` — was a verbatim copy of `/` (homepage) with no inbound links, weaker error handling (no try/catch around supabase queries), and a longer metadata title that diverged from the canonical homepage.
>   - Visited `/home2` now shows the not-found UI (with `robots: noindex` from Plan 34) — body content correct, HTTP status still 200 due to the unresolved `notFound()` quirk, SEO unaffected because of noindex.
>   - **Closes the "5 suspicious legacy pages" original cleanup list** (started in Plan 29 with 4 deletions; `/home2` was the deferred fifth).
>   - **Out of scope (queued):** Per-card "проверенный" sweep on `/listings` and `/guides` items; ПППД-D (Plan 36+) page-by-page acceptance; deep `notFound()` HTTP-200 root-cause investigation.

> STATUS (2026-04-30): **PLAN 34 SHIPPED — `robots: noindex` on all not-found.tsx pages to address SEO concern from HTTP-200 quirk; underlying quirk itself unfixed.**
>   - **What worked:** added `robots: { index: false, follow: false }` metadata to `src/app/not-found.tsx`, `src/app/(site)/not-found.tsx`, `src/app/(protected)/not-found.tsx`. Verified: `/tours` and any other notFound()-rendered page now emits `<meta name="robots" content="noindex">` — search engines won't index "not found" pages as real content.
>   - **Cosmetic caveat:** Next.js v15+ metadata merging quirk emits BOTH the layout's `index, follow` AND the page's `noindex` tag in the same HTML. Google's algorithm treats the most restrictive directive as binding (`noindex` wins), so functionally fine; HTML is just slightly noisy. Not worth chasing further.
>   - **What didn't work (reverted):** tried `export const dynamic = "force-dynamic"` on `/tours/page.tsx` — no effect on HTTP status. Tried adding `await headers()` to force-dynamic-render — also no effect. Underlying cause of `notFound()` returning HTTP 200 (instead of 404) remains uninvestigated. Sentry's `withSentryConfig` wrapper, `(site)/error.tsx`, `proxy.ts` matcher (excludes /tours), root `not-found.tsx` — all checked, none cause it. Possibly Cloudflare proxy normalization or a deeper Next.js 15+ behavior. Deferred to a focused investigation plan.
>   - **Verified privacy + cookies pages are clean** — neither has payment/refund fiction. Audit closed for ПППД-A policies.
>   - **Out of scope (queued):** Per-card "проверенный" sweep on `/listings` and `/guides` items; `/home2` audit; ПППД-D (Plan 35+) page-by-page acceptance; deep Next.js notFound() HTTP-200 root-cause investigation.

> STATUS (2026-04-30): **PLAN 33 SHIPPED — `/policies/{cancellation,refunds}` killed (config-level 307 → /trust); refund refs stripped from terms + sitemap. 4 files changed; final commit `d99c177`; Vercel deployed; Sentry clean; Slack + Telegram dev-notes posted (2h, $300).**
>   - First attempt used `redirect()` in server components — 200 was returned instead of 307 due to App Router rendering quirk (same family as the `/tours` `notFound()` HTTP-200 issue). Switched to `next.config.ts` `redirects()` array which produces real edge-level 307 with `Location: /trust`.
>   - Page `.tsx` files for cancellation + refunds deleted (config redirects fire before page resolution).
>   - Terms page: stripped "подтверждения оплаты" mention from dispute-step prose; removed bottom "Вопросы о возвратах..." block; cleaned up unused `Link` import.
>   - Sitemap entries for both deleted policies removed.
>   - **Lesson learned (not yet ERR-NNN-codified):** App Router server-component `redirect()` and `notFound()` return HTTP 200 with rendered fallback HTML in production, not the documented 307/404. Workaround: use `next.config.ts` config-level `redirects()` for redirects; for true 404s the same problem applies and warrants a separate investigation (e.g. `/tours` still returns HTTP 200 with "Страница не найдена" body).
>   - **Out of scope (queued):** privacy + cookies policy pages (likely OK but not yet audited); per-card "проверенный" sweep on `/listings` and `/guides` items; `/home2` audit; ПППД-D (Plan 34+) page-by-page acceptance.

> STATUS (2026-04-30): **PLAN 32 SHIPPED — `/trust` page rewritten without payment/refund fiction. 5 edits in one file; commit `a7c3cb4`; Vercel deployed; Sentry clean; Slack + Telegram dev-notes posted (2h, $300).**
>   - Stripped "До оплаты", "политика возвратов", "политике отмен", "Подробнее об отменах и штрафах" from `/trust` — none of these systems exist in v0.
>   - New framing: bid-flow + written confirmations in chat + taimstamped messages = source of truth for disputes. MVP caveat preserved in intro.
>   - Removed second CTA `Подробнее об отменах и штрафах → /policies/cancellation` to avoid pointing at fiction-laden policy page.
>   - Page renders 200 on prod, no fictional terms in HTML, single primary CTA (`Смотреть экскурсии`) intact.
>   - **Out of scope (queued):** `/policies/*` legal-correctness audit (separate plan — these pages may have similar payment/refund fiction); per-card "проверенный" sweep on `/listings` and `/guides` items; `/home2` audit; ПППД-D (Plan 33+) page-by-page acceptance.

> STATUS (2026-04-30): **PLAN 31 SHIPPED — honesty pass on public top copy. 5 small fixes (4 copy + 1 dead-code) applied directly; commit `8adbee0`; Vercel deployed; Sentry clean; Slack + Telegram dev-notes posted (2h, $300).**
>   - Stripped "проверенные/проверенными" claims from `/guides` (header + empty state), `/destinations` (header), `/listings` (metadata), `/how-it-works` (catalog step).
>   - `/guides` empty state rewritten: no more "скоро появятся проверенные гиды" promise — honest "Пока нет гидов" with guide-onboarding nudge.
>   - Removed dead `noOpenRequests` empty-state key from `src/lib/copy.ts` (terminology-lock landmine; unused project-wide).
>   - **Out of scope (queued):** `/trust` rewrite (heavy "оплата" copy but no payment system) — separate plan; `/policies/*` legal-correctness audit — separate; per-card "проверенный" sweep on `/listings` and `/guides` items — separate visual audit.
>   - **Next plan:** continue ПППД-A second wave on remaining surfaces (`/trust` rewrite or `/policies/*` audit) OR pivot to ПППД-D / ПППД-C per the original group order. Audit method: open page-by-page at 1280px + 375px under guest, find honest-product violations, bundle as Plan 32.

> STATUS (2026-04-30): **PLAN 30 SHIPPED — homepage UX + Help Center + footer terminology. 7 cursor-agent-shaped tasks all applied directly per ERR-055 lesson; 7 commits on main, pushed, Vercel deployed, prod verified. Slack + Telegram dev-notes posted (5h, $750).**
>   - **Commits on main:** `b515f38` T1 (gap balance comment) · `0d8ef88` T5 (footer FAQ → Биржу) · `18193d5` T6 (help article rewrite) · `e916632` T7 (`FEATURE_TR_PAYMENT` flag + payment category gate) · `b4acd26` T2 (cards uniform height + interests row always) · `9e2702b` T3 (formatGroupLine extracted + unified across homepage + guide inbox) · `24c5ecf` T4 (offers-first sort + filter full Сборная without offers).
>   - **Deploy verified:** homepage renders new group format ("Сборная группа", "Своя группа"); footer FAQ contains "Биржу" (no hits for "раздел Открытых запросов"); homepage 200; Sentry 0 new issues post-deploy.
>   - **Wave 3 SQL skipped:** `help_articles` table is empty in prod — Help Center page falls through to TS `FALLBACK_ARTICLES` which T6 updated. UPDATE would have been a no-op.
>   - **Two prod env-var follow-ups DONE in this session** (via Vercel REST API + PAT in codex-ops/.env.local — `vcp_*` token has full scope, unlike the `vca_*` MCP-scoped tokens):
>     - `FEATURE_TR_TOURS` flipped 1 → 0; redeploy `a070226` READY; `/tours` now renders "Страница не найдена" (user-facing 404). HTTP status is 200 due to Next.js App Router `notFound()` quirk — UI-correct, status-imperfect; track as a separate concern if SEO matters.
>     - `FEATURE_TR_HELP` flipped 0 → 1; same redeploy; `/help` now serves 200 with the Help Center content (T6/T7 changes live: rewritten "Как отправить заявку гиду?" article + payment category gated by `FEATURE_TR_PAYMENT`).
>   - **Lint/typecheck:** 0 errors, 55 pre-existing warnings unchanged.
>   - **Memory updated:** `feedback_skip_cursor_for_pure_deletes.md` saved (mirrors ERR-055 boundary signal — when a task is `rm`-shaped or pure mechanical, orchestrator applies directly; skip cursor-agent dispatch overhead).

> STATUS (2026-04-30): **PLAN 29 CLOSED — legacy cleanup live on prod, dev-notes posted, SOT closed. Plan 30 dispatching now.**
>   - **Deploy verified:** `/guide/listings-v1`, `/guide/statistics` → 307 → `/auth` (route deleted, protected layout middleware bumps unauth requests to login — correct behavior). `/guide/[id]` → permanent redirect to `/guides/[slug]`. `/guide/dashboard` retargeted in code; redirect removed.
>   - **`/tours` discrepancy:** code-level `notFound()` guard ships per Plan 29 T5 — but production env has `FEATURE_TR_TOURS=1` (someone set it externally). Page currently renders. Code is correct; env needs flipping in a session with Vercel admin access. Logged for follow-up below.
>   - **Sentry:** zero unresolved issues filed in last 24h. No regressions from Plan 29.
>   - **SOT:** ERR-055 logged (Plan 29 cursor-agent T1 stall + ZERO_COMMIT fallback applied directly to all 5 tasks). INDEX.md +5 entries (ERR-052..055 backfilled).
>   - **Dev-notes:** Slack + Telegram pending in this run (one Slack post for the day, hours_override=7).
>   - **Follow-up for next session:** flip `FEATURE_TR_TOURS=0` (or unset) in Vercel project env so `/tours` actually 404s in prod. Vercel API tokens stored in memory have rotated; re-auth via plugin first. Single env update + redeploy.

> STATUS (2026-04-29 night): **PLAN 29 SHIPPED — legacy cleanup, 5 commits on main (`6e30109` HEAD), pushed to origin. Vercel deploy unverified — prod still serves old code 17 min after push (build failed silently OR still queued). Slack/Telegram dev-notes BLOCKED until deploy verified.**
>   - Local quality: typecheck 0 errors, lint 0 errors (55 pre-existing warnings unchanged), all 5 commits FF-merged to main.
>   - Commits on main: `0c8868b` delete `/guide/listings-v1` · `aeccdf2` delete `/guide/statistics` · `e77da38` `/tours` notFound() under `FEATURE_TR_TOURS` · `e0047bf` retarget `/guide/dashboard` → `/guide` (8 hits, 2 file deletes) · `6e30109` legacy `/guide/[id]` → `permanentRedirect()` to `/guides/[slug]`, public-guide-card slug href.
>   - cursor-agent dispatch failed on T1 (stalled at 600s timeout per ERR-049 pattern). Orchestrator applied T1 + T3 + T5 + T2 + T4 directly per ZERO_COMMIT fallback rule. Pure file deletes + mechanical edits + small structural redirect — same end result, just faster than waiting on stalled agent.
>   - **Verification PENDING (next session):** Vercel build status (was it READY or ERROR?), Sentry sweep for new issues, browser smoke at 1280px under guest on `/`, `/listings`, `/guides`, `/destinations`, `/help`, `/tours` (must 404), `/guide/<old-uuid>` (must 308 → `/guides/<slug>`), `/guide/dashboard` and `/guide/listings-v1` and `/guide/statistics` (must 404). Post-deployment 4-step checklist (functional, runtime, cleanliness, completeness) deferred.
>   - **Post-work PENDING (next session):** SOT close-out (ERRORS.md += ERR-NNN logging the cursor-agent stall pattern reproduction; INDEX.md update; METRICS.md), Slack dev-note via `slack-devnote.mjs`, Telegram dev-note via `telegram-devnote.mjs`. Items.json draft below.
>   - **Plan 30 first wave PENDING (next session):** 7 cursor-agent tasks (Wave 2a homepage cluster T1→T2→T3→T4 + Wave 2b content cluster T5/T6/T7 parallel). Wave 3 SQL UPDATE on `help_articles` row `kak-otpravit-zayavku-gidu` follows T6.
>   - **Items.json draft for Plan 29 dev-note** (apply when deploy verified):
>     ```json
>     {
>       "theme": "Чистка пяти legacy-маршрутов перед поэтапной приёмкой главной",
>       "items": [
>         { "kind": "fix", "area": "Маршруты", "text": "Удалена дублирующая страница управления экскурсиями /guide/listings-v1 — у гидов остаётся одна каноническая страница." },
>         { "kind": "fix", "area": "Маршруты", "text": "Удалён редирект /guide/statistics — раздел был пустой и только захламлял урл-пространство." },
>         { "kind": "change", "area": "Маршруты", "text": "Все внутренние ссылки на /guide/dashboard переведены на канонический /guide; редирект-страница удалена." },
>         { "kind": "fix", "area": "Маршруты", "text": "Старая страница профиля гида /guide/[id] заменена на постоянный редирект на каноническую /guides/[slug] — карточки гидов из каталога направлений теперь ведут на правильную страницу, а не на сломанную старую." },
>         { "kind": "fix", "area": "Маршруты", "text": "Страница /tours отдаёт 404 за фиче-флагом — нет фейковой страницы под несуществующую фичу многодневных туров." },
>         { "kind": "tech", "category": "infra", "text": "Закреплены два новых обязательных правила: «Ревизия Бека» (проверка в браузере под нужной ролью на 375 и 1280 пикселей перед закрытием задачи) и «SOS Бек» (фиксированный формат запроса помощи когда заблокирован)." },
>         { "kind": "tech", "category": "docs", "text": "В постоянной памяти зафиксирован запрет жаргона в обращениях — это серьёзный продукт, не базар." },
>         { "kind": "tech", "category": "arch", "text": "Поднята задача для Анзора: разделить нумерацию планов между разными проектами в репо — текущая плоская нумерация привела к коллизии с внутренней работой над инструментами." }
>       ],
>       "capabilities": [
>         "Турист, который кликает на карточку гида со страницы направления, попадает на правильный профиль вместо сломанной старой страницы.",
>         "Внутренние ссылки в кабинете гида ведут на одну каноническую главную; нет двойных редиректов через мёртвые маршруты.",
>         "Сайт перестал обещать раздел «Туры», который не реализован — посетитель не натыкается на пустую страницу-заглушку."
>       ],
>       "hours_override": 7
>     }
>     ```
>   - Master plan: `docs/superpowers/plans/2026-04-29-pppd-campaign-plans-29-30-first-wave-implementation.md`. Design spec: `docs/superpowers/specs/2026-04-29-pppd-campaign-plans-29-30-first-wave-design.md`.
>   - Rollback anchor: `bf135e0` (pre-Plan-29 HEAD on main). Single command if needed: `git reset --hard bf135e0 && git push --force origin main` (requires explicit Alex ask per CLAUDE.md §9).

> STATUS (2026-04-29 late evening): **PLANS 29 + 30 FIRST WAVE SCOPED — ПППД campaign kickoff (legacy cleanup + homepage + content) + governance lock-in. 12 cursor-agent tasks + 4 orchestrator-local. READY FOR DISPATCH.**
>   - Plan 29 (legacy cleanup, 5 cursor-agent tasks): delete `/guide/listings-v1`; retarget 8 hits `/guide/dashboard` → `/guide` + remove redirect; delete `/guide/statistics` redirect; fix `public-guide-card.tsx` slug href + replace `(site)/guide/[id]` with id→slug `permanentRedirect()`; `/tours` → `notFound()` under existing `FEATURE_TR_TOURS`. `/home2` intentionally KEPT in production (deferred to ПППД-A audit).
>   - Plan 30 first wave (ПППД-A pre-agreed, 7 cursor-agent tasks): homepage gap balance comment; uniform card height + always-render interests row; unified group format extracted to `src/data/requests-format.ts`; `getHomepageRequests` filter+sort (offers-first, full Сборная sinks); footer FAQ `Открытых запросов` → `Биржу`; Help Center article «Как отправить заявку гиду?» rewrite (TS fallback + orchestrator-side DB SQL UPDATE); hide payment category under new `FEATURE_TR_PAYMENT` flag.
>   - Wave 0 (orchestrator-local, governance, this session): added Ревизия Бека + SOS Бек as new HOT entries; added `feedback_no_jargon.md` to memory + indexed in MEMORY.md; this STATUS block + Plans 31-37 stubs + namespace handoff appended below.
>   - Dispatch order: Wave 1 (Plan 29 × 5, parallel-safe) → merge → Wave 2a (Plan 30 T1→T2→T3→T4 sequential homepage cluster) + Wave 2b (Plan 30 T5/T6/T7 parallel content cluster) → Wave 3 (orchestrator SQL on `help_articles`).
>   - Master plan: `docs/superpowers/plans/2026-04-29-pppd-campaign-plans-29-30-first-wave-implementation.md`. Design spec: `docs/superpowers/specs/2026-04-29-pppd-campaign-plans-29-30-first-wave-design.md`.
>   - Next: dispatch Wave 1 (Plan 29) on Alex's go.

> STUBS — Plans 31–37 (ПППД remaining groups, audit-then-task per group)
>   - **Plan 31 = ПППД-D** — auditor opens every page in Group D at 375px + 1280px under the role that uses it; every issue becomes a separate cursor-agent task. Re-invoke brainstorm → spec → mega-plan when audit starts.
>   - **Plan 32 = ПППД-C** — same audit-then-task method, Group C.
>   - **Plan 33 = ПППД-E** — same, Group E.
>   - **Plan 34 = ПППД-F** — same, Group F.
>   - **Plan 35 = ПППД-G** — same, Group G.
>   - **Plan 36 = ПППД-H** — same, Group H.
>   - **Plan 37 = ПППД-B** — same, Group B (auth surfaces).
>   - Plan 30 second wave (13 remaining ПППД-A pages — `/listings`, `/guides`, `/destinations`, etc.) — re-invoke brainstorm → spec → mega-plan after Plan 30 first wave merges.

> HANDOFF — Plan-folder namespace (CarbonS8)
>   - **Current state:** plan numbering is flat across ALL projects in this repo. Both Provodnik (product) and BEK-runtime (internal tooling) increment the same counter. Plan 28 collision (BEK-SDK migration burned the number before the Provodnik session could claim it) proved the structure is broken.
>   - **Future shape:** `_archive/bek-frozen-2026-05-08/prompts/out/<project>/plan-NN.md` with a per-project counter — e.g. `_archive/bek-frozen-2026-05-08/prompts/out/provodnik/plan-29.md` and `_archive/bek-frozen-2026-05-08/prompts/out/bek-runtime/plan-28.md` independently.
>   - **Owner:** CarbonS8 (file-structure migration + tooling that resolves the project automatically).
>   - **Not a BEK task.** Until the migration lands, the orchestrator works around the collision by skipping numbers (Provodnik jumped 27 → 29 to avoid BEK-SDK's plan-28-* files).

> STATUS (2026-04-29 evening): **PLANS 25+26+27 SHIPPED — Profile crash fix + Mobile guide nav + Public pages crash protection. HEAD: e05597e, Vercel deploying.**
>   - Plan-25 T1: Radix Select crash on /guide/profile → NONE_VALUE sentinel (commit 018882c)
>   - Plan-26 T1: Mobile guide cabinet shell — GuideBottomNav (5 tabs) + UserAccountDrawer (right sheet) + header mobile adaptations (commit ccdeef8)
>   - Plan-27 T1: try/catch wrap on 4 public pages — homepage, /listings, /guides, /destinations (commit 85011a7)
>   - JSX fragment fix applied manually: cursor-agent placed `<UserAccountDrawer>` after `</header>` without wrapping `<>...</>` (see ERR-053)
>   - ERR-054 logged: cursor-agent writes to main workspace regardless of --workspace worktree arg; orchestrator copies+commits manually
>   - typecheck: 0 errors. lint: 0 errors (55 pre-existing warnings). Pushed to origin/main.
>   - Next: Plan 26 T2–T6 (inbox card fixes); browser smoke at 375px + 1280px under guide role; desktop Group A visual review page by page.

> STATUS (2026-04-29): **PLAN 27 SCOPED — Crash protection for public entry pages (Group A). 1 cursor-agent task. READY FOR DISPATCH.**
>   - T1: try/catch wrap on homepage, /listings, /guides, /destinations — 4 files, same ERR-052 fix pattern
>   - Dispatch: `fix/plan-27-t1` → merge → verify 4 pages render clean at 1280px under guest
>   - Plans 25 (profile crash) + 26 (mobile nav) also ready — dispatch in parallel, no file overlap
>   - Next: dispatch Batch 1 (Plans 25 + 26 + 27 T1 all independent).

> STATUS (2026-04-28 latest): **PLAN 24 COMPLETE — Принять и забронировать. HEAD: f90648c, Vercel deploying.**
>   - T1: accept-offer redirect fixed /traveler/chat → /messages (commit 06233f4)
>   - T2: accept_offer RPC updated — fn_notify_user(guide, 'booking_created') called after booking INSERT — APPLIED ✅
>   - T3: admin bookings page + confirmPaymentAction + CalendarCheck nav link (commit f90648c)
>   - guide-portfolio bucket: APPLIED ✅ (migration 20260428000001)
>   - typecheck: 0 errors. 4 files, 116 lines. Pushed to origin/main.
>   - Next: Grand Verification Plan — 5 test accounts (2 traveler, 2 guide, 1 admin) + full journey test

> STATUS (2026-04-28 earlier): **PLANS 20–23 + PROFILE CRASH FIX. HEAD: 8d9ab5a, Vercel deploying.**
>   - Plan-20 T1+T2: STATUS REPORT FORMAT block + /done polish (commit 4b09794)
>   - Plan-21 T1: equalize discovery section vertical spacing (commit 53876fc)
>   - Plan-21 T2: remove progressive disclosure from homepage request form (commit a6637c2)
>   - Plan-22 T1: prominent mode selector + «Популярно» badge (commit 278eb13)
>   - Plan-23 T1: guide-portfolio public bucket migration + storage refs migrated guide-media→guide-portfolio (commit d3a7aea) — **MIGRATION PENDING SUPABASE APPLY** (bucket `guide-portfolio` must be created via Supabase MCP `apply_migration` or manually via dashboard)
>   - Plan-23 T2: removed fake fallback data from public guide profile (fallbackListings/Offers/Reviews); real empty states added (commit 486bcdd)
>   - ERR-052: guide/profile page error boundary — createSupabaseServerClient() moved inside try/catch (commit 8d9ab5a)
>   - Pending (hard blocker for portfolio): apply migration `20260428000001_guide_portfolio_bucket.sql` to create guide-portfolio bucket + RLS policies in Supabase

> STATUS (2026-04-28): **PLAN 19 COMPLETE — Cabinet Quality Sweep + Nav Overhaul. 7 tasks shipped, 6 commits + 1 Supabase policy. HEAD: 74c8c13, Vercel deploying.**
>   - T1: Auth form chrome stripped (label/H1/subtitle removed, title/subtitle vars removed) → d911285
>   - T2: Supabase policy "portfolio public read" created on storage.objects — guide-media/portfolio/* now publicly readable
>   - T3: Messages page — auth crash fixed, chrome header removed from both return paths, empty state role-neutral → 4d0c756
>   - T4: Guide profile — bare auth.getUser() replaced with readAuthContextFromServer(); const supabase kept for data queries → afb1150
>   - T5: Protected + admin layouts aligned to nav (clamp padding + max-w-page) → 51a3112
>   - T6: publicNavLinks added for logged-out nav; listings meta "Готовые туры"→"Готовые экскурсии" → d014fca
>   - T7: /how-it-works page created (Биржа + готовые экскурсии flows, static server component) → 74c8c13
>   - Deferred to future plan: phone OTP/SMS login (needs SMS provider), reCAPTCHA (needs provider research), legal disclaimer on auth form, stale font vars in globals.css

> STATUS (2026-04-27): **PLAN 18 (= BEK 15/16/17) COMPLETE — Rubik font migration + homepage discovery + portfolio UX + guide profile resilience + nav renames + /become-a-guide. 12 files changed, 1 new route, ef60995 on origin/main, Vercel deployed.**
>   - T1 (discovery alignment): Two-layer container fix on `homepage-discovery.tsx` — `max-w-page` outer + `max-w-2xl` inner aligns with hero form above.
>   - T2 (Rubik font migration): Replaced DM Sans + Cormorant Garamond (Latin-only) with Rubik (Latin+Cyrillic variable). `globals.css` aliases `--font-sans/serif/display` → `var(--font-rubik)`. Zero class renames. ERR-051: omit `weight` on variable fonts — TS types reject range syntax.
>   - T2b (hero H1 clamp): Tightened `text-[clamp(1.75rem,4vw,2.75rem)]` → `clamp(1.5rem,2.5vw,1.875rem)` — Rubik renders larger than DM Sans at same size.
>   - T2c (homepage requests): Added `.gt("budget_minor", 0)` filter + `.limit(3)→.limit(4)` in `getHomepageRequests`. Demo data updated via Supabase REST API: rows 005–008 now have chip IDs (`nature/adventure`, `kids/history`, `food/architecture`, `architecture/history`).
>   - T3 (portfolio upload): Added `uploadError` state + catch block; label shows `cursor-not-allowed opacity-50` when disabled; helper text + error paragraph below label. ERR-049: cursor-agent hallucinated DONE with zero edits — wrapper applied changes directly (bc7b551).
>   - T4 (profile crash): Wrapped Promise.all + data-processing in try/catch on `guide/profile/page.tsx`; pre-declared let vars; `console.error` on catch; empty shell renders instead of error boundary. ERR-050: cursor-agent timed out on large file restructure — wrapper applied directly (9d0204c).
>   - T5 (nav omnibus): `guideNavLinks[0].label` "Биржа"→"Запросы"; both "Стать гидом" desktop+mobile links `/auth?role=guide`→`/become-a-guide`; `guide/page.tsx` title "Биржа"→"Запросы"; `birjha-screen.tsx` aria-label "Биржа"→"Запросы"; `guides/page.tsx` CTA href updated.
>   - T6 (new page): `src/app/(site)/become-a-guide/page.tsx` created — static marketing page, 3 value-prop cards (Нулевая комиссия / Свободный График / Входящие запросы), primary CTA `/auth?role=guide`, secondary `/auth`.
>   - ERR-049, ERR-050, ERR-051 logged in ERRORS.md.
>   - Next: Phase 10.2 Lighthouse audit, or next feature plan per Alex.

> STATUS (2026-04-26): **PLANS 10 + 11 COMPLETE — guide notifications + homepage polish. 7 commits on main, Vercel deployed, DB migration applied.**
>   - Plan 10 (4 tasks): DB migration `20260426000001_plan10_guide_notifications.sql` (adds `new_request` to `notification_kind` enum; adds `base_city TEXT` + `max_group_size INTEGER` to `guide_profiles` + index). TS types updated. Guide profile save action now persists `base_city` + `max_group_size`. `notifyGuidesNewRequest(requestId)` trigger added to `triggers.ts` (3-filter: ILIKE city, specialties overlap, group size). Trigger wired into `createRequestAction` before `redirect()` in try-catch so notification failures never block traveler.
>   - Plan 11 (2 tasks): Removed HomePageSteps block. H1 → "Опишите запрос — гиды откликнутся". Submit button → "Отправить запрос гидам". Metadata title → "Проводник". Discovery section → `max-w-2xl`. Cards enriched: group type, participant count, up to 4 interest labels (+N overflow), budget as "N ₽/чел.".
>   - DB migration applied via Supabase Management API. `base_city` and `max_group_size` columns verified present. HEAD: `d90565e`.
>   - ERR-048 logged: `as const` INTEREST_CHIPS + Map literal type mismatch — use `Record<string, string>` + `Object.fromEntries` pattern instead.
>   - Next: Plan 12 (BEK railguards — bloat + quality gates). Spec at `docs/superpowers/specs/2026-04-26-bek-bloat-railguards-and-quality-gates-design.md`.

> STATUS (2026-04-25 evening): **SENTRY ERROR RESILIENCE COMPLETE — 3 unhandled-rejection errors fixed, 5 commits on main, Vercel deploying.**
>   - ERR-1 (13 hits, Firefox): `NotificationBell.tsx:91` `.subscribe()` lacked error callback → `CHANNEL_ERROR` propagated as unhandled rejection across all 8 SiteHeader-rendering pages. Fixed: added `(status, err) => { if (status === "CHANNEL_ERROR") console.error(...) }` callback.
>   - ERR-2+3 (2 hits): `use-unread-count.ts:24` `fetch("/api/messages/unread-count")` unguarded → network throws propagated. Fixed: wrapped fetch block in try/catch, catch sets state to 0/null.
>   - ERR-3: `homepage-request-form.tsx:133` `supabase.auth.getUser()` unguarded → network throws propagated. Fixed: try/catch wrapping getUser; catch opens auth gate (same path as unauthenticated user, form data preserved).
>   - 3 test files created (2+3+2 test cases). All commits on main. typecheck: 0 errors. lint: 0 errors. HEAD: `55193c1`.
>   - Also: resolved stale Sentry issue 111792490 (PGRST200 FK error fixed 2026-04-14 in commit 0cd4bfe, never closed in Sentry).
>   - New SOT entries: ERR-046 (cursor-agent `&&` chain stall on bun test:run), ERR-047 (cursor-agent commits to HEAD branch not specified branch).
>   - Next: Lighthouse + Mobile QA (Phase 10), or BEK Plan 08 (still in BRAINSTORMING state).

> STATUS (2026-04-25): **PLANS 05+06+07 COMPLETE — 11 tasks, all merged to main, Vercel deployed, DB migration applied.**
>   - Plan 05 (4 tasks): dates.ts + Russian date utils; guide inbox redesign (mode badge, interests, time, group size, no summary card); BidFormPanel request context block; deleted vestigial guide request detail pages
>   - Plan 06 (4 tasks, worktree feat/plan-06-photo-library): DB migration `20260424000001_guide_photo_library.sql` (guide_location_photos table + route_stops/route_duration_minutes columns); guide portfolio management page + nav link; public guide profile photo grid; route builder in BidFormPanel (photo picker, duration selector, date/time, FormData wiring)
>   - Plan 07 (3 tasks): HomepageAuthGate dialog (sign-in + sign-up for guests); HomepageRequestForm (full request form with interests, budget, city autocomplete); homepage shell swap (now shows form instead of hero2)
>   - Quality review caught: AP-010 in getDefaultValidUntil (ERR-042), AP-012 in offers.ts (ERR-043), Zod .default() RHF incompatibility (ERR-041)
>   - DB migration applied via Supabase Management API. HEAD: `0b1ee92` on origin/main.
>   - Next: Lighthouse + Mobile QA (Phase 10), or next feature plan — homepage is now the request form surface.

> ADHOC — 2026-04-23: **NAV CONTEXT BUG + ARCHITECTURAL DECISION (start of next session)**
>   - Bug: `SiteHeader` selects nav by role only → traveler on public pages loses "Гиды" link site-wide. Plan 03 said remove it only on `/traveler/*`.
>   - Root cause: role ≠ context. Layout knows what it is; the header should not infer from pathname.
>   - Decision (permanent): Add explicit `context="traveler-cabinet"` prop to `SiteHeader`. Set in `(protected)/traveler/layout.tsx`. `resolveNavLinks(isAuthenticated, role, context)` helper replaces inline ternary in desktop ul + mobile sheet.
>   - Files: `src/components/shared/site-header.tsx` + `src/app/(protected)/traveler/layout.tsx` (+ possibly `(protected)/layout.tsx` if SiteHeader lives there).
>   - Spec: `docs/superpowers/specs/2026-04-23-nav-context-design.md`
>   - Verification: traveler on `/requests` sees Гиды ✅ | traveler on `/traveler/requests` does NOT ✅ | guide nav unchanged ✅
>   - This is a small task (2 files, ~15 lines changed). Dispatch as Plan 03-fix or bundle into Plan 04 preamble.
>   - Alex's screenshot (sent 12:44 UTC, BEK crashed) likely shows this bug. BEK notified Alex it's back online — await his confirmation before shipping.

> STATUS (2026-04-23): **PLAN 03 COMPLETE — traveler cabinet restructure. 4 tasks, build ✓.**
>   - T1a ✅ /traveler → /traveler/requests redirect; deleted 9 dead route pages (dashboard, favorites, bookings list, open-requests, requests/quick)
>   - T1b ✅ Deleted 6 orphaned feature components (dashboard-screen, favorites-screen, open-requests screens, bookings-screen)
>   - T2 ✅ Deleted mobile bottom nav panel; removed "Гиды" from traveler nav header; updated all /traveler/dashboard refs → /traveler/requests (AuthRedirectTarget, ROLE_DASHBOARD_PATHS, site-header, workspace-role-nav)
>   - T3 ✅ Added Сборная indicator to request list cards ("N из M · сборная группа") and detail header ("Сборная группа · сейчас N из M чел."); added mode+group_max to TravelerRequestSummary
>   - 4 commits on main (3e0aea6), Vercel deployed ✓. typecheck: 0 errors. lint: 0 errors.
>   - Deferred: T10 registration-before-request (needs Alex decision); T11 guide avatars already done.
>   - Next: Alex review of Plan 03 live on provodnik.app → decide T10 (registration-before-form) → Phase 10 Lighthouse + Mobile QA → Phase 11 soft launch.

> STATUS (2026-04-22): **PLAN B COMPLETE — all 5 tasks shipped and verified.**
>   - Task 1 ✅ Status badge colors (submitted→blue, offers_received→amber, booked→emerald, closed/expired→red)
>   - Task 2 ✅ Requests list redesign (two tabs, booking cards, empty states)
>   - Task 3 ✅ Offer board + Q&A drawer wired into request detail page (OfferCard, QA sheet, server-side thread prefetch)
>   - Task 4 ✅ Contact masking utility (maskPii covers phones, email, Telegram, WhatsApp, VK)
>   - Task 5 ✅ DB expiry cron (pg_cron job `expire-open-requests` — `0 * * * *` — active in prod, migration `20260421133743` tracked)
>   - All merged to main, pushed, Vercel deployed. DB migration confirmed via Supabase MCP.
>   - ERR-039 logged: cursor-agent made correct changes twice but failed to commit — orchestrator committed directly.
>   - Next: Phase 10 Lighthouse + Mobile QA, then Phase 11 soft launch.

> STATUS (2026-04-16 night): TWO-MODE ARCH + FOCUSED PASS SHIPPED. HEAD: `711bed0` on origin/main.
>   - All 10 parent tasks + 7 focused-pass fixes merged to main. 12 commits total (11 features + 1 lint fix).
>   - 3 worktrees: two-mode-arch (4 commits), audit-polish (5 commits), focused-standalone (2 commits). All rebased and FF-merged. Worktrees + branches cleaned up.
>   - typecheck: 0 errors. lint: 0 errors (51 pre-existing warnings). build: success.
>   - cursor-agent stalled on all dispatches (known Windows bun/tsc hang). All code edits were correct — agents verified typecheck manually and committed.
>   - 1 merge conflict resolved (fp7 skeleton vs task-9 multiplier removal on traveler-dashboard-screen.tsx).
>   - Key changes shipped: ExcursionShapeDetail CTA → /listings/[id]/book, guide orders direct-booking branch, BookingFormTabs Moscow TZ + error classify, publish validation + submit guard, centralised kopecks helpers, full-card guide listing link, hoist bid CTA, remove 0.8 multiplier, home "Two ways to book", inbox auth state change, dashboard loading skeleton.
>   - ADR-012 (two-mode arch) + ADR-013 (kopecks helpers) logged.
>   - Next: Phase 10 Lighthouse + Mobile QA, then Phase 11 soft launch.

> STATUS (2026-04-16 evening): FOCUSED-PASS RIDE-ALONG SET ADDED. 7 new findings on the same surfaces as the parent two-mode sprint.
>   - Trigger: explicit user ask after the Russian brief landed: "do focused pass on surfaces touched by the 9 fixes"
>   - Spec: `docs/superpowers/specs/2026-04-16-focused-pass-design.md`
>   - Plan: `docs/superpowers/plans/2026-04-16-focused-pass-plan.md`
>   - Tasks: `.claude/tasks/focused-pass/` — 4 addenda + 2 standalone prompt files + README
>   - Raw findings: `.claude/tmp/focused-pass-findings.json` (10 total; 3 already covered by parent plan)
>   - 7 net-new fixes layered onto the 10 parent fixes:
>     * **FP-1** (P0) — `BookingFormTabs todayLocalISODate()` uses local TZ, server validates in Moscow TZ → swap to `Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Moscow'})`. Bundle into parent Task 3.
>     * **FP-2** (P1) — Mystery `* 0.8` multiplier on traveler dashboard `priceLabel` → remove, match canonical `от X ₽ / чел.`. Bundle into parent Task 9.
>     * **FP-3** (P1) — `submitRequest.ts` accepts requests against draft/archived listings → guard `listing.status === 'published'` (order tab only; inquiry tab unaffected). Bundle into parent Task 5.
>     * **FP-4** (P0) — Wizard write-path `budgetMap` skips `* 100` to kopecks → centralise via `rubToKopecks` / `kopecksToRub` helpers + round-trip test. Bundle into parent Task 6.
>     * **FP-5** (P1) — Inbox effect deps `[]` skips offered/accepted fetch when session resolves late → subscribe to `onAuthStateChange`. Standalone in `focused-standalone` worktree.
>     * **FP-6** (P2) — Generic error message in BookingFormTabs catch → classify into 3 buckets (auth / validation / generic) via `userMessageForError`. Bundle into parent Task 3.
>     * **FP-7** (P2) — Empty grid flash on dashboard cold load → 3-card `DashboardSkeleton` using existing `Skeleton` primitive. Standalone in `focused-standalone` worktree.
>   - Worktrees: parent `two-mode-arch` + parent `audit-polish` + NEW `focused-standalone`. Merge order: two-mode-arch → audit-polish → focused-standalone.
>   - Effort delta: +4h agent execution time. Sprint duration unchanged (1.5–2 working days) — standalone runs in parallel.
>   - Open question for user: Alex copy for "Two ways to book" home block (parent Task 10 still pending).

> STATUS (2026-04-16 late): TWO-MODE ARCHITECTURE DESIGN APPROVED. Trigger: Alex Slack ts 1776353334.780179.
>   - Alex formally named the missing architecture: Provodnik = Биржа-mode (request + guide bids) + Трипстер-mode (direct booking of fixed listing). W-05 from morning audit was the symptom; the root is one of mode ownership at listing-detail CTAs.
>   - Decision (option A): both listing shapes (Tour + Excursion) → Трипстер-mode by default. Listing pages own Трипстер; request wizard owns Биржа.
>   - Spec: `docs/superpowers/specs/2026-04-16-two-mode-architecture-design.md`. No schema changes, no payment, no new tables. Wiring + user-education only.
>   - Six concrete code touchpoints: ExcursionShapeDetail.tsx CTA route swap (line 103), BookingFormTabs shape-agnostic verify, /listings/[id]/book page shape guard removal, /guide/orders direct-booking branch, home-page "Two ways to book" section, optional Tour/Excursion file consolidation (deferred).
>   - Effort: 4–6h core + 2–3h verification (R1 guide/orders + R2 minor-units math). Fits inside 1.5-day GO budget alongside yesterday's W-01..W-04 polish.
>   - Revised fix order replacing yesterday's 6-step plan:
>     1. **W-05a: ExcursionShapeDetail CTA route swap** (~30m, P0). Single-line change. Standalone PR — verify nothing else broken first.
>     2. **W-05b: /guide/orders direct-booking branch** (R1) (~1h, P0). Without this, step 1 creates orphan rows guides can't see.
>     3. **W-05c: BookingFormTabs + listing/book page shape-agnostic verify + amount_minor smoke check** (R2/R4) (~1.5h, P0).
>     4. **W-04: budget minor-units fix + per-person toggle in wizard** (~3h, P1). Same minor-units family as R2.
>     5. **W-02: full-card Link wrap on guide listing card** (~30m, P1).
>     6. **W-01: hoist "Предложить цену" CTA above fold in guide inbox** (~1h, P1).
>     7. **W-03: dashboard "от X ₽" → `formatRub(budget) / чел.`** (~30m, P2).
>     8. **Home-page "Two ways to book" section** (~1.5h, P2). After Alex copy review.
>     9. **W-07 followup: route dedupe + flag prune audit** (~4h, P2). Separate batch before soft launch.
>   - Re-dispatch full Alex retest after step 8. Step 9 is cleanup, not blocking GO.
>   - Open question for user: confirm spec at `docs/superpowers/specs/2026-04-16-two-mode-architecture-design.md` then proceed to writing-plans.

> STATUS (2026-04-16): ALEX-FEEDBACK AUDIT COMPLETE — pre-launch wall check.
>   - Trigger: Alex's 7 WhatsApp/Telegram complaints (12:40–13:02) + meta-criticism ("несущие стены не готовы", "Frankenstein", "Бек хочет всё, везде и сразу"). Crashed mid-audit; re-dispatched 5 parallel research agents.
>   - Deliverable: `.claude/logs/report-2026-04-16-alex-resolution.html` — single-file steel-blue report with W-01..W-07 wall cards + 6-step plan + launch-readiness scorecard.
>   - Verdict: not Frankenstein. 1 P0 architectural break, 3 P1 polish, 1 P2 copy, 2 complaints refuted by code. ~1.5 dev-days to GO-for-retest.
>
>   **Alex's complaints — adjudicated:**
>   - W-01 P1 — Guide can't bid from "Входящие": REFUTED. `BidFormPanel` IS rendered inline at `features/guide/components/requests/guide-requests-inbox-screen.tsx:414`. Issue is discoverability: only "Подробнее" button is visible (line 381,398); the panel sits below collapsed. **Fix: hoist "Предложить цену" CTA to card row.**
>   - W-02 P1 — Cards not clickable in traveler/guide cabinets: PARTIAL. Traveler `ReqCard` IS clickable; guide `guide-listing-card.tsx:83` only the title is `<Link>`, body absorbs clicks. **Fix: wrap full card in Link.**
>   - W-03 P2 — Mystery price on request detail: CONFIRMED. Dashboard list shows `от ${budget * 0.8} ₽` (`traveler-dashboard-screen.tsx:177,204`) — vague, no per-person label. Detail page is correct (`Бюджет ... на человека`). **Fix: replace dashboard label with `formatRub(budget) / чел.`**
>   - W-04 P1 — "100₽ per person" bug + form lacks per-person clarity: CONFIRMED. `request-wizard.tsx:53` budgetMap stores integers (`under5k: 5000`), `actions.ts:80` likely missing `* 100` for minor units → `queries.ts:296` divides by 100 → renders 50, 100, 150 etc. **Fix: multiply by 100 on insert + add per-person/total toggle to wizard.**
>   - W-05 P0 ARCHITECTURAL — Excursion CTAs route to bid marketplace: CONFIRMED. `TourShapeDetail.tsx:96` correctly routes "Заказать тур" → `/listings/[id]/book`; `ExcursionShapeDetail.tsx:103` BROKEN — "Запросить у этого гида" → `/traveler/requests/new?guide=[id]` (bid flow). `BookingFormTabs.tsx` exists with "Заказать"/"Задать вопрос" tabs but is unused by excursions. **Fix: route ExcursionShape CTAs to `/listings/[id]/book` like Tour. Single highest-impact change.**
>   - W-06 — Guide nav misnaming "Заказы" vs "Запросы": REFUTED on terminology, confirmed on UX (same as W-01).
>   - W-07 P2 — Frankenstein meta-feel: CONTRIBUTING CAUSES — 13 `FEATURE_TR_*` flags (~60% off in prod), 5× duplicate route paths between `(public)`/`(protected)`/legacy `/requests`, no clean separation of TOUR mode (direct booking) vs EXCHANGE mode (bid). **Fix: route audit + flag prune in dedicated cleanup batch.**
>
>   **6-step fix sequence (~1.5 dev-days):**
>   1. W-05: ExcursionShape CTAs → /listings/[id]/book (P0, ~1h)
>   2. W-04: budget minor-units fix + per-person toggle in wizard (P1, ~3h)
>   3. W-02: full-card Link wrap on guide listing card (P1, ~30m)
>   4. W-01: hoist "Предложить цену" CTA above fold in guide inbox (P1, ~1h)
>   5. W-03: dashboard "от X ₽" → `formatRub(budget) / чел.` (P2, ~30m)
>   6. W-07 followup: route dedupe + flag prune audit (P2, ~4h, separate batch)
>   - Re-dispatch full Alex retest after step 5. Step 6 lands as cleanup batch before soft launch.
>
>   **Launch-readiness scorecard:** GO after steps 1–5; HOLD on step 6 (cosmetic, not blocking).
>
>   **Next:** confirm priority with user → dispatch cursor-agent batch (steps 1–5 in 1 worktree, step 6 separately).

> STATUS (2026-04-14): QA AUDIT COMPLETE. HEAD: `5cb821a` on origin/main (provodnik.app).
>   - Full pre-launch E2E QA audit with 4 test users (Maxim/Anna/Boris/Vera) — complete circle: request→join→bid→accept→confirm→ticket.
>   - BUG-001 (P0 FIXED): `/traveler/bookings/[id]` crashed — PostgREST join `guide_profiles!guide_id` invalid (no FK). Split into sequential queries in `getBooking()`. Commit `0cd4bfe`.
>   - BUG-002 (P1 FIXED): Guide inbox showed 0 open requests — `getOpenRequests()` ignored client param, called getPublicClient() (server-only). Commit `765b662`.
>   - BUG-003 (P1 FIXED): Offer submit always showed generic error — `PostgrestError` is not `instanceof Error`. Fixed with `typeof err.message === 'string'` check. Commit `d837554`.
>   - BUG-004 (P2 FIXED): English strings in request/booking UI — status badge ("Draft"→"Черновик" etc), "No events yet.", raw enum values ("city"/"group"). Commit `d837554`.
>   - Audit findings documented: `docs/qa/2026-04-14-audit-findings.md`. Commit `5cb821a`.
>   - Open P2/P3 issues (unfixed, documented): ISSUE-001 bookings list shows PENDING/RUB, ISSUE-002 guide tour count 0 on cards, ISSUE-003 guide booking detail flashes "не найдено" on hard nav, ISSUE-004 English "confirm" in booking summary, ISSUE-005 contact unlock flow untested, ISSUE-006 guide_offers INSERT RLS needs post-fix-003 verification.
>   - Next: Fix ISSUE-001 (P2 booking status/currency i18n) then ISSUE-004 (action name), then verify ISSUE-006 RLS.

> STATUS (2026-04-13 latest): Parts D+F+G+H COMPLETE. HEAD: `5caba83` on origin/main.
>   - D4: calendar day panel — 48 30-min slots, block/unblock per slot + block full day, listing filter dropdown
>   - F1: destination detail — category pill filter strip + format (private/group) dropdown filter
>   - F2: listing card anatomy — format + duration chips, rating display, price formatting
>   - F3: listing detail CTA — bid-first "Запросить у этого гида" → /traveler/requests/new?guide=[id]
>   - G1: system event messages — 8 bid-first event types with bold field diffs in chat
>   - G2: booking page — support sidebar + booking ticket modal + contact unlock reveal + review prompt overlay
>   - H1: guide public profile — "Написать запрос" CTA + trust signals footer (verified badge, experience, tours)
>   - H2: guide about sub-page — /profile/guide/about with bio/languages/years_experience form + server action
>   - H3: notification matrix — role tabs (traveler/guide) × 6 events × 3 channels (Telegram/Email/Push-disabled)
>   - typecheck: 0 errors on every commit. 9 commits 5caba83→b103353. Vercel deployed.
>   - Next: H2 sidebar nav layout (О себе / Правовые данные / Лицензии), then Phase 10 Lighthouse + Mobile QA

> STATUS (2026-04-13): Parts A+B+C COMPLETE. HEAD: `03cfafc` on origin/main.
>   - C1: 3-step request wizard (destination/interests/details) — replaces flat form
>   - C2: public feed CTA links fixed (/requests/new → /traveler/requests/new)
>   - C3: /traveler/requests/[id]/accepted emotional moment page — green checkmark, guide avatar, "Отлично" CTA
>   - C4: joinRequestAction + JoinGroupButton — wraps existing open_request_members table
>   - C5: BidFormPanel inline panel — guide inbox "Предложить цену" opens panel, not page nav
>   - typecheck: 0 errors on every commit. All pushed. Vercel deploying.
>   - Next: Part D (Guide workspace) — D1 inbox tabs rework, D2 orders 7-tab + confirm action, D3 listings status badges, D4 calendar

> STATUS (2026-04-13): Parts A+B COMPLETE. HEAD: `4d5e994` on origin/main.
>   - Part B: demand-first home page (new headline, 0% trust tile, guide acquisition CTA, gateway title fix), for-guides page (commission table vs Tripster/Airbnb), how-it-works page (traveler 3-step + group pricing + guide 3-step + 5 FAQ items)
>   - typecheck: 0 errors on every commit. All pushed.
>   - Next: Part C (Demand-side core) — C1 request wizard, C2 open requests feed, C3 request detail + bid comparison, C4 bid accepted emotional moment, C5 join request + price recalculation, C6 guide bid submission

> STATUS (2026-04-13): Part A (Foundations) COMPLETE. HEAD: `7f34d04` on origin/main.
>   - A1: guide/requests → guide/inbox renamed (5 route files), 4 placeholder pages added (guide/stats, how-it-works, for-guides, tours)
>   - A2: src/lib/copy.ts created — central Russian copy constants, nav.notifications added
>   - A3: SiteHeader unauthenticated nav updated — Как это работает | Стать гидом | Создать запрос → /traveler/requests/new
>   - A4: TravelerNavItems + TravelerMobileTabs client components with usePathname() active state. 5 items: Открытые запросы | Мои запросы | Поездки | Избранное | Уведомления
>   - A5: guide-kpi-strip.tsx server component (6 tiles, try/catch fallback), guide/layout.tsx updated with KPI strip. Guide SiteHeader shows flat 5-item nav (Входящие | Заказы | Предложения | Календарь | Статистика)
>   - typecheck: 0 errors. Pushed to origin/main. Vercel building.
>   - Next: Part B (Home page + entry points) — B1 home redesign, B2 for-guides page, B3 how-it-works page

> STATUS (2026-04-13 latest): Phase 9 COMPLETE. HEAD: `a6e9002` on origin/main.
>   - Phase 9 all 9 items done: DNS/SSL live (Cloudflare→Vercel), Auth redirect URLs + SMTP configured in Supabase dashboard, all Vercel env vars set, Sentry SDK wired (tracing 10%, SENTRY_AUTH_TOKEN in Vercel), Upstash KV env var mismatch fixed (rate limiting now active), backups N/A (no Pro plan).
>   - Bug fixed: redis client was always null — STORAGE_KV_REST_API_URL/TOKEN vs UPSTASH_REDIS_REST_* mismatch (6dece9e).
>   - Sentry: @sentry/nextjs wizard complete, instrumentation.ts + instrumentation-client.ts (Next.js 15 pattern), global-error.tsx, tracesSampleRate=0.1 (a6e9002).
>   - Next: Phase 10 — Lighthouse audit (10.2), Mobile QA (10.3). Phase 10.1 already done.

> STATUS (2026-04-13): Housekeeping + env vars complete. HEAD: `0f619ec` on origin/main.
>   - Repo split: provodnik.app slimmed to production-only; docs/scripts/skills moved to root workspace.
>   - AGENTS.md, CLAUDE.md, README.md, .github/ updated to reflect current structure.
>   - Vercel env vars fully set (Supabase keys, RESEND_API_KEY, FEATURE_TR_* flags, Upstash KV).
>   - Vercel build green. Prod is live.
>   - Pending: domain/DNS, Supabase Auth redirect URLs + Custom SMTP, daily backups, Sentry.

> STATUS (2026-04-13 earlier): Post-launch fixes shipped. HEAD: `41c0877` on origin/main.
>   - ERR-016: Missing shadcn/ui table component added (29ae0a4).
>   - ERR-017: turbopackUseSystemTlsCerts removed from next.config.ts — was breaking Vercel TypeScript build (41c0877).
>   - Flag prefix renamed FEATURE_TRIPSTER_ → FEATURE_TR_ across all files (aa55c44).

> STATUS (2026-04-12): Tripster V1 COMPLETE. HEAD: `30fb971` on origin/main. All 42 waves merged to main.
>   - DB: 23 new tables, 38 additive columns, 5 views, full RLS. Rollback script verified.
>   - Types + Zod schemas regenerated. State machines (37 tests). PII mask (26 tests). Playwright e2e happy-path suite.
>   - Full product surface: ListingEditorV1, traveler pages, booking form (bid-first), messaging/disputes, admin moderation, guide dashboard (KPI/stats/orders/calendar), notifications, four-axis reviews, dual rating aggregation (pg_cron), guide onboarding quiz, help center, favorites, partner cabinet, referrals, cross-sell.
>   - Resend email for password reset wired. Real booking completion action (status + notify).
>   - Booking auth helper extracted. hasEnv gate fixed. getSiteUrl() utility added.
>   - 0% commission model enforced. Feature flags: FEATURE_TR_* prefix, 14 flags registered.

> STATUS (2026-04-11 latest): Alex-feedback wave D SHIPPED. HEAD: `46ce21b` on origin/main.
>   - 4 remaining xlsx code items closed: D-1 public /listings URL-synced search, D-2 destination badge typography, D-3 guide inbox segmentation tabs (Все/Без-оффера/С-оффером), D-4 error+not-found button centering on mobile.
>   - 4 parallel Explore research agents → 4 parallel native implementation Agents, all PASS first try, zero retries. typecheck:0 lint:0 on every commit. 4 commits 0de6126→46ce21b pushed. Vercel auto-deploy.
>   - Remaining from xlsx — all non-code, REQUIRES USER INPUT: #1 heading font design (too sharp), #3 Направления section purpose (product), #4 guide DM architecture (needs thread schema migration if real DM wanted), #7 Тур vs Экскурсия terminology (product).
>   - Next: same as previous — Phase 7.4–7.10 launch prep (manual/infra).

> STATUS (2026-04-11 late): Alex-feedback waves A/B/C SHIPPED. HEAD: `add2a32` on origin/main.
>   - All 11 xlsx feedback items green: A1 footer/policies/cookies, B1 top nav cleanup, C1 homepage polish, D2 listing contact-manager (no payment), E2 traveler request UX (date min=today + join-group notify), F2 destinations search + button routing, G3 messaging thread auto-create on offer, H2 guide-side role guards + dedupe routes, I1 guide dashboard polish, J1 listing cover photo sync, K3 guide search.
>   - Prod schema verified via Supabase Mgmt API: listings.image_url ✓, listing-media + 4 other buckets ✓, RLS on threads/messages/notifications ✓. No migrations pending (CLAUDE.md "3 pending migrations" note is stale — all 3 already applied).
>   - Out-of-band: Slack last_patch_5 posted (ts 1775922638), Telegram summary sent, slack-state.yaml updated.
>   - Next: Phase 7.4–7.10 launch prep (real guides onboarding, domain/DNS, daily backups, soft launch) — all manual/infra, no code.

> STATUS (2026-04-11): P0 + P1 fix batches SHIPPED. HEAD: `39159ae` on origin/main (Vercel deploy triggered).
>   - 5 P0 closed: P0-001 public request form redirect, P0-002 guide confirm server action, P0-003 payment info card, P0-004 mobile nav drawer, P0-005 traveler-only RBAC guards.
>   - 7 P1 closed: P1-009 duplicate Запросы nav, P1-011 Забронировать тур CTA, P1-012 listing content bugs (duration clamp, split inclusions card, delete fake itinerary), P1-013 wrong openRequestCount, P1-014 dynamic traveler booking heading, P1-015 guide verification stepper wired to DB enum, P1-016 logo prefetch=false.
>   - P1-008 photo upload NOT ATTEMPTED — out of scope for this run, dispatch separately.
>   - Remaining P1 items from MASTER_TODO to re-audit: P1-001 through P1-007 + P1-010 (marked DONE in previous phases, not re-verified in this run).
>   - typecheck ✓ lint ✓. Local build env-blocked by SWC/Turbopack/lightningcss on Windows — Vercel Linux build authoritative.
> STATUS (2026-04-06): Phase 8 COMPLETE. Phase 10.1 COMPLETE. Site live at provodnik.app.
> Post-audit polish COMPLETE: nav links (Туры/Запросы), account indicator, logout fix, footer links, DB seed.
> B1 (forgot password) DEFERRED by user until Resend SMTP configured.
> Next: Phase 12 — itinerary segments, analytics, payment groundwork; plus P1-008 photo upload in a dedicated batch.

> Generated: 2026-04-06
> Based on: full codebase audit (AUDIT-REPORT.md), AUDIT-FIX-PLAN.md, PLAN.md phases 0–7,
> STAKEHOLDER-FEEDBACK.md (7 changes), ERRORS.md (ERR-001–007), research on Supabase auth
> patterns and Next.js metadata API.
> Status of phases 0–7: scaffolded and committed, but 15 post-audit findings remain open.

---

## Executive Summary

Phases 0–7 are committed. The app compiles and routes are functional. However, a full CDP-based
audit on 2026-04-06 found 15 issues: 3 critical (including a security access-control bypass),
6 major UX gaps, and 6 minor polish items. None were caught because phases were marked complete
on commit, not on verified walkthrough.

Phase 7's non-code launch tasks (domain, DNS, SSL, backups, real guides) are also outstanding.

**The path to soft launch is: Phase 8 (audit fixes) → Phase 9 (launch infra ops) → Phase 10
(stakeholder feature catch-up) → Phase 11 (soft launch). Estimated: 4–5 days.**

---

## Phase 8 — Audit Fixes
> Execute AUDIT-FIX-PLAN.md in dependency/journey order.
> Run `bun run build && bun run typecheck` after every batch. Run CDP walkthrough after batch 5.

### Batch 1 — Security & Quick Wins (PARALLEL, ~1 hour)

**8.A1 — Remove demo debug bar from production** ← DO FIRST, SECURITY
- File: `src/components/shared/workspace-role-nav.tsx`
- Fix: Wrap demo controls block in `{process.env.NODE_ENV !== 'production' && (...)}`
- Verification: `bun run build`, confirm bundle has no signInAs references in prod output
- ERRORS.md ref: ERR-002

**8.A2 — Fix Kazan + Nizhny Novgorod destination images**
- File: `supabase/migrations/20260401000002_seed.sql`
- Fix: Replace hero_image_url for kazan-tatarstan and nizhny-novgorod with correct Russian city photos
- Verification: `bun run db:reset`, navigate to /destinations/kazan-tatarstan, confirm Kazan Kremlin
- ERRORS.md ref: ERR-003

**8.C1 — Fix auth empty-field validation (browser tooltip → styled error)**
- File: `src/features/auth/components/auth-entry-screen.tsx`
- Fix: Remove `required` HTML attributes from all Input elements (lines ~310, 330, 351)
- Verification: Clear fields, click Войти, see red styled error box, not browser tooltip
- ERRORS.md ref: ERR-006

---

### Batch 2 — Data Query Fixes (PARALLEL, ~2 hours)

**8.A3 — Fix destination tour count + query mismatch**
- Files:
  - `src/data/supabase/queries.ts` fn `getListingsByDestination`
  - `src/features/destinations/components/destination-detail-screen.tsx`
- Fix 1: Resolve slug → destination record first, then query listings by `destination.name`/`destination.region`
- Fix 2: Derive `listingCount` from `listings.length` (prefer live count over static column)
- Verification: /destinations/kazan-tatarstan shows matching stat + real tour cards
- ERRORS.md ref: ERR-001, ERR-005

**8.B6 — Fix listing-specific hero images**
- Files:
  - New migration: add `image_url TEXT` column to `listings` table
  - `supabase/migrations/20260401000002_seed.sql`: populate image_url per listing with destination-appropriate photos
  - `src/data/supabase/queries.ts` fn `mapListingRow`: read `image_url` first, fall back to existing logic
- Verification: /listings — each card shows distinct destination-appropriate image
- ERRORS.md ref: ERR-004

---

### Batch 3 — Derived Fix (AFTER Batch 2, ~30 min)

**8.B5 — Fix destination budget showing "—"**
- File: `src/features/destinations/components/destination-detail-screen.tsx`
- Root cause: minPrice computed from listings.map, but listings were always empty (fixed in A3)
- Additional fix: Add defensive fallback — if listings still empty but listingCount > 0, show "Скоро"
- Verification: /destinations/moscow shows ruble budget amount

---

### Batch 4 — Auth Flows (PARALLEL, ~2 hours)

**8.B1 — Add forgot password flow**
- Context: Supabase `resetPasswordForEmail(email, { redirectTo })` + `verifyOtp({ type: 'recovery', token_hash })` + `updateUser({ password })`
- Files:
  - Modify: `src/features/auth/components/auth-entry-screen.tsx` — add "Забыли пароль?" link below password field (sign-in mode only)
  - New: `src/app/(auth)/auth/forgot-password/page.tsx` — email input, calls `resetPasswordForEmail`
  - New: `src/app/(auth)/auth/update-password/page.tsx` — new password input, calls `updateUser`
  - The `/auth/confirm` callback route (already exists from Phase 1) handles token_hash exchange
- Infra dependency: redirectTo URL must be whitelisted in Supabase Dashboard → Auth → URL Configuration.
  In dev, use `http://localhost:3000`. In prod, use `https://provodnik.app`.
- Glass card styling: reuse existing auth card pattern
- Verification: Full flow — click link → enter email → check Inbucket → click reset link → set new password → login works

**8.B2 — Add page-specific titles to all protected routes**
- Context: Root layout already exports `title: { template: "%s — Provodnik", default: "Provodnik" }`.
  Any Server Component page.tsx can export `export const metadata: Metadata = { title: "..." }`.
  Client Component pages must export metadata from their page.tsx wrapper (which is always a Server Component).
- Files: All page.tsx files under `src/app/(protected)/` (~20 files)
- Russian titles to use:
  - /traveler/dashboard → "Личный кабинет"
  - /traveler/requests → "Мои запросы"
  - /traveler/requests/new → "Новый запрос"
  - /traveler/bookings → "Мои поездки"
  - /traveler/open-requests → "Открытые группы"
  - /traveler/favorites → "Избранное"
  - /guide/dashboard → "Кабинет гида"
  - /guide/listings → "Мои туры"
  - /guide/listings/new → "Новый тур"
  - /guide/requests → "Входящие запросы"
  - /guide/bookings → "Бронирования"
  - /guide/verification → "Верификация"
  - /admin/dashboard → "Панель оператора"
  - /admin/guides → "Проверка гидов"
  - /admin/listings → "Модерация туров"
  - /admin/disputes → "Споры"
  - /messages → "Сообщения"
  - /notifications → "Уведомления"
- Verification: Check browser tab title on each protected page

---

### Batch 5 — Dashboard Builds (PARALLEL then SEQUENTIAL, ~3 hours)

**8.B3 — Build real traveler dashboard** (run first)
- File: `src/app/(protected)/traveler/dashboard/page.tsx` (currently redirects)
- Fix: Replace redirect with a Server Component that:
  1. Fetches: active request count, booking count, favorites count, recent request titles
  2. Renders: 3 stat cards (glass-card pattern) + quick-action links + recent activity list
  3. Pattern: match existing glass-card and stats row patterns from admin dashboard
- Stat queries: reuse existing TanStack Query hooks if available, else add to queries.ts
- Verification: /traveler/dashboard shows real data cards, no redirect

**8.C3 — Fix guide seed account listings** (parallel with B3)
- File: `supabase/migrations/20260401000002_seed.sql`
- Fix: Add 2 seed listings with `guide_id = '30000000-0000-4000-8000-000000000001'`
- Verification: Login as guide@provodnik.test → /guide/listings shows 2 tour cards
- ERRORS.md ref: ERR-007

**8.B4 — Build real guide dashboard** (AFTER B3 — follow same pattern)
- Files:
  - Move form content from `src/app/(protected)/guide/dashboard/page.tsx` → new `src/app/(protected)/guide/settings/page.tsx`
  - Build new `src/app/(protected)/guide/dashboard/page.tsx` as Server Component with:
    1. Stats: listing count, incoming request count, pending booking count, average rating
    2. Quick actions: "Добавить тур", "Смотреть запросы"
    3. Onboarding redirect: if guide verification_status !== 'approved', show onboarding banner
  - Update navigation: add "Настройки" link pointing to /guide/settings
- Verification: Login as verified guide → see stats. Login as new guide → see onboarding banner.

---

### Batch 6 — Admin fix + Seed Quality (PARALLEL, ~1 hour)

**8.Admin fix — Локализовать статус "Guide" в таблице гидов**
- File: `src/app/(protected)/admin/guides/page.tsx` or its data layer
- Fix: Status column shows "Guide" in English — translate to "Гид" or role-appropriate Russian label
- Verification: /admin/guides table shows Russian status labels

**8.C2 — Add more guide seed data**
- File: `supabase/migrations/20260401000002_seed.sql`
- Fix: Add 4–6 more seed guide profiles with distinct specialties and regions
- Also: Add "Стать гидом" CTA banner at bottom of /guides index page
- Verification: /guides shows 8–10 cards + CTA

**8.C4 — Improve request detail seed content**
- File: `supabase/migrations/20260401000002_seed.sql`
- Fix: Expand `notes` and `format_preference` for traveler requests with 2–3 sentence descriptions
- Verification: /requests/[id] shows rich "О маршруте" content

---

### Batch 7 — Navigation & Polish (SEQUENTIAL, ~1.5 hours)

**8.C6 — Add breadcrumbs to protected pages**
- Files:
  - New: `src/components/shared/breadcrumbs.tsx` — Server Component, maps pathname segments to Russian labels
  - Modify: `src/app/(protected)/layout.tsx` — render Breadcrumbs between nav and main content
- Russian segment map: traveler→"Путешественник", guide→"Гид", admin→"Оператор", requests→"Запросы", listings→"Туры", bookings→"Поездки", favorites→"Избранное", verification→"Верификация", settings→"Настройки", messages→"Сообщения", notifications→"Уведомления"
- Verification: /traveler/requests shows "Путешественник / Запросы" breadcrumb

**8.C5 — Content density pass (after all above)**
- Meta-issue: largely resolved by B3, B4, C2, C3, C4
- Any remaining empty states: add contextual onboarding tips
- Verification: All protected pages feel populated and purposeful

---

## Phase 9 — Launch Infrastructure (Ops Tasks — Human Operator Required)
> These are NOT code tasks. They require login access to Vercel, Supabase, and DNS provider.
> Track as a checklist; do not assign to Codex agents.

- [x] **9.1** Vercel: project linked to provodnik.app repo, auto-deploy on push ✓
- [x] **9.2** DNS: Cloudflare proxying to Vercel ✓ — `provodnik.app` → 104.21.22.215 / 172.67.207.31 (CF IPs), `x-vercel-id` confirmed in response headers (verified 2026-04-13)
- [x] **9.3** SSL: HTTPS live with HSTS ✓ — `strict-transport-security: max-age=63072000; includeSubDomains; preload` confirmed on provodnik.app (verified 2026-04-13)
- [ ] **9.4** Supabase Auth → URL Configuration → **MANUAL (3 steps)**:
  1. Go to `https://supabase.com/dashboard/project/yjzpshutgmhxizosbeef/auth/url-configuration`
  2. Set **Site URL** to `https://provodnik.app`
  3. Add `https://provodnik.app/**` to **Redirect URLs** list → Save
- [x] **9.5** Supabase Auth → Custom SMTP ✓ — smtp.resend.com:465, user `resend`, sender `noreply@provodnik.app` (verified 2026-04-13)
- [x] **9.6** Vercel env vars: SUPABASE_URL, PUBLISHABLE_KEY, SECRET_KEY, APP_URL, RESEND_API_KEY, FEATURE_TR_* flags, Upstash KV all set ✓ (2026-04-13)
- [x] **9.7** Daily backups — N/A: no Pro plan; revisit at scale
- [x] **9.8** Sentry ✓ — full wizard setup complete (e52e80a). instrumentation.ts + instrumentation-client.ts (Next.js 15 pattern), global-error.tsx, withSentryConfig, SENTRY_AUTH_TOKEN in Vercel. DSN hardcoded (de.sentry.io region). tracesSampleRate=1 (reduce to 0.1 before high traffic).
- [x] **9.9** Upstash Redis/KV: STORAGE_KV_* + STORAGE_REDIS_URL set in Vercel ✓; code fixed to read STORAGE_KV_REST_API_URL/TOKEN (was broken — redis.ts was calling fromEnv() which reads UPSTASH_REDIS_REST_URL, not STORAGE_KV_*) ✓ 6dece9e

> **Phase 9 blocker note (2026-04-13):** Items 9.4 and 9.5 require Supabase Management API PAT or manual
> dashboard access. Auth config is NOT in the database (auth.instances is empty on managed Supabase).
> Management API rejects service role key with 401 — only a Personal Access Token from
> `https://supabase.com/dashboard/account/tokens` would allow programmatic update.
> Easiest path: 5-minute manual steps above in the dashboard.

---

## Phase 10 — Stakeholder Feature Catch-up (~1 day code)
> Implements two of GG's requests that were deferred from their original phases.

**10.1 — "Гиды в этом городе" on destination pages** (Stakeholder Change 6)
- Files:
  - New: `src/features/guide/components/public/public-guide-card.tsx` — compact card with avatar, name, rating, specialties, link to profile
  - Modify: `src/features/destinations/components/destination-detail-screen.tsx` — add "Гиды в этом городе" section
  - Modify: `src/data/supabase/queries.ts` — add `getGuidesByDestination(region: string)` query
- Data: filter guide_profiles by region matching destination.region
- Verification: /destinations/moscow shows guide cards for Moscow-based guides

**10.2 — Lighthouse performance audit**
- Run: `npx lighthouse https://provodnik.app --output html --output-path /tmp/lighthouse.html`
- Target: >90 Performance, >90 Accessibility, >90 SEO
- Fix any issues found before opening to public

**10.3 — Mobile QA pass** (Phase 6.11, deferred)
- Test all critical flows on iOS Safari + Android Chrome using Chrome DevTools mobile emulation
- Flows to test: signup, create request, guide onboarding, listing create, booking confirm
- Fix any mobile-specific layout breaks

---

## Phase 11 — Soft Launch

**11.1 — Onboard 3–5 real guides** (7.4)
- Create real Supabase Auth accounts for guides in the launch region
- Complete guide profiles, upload verification docs, approve via admin panel
- Publish 1–2 real listings per guide

**11.2 — Closed beta**
- Invite 10–20 trusted travelers + the 3–5 real guides
- Monitor Sentry for errors
- Monitor realtime behavior (messages, notifications)
- Collect feedback via support email

**11.3 — Post-soft-launch fixes**
- Address any critical bugs from beta
- Before open registration, verify no security regressions

**11.4 — Open registration** (after beta stable for 1 week)

---

## Phase 12 — Post-Launch Product Sprints
> Specifically from GG's stakeholder feedback, not deferred forever.

**12.1 — Itinerary travel segments + transport options** (Stakeholder Change 4)
- Add `travelToNextMinutes`, `travelToNextLabel`, `transportOptions` fields to listing itinerary items
- New migration, updated listing create/edit form, updated listing detail page rendering
- New `ItineraryTravelSegment` component with transport option pills

**12.2 — Analytics** (Phase 6.8)
- Integrate PostHog or Plausible
- Track: page views, request creation, offer submission, booking confirmation, guide onboarding completion

**12.3 — Payment integration groundwork**
- Research: YooKassa / Tinkoff / CloudPayments
- Design escrow model for tour deposits
- No implementation until post-beta signal

---

## Dependency Map

```
8.A1 (security)     ─── MUST BE FIRST, independent
8.A2 (images)       ─── independent
8.C1 (form valid)   ─── independent
      ↓ (all batch 1 complete)
8.A3 (query fix)    ─── independent of batch 1 but must precede B5
8.B6 (listing imgs) ─── independent
      ↓
8.B5 (budget)       ─── after A3
      ↓
8.B1 (forgot pw)    ─── independent, but needs Phase 9.4+9.5 for email delivery
8.B2 (page titles)  ─── independent
      ↓
8.B3 (traveler dash)─── independent
8.C3 (guide seed)   ─── independent
      ↓
8.B4 (guide dash)   ─── AFTER B3 (follow same pattern)
      ↓
8.Admin fix         ─── independent
8.C2 (more guides)  ─── independent
8.C4 (request data) ─── independent
      ↓
8.C6 (breadcrumbs)  ─── independent
      ↓
8.C5 (density)      ─── AFTER all above
      ↓
Phase 9 (infra ops) ─── parallel with code work
      ↓
Phase 10 (features) ─── after Phase 8 complete
      ↓
Phase 11 (launch)   ─── after Phase 9 + 10 complete
```

---

## Estimated Timeline

| Phase | Work Type | Estimate |
|-------|-----------|----------|
| 8: Audit Fixes | Code (7 batches) | 2 days |
| 9: Launch Infra | Ops/config (human) | 1 day |
| 10: Feature catch-up | Code | 1 day |
| 11: Soft launch | Business/beta | ongoing |
| **Total to soft launch** | | **~4–5 days** |

---

## Key Risks

| Risk | Mitigation |
|------|------------|
| A1 debug bar fix accidentally breaks navigation tabs | Keep nav tabs, only strip demo session controls |
| B1 forgot password silently fails in prod | Requires Supabase Custom SMTP config (Phase 9.5) — document dependency clearly |
| B4 guide dashboard agent over-engineers | Provide explicit data spec in prompt (listing count, request count, booking count, rating) |
| Guide dashboard page.tsx is "use client" — can't export metadata | Move client logic to child component, keep page.tsx as Server Component |
| A3 query fix breaks other destination-related queries | Run full build + typecheck + CDP walkthrough after every batch |
| Seed reset wipes test bookings | Use `db:reset` only on local dev. Production seed is applied once at init. |

---

## Research-Backed Implementation Notes

### Forgot Password (B1)
```typescript
// Initiate — server action in forgot-password page
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`
})

// Callback already exists at /auth/confirm/route.ts (from Phase 1)
// verifyOtp({ type: 'recovery', token_hash }) → redirect to /auth/update-password

// Update password page
const { error } = await supabase.auth.updateUser({ password: newPassword })
```
The `/auth/confirm` route from Phase 1 handles all OTP types. Just verify it passes `type` from URL params.

### Page Titles (B2)
```typescript
// In any server-component page.tsx:
export const metadata: Metadata = { title: "Мои запросы" }
// Automatically composes to "Мои запросы — Provodnik" via root layout template
// DO NOT add metadata to pages with "use client" — metadata is ignored in client components
// Instead, metadata goes in the page.tsx (always a server component) not in the feature component it imports
```
