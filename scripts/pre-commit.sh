#!/bin/sh
# Pre-commit gate: typecheck → lint → unit tests
# All three must pass. Warnings are allowed; errors block.
set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "▸ typecheck"
bun run typecheck

echo "▸ lint"
bun run lint

echo "▸ tests"
bun run test:run

echo "✓ all checks passed"
