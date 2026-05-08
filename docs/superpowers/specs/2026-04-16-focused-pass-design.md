# Focused-Pass Design — Provodnik Two-Mode Sprint Ride-Along

**Date:** 2026-04-16
**Status:** Approved (orchestrator self-resolved open questions)
**Parent spec:** `2026-04-16-two-mode-architecture-design.md`
**Parent plan:** `2026-04-16-two-mode-architecture-plan.md`

---

## Problem

The two-mode architecture spec covers nine fixes that ship together. A focused
1-hour audit of the same surfaces (booking form, listing detail shapes,
traveler dashboard, requests inbox, request wizard, related server actions)
surfaced **seven additional issues** that should ride along — they live in
files we are already editing, so the marginal cost is near-zero, and shipping
them later means a second deploy.

Source of findings: `.claude/tmp/focused-pass-findings.json` (Explore agent
audit, 10 findings; 3 already covered by the parent plan).

## Goals

1. Bundle ride-along fixes into the same worktrees as the parent plan, so the
   nine-fix sprint becomes a sixteen-fix sprint without extending the timeline
   beyond ~2 working days.
2. Catch one new P0 (date timezone) before launch, not after.
3. Tighten three surfaces (request submit, dashboard math, error messaging)
   that would otherwise leak confusing data into production within week one.

## Non-goals

- Not doing a full app audit. Stays scoped to surfaces touched by the parent
  plan.
- Not refactoring file structure or splitting components.
- Not adding test coverage beyond the W-04 currency smoke test already in the
  parent plan (one extra invariant assertion is in scope; full Jest setup is
  not).
- Not changing the visual design of any surface — fixes are behaviour and
  copy only.

## Findings inventory

### Already covered by parent plan (no new work)

| ID  | Finding | Covered by |
|-----|---------|------------|
| F01 | `actions.ts:80` budget stored as RUB instead of kopecks | Parent Task 6 (W-04) |
| F05 | `ExcursionShapeDetail.tsx:104` Button-with-Link semantic issue | Parent Task 1 (CTA swap rebuilds the button) |
| F06 | `guide-listing-card.tsx:83` only title clickable | Parent Task 7 (W-02 full-card link) |

### New ride-along items

| ID    | Severity | File | Brief | Slot |
|-------|----------|------|-------|------|
| FP-1  | P0 | `features/booking/components/BookingFormTabs.tsx:80` | `todayLocalISODate()` uses local TZ; server validation runs in UTC. Users in UTC+12 / UTC-8 see "today" disagree with server. | Bundle into parent **Task 3** (BookingFormTabs amount + tabs) |
| FP-2  | P1 | `features/traveler/components/traveler-dashboard-screen.tsx:177` | `от ${budget * 0.8} ₽` — unexplained 0.8 multiplier. Travelers see a 20% discount they didn't request. | Bundle into parent **Task 9** (W-03 dashboard label) |
| FP-3  | P1 | `features/booking/actions/submitRequest.ts:28` | No verification that `listing.status === 'published'` before insert. Allows requests against draft / rejected / archived listings. | Bundle into parent **Task 5** (publish validation), expand scope from publish-time only to also include submit-time |
| FP-4  | P0 | `features/requests/components/request-wizard.tsx:76` + `actions.ts` | `budgetMap` keys (`under5k`, `under10k`) map to RUB integers, then stored as `budget_minor`. Same bug family as F01. | Bundle into parent **Task 6** (W-04 currency fix) — single PR for the whole minor-units pipeline |
| FP-5  | P1 | `features/guide/components/requests/guide-requests-inbox-screen.tsx:67` | `if (session?.user?.id) { ... } else { silent no-op }`. When session resolves late, `offered`/`accepted` tab counts stay 0 forever. | Standalone — small, clean PR |
| FP-6  | P2 | `features/booking/components/BookingFormTabs.tsx:151` | Generic error message regardless of failure mode (auth, timeout, server, validation). | Bundle into parent **Task 3** |
| FP-7  | P2 | `features/traveler/components/traveler-dashboard-screen.tsx:78` | No skeleton or Suspense fallback while requests load client-side; user sees blank grid for 1–2s. | Standalone — small standalone PR |

## Self-critique (open questions resolved)

**Q1: Should FP-3 (`listing.status === 'published'` check) also apply to existing draft listings that have pending requests?**
**A:** No. Apply guard going forward only. Migrations for historical data are out of scope. If a request already exists against a draft, leave it — the guide can decline. *Rationale: data clean-up is its own ticket; this fix is about preventing future bad inserts.*

