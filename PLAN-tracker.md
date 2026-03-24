# Provodnik — Tracker Hygiene + Slack Canvas Cleanup

> Executor: Codex (orchestrator) + gh CLI + Slack API
> Workspace: D:\dev\projects\provodnik\provodnik.app
> GitHub task repo: https://github.com/s6s8/provodnik.app-Tasks
> Slack channel: C0AMQCN4CDP (#all-provodnik)
> Slack canvas — status/plan: F0AMV791C2D
>
> Source documents — read before starting:
> - D:\dev\projects\codex-ops\projects\provodnik\dev-notes.md
> - D:\dev\projects\codex-ops\projects\provodnik\handoff.md
>
> Execution rules:
> - Do not write or edit any source code files.
> - Use gh CLI for all GitHub operations.
> - Use Slack Web API (curl) for all Slack operations.
> - Each phase = one discrete task. Do not combine phases.
> - Report what was done at the end of each phase.

---

## Phase 0 — Read implementation state

**What**: Understand what was built so you can accurately close GitHub issues.

**Task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read the git log to understand what was implemented:
  git -C D:\dev\projects\provodnik\provodnik.app log --oneline

Read the directory structure to confirm what pages and components exist:
  ls D:\dev\projects\provodnik\provodnik.app\src\app
  ls D:\dev\projects\provodnik\provodnik.app\src\components
  ls D:\dev\projects\provodnik\provodnik.app\supabase\migrations
  ls D:\dev\projects\provodnik\provodnik.app\supabase\seed

Also read:
  D:\dev\projects\codex-ops\projects\provodnik\dev-notes.md
  D:\dev\projects\codex-ops\projects\provodnik\handoff.md

Do not act yet — just build a clear picture of what is complete.

Acceptance: you can state what each of issues #20–#31 maps to and whether it was delivered.
```

---

## Phase 1 — Reconcile GitHub issues #20–#31

**What**: Close or update every issue in the rollout queue to reflect actual implementation state.

**Task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

List all open issues in provodnik.app-Tasks:
  gh issue list --repo s6s8/provodnik.app-Tasks --limit 50 --state open

For each issue #20 through #31:
1. Read the issue body: gh issue view <N> --repo s6s8/provodnik.app-Tasks
2. Determine if the work was delivered in the Codex run (41 commits, all phases complete as of 2026-03-20).
3. If delivered:
   - Comment with a short factual note: what was implemented, which commits or files cover it, checks passed (bun run build clean).
   - Close the issue: gh issue close <N> --repo s6s8/provodnik.app-Tasks --comment "<same note>"
4. If partially delivered or blocked:
   - Comment with what is done and what remains.
   - Leave open. Add label "needs-qa" if appropriate.
5. If already closed: skip.

Do not invent or fabricate commit references — only cite what is in the git log.
Do not use vague comments like "done" — be specific about what file or flow covers the issue.

Acceptance: gh issue list --repo s6s8/provodnik.app-Tasks --state open returns only genuinely open/unresolved issues.
```

---

## Phase 2 — Update Slack canvas to remove tool references

**What**: Edit the "PROVODNIK: status i plan" canvas to remove any mention of internal tooling. The canvas should read as a clean project status document — no tool names, no internal orchestration detail.

**Task**:
```
Canvas file_id: F0AMV791C2D
Slack channel: C0AMQCN4CDP
Slack bot token: read from environment variable SLACK_BOT_TOKEN

Step 1 — check if bot token is available:
  echo $SLACK_BOT_TOKEN
  If empty: skip this phase, log "SLACK_BOT_TOKEN not set — canvas update deferred".

Step 2 — fetch the current canvas content:
  curl -s -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    "https://slack.com/api/files.info?file=F0AMV791C2D" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('file',{}).get('plain_text',''))"

Step 3 — identify any references to internal tooling (Paperclip, Codex internals, agent names, DEV- issue IDs, orchestration mechanics). The canvas is a board/stakeholder document — it should only contain:
  - what the product is
  - current implementation status
  - what is next (user-facing milestones)
  - links to GitHub repos and relevant docs

Step 4 — rewrite the canvas content removing those references. Replace any "implemented via [tooling]" with "implemented". Replace any orchestration detail with a simple status line.

Step 5 — update the canvas via Slack API:
  Use files.getUploadURLExternal + files.completeUploadExternal OR
  canvases.sections.update if the canvas API is available.
  Prefer the simplest working API call. If canvas update API is unavailable, post a clean replacement message to #all-provodnik (C0AMQCN4CDP) and note that the canvas needs manual update.

Acceptance: the canvas (or pinned message) contains no mention of Paperclip, Codex, Cursor, DEV- IDs, or agent names.
```

---

## Final verification

```bash
# Confirm GitHub state
gh issue list --repo s6s8/provodnik.app-Tasks --state open

# Confirm closed issues
gh issue list --repo s6s8/provodnik.app-Tasks --state closed --limit 20
```

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\dev\projects\provodnik\PLAN-tracker.md fully. Execute it phase by phase starting from Phase 0. Do not skip phases. Do not combine phases. Report phase completion and any blockers." 2>&1 &

echo "Codex PID: $!"
```
