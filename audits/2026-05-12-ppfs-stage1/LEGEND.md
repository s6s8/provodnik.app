# PPFS Stage 1 — audit protocol (LEGEND)

Observation-only pass: record steps, expectation, fact on screen, screenshots, product-facing fact-or-question, and criticality. No code or database changes inside this ticket.

## Column Schema

Audit tables in `guest.md`, `traveler.md`, `guide.md`, and `admin.md` use this column order and meaning:

| route | row_type | steps | expected | actual | screenshot | fact-or-question-for-PM | criticality |
| --- | --- | --- | --- | --- | --- | --- | --- |

- **route** — URL path (or `PRE-GATE` for guide preflight); use bracket segments for dynamic routes (e.g. `/requests/[requestId]`).
- **row_type** — `UX` (visible behaviour/layout), `CONSOLE` (browser console), or `SERVER-ERROR` (terminal/network/server log line tied to the step).
- **steps** — Numbered or clear imperative sequence the auditor performed.
- **expected** — What should happen per product intent or prior agreement.
- **actual** — What happened (symptom, copy, HTTP status, stack snippet as appropriate).
- **screenshot** — Filename under `screenshots/` for 1280px capture; second capture at 375px when responsive behaviour exists (see Viewport Matrix).
- **fact-or-question-for-PM** — Confirmed defect/observation, or explicit question for product (not hidden opinion).
- **criticality** — One of the levels in Criticality Scale.

## Row-Type Taxonomy

- **UX** — End-user visible outcome: navigation, copy, forms, empty states, spacing, role-correct chrome, redirects, permissions.
- **CONSOLE** — JavaScript console: errors, warnings tied to the route or action (note red vs yellow).
- **SERVER-ERROR** — Server or edge log, failed API response body, or non-2xx documented against the same step (capture enough context to reproduce).

## Criticality Scale

Use exactly one label per finding (stub rows before the walk may use `—`):

- **P0** (blocker — feature unusable) — Cannot complete primary task; data loss risk; security/permission breach; crash loop.
- **P1** (serious — degrades flow) — Wrong role data, broken secondary path, misleading copy with user harm, repeated errors with workaround.
- **P2** (minor — workaround exists) — Small UI glitches, non-blocking console noise with clear workaround.
- **Cosmetic** — Purely visual nit, typo with no ambiguity, no functional impact.

## Viewport Matrix

Operational rule for this audit:

- Test every route at **1280px** (primary screenshot set).
- Test every route additionally at **375px**.
- In the **screenshot** column: include the 1280px artifact name; when 375px is in scope, either add a second filename or note both. **Mark the 375px screenshot cell `N/A`** for any route where **no** layout shift or reflow is observed (narrow pass explicitly waived with rationale).

## Seed Account Roster

| Account | Role / use |
| --- | --- |
| `admin@provodnik.test` | Admin seed — admin protected routes. |
| `traveler@provodnik.test` | Traveler seed — traveler + shared protected routes as traveler. |
| `dev+guide@rgx.ge` | **Primary guide credential** for all `/guide/*` walkthroughs on seed/local. |
| Demo guide (production) | live provodnik.app demo account — use only when a finding specifically requires a guide session on the production domain; dev+guide@rgx.ge is the primary credential for all guide-route walkthroughs. |
| `guide@provodnik.test` | **Does not exist** (ADR-058) — do not use for login attempts. |

## Pre-Guide-Route Gate

Before visiting any `/guide/*` page as the guide persona: open **DevTools > Application > Auth session** (stored Supabase session) and confirm **`user_metadata.role`** and **`app_metadata.role`** are both the string **`guide`**. If either differs or is missing, **stop** and log a **P1** row describing the mismatch — do **not** silently “fix” metadata in the client; escalate or re-seed per runbook.

## Role-Switch Protocol

To change persona or clear session: set **`window.location.href = '/api/auth/signout'`** and complete the redirect. **Do not** use `supabase.auth.signOut()` from the browser as the primary logout (cookie session may rehydrate — ADR-015).

## Theme-Tag Vocabulary

Tag cross-cutting findings (optional column in prose or trailing tag in `fact-or-question-for-PM`) using:

anti-disintermediation | transaction | monetisation | programs | push

These align with the epic sequence after PPFS; they help cluster audit follow-ups.
