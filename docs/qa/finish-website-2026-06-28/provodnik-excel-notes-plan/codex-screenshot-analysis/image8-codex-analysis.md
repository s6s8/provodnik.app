## 1. Screenshot Identity

Route: `/requests/[requestId]` request detail, likely owner/post-create state because the green success alert says: “Открытая экскурсия опубликована — гиды увидят ваш запрос и смогут присоединиться.”

Visible UI:
- Immersive photo hero.
- Breadcrumb-like line: `Поездки > Россия > Москва`.
- Main title: `Москва`.
- Floating trip details panel: `30 июня`, `11:00–13:00`.
- Success alert below hero.

Screenshot-specific complaint: breadcrumb is wrong, not clickable, and uses the wrong public/private context.

## 2. UX/Product Diagnosis

The main defect is semantic, not just visual.

`Поездки > Россия > Москва` tells the user they are inside “Trips,” but this page is an open request/open group detail under `/requests`. “Поездки” sounds like a private traveler cabinet or booked trips area, not a public marketplace request. That is especially confusing because the success alert says the request was just published for guides.

`Россия` is also weak as a breadcrumb level. For Moscow it reads like a fake taxonomy rather than useful navigation. It does not help the user go anywhere, filter anything, or understand ownership/status. If the real region is unknown and only country fallback exists, it should not appear as a breadcrumb segment.

The breadcrumb visually looks interactive: small text, chevrons, conventional breadcrumb placement. But source renders plain spans, so users see a navigation affordance that cannot be used. That breaks trust because the UI borrows a navigation pattern without navigation behavior.

The title repeats the last crumb. `... > Москва` followed by huge `Москва` is acceptable only if the crumb is a true current-page marker. Since it is non-clickable and not announced as current, it becomes redundant decoration.

The page state is also mixed: “Открытая экскурсия опубликована” below a breadcrumb beginning with “Поездки” makes the user wonder whether they created a trip, an excursion, a request, or a public group.

## 3. Source/Code Investigation

Primary files to inspect/change:

- [src/app/(site)/requests/[requestId]/page.tsx](/Users/idev/provodnik/src/app/(site)/requests/[requestId]/page.tsx:94)
  - `buildViewModel()` maps `request.destinationRegion` into `regionLabel`.
  - This view model feeds all request detail branches.

- [src/features/requests/components/request-detail-screen.tsx](/Users/idev/provodnik/src/features/requests/components/request-detail-screen.tsx:256)
  - Public branch hard-codes:
    `[{ label: "Поездки" }, { label: viewModel.regionLabel }, { label: viewModel.title }]`
  - Owner branch separately builds the same idea at line 628:
    `Поездки`, optional region, title.
  - This duplication is likely why the wrong breadcrumb appears across roles.

- [src/components/shared/immersive-hero.tsx](/Users/idev/provodnik/src/components/shared/immersive-hero.tsx:8)
  - `HeroBreadcrumbItem` only supports `{ label: string }`.
  - Rendering uses `<span>`, not `Link`, so crumbs cannot be clicked.
  - If breadcrumbs remain visually breadcrumb-like, this component should support optional `href` and `aria-current`.

- [src/data/supabase/queries/core.ts](/Users/idev/provodnik/src/data/supabase/queries/core.ts:422)
  - `mapRequestRow()` sets:
    `destinationRegion: meta.regionLabel ?? row.region ?? "Россия"`
  - The `"Россия"` fallback is leaking into UI as if it were meaningful hierarchy.

- [src/data/supabase/queries.ts](/Users/idev/provodnik/src/data/supabase/queries.ts:266)
  - `getRequestById()` fetches the request and maps it through `mapRequestRow()`.

- [src/lib/navigation.ts](/Users/idev/provodnik/src/lib/navigation.ts:20)
  - Public `/requests` route label is currently `Запросы`.
  - Product surfaces also use “Открытые группы” in cards/comments, so the executor should align naming deliberately.

Tests to inspect/change:
- [src/features/requests/components/request-detail-screen.test.tsx](/Users/idev/provodnik/src/features/requests/components/request-detail-screen.test.tsx:1)
- [src/components/shared/immersive-hero.test.tsx](/Users/idev/provodnik/src/components/shared/immersive-hero.test.tsx:1)
- [src/app/(site)/requests/[requestId]/page.test.tsx](/Users/idev/provodnik/src/app/(site)/requests/[requestId]/page.test.tsx:1)

