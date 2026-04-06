## Post-Work Protocol (Mandatory — runs automatically via Stop hook)

After every session that touches code:
1. If worktrees have new commits → merge to main (fast-forward only)
2. Push to origin/main (triggers Vercel auto-deploy)
3. Apply any pending DB migrations via Supabase Management API (token in codex-ops)
4. Update Slack dev-notes: follow the full codex-ops workflow (codex-ops/kb/workflows/slack-dev-notes.yaml) — inventory first, blocks format, Russian language, state file read/write. This is done by the orchestrator, NOT by post-work.sh.
5. Update SOT files: METRICS.md, ERRORS.md, DECISIONS.md, NEXT_PLAN.md
6. Send Telegram summary to chat_id 109577644
7. Save session memory with key decisions and patterns

Script: `/mnt/rhhd/projects/provodnik/.claude/post-work.sh`
