# Provodnik — Full Status Entry to Slack

> Executor: Codex only (no Cursor needed)
> Slack channel: C0AMQCN4CDP (#all-provodnik)
> Slack bot token: read from environment SLACK_BOT_TOKEN
> GitHub task repo: s6s8/provodnik.app-Tasks
> GitHub code repo: s6s8/provodnik.app
> Local code path: D:\dev\projects\provodnik\provodnik.app
>
> Rules:
> - Use Slack Web API only via PowerShell Invoke-RestMethod. No browser. No GUI.
> - Do NOT mention any AI tool names, agent names, orchestration tool names, or automation framework names anywhere in the Slack message.
> - Write as if a senior engineering team did this work. No references to how it was done — only what was done.
> - The message should be detailed, professional, and readable by a non-technical stakeholder.
> - Use Slack block kit (blocks array) for formatting.

---

## Phase 0 — Gather all data

**Task**:
```
Read all of the following before writing anything:

1. Git log — full commit history:
   git -C D:\dev\projects\provodnik\provodnik.app log --oneline

2. Git log with details on recent commits:
   git -C D:\dev\projects\provodnik\provodnik.app log --oneline -20 --stat

3. What pages and routes exist:
   ls D:\dev\projects\provodnik\provodnik.app\src\app -Recurse -Filter "page.tsx" | Select-Object FullName

4. What SQL was delivered:
   ls D:\dev\projects\provodnik\provodnik.app\supabase\migrations
   ls D:\dev\projects\provodnik\provodnik.app\supabase\seed

5. GitHub issues — all closed:
   gh issue list --repo s6s8/provodnik.app-Tasks --state closed --limit 50

6. GitHub issues — all open:
   gh issue list --repo s6s8/provodnik.app-Tasks --state open --limit 50

7. Project handoff:
   Get-Content -Raw D:\dev\projects\codex-ops\projects\provodnik\handoff.md

8. Dev notes:
   Get-Content -Raw D:\dev\projects\codex-ops\projects\provodnik\dev-notes.md

Do not act yet. Build a complete picture of everything delivered.
```

---

## Phase 1 — Post comprehensive status to Slack

**Task**:
```
Using everything gathered in Phase 0, post ONE comprehensive message to Slack.

Channel: C0AMQCN4CDP
Token: $env:SLACK_BOT_TOKEN

The message must cover:

SECTION 1 — What was built (pages, features, flows)
  List every major page and feature that exists in the app now.
  Group by user type: public/discovery, traveler flows, guide flows, admin flows.
  Be specific — page names, what each does.

SECTION 2 — Database
  List the migrations applied (what schema was created).
  List the seed data sets (what data is seeded).
  Note that auth users were seeded for all test accounts.

SECTION 3 — Commits and delivery
  State how many commits are in the repo.
  Mention the most recent 5-6 commit messages (clean, readable).
  Note that build is passing (bun run build clean).

SECTION 4 — Images and assets
  Note that all image assets across the site are working.
  New routes were added as part of the image fix pass.

SECTION 5 — What is still pending
  Visual QA (walk through the app in browser)
  GitHub issue tracker reconciliation (#20-#31)
  Color palette update (decision made: teal + amber on warm off-white)

Format using Slack Block Kit. Use sections with mrkdwn. Use dividers between sections.
Use header block for the title.
Use bold for section headings within mrkdwn text.
Write professionally. No tool names, no AI names, no agent references.
Write as if a competent engineering team produced this — because one did.

PowerShell call:

$token = $env:SLACK_BOT_TOKEN
$channel = "C0AMQCN4CDP"

Build the $blocks array in PowerShell, then:

$payload = @{ channel = $channel; text = "Provodnik — full project status 2026-03-21"; blocks = $blocks } | ConvertTo-Json -Depth 20

$response = Invoke-RestMethod -Method Post `
  -Uri "https://slack.com/api/chat.postMessage" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $payload

$response | ConvertTo-Json

Verify response.ok = true. Report the ts and channel.

Acceptance: response.ok = true.
```

---

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\dev\projects\provodnik\PLAN-slack-status.md fully. Execute Phase 0 then Phase 1 in order. Do not skip phases. Use Slack Web API via PowerShell only — no browser. SLACK_BOT_TOKEN is set in the environment. Report the Slack API response when done." 2>&1 &
echo "Codex PID: $!"
```
