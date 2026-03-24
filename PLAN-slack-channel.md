# Provodnik — Create dev-notes channel and move updates

> Executor: Codex only
> Slack workspace: T0AN5P8EYDN (provodnik.slack.com)
> Main channel: C0AMQCN4CDP (#all-provodnik)
> Bot token: $env:SLACK_BOT_TOKEN
>
> Rules:
> - Slack Web API only via PowerShell. No browser.
> - Do not mention tool names or AI names in any Slack content.

---

## Phase 0 — Create #provodnik-dev-notes channel

**Task**:
```
Create a new public channel named "provodnik-dev-notes".

$token = $env:SLACK_BOT_TOKEN

$response = Invoke-RestMethod -Method Post `
  -Uri "https://slack.com/api/conversations.create" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body (@{ name = "provodnik-dev-notes"; is_private = $false } | ConvertTo-Json)

$response | ConvertTo-Json

If response.ok = false and error = "name_taken", the channel already exists — fetch its ID with:
  Invoke-RestMethod -Method Post `
    -Uri "https://slack.com/api/conversations.list" `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body (@{ limit = 200 } | ConvertTo-Json) | Select-Object -ExpandProperty channels |
    Where-Object { $_.name -eq "provodnik-dev-notes" } | Select-Object id, name

Record the new channel ID for use in Phase 1.

Acceptance: have a valid channel ID for provodnik-dev-notes.
```

---

## Phase 1 — List all bot messages in #all-provodnik

**Task**:
```
Fetch the message history of #all-provodnik (C0AMQCN4CDP) and collect all messages
posted by this bot (bot_id = B0AM67P9L0K).

$token = $env:SLACK_BOT_TOKEN

$history = Invoke-RestMethod -Method Post `
  -Uri "https://slack.com/api/conversations.history" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body (@{ channel = "C0AMQCN4CDP"; limit = 200 } | ConvertTo-Json)

$botMessages = $history.messages | Where-Object { $_.bot_id -eq "B0AM67P9L0K" }
$botMessages | ForEach-Object { Write-Output "ts=$($_.ts) text=$($_.text.Substring(0, [Math]::Min(80,$_.text.Length)))" }

Record each message ts value. These are the messages to move.

Acceptance: have a list of ts values for all bot messages in #all-provodnik.
```

---

## Phase 2 — Repost each message to #provodnik-dev-notes

**Task**:
```
For each bot message collected in Phase 1, post its full content to #provodnik-dev-notes.

For messages that have a blocks array: repost using the same blocks.
For plain text messages: repost as text.

$token = $env:SLACK_BOT_TOKEN
$devNotesChannel = "<channel ID from Phase 0>"

For each message:
  If it has blocks:
    Invoke-RestMethod -Method Post `
      -Uri "https://slack.com/api/chat.postMessage" `
      -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
      -Body (@{ channel = $devNotesChannel; blocks = $msg.blocks; text = $msg.text } | ConvertTo-Json -Depth 20)
  Else:
    Invoke-RestMethod -Method Post `
      -Uri "https://slack.com/api/chat.postMessage" `
      -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
      -Body (@{ channel = $devNotesChannel; text = $msg.text } | ConvertTo-Json)

Verify each post returns ok = true before continuing.

Acceptance: all messages reposted to #provodnik-dev-notes.
```

---

## Phase 3 — Delete original bot messages from #all-provodnik

**Task**:
```
For each ts value from Phase 1, delete the message from #all-provodnik.

$token = $env:SLACK_BOT_TOKEN

For each ts:
  $del = Invoke-RestMethod -Method Post `
    -Uri "https://slack.com/api/chat.delete" `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body (@{ channel = "C0AMQCN4CDP"; ts = $ts } | ConvertTo-Json)

  $del | ConvertTo-Json

  If ok = false: log the error and continue — do not stop on a single failure.

Acceptance: all bot messages removed from #all-provodnik.
```

---

## Phase 4 — Update slack.yaml in codex-ops

**Task**:
```
Update D:\dev\projects\codex-ops\projects\provodnik\slack.yaml to record the new channel.

Add under current_references.channels:
  - name: provodnik-dev-notes
    id: <channel ID from Phase 0>
    purpose: implementation updates, issue links, checks, blockers

Then commit and push:
  cd D:\dev\projects\codex-ops
  git add projects/provodnik/slack.yaml
  git commit -m "add provodnik-dev-notes channel to slack.yaml"
  git push origin master

Acceptance: git push succeeds.
```

---

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\dev\projects\provodnik\PLAN-slack-channel.md fully. Execute phases 0 through 4 in order. Use Slack Web API via PowerShell only — no browser. SLACK_BOT_TOKEN is set in the environment. Report results after each phase." 2>&1 &
echo "Codex PID: $!"
```
