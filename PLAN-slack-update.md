# Provodnik — Post today's update to Slack

> Executor: Codex only (no Cursor needed — API call only)
> Slack channel: C0AMQCN4CDP (#all-provodnik)
> Slack bot token: $env:SLACK_BOT_TOKEN
> Credentials reference: D:\dev\projects\codex-ops\kb\slack.yaml
>
> Rules:
> - Use Slack Web API only. Do NOT use a browser or any browser automation tool.
> - Use curl or PowerShell Invoke-RestMethod against https://slack.com/api/chat.postMessage
> - Do not open any GUI.

---

## Phase 0 — Post update message to #all-provodnik

**What**: Post a clean project update message covering today's work.

**Task**:
```
Step 1 — check token:
  echo $env:SLACK_BOT_TOKEN
  If empty or not set: stop and report "SLACK_BOT_TOKEN not available in shell".

Step 2 — post message to Slack Web API using PowerShell:

$token = $env:SLACK_BOT_TOKEN
$channel = "C0AMQCN4CDP"

$body = @{
  channel = $channel
  text = "*Provodnik — update 2026-03-21*"
  blocks = @(
    @{
      type = "header"
      text = @{ type = "plain_text"; text = "Provodnik — update 2026-03-21" }
    },
    @{
      type = "section"
      text = @{
        type = "mrkdwn"
        text = "*SQL applied to Supabase*`nAll 4 migrations and 4 seed files applied. Auth users seeded for all guide and traveler accounts."
      }
    },
    @{
      type = "section"
      text = @{
        type = "mrkdwn"
        text = "*Images fixed*`nAll broken image URLs replaced across the site. Build passes clean."
      }
    },
    @{
      type = "section"
      text = @{
        type = "mrkdwn"
        text = "*New pages added*`n`/destinations/[slug]`, `/requests`, `/requests/new`, `/guide/[id]` and supporting components added."
      }
    },
    @{
      type = "section"
      text = @{
        type = "mrkdwn"
        text = "*Next*`nVisual QA — run `bun dev` and walk through all pages. GitHub tracker reconciliation pending."
      }
    }
  )
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Method Post `
  -Uri "https://slack.com/api/chat.postMessage" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body

$response | ConvertTo-Json

Step 3 — verify response:
  Check that $response.ok is true.
  If false: report the error field from the response.

Acceptance: response.ok = true, message visible in #all-provodnik.
```

---

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\dev\projects\provodnik\PLAN-slack-update.md fully. Execute Phase 0 exactly as written. Use the Slack Web API via PowerShell — do NOT use a browser. Report the API response when done." 2>&1 &
echo "Codex PID: $!"
```
