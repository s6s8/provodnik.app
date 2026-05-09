# E2E spec rot — fix scope (bek's first post-handover ticket)

**Status:** Ticket-ready. Specs all skipped via `test.skip` pending this fix.
**Tracked as:** ERR-059 in `.claude/sot/ERRORS.md`.
**Source of truth:** This file. ERR-059 is the short SOT entry; this doc is the actionable plan.
**Origin:** Phase 4 (provodnik → quantumbek migration) wired Playwright `webServer` auto-boot, then ran the suite from macmini against prod DB. Auth selector + fixture rot surfaced; migration scope ended at the wiring deliverable. Detailed in `quantumbek/orchestrator/HANDOVER-2026-05-09-phase-4-entry.md`.

## TL;DR

Six e2e specs in `tests/e2e/tripster-v1/` (`01-create-listing` through `06-dispute-flow`) were authored 2026-04-12/13 against an imaginary fixture set. None of them have ever been runnable against any real DB — the seed accounts they reference don't exist with those credentials.

Phase 4 fixed only the auth-page selector pattern (`[name="email"]` → `#email`). Three layers of rot remain.

## What's actually broken (in order of cost-to-fix)

### Layer 1 — Wrong test fixture identities (cheapest)

The seed migration `supabase/migrations/20260331121000_phase1_auth_seed_accounts.sql` creates exactly three users:

| Role | Email | Password |
|---|---|---|
| admin | `admin@provodnik.test` | `Admin1234!` |
| traveler | `traveler@provodnik.test` | `Travel1234!` |
| guide | `guide@provodnik.test` | `Guide1234!` |

The specs hard-code different credentials:

| Spec line | Hardcoded (broken) | Should be |
|---|---|---|
| `01-create-listing.spec.ts:5` | `guide1@provodnik.test` / `testpass123` | `guide@provodnik.test` / `Guide1234!` |
| `02-send-request.spec.ts:6` | `traveler1@provodnik.test` / `testpass123` | `traveler@provodnik.test` / `Travel1234!` |
| `03-offer-flow.spec.ts:5` | `guide1@provodnik.test` / `testpass123` | `guide@provodnik.test` / `Guide1234!` |
| `04-booking-confirm.spec.ts:5` | `traveler1@provodnik.test` / `testpass123` | `traveler@provodnik.test` / `Travel1234!` |
| `05-review-reply.spec.ts:5` | `guide1@provodnik.test` / `testpass123` | `guide@provodnik.test` / `Guide1234!` |
| `06-dispute-flow.spec.ts:6,38` | `traveler1@.../testpass123`, `admin@.../testpass123` | `traveler@/Travel1234!`, `admin@/Admin1234!` |

Auth page error confirms: `signInWithPassword` returns "invalid login credentials" → the friendly error "Неверный email или пароль." renders → form stays on `/auth` → `waitForFunction(!startsWith("/auth"))` times out.

**Fix shape:** centralize fixture identities in `tests/e2e/fixtures.ts` (new), import into specs. Don't sprinkle credentials. Example:

```ts
// tests/e2e/fixtures.ts
export const SEED_USERS = {
  admin:    { email: "admin@provodnik.test",    password: "Admin1234!" },
  traveler: { email: "traveler@provodnik.test", password: "Travel1234!" },
  guide:    { email: "guide@provodnik.test",    password: "Guide1234!" },
} as const;
```

Specs become `await loginAs(page, SEED_USERS.guide.email, SEED_USERS.guide.password)`.

### Layer 2 — Internal form selectors

The auth page uses shadcn `<Input id="..." />` controlled-state pattern (no `name=` attr emitted). Internal forms across the app likely follow the same pattern. The specs use `[name="..."]` selectors that won't match.

| Spec | `[name=...]` selectors used |
|---|---|
| 01-create-listing | `title`, `region`, `description` |
| 02-send-request | `starts_on`, `participants_count` |
| 03-offer-flow | `price`, `message` |
| 04-booking-confirm | (none — interaction-based) |
| 05-review-reply | `review_text`, `rating` |
| 06-dispute-flow | `dispute_reason`, `resolution_note` |

**Audit step:** open each form component (the page Bek navigates to in the spec), check whether the `<Input>` emits `name=`. If it does (e.g. via `react-hook-form` `register("title")`), the selector is fine. If not, switch to `#id` or `getByLabel(...)` / `getByRole(textbox, { name: ... })`.

For Playwright modern style, prefer:

```ts
await page.getByLabel(/Название|Title/).fill("Тестовая экскурсия");
await page.getByRole("button", { name: /Отправить|Submit/ }).click();
```

over brittle `[data-testid=...]` chains where labels exist.

### Layer 3 — `data-testid` attribute existence

Most specs gate progress on `[data-testid="..."]` selectors with a defensive `isVisible().catch(() => false)` → `test.skip()` pattern. If the testid was never wired into the component, the spec silently skips itself rather than failing — which means **green CI doesn't actually mean any of these specs ran a single assertion**.

Required testids (per spec):

| Spec | Required `data-testid` |
|---|---|
| 01 | `type-picker`, `type-excursion`, `autosave-saved` |
| 02 | `listing-card`, `book-button`, `submit-order` |
| 03 | `request-item`, `send-offer-button`, `submit-offer`, `offer-sent-badge` |
| 04 | `offer-item`, `accept-offer-button`, `booking-confirmed-badge` |
| 05 | `booking-item[data-status=pending_review]`, `post-review-button`, `submit-review`, `review-submitted-badge` |
| 06 | `booking-item`, `open-dispute-button`, `submit-dispute`, `dispute-opened-badge`, `dispute-item`, `resolve-dispute-button`, `confirm-resolution`, `dispute-resolved-badge` |

**Audit step per testid:** grep the codebase. If absent, decide between (a) wiring the testid into the component, or (b) rewriting the spec to use accessible role/label selectors that don't need testids.

For badges/state markers, accessible-name targeting often works without testids:

```ts
await expect(page.getByRole("status", { name: /отправлено|sent/i })).toBeVisible();
```

## Recommended sequencing for bek

1. **Spike: get one spec green end-to-end against prod.** Pick `04-booking-confirm` (no `name=` selectors, simplest interaction). Get auth working with the real fixture, fix testids or replace with role/label, prove the loop.
2. **Centralize fixtures** (`tests/e2e/fixtures.ts`) so credential rotation is one file.
3. **Per-spec pass.** For each remaining spec: align fixtures, audit selectors, decide testid-add vs spec-rewrite. Each spec ~30–60 min after the spike.
4. **Drop `test.skip`** as each spec lands. Don't unskip until the spec passes locally on macmini.
5. **CI gating:** after all 6 are green, wire `bun run playwright` into the verify-runner (Phase 5.1.2 of the migration runbook). Until then, e2e is mini-local only.

## Out of scope for this ticket

- Creating staging Supabase project. Decision in Phase 4: existing prod is fine; mutations are bounded to the seed users.
- New e2e specs beyond the existing 6.
- Rewriting helpers.ts beyond what each spec needs.

## Acceptance

- `bun run playwright` from macmini → 6/6 pass (or each skip has an inline non-rot reason: feature flag off, env-dependent, etc.).
- No spec self-skips silently via `isVisible().catch(() => false)` — replace with explicit assertions.
- `tests/e2e/fixtures.ts` is the only place fixture credentials appear.
- All 6 testid columns above are either wired into components or replaced with accessible selectors.
