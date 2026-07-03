# RISK_NOTES — risks reduced / deferred / blocked

Tracks the `RISK_REGISTER.md` (R-01 … R-14) items against execution.

## Reduced / closed

- **R-01 (no refactor safety net).** Reduced: the pgTAP RLS suite (~100+ assertions) and
  the unit suite now run as CI gates (`db-tests` + `quality` jobs incl. `test:run` +
  `lint:ratchet`); E2E is de-rotted (no green-by-construction) with a role-fixture setup
  project. Residual: DB + browser E2E live green is an operator step (shared stack).
- **R-02 (data-layer drift).** Reduced: warn-level boundary rule + ratchet block new
  `.from(`/`.rpc(` in `src/data`/`src/components` (CI-gated, proven to bite); mislocated I/O
  went 8 modules → 2, boundary warnings 79 → 21 (floor locked).
- **R-03 (traveler_requests PII).** Closed by the launch fix + verified; this branch added
  non-owner booking-read assertions.
- **R-07 (business_leads anon insert).** Closed: shape-constrained policy + pgTAP.
- **R-08 (storage bucket drift).** Closed: buckets + public flags seeded in a migration +
  pgTAP. Both migrations rolled-back-validated against the live baseline schema.
- **R-09 (SECURITY DEFINER surface).** Test coverage already present; not touched.

## Deferred — feasible but gated (evidence + next action in PROGRESS.md)

- **R-04 (admin authz app-layer-only)** → additive `is_admin()` read policies are latent
  (service-role bypasses RLS); correctness needs the admin E2E net. Non-admin denial
  already test-proven.
- **R-05 (client-side table writes: guide-assets / guide-templates)** → ADAPTER-REWRITE to
  server-action + presigned; changes the client call contract, needs browser E2E parity. A
  cosmetic relocate would mask the debt, so left flagged by the boundary rule.
- **R-06 (unauth /api/requests/parse)** → guest-facing homepage parser; signed-token fix
  changes the form contract and needs live guest-flow verification. Kept rate-limit +
  budget caps meanwhile.
- **R-10 (ActionResult migration)** → contract pinned (Phase 0); per-feature migration
  needs form E2E (high caller fan-out).
- **R-12 (god components)** → decomposition needs the 1280/375 visual net.

## Not a code blocker (sandbox-only)

- Live pgTAP + browser E2E execution — wired for CI/operator; see `VERIFY.md`.
