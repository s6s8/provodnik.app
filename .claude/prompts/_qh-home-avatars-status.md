# Task: wire homepage request cards to real members + real guide status

Two small, surgical fixes so the homepage discovery cards match `/requests` behaviour. No new design, no logic invention — mirror what `/requests` already does.

## Context (already verified)
- Homepage feed: `src/app/(home)/page.tsx` → `getHomepageRequests` → `HomePageShell2` → `HomePageDiscovery`.
- `HomePageDiscovery` (`src/features/homepage/components/homepage-discovery.tsx`) renders `RequestCardFinal` with `guideState="waiting"` hardcoded and `members={req.members}`.
- `getHomepageRequests` in `src/data/supabase/queries.ts` does NOT populate `members` (stays `[]` from `mapRequestRow`), so avatars never render. The sibling `getOpenRequests` DOES populate members via `fetchMembersForRequests` (see lines ~655-658).
- `RequestRecord.status` is `"open" | "booked" | "cancelled" | "expired"`.

## Fix 1 — load members in `getHomepageRequests`
In `src/data/supabase/queries.ts`, inside `getHomepageRequests`:
- After `records` is built (the `rows.map((row) => { ... })` block) and BEFORE the `filtered` capacity filter, populate members for all record ids using the existing `fetchMembersForRequests(db, ids)` helper, exactly mirroring `getOpenRequests`:
  - assign `rec.members = membersMap.get(rec.id) ?? []`
  - if `rec.members.length > 0` set `rec.groupSize = rec.members.length`
- Doing this before the filter keeps the `remaining = capacity - groupSize` check accurate.
- Use the same client the function already uses for the main query (`client`). Do not introduce a new admin client for members.

## Fix 2 — derive real guide status in `HomePageDiscovery`
In `src/features/homepage/components/homepage-discovery.tsx`:
- Add a small helper `deriveGuideState(status: RequestRecord["status"])` returning `"found"` when `status === "booked"`, else `"waiting"`.
- Replace the hardcoded `guideState="waiting"` with `guideState={deriveGuideState(req.status)}`.
- Note: the homepage query only returns `status === "open"` requests today, so visually this stays "waiting" — that is correct and intended. The point is to remove the hardcode so the card reads the real field.

## Do NOT touch
- `RequestCardFinal` itself.
- `/requests` screen and its data source.
- `/destinations/*`.
- Any capacity/group-max concept — that is a separate future task.

## Verify before reporting done
- `bun run typecheck`
- `bun run lint`
- `bun run test:run` — update `src/features/homepage/components/homepage-discovery.test.tsx` only if the status/members change breaks an assertion; keep changes minimal and truthful.
- Report: exact files changed, the diff summary, and the check results. Do NOT push.
