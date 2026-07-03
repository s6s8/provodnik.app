-- Rollback for 20260703001100_seed_storage_buckets.sql.
-- The migration is additive/reconciling (it declares bucket rows + publicness). We do
-- NOT drop the buckets on rollback — that would orphan uploaded objects. This rollback
-- is intentionally a no-op placeholder documenting that the bucket rows are retained;
-- to revert a publicness change, set the `public` flag manually to the prior value.

begin;

-- no-op: buckets are data-bearing; do not drop.

commit;
