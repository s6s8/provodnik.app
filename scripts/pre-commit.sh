#!/bin/sh
# Pre-commit gate: typecheck → lint:ratchet → lint:canon → lint:dead → unit tests
# All must pass. Ratchet/canon/dead allow pre-existing legacy but block regressions.
set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "▸ typecheck"
bun run typecheck

echo "▸ lint:ratchet"
bun run lint:ratchet

echo "▸ lint:canon"
bun run lint:canon

echo "▸ lint:dead"
bun run lint:dead

echo "▸ tests"
bun run test:run

echo "✓ all checks passed"
