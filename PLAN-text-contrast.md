# Provodnik — Text Contrast Fix

> Executor: Codex (orchestrator) → cursor-agent (code writer)
> Workspace: D:\dev\projects\provodnik\provodnik.app
> Package manager: bun
>
> SUPERPOWERS: read C:\Users\x\.agents\skills\superpowers\subagent-driven-development\SKILL.md
>
> After cursor-agent: run bun run build. Fix errors before stopping.
> Commit: "fix: text contrast — white hero headline, stronger gradients, drop-shadow safety net"

---

## Files to change

1. src/features/homepage/components/homepage-hero.tsx
2. src/features/homepage/components/homepage-destinations.tsx

---

## cursor-agent prompt

```
Use context7 MCP — resolve tailwindcss, next.js.

Fix text visibility across the homepage. Two files to touch.

━━━ FILE 1: src/features/homepage/components/homepage-hero.tsx ━━━

PROBLEM: Hero headline uses dark text (#0F172A) on a photo background.
Dark text on any photo is fragile — fails as soon as the image crop is
anything other than pure white/bright.

FIX 1 — Switch h1 to white:
Find the h1 element. Change:
  text-[var(--color-text)]
to:
  text-white drop-shadow-[0_2px_12px_rgba(15,23,42,0.35)]

FIX 2 — Switch kicker to white/soft:
Find the kicker <p> element. Change:
  text-[rgba(71,85,105,0.92)]
to:
  text-white/80 drop-shadow-[0_1px_4px_rgba(15,23,42,0.25)]

FIX 3 — Strengthen the radial gradient behind the text area:
Find this class on a pointer-events-none div:
  bg-[radial-gradient(ellipse_90%_55%_at_50%_0%,rgba(255,255,255,0.5),transparent_58%)]
Change it to a soft DARK radial at the bottom where text sits:
  bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(15,23,42,0.28),transparent_70%)]
This darkens just the lower area where the headline and search bar sit,
guaranteeing white text is always readable.

━━━ FILE 2: src/features/homepage/components/homepage-destinations.tsx ━━━

PROBLEM: Small destination cards use white text over a gradient overlay.
The gradient ends at rgba(15,23,42,0.55) which is not dark enough for
lighter-toned photos (Суздаль, Казань).

FIX 1 — Strengthen the secondary card gradient:
Find the gradient applied to non-featured cards:
  bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.55)_100%)]
Change to:
  bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.72)_100%)]

FIX 2 — Add drop-shadow to card text:
Find where card name and subtitle render for non-featured cards:
  className that includes font-semibold leading-tight text-white
Add drop-shadow-sm to both the name and subtitle text elements.

FIX 3 — Featured Baikal card gradient also needs strengthening:
Find the featured card gradient:
  bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,transparent_42%,rgba(15,23,42,0.78)_100%)]
Change the final stop to 0.88:
  bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,transparent_42%,rgba(15,23,42,0.88)_100%)]

After all changes: bun run build. Fix any errors.
Commit: "fix: text contrast — white hero headline, stronger gradients, drop-shadow safety net"
```

---

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\\dev\\projects\\provodnik\\PLAN-text-contrast.md. Call cursor-agent --model auto --yolo -p --workspace D:\\dev\\projects\\provodnik\\provodnik.app with the exact prompt from the plan. After cursor-agent finishes run bun run build. Fix any errors. Then git push origin main." 2>&1 &
echo "Codex PID: $!"
```
