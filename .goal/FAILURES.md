# FAILURES — dead approaches and their root→rule lessons

## F-01 — The plan's B3 grep would have shipped a broken guide calendar

**Signature:** `grep -rn '"active"' src | grep -i listing` (the plan's own gate for B3) returns
**zero** hits for `src/app/(protected)/guide/calendar/page.tsx:111`, which reads
`.eq("status", "active")` on the `listings` table. The word "listing" is not on that line.

**Root cause:** the gate greps for the value AND a keyword. Any reader that doesn't happen to
spell the table name on the same line is invisible to it.

**Consequence had it been trusted:** migrating `listings.status` `active` → `published` while
that reader still filtered on `active` would have emptied **every guide's calendar** — a silent,
total data-disappearance bug shipped by the very card meant to fix a visibility bug.

**Rule:** before migrating a column's values, grep for the VALUE alone across the whole
codebase, then READ every hit and classify it (same table? same meaning?). Never let a keyword
narrow the search. Two of the hits this produced were correct as-is
(`listing_tour_departures.status`, a different table; `ExcursionRecord.status`, a UI view-model
field) — which is exactly why each hit must be read rather than pattern-matched.

---

## F-02 — Trusting the plan's description of the notification stack

**Signature:** the plan states the seven notification triggers are "gated by
`FEATURE_TR_NOTIFICATIONS` + `RESEND_API_KEY`" and that item 8 is therefore an env-drift
problem.

**Reality, from tracing every caller:** `FEATURE_TR_NOTIFICATIONS` gates only the settings page
and the header bell — `sendNotificationEmail` never reads it. Three of the seven triggers have
**zero callers** and are dead code. Only two can deliver an email in production.

**Consequence had it been trusted:** C7 would have "verified the env", declared item 8 closed,
and shipped nothing. The operator would have set an env var and still received no notifications,
with an audit doc saying the stack was fine.

**Rule:** a plan's factual claims about the code are hypotheses, not inputs. When a card says
"verify X is configured", first verify that X is what actually controls the behaviour. Trace
callers; do not read exports and assume they run.

---

## F-03 — Lint ratchet blocked a commit on another agent's in-flight file

**Signature:** `lint:ratchet` → `homepage-request-form-classic.tsx: warnings 0→1` while
committing an unrelated card (D1). The pre-commit hook lints the **whole working tree**, not the
staged set.

**Root cause:** parallel agents in one worktree. A NEW warning anywhere blocks every commit,
including cards that did not cause it.

**Not a false alarm:** the warning was real and worth blocking on —
`jsx-a11y/role-has-required-aria-props`: a `role="combobox"` without `aria-controls` /
`aria-expanded`. Exactly the accessibility defect the C3 brief called non-negotiable.

**Rule:** when running agents in parallel, integrate on a QUIET tree. Before committing card N,
confirm no other agent is mid-edit; if the ratchet fires on a file you don't own, fix the defect
(or wait for its owner) — never ratchet-update the baseline to make it pass. The ratchet caught a
genuine a11y bug that the agent's own "tests pass" report had missed.

---

## F-04 — A "use server" module cannot export a sync function (the plan told me to)

**Signature:** `bun run build` → `Server Actions must be async functions.
./src/app/(protected)/admin/users/actions.ts:70 > export function buildGuideRoleFlipWrite(`.

**Root cause:** the plan's A1 step 1 says, verbatim, to put the pure decision function `// in
actions.ts (exported for tests)`. A `"use server"` module may only export async functions. The
plan was wrong.

**What did NOT catch it:** typecheck, lint, all 1279 tests, and the pre-commit hook (which runs
typecheck + lint + tests, but **not** the build). It shipped through five green commits. Only
`next build` knows this rule.

**Rule:** run `bun run build` before believing a branch is green — the pre-commit hook does not.
Framework-level constraints ("use server", "use client", route-segment config) are invisible to
tsc, eslint and vitest. And when a plan says where to put a function, check that location against
the framework's rules before following it. The repo already had the correct home
(`src/data/admin-users/guards.ts`, whose docblock literally describes this use case).

---

## F-05 — Registering a nav flag is not the same as applying it

**Signature:** C1 registered `"/listings"` in `NAV_FLAG_BY_HREF`; the unit test on
`filterNavItemsByHiddenHrefs` passed; and the entry **still rendered with the flag off** on the
built app.

**Root cause:** `SiteHeader` applied the filter to `accountItems` only — never to `primaryItems`.
Every previously flag-gated href (`/favorites`, `/referrals`) lives in the ACCOUNT menu, so the
omission had never mattered. `/listings` is the first flag-gated PRIMARY entry.

**Why the test could not catch it:** the pure function was always correct. The component simply
never called it. A unit test on the helper proves the helper; it says nothing about whether
anyone invokes it. This is the design-run playbook's D-07 lesson repeating in a new costume:
*a math gate only proves the pairs you thought of; the browser gate is the real one.*

**Rule:** for anything whose whole purpose is "X appears/disappears under condition Y", the proof
must render X. Assert the DOM, or serve the app and look. When you add a value to a registry
(a flag map, a route table, a permission list), grep every CONSUMER of that registry and confirm
each one actually reads it.

---

## F-06 — `%{http_code}` is the wrong instrument for a Next.js redirect

**Signature:** `/listings` with the flag off returned **200**, not 307, and served a body — so it
looked broken. It was not. Next 16 does not send a 307 for a `redirect()` inside an
already-streaming render: it returns 200 with `NEXT_REDIRECT` and
`<meta http-equiv="refresh" content="1;url=/guides">` in the body. `curl -L` does not follow a
meta-refresh either, so the "final URL" check also lies.

**Cost:** ~20 minutes chasing a phantom bug, including two unnecessary rebuilds — while a REAL
bug (F-05) sat next to it in the same output.

**Rule:** to verify a Next.js redirect, grep the BODY for the redirect target
(`grep -c 'url=/guides'`) or use a real browser. Status codes are not a reliable signal for
streamed server components.
