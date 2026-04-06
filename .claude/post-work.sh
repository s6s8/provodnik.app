#!/bin/bash
# post-work.sh — Provodnik post-session automation
# Runs automatically via Claude Code Stop hook after every work session.
# Safe: every step is wrapped in error handling; failures are logged, not fatal.

set -euo pipefail

APP_DIR="/mnt/rhhd/projects/provodnik/provodnik.app"
LOG_FILE="/mnt/rhhd/projects/provodnik/.claude/logs/post-work.log"
TG_BOT="290060382:AAGOOSKkAnhnJAQH0jpO4xCwpeYX-su7IvY"
TG_CHAT="109577644"


log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_err() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

log "=== post-work.sh start ==="

# ── Step 1: Check for uncommitted changes ──────────────────────────────────────
log "Step 1: Checking for uncommitted changes..."
if ! git -C "$APP_DIR" diff --quiet || ! git -C "$APP_DIR" diff --cached --quiet; then
  log "Uncommitted changes found — skipping push. Manual commit required."
  log "=== post-work.sh done (skipped — dirty workdir) ==="
  exit 0
fi

# ── Step 2: Push if local main is ahead of origin/main ─────────────────────────
log "Step 2: Checking if ahead of origin/main..."
PUSHED=false
git -C "$APP_DIR" fetch origin main --quiet 2>>"$LOG_FILE" || log_err "fetch failed, continuing"

LOCAL=$(git -C "$APP_DIR" rev-parse HEAD 2>/dev/null)
REMOTE=$(git -C "$APP_DIR" rev-parse origin/main 2>/dev/null)

if [ "$LOCAL" != "$REMOTE" ]; then
  AHEAD=$(git -C "$APP_DIR" rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
  if [ "$AHEAD" -gt 0 ]; then
    log "Local is $AHEAD commit(s) ahead of origin/main — pushing..."
    if git -C "$APP_DIR" push origin main 2>>"$LOG_FILE"; then
      log "Push successful."
      PUSHED=true
    else
      log_err "Push failed. Check git credentials."
    fi
  else
    log "Local is not ahead of origin/main — nothing to push."
  fi
else
  log "Already up to date with origin/main."
fi

# ── Step 3: Build check ────────────────────────────────────────────────────────
log "Step 3: Running build check..."
BUILD_OUTPUT=$(cd "$APP_DIR" && bun run build 2>&1 | tail -5) || true
BUILD_STATUS=$?
log "Build output (last 5 lines):"
echo "$BUILD_OUTPUT" | while IFS= read -r line; do log "  $line"; done
if [ $BUILD_STATUS -eq 0 ]; then
  BUILD_RESULT="passed"
  log "Build: PASSED"
else
  BUILD_RESULT="FAILED"
  log_err "Build: FAILED (exit $BUILD_STATUS)"
fi

# ── Step 4: Telegram push ping (if push happened) ─────────────────────────────
# NOTE: Slack dev-notes are NOT posted here. They require a structured inventory,
# Russian-language blocks format, and state file management per the codex-ops
# workflow (codex-ops/kb/workflows/slack-dev-notes.yaml). The orchestrator
# handles Slack dev-notes manually at the end of each session.
if [ "$PUSHED" = true ]; then
  log "Step 4: Sending Telegram push ping..."
  LAST_COMMIT=$(git -C "$APP_DIR" log --oneline -1 2>/dev/null || echo "unknown")
  BUILD_EMOJI=$([ "$BUILD_RESULT" = "passed" ] && echo "✅" || echo "❌")

  TG_TEXT="*Проводник — push to main*
\`$LAST_COMMIT\`
Build: $BUILD_EMOJI $BUILD_RESULT"
  if curl -s -X POST "https://api.telegram.org/bot${TG_BOT}/sendMessage" \
    -d "chat_id=${TG_CHAT}" \
    -d "parse_mode=Markdown" \
    --data-urlencode "text=${TG_TEXT}" \
    >> "$LOG_FILE" 2>&1; then
    log "Telegram ping sent."
  else
    log_err "Telegram ping failed."
  fi
else
  log "Step 4: No push occurred — skipping Telegram ping."
fi

log "=== post-work.sh done ==="
