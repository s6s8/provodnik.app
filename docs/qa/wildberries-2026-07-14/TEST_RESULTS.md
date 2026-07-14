# Test results — Wildberries verification run, 2026-07-14

Environment: local Supabase (127.0.0.1:55621, all 27 migrations applied), app served from a
**production build** (`next build && next start`) for every browser proof. No production
system was read, written, or deployed.

---

## 1. Final verification chain

Run on `a0a19338` with a clean tree.

| Gate | Command | Result |
|---|---|---|
| Types | `bun run typecheck` | **PASS** (no output) |
| Lint | `bun run lint` | **0 errors**, 21 warnings — identical to the baseline (ratchet **+0**) |
| Unit / component | `bun run test:run` | **234 files, 1291 tests PASS** (baseline at `88df693e`: 1282 → **+9**) |
| E2E gate | `bun run playwright` | **11 passed, 20 skipped** |
| Build | `bun run build` | **PASS** |
| Whitespace | `git diff --check` | clean |
| Whitespace (range) | `git diff --check cbcffe67..HEAD` | clean |

**Why 20 skipped is correct, not a dodge.** The 20 skipped specs are the Wildberries evidence
suite. They are gated behind `WB_EVIDENCE=1` because they require a seeded local fixture
(guides, listings, reviews, a request) that does not exist in CI or on a fresh clone. Running
them unconditionally would make the shared gate fail for everyone else. They are run
explicitly, in full, below.

---

## 2. The evidence suite (items 1–18 in a real browser)

```
bun scripts/seed-test-users.mjs .env.local
bun scripts/seed-qa-content.mjs .env.local
E2E_BASE_URL=http://localhost:3000 WB_EVIDENCE=1 WB_REQUEST_ID=<uuid> \
  bunx playwright test tests/e2e/wildberries-evidence.spec.ts
```

**Result: 20 passed, 0 failed** (1.2 min). Every UI item is driven at **1440×900 and 375×812**.
55 screenshots written to `screenshots/`.

Measurements the suite logs (not assertions dressed up as facts — these are numbers observed
on a local production build with a 6-row fixture, and are **not** production latencies):

```
[item 03] guide → admin role save settled in 64–303 ms   (across runs; no infinite «сохраняет»)
[item 15] /admin/audit interactive @desktop in 233–297 ms
[item 15] /admin/audit interactive @mobile  in 255–280 ms
[item 16] request hero height @desktop = 335 px          (default variant: 520/632 px)
[item 16] request hero height @mobile  = 564 px          (contains the trip-details panel)
```

Fixture safety: the two mutating tests (13 edits a name, 03 flips a role) restore their rows in
a `finally` and independently confirm the rollback. Verified after the run — all six fixture
accounts back to their seeded state.

---

## 3. Focused checks per repair

### `299be64a` — public review authors (items 5, 12)

```
bun run test:run src/lib/supabase/homepage.test.ts src/lib/supabase/queries.test.ts
→ 2 files, 60 tests PASS
```
New test: *"names review authors from the anon-safe view, never a profiles join"* — asserts the
read hits `v_public_reviews`, never `reviews`, and never an embedded `profiles:traveler_id` join.

Browser (anonymous, production build):
```
homepage       → «Ирина П.» ×2, «Олег С.» ×1,  «Путешественник» ×0
/guides/bair-elista → «Ирина П.» ×1,           «Путешественник» ×0
```
Before the fix, the same two pages rendered «Путешественник» for every review.

### `6bb24dc7` — anonymous draft restore (item 10)

A/B on a **production build** (`next build && next start`), draft = `{destination: Элиста,
groupSize: 4, budgetPerPersonRub: 7000}`, zero console errors in both runs:

```
before → dest=Элиста | guests=2 | budget=5000     ← the DEFAULTS (form state held 4 / 7000)
after  → dest=Элиста | guests=4 | budget=7000
```

**Test honesty — read this before trusting the unit test.** The added component test
(`homepage-request-form-classic.destination.test.tsx`, "puts the stored draft back into the
visible inputs") passes against the **old** code too: jsdom does not reproduce the
ref/DOM divergence. It locks the new behaviour but it did **not** and could not catch this bug.
The real guard is the browser assertion in the evidence suite (item 10), which fails on the old
code and passes on the new one. Recorded rather than papered over: **this bug class is invisible
below the browser layer**, which is exactly why it shipped.

### `b2dadaff` — new-request email to matching guides (item 8)

```
bun run test:run src/lib/notifications/triggers.test.ts   → 5 tests PASS
bun run test:run src/lib/email                            → 9 tests PASS
```
Three new tests:
- emails **every** matching guide, under a **per-recipient** idempotency key
  (`${requestId}:${guideId}`). `notification_email_log` is `PRIMARY KEY (kind, entity_id)`, so a
  bare request id would let guide one's row take the key and every other guide's mail would be
  dropped as "already sent" — silently. The test pins the exact entity ids.
- respects a guide who turned new-request email **off**.
- an email failure **never** fails the request that triggered it: the in-app notification still lands.

No email was actually sent: there is no `RESEND_API_KEY` locally and no mail server. Delivery is
a release gate, stated as such.

### `fb467235` — public guide name (item 13)

```
bun run test:run src/lib/supabase/queries-core.test.ts   → 10 tests PASS
```
Red→green proven: with the old precedence the new test fails with
`expected 'Гиляна Манджиева' to be 'Гиляна'`. With the fix, 10/10 pass.

Browser (anonymous, production build), counting the private FIO on public pages:
```
/guides               → «Манджиева» ×0
/guides/gilyana-elista → <h1> «Гиляна» ;  «Манджиева» ×0
```
Before the fix the `<h1>` read «Гиляна Манджиева».

Full suite after the migration (both projections changed): **234 files / 1291 tests PASS** — no
caller depended on the old behaviour.

### `a0a19338` — mobile form fields (items 4, 10)

Measured at 375×812 on a production build, after picking a date:

| | guests input | budget input | page overflow |
|---|---|---|---|
| before | **0 px** (unusable) | 60 px | 0 |
| `shrink-0` only | 6 px | — | **card overflows** |
| **stacked (shipped)** | **189 px** | 243 px | **0** |

Desktop (1440) is unchanged — the two fields stay side by side. New regression test asserts the
**rendered width** of both fields and that the document does not scroll horizontally. A
"can I type into it" test would pass happily while the field is 6 px wide.

---

## 4. What the local environment cannot prove

- **Email delivery.** No `RESEND_API_KEY`, no mail server. Code path is tested with a mocked
  Resend client; an actual send is a staging step.
- **Production latency** (items 3, 15). Numbers above are a local server, local DB, 6-row
  fixture. They demonstrate the absence of a hang, not production performance.
- **Production data.** The clobbered `display_name` rows, the `active` → `published` listing
  rows, and existing phoneless guides are all **prod data** questions. The repair runbook exists
  (`docs/audits/wildberries-2026-07/prod-data-repair-runbook.md`) and was rehearsed against a
  real Postgres by the prior run; it is not executed from here.
- **The footer on production** (item 9). Verified locally. If those links are dead on prod, it is
  environment drift (e.g. `/help` behind `FEATURE_TR_HELP`), not code.