## 4. Redesign/Fix Strategy

Recommended behavior:

Before:
`Поездки > Россия > Москва`

After, public/open request context:
`Открытые группы > Москва`

Better if a real region exists:
`Открытые группы > Калмыкия > Элиста`

For owner post-create state:
`Мои запросы > Москва` or `Открытые группы > Москва`, depending on the intended mental model:
- Use `Мои запросы > Москва` if this branch is primarily the owner managing their own request.
- Use `Открытые группы > Москва` if the owner is previewing the public page they just published.

My recommendation for this screenshot: use `Открытые группы > Москва`, because the success state says the request is published and visible to guides.

Clickable behavior:
- First crumb links to `/requests`.
- Region crumb links only if there is a real destination/region route available. Do not invent dead links.
- Current city crumb is non-clickable and marked with `aria-current="page"`.
- If only the country fallback is available (`Россия`), omit it.

Russian copy suggestions:
- Breadcrumb root: `Открытые группы`
- Owner private alternative: `Мои запросы`
- Success alert: current text is understandable, but “Открытая экскурсия” conflicts with “запрос/группа”. Prefer:
  `Открытая группа опубликована — гиды увидят запрос и смогут предложить маршрут.`
- If product wants to keep “экскурсия”, then root breadcrumb should not be “Поездки”; use:
  `Открытые экскурсии > Москва`

Implementation shape:
- Add a small helper near `RequestDetailScreen`, for example `buildRequestDetailBreadcrumb(viewModel, context)`.
- Drop region crumb when `regionLabel` is empty, equals `Россия`, or equals `viewModel.title`.
- Normalize labels like `Калмыкия · Россия` to `Калмыкия` for breadcrumb display.
- Extend `HeroBreadcrumbItem` to `{ label: string; href?: string; current?: boolean }`.
- Render `Link` for items with `href`; render span for current item.
- Keep Tailwind-only styling. No custom CSS classes beyond existing hero classes.

## 5. Implementation Checklist

1. Decide canonical route label for `/requests`: `Открытые группы` vs `Запросы`. For this screenshot, use `Открытые группы`.
2. Update breadcrumb construction in both public and owner branches of `RequestDetailScreen`; remove duplicated ad hoc arrays.
3. Add breadcrumb sanitization:
   - omit `Россия`;
   - omit region equal to city/title;
   - strip trailing country from labels like `Калмыкия · Россия`.
4. Update `ImmersiveHero` breadcrumb type to support optional `href/current`.
5. Render clickable crumbs with `next/link`; current crumb as plain text with `aria-current="page"`.
6. Add tests:
   - public request renders `Открытые группы` linking to `/requests`;
   - does not render `Россия` when it is just fallback;
   - current city crumb is not a link;
   - real region appears when specific.
7. Browser checks:
   - desktop hero matches screenshot composition;
   - mobile breadcrumb wraps cleanly and does not collide with title/panel;
   - click `/requests` crumb returns to open groups marketplace.
8. Verification:
   - `bun run typecheck`
   - `bun run lint`

Acceptance criteria:
- No request detail page shows `Поездки > Россия > Москва`.
- Breadcrumb root reflects the `/requests` marketplace, not private trips.
- Visible breadcrumb affordances are clickable where they imply navigation.
- No schema or RLS changes are needed.

## 6. Risk Notes

Do not “fix” this in the database by changing stored `region` values. The problem is UI semantics and fallback handling.

Be careful changing `ImmersiveHero`: it is shared by listing detail pages too. Optional `href` must preserve existing label-only usage.

Do not make `Россия` a clickable crumb unless there is a real country-level destination page. A fake link is worse than the current fake hierarchy.

Do not rename global navigation casually. `src/lib/navigation.ts` uses `Запросы`, while product UI references “Открытые группы”; align only after checking broader copy impact.

No RLS/auth/schema change is indicated for this screenshot. The route already gates private/non-assembly requests in [page.tsx](/Users/idev/provodnik/src/app/(site)/requests/[requestId]/page.tsx:321); keep that behavior unchanged.