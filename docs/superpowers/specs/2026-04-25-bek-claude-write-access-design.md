# BEK write access to `.claude/**` — design spec

**Date:** 2026-04-25
**Status:** Approved for implementation
**Related:** ERR-044 (PM2 Windows isMain), ADR-022 (BEK self-healing), Claude CLI 2.1.119 behavior change

## 1. Context

BEK's spawned Claude subprocess (`claude --dangerously-skip-permissions ...`) was blocked when writing `.claude/prompts/out/plan-08.md`. Tool error in the stream log:

```
[tool_end] ERROR Claude requested permissions to edit D:\dev2\projects\provodnik\.claude\prompts...
```

Claude CLI 2.1.119 (released between 2026-04-24 and 2026-04-25) added self-protection for `.claude/**` paths that overrides `--dangerously-skip-permissions`. Plans 05/06/07 (written 2026-04-24 under an earlier CLI) succeeded; plan-08 today did not. Reads, Glob, Grep are not affected — only `Write` and `Edit` tools targeting `.claude/**`.

BEK is now permanent infra in this repo. The blocked paths (`.claude/prompts/out/`, `.claude/bek-sessions/active/`, `.claude/sot/`, etc.) are exactly where BEK is designed to write.

## 2. Decision

Add a `permissions.allow` block to **project-level** `.claude/settings.json` granting `Write` and `Edit` on `.claude/**` for any Claude session in this repo. Wide open — no carve-outs.

```jsonc
{
  "permissions": {
    "allow": [
      "Write(.claude/**)",
      "Edit(.claude/**)",
      "Write(D:/dev2/projects/provodnik/.claude/**)",
      "Edit(D:/dev2/projects/provodnik/.claude/**)"
    ]
  },
  "hooks": { /* unchanged */ }
}
```

Both pattern styles included because Claude CLI's permission matcher compares against the literal tool input, and the inner agent uses absolute paths (e.g. `D:\dev2\projects\provodnik\.claude\prompts\out\plan-08.md`) some of the time and relative paths other times.

## 3. Alternatives rejected

- **Carve out `.claude/bek/**`, `settings*.json`, `*.sh` hooks, `CLAUDE.md`** — would prevent BEK from rewriting its own code, escalating its own permissions, modifying hook scripts, or changing orchestrator rules. User rejected: wants maximum flexibility and accepts the rope.
- **Local-only via `settings.local.json`** — wouldn't survive fresh clones; BEK is now permanent infra so the policy is repo-shared, not per-developer.
- **Move plan files outside `.claude/`** (e.g. to `docs/plans/` or `plans/`) — cleaner long-term separation but requires rewiring BEK's path conventions in 4+ places. Not justified by the immediate need.
- **Bash workaround** (`cat > .claude/...` redirects) — `Bash(*)` is already allow-listed, so this works today, but it forces BEK to choose between Write/Edit semantics (atomic, structured) and Bash (string-templating into shell). Ugly.

## 4. Risks accepted (per "wide open" choice)

- BEK can rewrite `.claude/bek/*.mjs` — its own source code. If BEK breaks itself, recovery is `git checkout` + `pm2 restart`.
- BEK can rewrite `.claude/settings.json` — privilege escalation. If BEK ever invents new tool patterns, it could allow itself anything. Mitigated by: settings.json changes show in `git diff` and the operator commits manually before they take repo-wide effect; changes also surface in `current.log` stream.
- BEK can rewrite `.claude/post-work.sh` and `.claude/post-work-win.sh` — arbitrary command execution at every `Stop` hook. Same mitigation: visible in diff before commit.
- BEK can rewrite `.claude/CLAUDE.md` — changes the orchestrator's (my) operating rules across sessions. Same mitigation.
- BEK can rewrite `.claude/skills/**` and `.claude/commands/**` — affects every Claude session in this repo. Same mitigation.

User explicitly accepts these risks. Trust model: the operator reviews `git diff` before committing anything BEK proposes.

## 5. Verification

After the change is committed:
1. BEK's currently-running daemon does not need a restart — Claude CLI re-reads `settings.json` per spawned subprocess.
2. Tell BEK in Telegram: "Retry writing plan-08."
3. Stream log (`tail -f .claude/logs/bek-stream/current.log`) should show `[tool] Write D:\...\plan-08.md` followed by `[tool_end] OK ...` (not `ERROR`).
4. Confirm files exist: `ls -la .claude/prompts/out/plan-08*.md`.
5. Heartbeat returns to `phase: idle` after BEK reports `STATE: PLAN_READY`.

## 6. SOT companion

- **ERR-045** in `ERRORS.md` — Claude CLI 2.1.119 self-protects `.claude/**` even with `--dangerously-skip-permissions`; symptom + fix recipe.
- **AP-019** in `ANTI_PATTERNS.md` — don't rely on `--dangerously-skip-permissions` alone for `.claude/**` paths; add explicit Write/Edit allow rules.
- **INDEX.md** — one-liner pointers for ERR-045 and AP-019.

## 7. Out of scope

- Audit log of BEK's writes to sensitive paths (settings.json, hooks, own code). Future hardening if/when an incident happens.
- Reverting to a tighter policy (carve-outs) — possible later via a one-line edit to settings.json.
- Migrating plan files out of `.claude/` — future cleanup if convention drift becomes a problem.
