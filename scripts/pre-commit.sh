#!/bin/sh
# Pre-commit gate: typecheck → lint:ratchet → unit tests
# All three must pass. lint:ratchet allows pre-existing legacy errors but blocks regressions.
set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "▸ typecheck"
bun run typecheck

echo "▸ lint:ratchet"
bun run lint:ratchet

echo "▸ tests"
bun run test:run

echo "✓ all checks passed"
