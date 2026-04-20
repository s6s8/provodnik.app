#!/bin/sh
# Installs git hooks from scripts/ into .git/hooks/.
# Run automatically via postinstall, or manually: sh scripts/install-hooks.sh
HOOKS_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPTS_DIR="$(git rev-parse --show-toplevel)/scripts"

cp "$SCRIPTS_DIR/pre-commit.sh" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"
echo "git hooks installed"
