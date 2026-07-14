# Release gates — what is NOT done by merging this branch

Everything here is **outside the repository**. The code is complete and locally proven; these
steps need an environment, production data, or a human decision. Nothing in this list was
executed from this run — the contract forbids prod SQL, deploys and pushes, and that rail held.

Order matters. Gates are grouped by the release they belong to.

---

## G1 — Deploy first, repair data second (blocking, in this order)

### G1.1 Deploy the identity fixes **before** repairing any data
`b342722f` (role-flip no longer clobbers a guide's identity) and `fb467235` (public surfaces
serve the display name, not the FIO) must be **live** before the data repair runs. Repairing rows
while the clobbering write is still deployed re-corrupts them.

### G1.2 Repair the clobbered guide names on production
- **Runbook:** `docs/audits/wildberries-2026-07/prod-data-repair-runbook.md` (written and
  **rehearsed against a real Postgres in a rolled-back transaction**, including a deliberate
  false-positive fixture — a guide genuinely named like their email must not be "repaired").
- **What it fixes:** `guide_profiles.display_name` rows overwritten with an email local-part
  (the «officekg» / «nayan.zadvaev.01» cards in msgs 546, 577, 579, 590), and verification state
  lost on a role flip.
- **Never `supabase db push`.** The prod migration ledger is truncated. Apply as targeted SQL +
  a manual ledger entry.
- **Owner:** operator, with a reviewed, separately authorised SQL run.
- `BLOCKED: production data repair requires a reviewed, separately authorized SQL run`

### G1.3 Apply the two new migrations to production
Both are additive and reversible; neither drops a column.

| Migration | What it does | Rollback |
|---|---|---|
| `20260716000000_public_review_author.sql` | Adds `v_public_reviews` — an anon-safe projection of published reviews carrying a sanitised author name (first name + initial). Without it, every public review card reads «Путешественник». | `DROP VIEW public.v_public_reviews;` |
| `20260717000000_public_guide_name_is_display_name.sql` | `v_guide_public_profile.full_name` and `get_public_guide_by_slug.full_name` now resolve `COALESCE(NULLIF(BTRIM(display_name),''), full_name)`. Stops the private legal FIO leaving the DB on a public read. Column names unchanged. | Restore `p.full_name` in both bodies (re-opens the leak). |

Apply as **targeted SQL + ledger repair**, same rule as G1.2. The app tolerates their absence
badly: without `20260716000000` the review blocks throw (the view does not exist), so these
migrations must land **with or before** the app deploy, not after.

### G1.4 Migrate `active` → `published` listing rows
The approved-listing status is unified on `published` (`3bbf2dc3`). Existing prod rows still
carrying `active` are invisible to every public reader until migrated. The guide-calendar reader
was also fixed in the same commit — migrating the rows **without** that deploy would have emptied
every guide's calendar.

---

## G2 — Environment variables

| Variable | Where | Why |
|---|---|---|
| `RESEND_API_KEY` | prod **+ preview + Mac mini** | **Nothing emails without it.** Item 8 is code-complete and does nothing until this exists. Verify it is present on all three, then prove one real send + idempotency on staging (send the same event twice; the second must be a no-op). |
| `FEATURE_PUBLIC_CATALOG=1` | prod **+ preview + Mac mini** | Item 7. With the flag off, the «Готовые экскурсии» nav entry is hidden and `/listings` redirects to `/guides`. Set on **every** environment or the catalog silently differs between preview and prod. Run the content check in `docs/audits/wildberries-2026-07/catalog-preflight.md` **and** G1.4 first — flipping the flag while approved listings still say `active` shows a half-empty catalog. |
| `FEATURE_TR_HELP=1` | prod | Item 9. `/help` sits behind this flag, and the footer link is hidden when it is off. **This is the most likely cause of «не активны кнопки… поддержка»** — the links are correct in code and all resolve locally. Check the flag before hunting for a bug. |

---

## G3 — Production proofs the operator must take (not code)

1. **Item 9, footer:** open the production footer at 1280 and 375 and click all nine links.
   Verified locally; if any is dead, it is env drift (see `FEATURE_TR_HELP`), not code.
2. **Items 3 & 15, latency:** the numbers in TEST_RESULTS.md are from a local server with a
   6-row fixture. The causal fix (admin nav: 8 count queries → 2) is pinned by a test, but a
   production timing is an operator observation.
3. **Item 18, existing phoneless guides:** the bypass is closed for new promotions, and phoneless
   guides are flagged in the admin list and prompted in their cabinet. Guides **already** on prod
   without a phone are a backfill/outreach decision, not a code one.
4. **SHIP_GATE preview:** requires a push. Forbidden by this run's contract; Hermes owns it.

---

## G4 — Follow-ups found this run (not blockers, do not ship blind)

1. **First request after an admin change can be stale (item 3).**
   `/guides/[slug]` carries `export const revalidate = 3600`. The first anonymous request after a
   role/name change can be served the pre-change render once (ISR stale-while-revalidate) before
   the next one is correct; the database is already right at that instant. **This is the mechanism
   behind «Ctrl+F5 — ничего не происходит» / «удалил кэш, в гугле также» (msgs 581–584): the
   staleness is on the SERVER, so no browser-cache clearing can touch it.**
   Deliberately **not** fixed here: the obvious fixes (`force-dynamic`, or `revalidatePath` from
   the admin actions) were both tried, measured, and **reverted** — neither removed the window,
   and one traded it for a permanent per-request DB cost. This needs a decision, not a reflex.
2. **Three dead notification triggers.** `notifyBookingConfirmed`, `notifyBookingCancelled`,
   `notifyReviewRequested` have **zero callers** anywhere in `src/`. Dead notification code reads
   as coverage that does not exist — it is how the item-8 gap survived this long. Wire them or
   delete them.
3. **`FEATURE_TR_NOTIFICATIONS` does not gate email.** It gates the settings page and the bell
   only. Anyone flipping it expecting to turn email on or off will be wrong.
4. **Admin console shows raw email addresses.** `maskEmail()` exists and is used for
   `maskedEmail`, but the list and detail render `user.email ?? user.maskedEmail`, so the mask
   never applies. Admin-only and arguably intended — but the helper's own comment says
   "mask for list/detail display", so code and intent disagree. Decide which is right.
5. **Item 14 wording:** the group asked for «экскурсии **и туры**» on moderation. Tours are a
   `category` of the same `listings` table and share the queue; there is no separate tab. A naming
   decision for the operator.
