#!/usr/bin/env bash
#
# Deterministic pgTAP runner for the RLS/authorization safety net.
#
# Why this exists instead of `supabase test db`:
#   `supabase test db` runs `pg_prove` INSIDE the database container, so it only
#   sees test files that the container has mounted. On some hosts (e.g. colima with
#   a project checked out under /private/tmp) that mount is absent and the command
#   silently reports `Files=0 … Result: NOTESTS` and exits 0 — a vacuous green.
#
# This runner instead reads each test file on the host and pipes it over stdin into
# `psql` in the running supabase_db container, then parses the raw TAP output. It
# FAILS (non-zero exit) on: any `not ok`, any SQL ERROR, a pgTAP "Looks like you
# failed/planned" diagnostic, a plan/ok-count mismatch, or zero discovered files.
#
# Prereq: a migrated local stack is already running (`supabase db start`).
# Usage:   bash scripts/run-pgtap.sh [tests_dir]
set -uo pipefail

TESTS_DIR="${1:-supabase/tests}"

DB=$(docker ps --format '{{.Names}}' | grep -E '^supabase_db_' | head -1)
if [ -z "${DB}" ]; then
  echo "ERROR: no running supabase_db container found (run 'supabase db start' first)" >&2
  exit 1
fi

# pgTAP is created by each test file too, but declare it up front so a missing
# extension surfaces as an explicit error rather than a per-file failure.
docker exec -i "${DB}" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "create extension if not exists pgtap with schema extensions;" >/dev/null 2>&1 || {
    echo "ERROR: could not ensure pgtap extension" >&2; exit 1; }

shopt -s nullglob
files=("${TESTS_DIR}"/*.sql)
if [ "${#files[@]}" -eq 0 ]; then
  echo "ERROR: no pgTAP files found in ${TESTS_DIR}" >&2
  exit 1
fi

overall_fail=0
pass_files=0
total_assertions=0

for f in "${files[@]}"; do
  name=$(basename "$f")
  # -A unaligned + -t tuples-only => pgTAP emits raw TAP (`ok`/`not ok` at line start).
  out=$(docker exec -i "${DB}" psql -U postgres -d postgres -X -q -A -t -v ON_ERROR_STOP=0 < "$f" 2>&1)

  ok_count=$(printf '%s\n' "$out" | grep -cE '^ok [0-9]')
  notok_count=$(printf '%s\n' "$out" | grep -cE '^not ok [0-9]')
  plan_line=$(printf '%s\n' "$out" | grep -oE '^1\.\.[0-9]+' | head -1)
  planned=${plan_line#1..}

  reason=""
  if printf '%s\n' "$out" | grep -qE '(^|[[:space:]])ERROR:'; then
    reason="SQL ERROR: $(printf '%s\n' "$out" | grep -E '(^|[[:space:]])ERROR:' | head -1 | cut -c1-140)"
  elif [ "$notok_count" -gt 0 ]; then
    reason="${notok_count} failing assertion(s)"
  elif printf '%s\n' "$out" | grep -qiE 'Looks like you (failed|planned)'; then
    reason="$(printf '%s\n' "$out" | grep -iE 'Looks like you (failed|planned)' | head -1)"
  elif [ -z "${planned}" ]; then
    reason="no plan line emitted (test did not run)"
  elif [ "$ok_count" -eq 0 ]; then
    reason="zero passing assertions"
  elif [ "$ok_count" -ne "$planned" ]; then
    reason="planned ${planned} but only ${ok_count} ok"
  fi

  if [ -n "$reason" ]; then
    echo "FAIL  ${name}  [ok=${ok_count} notok=${notok_count} planned=${planned:-?}]  -> ${reason}"
    printf '%s\n' "$out" | grep -E '^(not ok|# )' | head -20
    overall_fail=1
  else
    echo "ok    ${name}  [${ok_count}/${planned} assertions]"
    pass_files=$((pass_files + 1))
    total_assertions=$((total_assertions + ok_count))
  fi
done

echo "-----------------------------------------"
echo "pgTAP: ${pass_files}/${#files[@]} files passed, ${total_assertions} assertions ok"
if [ "$overall_fail" -ne 0 ]; then
  echo "PGTAP_RESULT=FAIL"
  exit 1
fi
echo "PGTAP_RESULT=PASS"