**Q2: For FP-1 (date timezone), what's the canonical "today"?**
**A:** Server time (Europe/Moscow, the operational TZ for Provodnik). Client computes `todayLocal()` for display, but submission is validated server-side using `now() AT TIME ZONE 'Europe/Moscow'`. This means a user in UTC-8 at 23:00 local can submit "tomorrow" in their TZ but it'll be rejected if it equals server-side "yesterday" — acceptable, since dates are about Russian travel and Russian guide schedules. *Rationale: aligns with where bookings actually happen.*

**Q3: FP-2 — the `* 0.8` multiplier. Is it intentional (some "discount preview" idea) or a leftover from prototyping?**
**A:** Treat as a leftover. There is no design system spec for a discount preview, no copy explaining "от" vs "до", and no comment in code. Remove the multiplier and show the raw budget as `от X ₽ / чел.` to match the existing pattern in `data/supabase/queries.ts:296`. *Rationale: pick the option that matches an already-shipped pattern; if Alex wants a discount preview later, that's a deliberate ticket with copy.*

**Q4: FP-6 (error classification) — how granular?**
**A:** Three buckets only:
- **auth/session expired** → "Войдите снова, чтобы отправить заявку"
- **validation** (server returned `validation` shape) → show field-level errors inline, no toast
- **everything else** → "Не удалось отправить заявку. Попробуйте ещё раз через минуту"
Avoid building an exception taxonomy. *Rationale: three messages cover 95% of real-world failures and fit in one render conditional.*

**Q5: FP-7 (skeleton) — how much do we invest?**
**A:** Three card skeletons matching the grid layout, fade-in. No shimmer. No Suspense boundary refactor. Just a `if (loading) return <SkeletonGrid />` block. *Rationale: matches the rest of the app's loading patterns; investing in shimmer is YAGNI.*

## Design

### Slotting strategy

The parent plan has two worktrees: `two-mode-arch` (Tasks 1–5) and
`audit-polish` (Tasks 6–10). Ride-along items slot in by file co-location:

```
worktree two-mode-arch (parent + FP)
├── Task 1: ExcursionShape CTA swap                     (parent)
├── Task 2: /guide/orders branch                        (parent)
├── Task 3: BookingFormTabs amount + tabs
│           ├─ FP-1 date TZ fix                         (bundled)
│           └─ FP-6 error classification                (bundled)
├── Task 4: remove shape guard                          (parent)
└── Task 5: publish validation
            └─ FP-3 published-status check on submit    (bundled)

worktree audit-polish (parent + FP)
├── Task 6: W-04 budget kopecks fix
│           └─ FP-4 wizard kopecks consistency          (bundled)
├── Task 7: W-02 full-card link                         (parent)
├── Task 8: W-01 hoist bid CTA                          (parent)
├── Task 9: W-03 dashboard label
│           └─ FP-2 remove 0.8 multiplier               (bundled)
└── Task 10: home "Two ways to book"                    (parent)

worktree focused-standalone (NEW — for items that don't fit)
├── FP-5: inbox session-skip fix                        (standalone)
└── FP-7: traveler dashboard skeleton                   (standalone)
```

Adds **one** new worktree (`focused-standalone`), keeps merge order identical
to the parent plan, then merges focused-standalone last (it touches no files
in the critical path).

### Dependency adjustments

- **FP-3 changes Task 5's scope.** Task 5 was "block publishing of listings
  without `price_minor`". It now also validates listing status at request-submit
  time (`features/booking/actions/submitRequest.ts`). Same logical responsibility
  ("don't let a non-shippable listing accept commerce"); update Task 5's prompt
  to cover both call sites.
- **FP-4 expands Task 6's scope.** Task 6 was "fix `budget_minor / 100` and
  introduce a centralised `formatBudget()`". It now also covers the inverse
  conversion at insert time in `request-wizard.tsx` + `actions.ts`. Update
  Task 6's prompt to include the wizard write path and add a one-line invariant
  test: round-trip `RUB → kopecks → RUB` returns the same value.
- **FP-1, FP-2, FP-6** are pure additive scope inside their parent tasks, no
  upstream/downstream effects.
- **FP-5, FP-7** are zero-dependency standalone tasks.

### What stays unchanged

- All visual design (colors, type, spacing) on every surface.
- The two-mode architecture itself.
- All existing query patterns, mutation patterns, RLS policies.
- The parent plan's testing approach (manual QA over the eight-step matrix).

## Data flow notes

### FP-1 date timezone — concrete fix

