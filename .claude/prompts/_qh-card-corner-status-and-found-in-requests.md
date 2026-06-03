# Task: compact request card (status badge → top-right corner) + show "guide found" cards in /requests

You edit product code only with Read/Edit/Write/Glob/Grep. **No bash, no git, no bun — ever.** The orchestrator runs all git + verification after you return. Your DONE report lists files edited + any unexpected findings. No commit SHAs.

There are TWO independent parts. Do both.

---

## PART A — Card layout: move guide-status badge to the top-right corner, drop one row of height

File: `src/components/shared/request-card-final.tsx`

Current structure inside `<article>`:
1. Title (city)
2. Date
3. A wrapping badge row: `GuideStatusBadge` + `GroupTypeBadge` + optional `Гибкие даты`
4. (mt-auto block) theme-icon chips row, then avatars + price row

Goal: the guide-status badge ("Ждёт гида" / "Гид найден") moves OUT of the badge row and into the **top-right corner of the card**. This frees vertical space so the card is one row shorter.

Required result:
- The status badge sits pinned top-right of the `<article>`. Use a `relative` article + the badge in a small flex header, OR `absolute right-4 top-4`. Pick whichever keeps the existing `shadow-card`/padding clean.
- The remaining badge row under the date holds only `GroupTypeBadge` + optional `Гибкие даты` (still wrapping, `flex flex-wrap gap-1.5`).
- Theme-icon chips and the avatars+price block stay as they are, but the overall card is shorter by the removed row.

**AP-040 (layout source, mandatory):** the real risk is the corner status badge colliding with a long city title ("Санкт-Петербург", "Нижний Новгород") at 375px. Do NOT patch this with `whitespace-nowrap`/shrinking text after the fact. Fix the allocation up front:
- Reserve horizontal room for the badge: give the title `pr-24` (or a wrapping-safe right padding sized to the badge) so the title never runs under the badge.
- Keep the title to a single line with `truncate` if needed, but verify the common long names still read.
- The status badge keeps `whitespace-nowrap` (it already does) so it never wraps in the corner.

Keep the `Link` wrapping title + date + group-badge row clickable as before. The corner status badge can sit outside the `Link` (it's a status indicator, not a nav target) — that's fine and avoids nested-interactive issues.

Do not change colors, icons, or copy of any badge. Only relocate the status badge and re-flow.

### Tests for Part A
File: `src/components/shared/request-card-final.test.tsx`
- The existing assertions (`Гид найден` has `bg-success/10 text-success`; `Ждёт гида` has `bg-warning/10 text-warning`; `Открытая`/`Своя группа`; `Гибкие даты`; price; theme chip tooltip) must all still pass. They are structure-agnostic (text + closest span class), so they should survive the move — but run them in your head and adjust selectors ONLY if the relocation genuinely breaks a query. Do not weaken an assertion to make it pass.
- This card renders on both `/` (homepage discovery) and `/requests`. Both consume the same component, so one change covers both.

---

## PART B — Show groups with a found guide in /requests (with the real "Гид найден" status)

Today /requests only fetches and shows requests that are still waiting for a guide, and every card is forced to "waiting". Per a standing product decision, /requests should ALSO show groups where a guide is already found, with the real "Гид найден" badge, so the platform looks alive. The homepage already derives real status; /requests must match.

Three code points (all currently force "waiting"):

1. **Query** — `src/data/supabase/queries.ts`, function `getOpenRequests` (around line 626):
   - Change the status filter from `.eq("status", "open")` to include booked requests too: `.in("status", ["open", "booked"])`.
   - Leave ordering and everything else as-is.

2. **Mapper** — `src/app/(site)/requests/page.tsx`, function `mapToOpenRequestRecord`:
   - It currently hardcodes `status: "open"`. Map the real status instead. `RequestRecord.status` is `"open" | "booked" | "cancelled" | "expired"`; `OpenRequestRecord.status` is `OpenRequestStatus = "open" | "forming_group" | "matched" | "closed"`.
   - Map: `request.status === "booked" ? "matched" : "open"`. (The marketplace screen's `deriveGuideState` returns "found" when status is `"matched"`, "waiting" otherwise — so this mapping makes booked requests render "Гид найден" and everything else "Ждёт гида".)

3. **Verify the derive** — `src/features/requests/components/public-requests-marketplace-screen.tsx`, `deriveGuideState`: confirm it returns `"found"` for `"matched"`. It already does (`status === "matched" ? "found" : "waiting"`). No change needed unless it differs.

### Tests for Part B
- `src/features/requests/components/public-requests-marketplace-screen.test.tsx`: if it asserts all cards are "waiting", add/adjust so a `matched` request renders "Гид найден" while an `open` one renders "Ждёт гида". Keep existing coverage; don't delete cases.

### IMPORTANT — RLS caveat (do NOT change RLS in this task)
The live RLS SELECT policy on `traveler_requests` only exposes `status='open'` rows to non-owner/non-admin clients. So booked rows may not actually be returned to the public /requests client. **Do not modify any RLS policy or migration** — that is a separate high-stakes decision (AP-032). Your code changes must be fail-safe: if booked rows aren't returned, /requests simply shows what it shows today (no error, no empty page). The orchestrator will verify on the preview whether booked cards appear and decide on RLS separately. If you notice anything that would make the page throw rather than gracefully show fewer rows, flag it in DONE.

---

## Out of scope / do NOT touch
- No RLS / migration / DB changes.
- No money/`_minor` math.
- Do not rename `Открытая`/`Своя группа`/`Гибкие даты` copy.
- Do not touch homepage query (`getHomepageRequests`) — only `getOpenRequests` and the /requests mapper.
- Stay within the files named above + their tests.

## DONE report
List: files edited, what changed in each, whether the existing card tests still pass as-written, and any unexpected finding (especially anything RLS/throw-related from Part B).

## Commit message (for the orchestrator to use — do not run git yourself)
```
feat(request-card): status badge to top-right corner + show found-guide groups in /requests

- request-card-final: guide-status badge pinned top-right, title reserves room (AP-040); card one row shorter
- getOpenRequests: include booked requests so /requests can surface found guides
- /requests mapper: map real status (booked→matched) instead of forcing waiting
```
