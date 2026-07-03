# RISK_NOTES — risks reduced / deferred / blocked

Tracks the `RISK_REGISTER.md` (R-01 … R-14) items against execution.

## Reduced

- **R-01 (no refactor safety net).** Reduced: the pgTAP RLS suite (~96+ assertions) and
  the unit suite (1132 tests) now run as CI gates (`db-tests` + `quality` jobs); E2E is
  de-rotted (no green-by-construction) with a role-fixture setup project. Residual: DB +
  browser E2E live green is an operator step (sandbox can't run them — shared stack).

## Deferred (later phases)

- **R-02 (data-layer drift)** → Phase 1 lint gate + Phase 2 per-domain moves.
- **R-03 (traveler_requests PII)** → largely closed by the launch fix
  (`v_public_open_requests` + tightened `traveler_requests_select`); Phase 3 verifies +
  extends.
- **R-04 (admin authz app-layer-only)** → Phase 3 admin RLS read-backstop.
- **R-05 (client-side table writes)** → Phase 2 adapter-rewrite (guide-templates/assets).
- **R-06 / R-07 / R-08 (unauth endpoint / anon insert / storage buckets)** → Phase 3.
- **R-10 (ActionResult migration)** → Phase 4 (contract tests pinned in Phase 0).
- **R-11 / R-12 (terminology / god components)** → Phase 5.

## Blocked in-sandbox (documented, not a code blocker)

- Live pgTAP + browser E2E execution — see `VERIFY.md`. Wired for CI/operator.
</content>