Server side uses `dayjs.tz('Europe/Moscow').startOf('day').toISOString()` (or
the equivalent native: `new Intl.DateTimeFormat('ru-RU', {timeZone: 'Europe/Moscow'})`)
as the lower bound. Client side does the same to populate the date picker's
`min` attribute, so the UI never lets a user pick a date that the server will
reject. No new dependency: use `Intl.DateTimeFormat` to extract Y/M/D in
the target TZ.

### FP-3 published-status check — concrete shape

In `submitRequest.ts`, before the insert:

```ts
const { data: listing } = await supabase
  .from('listings')
  .select('id, status, price_minor')
  .eq('id', input.listingId)
  .single();
if (!listing || listing.status !== 'published') {
  return { error: 'listing_unavailable' };
}
if (listing.price_minor == null) {
  return { error: 'listing_no_price' };
}
```

Then map `listing_unavailable` and `listing_no_price` to user-facing Russian
strings in the form's error renderer.

### FP-5 inbox session-skip — concrete shape

Replace silent skip with explicit handling:

```ts
if (!session?.user?.id) {
  // session genuinely not loaded yet — re-run effect once it arrives
  return;
}
const result = await fetchOfferedRequestIds(session.user.id);
if (!ignore) setOfferedIds(result);
```

Wire `session?.user?.id` into the effect's dependency array so it re-runs
when session resolves.

## Error handling

- All new server-side validations return `{ error: '<machine_code>' }` instead
  of throwing. Client maps codes to Russian copy.
- All new client-side validations are React Hook Form rules (no extra
  libraries).

## Testing

Manual QA matrix expands by **three** scenarios on top of the parent plan:

1. **FP-1**: Set system clock to UTC-8, navigate to booking form, attempt
   to submit a date that is "tomorrow local" / "today server" — expect form
   to either accept it (if still future server-side) or display a clear
   message like "Дата уже прошла". No silent failure.
2. **FP-3**: Take a draft listing's UUID, manually craft a `submitRequest`
   call with that UUID, expect `listing_unavailable` response. Confirm no
   row inserted into `requests`.
3. **FP-5**: Refresh `/guide/requests` ten times in a row from a clean state
   — confirm `offered` / `accepted` tab counts are correct on every render
   (not 0 on some loads).

## Risks register

| ID  | Risk | Mitigation |
|-----|------|-----------|
| RFP-1 | Bundling FP-1 / FP-6 inflates Task 3 prompt past 8000 tokens | Split prompt: keep amount + tabs in Task 3, push date TZ + error classification to a Task 3b sibling prompt if budget exceeded |
| RFP-2 | FP-3 published-status check breaks inquiry-only flow on draft listings used for testing | Apply check only to the `order` tab path, not the `question` tab path — inquiries against drafts stay allowed (they don't create rows) |
| RFP-3 | FP-2 removal of `* 0.8` reveals that the wizard `under5k` label and the dashboard label were both wrong by different multipliers | Round-trip test in Task 6 catches this; verify on a fresh request post-merge |
| RFP-4 | FP-7 skeleton ships before Task 10 home redesign and looks inconsistent | Use existing card skeleton pattern from `components/listings/listing-card-skeleton.tsx` if it exists; otherwise mirror its visual size only |

## Out of scope

- Empty-state polish on `/guide/orders` (covered by parent Task 2).
- Notification wiring for booking events (parent plan defers to "after launch").
- Deep accessibility audit (post-launch sprint).
- N+1 query analysis on dashboard (no evidence of perf problem yet).

## Effort

- FP-1 ride-along: +30m on Task 3
- FP-2 ride-along: +20m on Task 9
- FP-3 ride-along: +45m on Task 5
- FP-4 ride-along: +30m on Task 6
- FP-5 standalone: 30m new task
- FP-6 ride-along: +45m on Task 3
- FP-7 standalone: 45m new task

**Total added: ~4 hours of agent execution time.** Sprint length stays at
1.5–2 working days because the standalone work runs in parallel.

## Success criteria

1. All ten parent tasks complete + all seven FP items complete.
2. Manual QA passes for both parent matrix (8 scenarios) and FP matrix (3 scenarios).
3. No regression in any of the three new test invariants (round-trip currency,
   listing-status guard, session-resolved tab counts).
4. Telegram dev-note records the bundle as one shipment.

## Dependencies

- Parent spec `2026-04-16-two-mode-architecture-design.md` and parent plan
  `2026-04-16-two-mode-architecture-plan.md` must be the active sprint.
- No new npm packages.
- No DB migrations.
- No env-var changes.
