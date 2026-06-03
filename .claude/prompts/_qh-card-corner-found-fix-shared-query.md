# Follow-up fix: don't leak booked requests into the guide bid inbox

Read/Edit/Write/Glob/Grep only. **No bash, no git, no bun.** DONE report = files edited + findings.

## Context
A prior change widened `getOpenRequests` in `src/data/supabase/queries.ts` from `.eq("status","open")` to `.in("status",["open","booked"])`. But `getOpenRequests` is shared by TWO callers:
- `src/app/(site)/requests/page.tsx` — public marketplace, SHOULD show open + booked (booked = "Гид найден").
- `src/features/guide/components/requests/guide-requests-inbox-screen.tsx` (line ~90) — the guide's inbox of requests to bid on. This must stay **open-only**: a guide must never see/bid on an already-booked request.

The unconditional widening is a regression for the guide inbox. Fix it by making the status set a parameter that defaults to open-only.

## Required change
File: `src/data/supabase/queries.ts`, function `getOpenRequests`:
- Add an optional parameter for the status set. Keep the existing `filters?: RequestFilters` arg working. Suggested signature:
  `export async function getOpenRequests(client: SupabaseClient, filters?: RequestFilters, statuses: string[] = ["open"])`
- Replace the hardcoded `.in("status", ["open", "booked"])` with `.in("status", statuses)`.
- Default `["open"]` means existing callers that pass nothing are unchanged (guide inbox stays open-only).

File: `src/app/(site)/requests/page.tsx`:
- Update the call so the marketplace opts into booked: `getOpenRequests(supabase, undefined, ["open", "booked"])`.

File: `src/features/guide/components/requests/guide-requests-inbox-screen.tsx`:
- Leave the call as-is (`getOpenRequests(supabase)`) — it now correctly gets open-only via the default. Confirm you did not change it.

## Don't touch
- The Part A card layout, the /requests mapper (booked→matched), and the marketplace test from the prior change are correct — leave them.
- No RLS/migration changes.

## DONE report
Files edited + confirm the guide inbox call still resolves to open-only.
