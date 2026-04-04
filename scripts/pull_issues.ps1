# Pull open issues from s6s8/provodnik.app-Tasks and update scripts/open-issues.json and scripts/open-issues.md
# Planning source of truth: IMPLEMENTATION.md
# Run from repo root: ./scripts/pull_issues.ps1

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$repo = "s6s8/provodnik.app-Tasks"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Local mapping: issue number -> phase, branch, worktree (not stored in GitHub)
$issueMeta = @{
  2  = @{ phase = 0; branch = "impl/issue-2-arch"; worktree = "provodnik-data" }
  3  = @{ phase = 1; branch = "impl/issue-3-dark-public-shell"; worktree = "impl-foundation" }
  4  = @{ phase = 1; branch = "impl/issue-4-shared-components"; worktree = "impl-foundation" }
  5  = @{ phase = 1; branch = "impl/issue-5-dark-protected-shell"; worktree = "impl-foundation" }
  6  = @{ phase = 2; branch = "impl/issue-6-requests-page"; worktree = "impl-foundation" }
  7  = @{ phase = 2; branch = "impl/issue-7-request-detail"; worktree = "impl-foundation" }
  8  = @{ phase = 2; branch = "impl/issue-8-create-request"; worktree = "impl-foundation" }
  9  = @{ phase = 2; branch = "impl/issue-9-destination-page"; worktree = "impl-foundation" }
  10 = @{ phase = 2; branch = "impl/issue-10-homepage-ctas"; worktree = "impl-foundation" }
  11 = @{ phase = 3; branch = "impl/issue-11-listings-redesign"; worktree = "impl-foundation" }
  12 = @{ phase = 3; branch = "impl/issue-12-guide-trust-auth"; worktree = "impl-foundation" }
  13 = @{ phase = 4; branch = "impl/issue-13-traveler-dashboard"; worktree = "impl-traveler" }
  14 = @{ phase = 4; branch = "impl/issue-14-traveler-workspace"; worktree = "impl-traveler" }
  15 = @{ phase = 5; branch = "impl/issue-15-guide-dashboard"; worktree = "impl-guide" }
  16 = @{ phase = 5; branch = "impl/issue-16-guide-workspace"; worktree = "impl-guide" }
  17 = @{ phase = 7; branch = "impl/issue-17-integration-polish"; worktree = "impl-foundation" }
  18 = @{ phase = 6; branch = "impl/issue-18-admin-alignment"; worktree = "impl-admin" }
}

$raw = gh issue list --repo $repo --state open --limit 50 --json number,title,state,url 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "gh issue list failed: $raw"
  exit 1
}

$list = $raw | ConvertFrom-Json
$out = @()
foreach ($i in $list) {
  $m = $issueMeta[$i.number]
  $phase = if ($m) { $m.phase } else { -1 }
  $branch = if ($m) { $m.branch } else { "" }
  $wt = if ($m) { $m.worktree } else { "" }
  $out += @{
    number = $i.number
    title = $i.title
    state = $i.state
    url = $i.url
    phase = $phase
    branch = $branch
    worktree = $wt
  }
}

# Sort by issue number
$out = $out | Sort-Object { $_.number }

$jsonPath = Join-Path $scriptDir "open-issues.json"
# Ensure array format; -Compress for single-line entries
$json = $out | ConvertTo-Json -Depth 5 -Compress
if ($out.Count -eq 1) { $json = "[$json]" }
Set-Content -Path $jsonPath -Value $json -Encoding UTF8 -NoNewline
Add-Content -Path $jsonPath -Value "`n" -Encoding UTF8
Write-Host "Wrote $jsonPath ($($out.Count) open issues)"

# Regenerate open-issues.md (only the "All open issues" table and JSON reference)
$mdPath = Join-Path $scriptDir "open-issues.md"
$header = @"
# Open implementation issues (pulled from s6s8/provodnik.app-Tasks)

Refreshed by: ``./scripts/pull_issues.ps1``

Planning source of truth: ``IMPLEMENTATION.md``

This file is only a cached issue view. If issue ordering or wording drifts from ``IMPLEMENTATION.md``, fix the issue records and regenerate this file.

## By worktree (for simultaneous work)

Use these worktrees to work on multiple issues in parallel (each in its own Cursor window or terminal):

| Worktree path | Branch | Issue |
|---------------|--------|--------|
| ``D:\dev\projects\provodnik\worktrees\provodnik-data`` | ``impl/issue-2-arch`` | #2 Phase 0 Architecture |
| ``D:\dev\projects\provodnik\worktrees\impl-foundation`` | ``impl/issue-3-dark-public-shell`` | #3 Phase 1 Dark public shell |
| ``D:\dev\projects\provodnik\worktrees\impl-traveler`` | ``impl/issue-13-traveler-dashboard`` | #13 Phase 4 Traveler dashboard |
| ``D:\dev\projects\provodnik\worktrees\impl-guide`` | ``impl/issue-15-guide-dashboard`` | #15 Phase 5 Guide dashboard |
| ``D:\dev\projects\provodnik\worktrees\impl-admin`` | ``impl/issue-18-admin-alignment`` | #18 Phase 6 Admin |

**Other branches (switch in same worktree when done with current issue):**  
Foundation: ``git checkout impl/issue-4-shared-components`` ... ``impl/issue-17-integration-polish``. Traveler: ``impl/issue-14-traveler-workspace``. Guide: ``impl/issue-16-guide-workspace``.

## All open issues (by phase)

| # | Phase | Title |
|---|-------|--------|
"@

$rows = foreach ($o in $out) {
  "| $($o.number) | $($o.phase) | $($o.title) |"
}
$rowsBlock = "`n" + ($rows -join "`n")
$footer = @"

## Running worktrees in parallel

1. Open one Cursor window (or terminal) per worktree:
   - ``D:\dev\projects\provodnik\worktrees\provodnik-data`` → Issue #2
   - ``D:\dev\projects\provodnik\worktrees\impl-foundation`` → Issue #3
   - ``D:\dev\projects\provodnik\worktrees\impl-traveler`` → Issue #13
   - ``D:\dev\projects\provodnik\worktrees\impl-guide`` → Issue #15
   - ``D:\dev\projects\provodnik\worktrees\impl-admin`` → Issue #18

2. To switch to another issue in the same worktree (e.g. in impl-foundation do #4 next):
   ``git checkout impl/issue-4-shared-components``

3. Run dev: from **main repo** ``bun dev``; or from inside a worktree run ``bun install`` once then ``bun dev``.

4. Validate before PR: ``bun run lint``, ``bun run typecheck`` in the worktree; after merge run ``bun run build`` on main.

## Full agent TODO

See ``scripts/AGENT_TODO.md`` for the full checklist, dependency order, and quick commands.

## Cursor workflow

See ``scripts/CURSOR_WORKTREE_WORKFLOW.md`` for split-worktree Cursor execution commands.
"@

$header + $rowsBlock + $footer | Set-Content -Path $mdPath -Encoding UTF8
Write-Host "Wrote $mdPath"
