# Provodnik — Visual QA and Fix Pass

> Executor: Codex (orchestrator) + Playwright MCP (inspection) + Cursor (fixes)
> Workspace: D:\dev\projects\provodnik\provodnik.app
> Package manager: bun
> Dev server: must be running at http://localhost:3000 before Phase 0
>
> Source of truth for how it SHOULD look:
> - D:\dev\projects\provodnik\design\HOMEPAGE-SPEC.md
> - D:\dev\projects\provodnik\design\images\01-home-full-202621031513.jpeg
>
> Execution rules:
> - Use Playwright MCP browser tools to inspect the live page — do NOT guess at issues
> - Take screenshots and compare against spec
> - Produce an explicit numbered issue list before touching any code
> - Cursor fixes all code — Codex does not write code directly
> - Inject context7 into every Cursor call to get accurate Tailwind v4 + Next.js 16 docs
> - After fixes: rebuild and re-screenshot to verify
> - After each Cursor call: run bun run build

---

## Phase 0 — Start dev server and screenshot

**Task**:
```
Step 1 — ensure dev server is running:
  Start-Process -NoNewWindow -FilePath "bun" -ArgumentList "dev" -WorkingDirectory "D:\dev\projects\provodnik\provodnik.app"
  Start-Sleep -Seconds 8

Step 2 — use Playwright MCP browser tools to open and screenshot the homepage:
  Navigate to: http://localhost:3000
  Wait for page to fully load (wait for network idle)
  Take a full-page screenshot
  Take a second screenshot of just the top 900px (hero + nav area)
  Take a third screenshot of the gateway cards section
  Take a fourth screenshot of the destinations section
  Take a fifth screenshot of the how-it-works + trust + footer sections

Step 3 — use browser DOM inspection to read:
  - Computed font-family on the hero headline element
  - Computed font-family on nav links
  - Computed background-color on the page body
  - Computed color on primary buttons
  - Nav bar: check if backdrop-filter blur is applied
  - Check if Cormorant Garamond is actually loading (check network requests for font)

Step 4 — list every visual discrepancy found between the live page and HOMEPAGE-SPEC.md.
  Be specific: "nav background is opaque white instead of frosted glass"
  "hero headline font is Inter not Cormorant Garamond"
  "teal button color is wrong hex"
  "avatar circles are missing"
  etc.

Produce a numbered list of ALL issues found. Save it to:
  D:\dev\projects\provodnik\VISUAL-ISSUES.md

Acceptance: VISUAL-ISSUES.md exists with a numbered list of issues.
```

---

## Phase 1 — Fix all issues via Cursor with context7

**Task**:
```
Read D:\dev\projects\provodnik\VISUAL-ISSUES.md — this is your fix list.
Read D:\dev\projects\provodnik\design\HOMEPAGE-SPEC.md — this is the target state.

Delegate ALL fixes to Cursor in a single comprehensive task.

Call Cursor with context7 injected at the top of the prompt:

cursor-agent --model auto --yolo -p --workspace D:\dev\projects\provodnik\provodnik.app "

Use context7 MCP to look up accurate documentation before making any changes:
- Resolve library IDs for: tailwindcss, next.js, next/font/google
- Query docs for: Tailwind v4 CSS-first theming, backdrop-filter, next/font Google integration, CSS @layer, CSS variables in Tailwind v4

Then fix every issue from the list below:

[INSERT FULL CONTENTS OF VISUAL-ISSUES.md HERE]

Reference spec: D:\dev\projects\provodnik\design\HOMEPAGE-SPEC.md

Key things to verify and fix:

FONTS:
- Hero headline MUST use Cormorant Garamond serif font. In Next.js 15/16 with next/font/google, import Cormorant_Garamond from next/font/google in layout.tsx, add CSS variable, apply to headline element with font-serif class or inline style. Do NOT use @import in globals.css for fonts in Next.js — use next/font/google only.
- Body and UI text MUST use Inter via next/font/google the same way.
- Nav links: Inter medium 15px, #475569
- Section headings: Inter semibold 28px, #0F172A

GLASSMORPHISM NAV:
- backdrop-filter: blur(16px) — in Tailwind v4 use backdrop-blur-xl class
- background: rgba(255,255,255,0.6) — use bg-white/60
- border-bottom: 1px solid rgba(255,255,255,0.5) — use border-b border-white/50
- Nav must be position: fixed top-0 with z-50, full width

COLORS:
- Page background: #F9F8F7 — set on <body> and <main> with bg-[#F9F8F7]
- Primary teal buttons: bg-[#0F766E] text-white
- Secondary/outline buttons: bg-white/70 backdrop-blur border border-[#CBD5E1] text-[#0F172A]
- Amber badges: bg-[#D97706] text-white rounded-full text-[10px] px-2 py-0.5
- Text primary: text-[#0F172A]
- Text secondary: text-[#475569]
- Text muted: text-[#94A3B8]

HERO:
- Background image should be full width, height 520px min
- Overlay must be LIGHT not dark — rgba(255,255,255,0.15) gradient, keep image bright
- Search bar: frosted glass pill shape, full rounded
- CTA buttons below search bar centered

GATEWAY CARDS:
- Both cards must be frosted glass: bg-white/75 backdrop-blur-xl border border-white/60 rounded-[28px]
- Mini request cards inside: show avatar circles (3 overlapping circles, 18px each, use img with rounded-full)
- Avatar circles: use real Unsplash portrait photos cropped to circle

DESTINATIONS GRID:
- Layout: CSS grid, left large card spans 2 rows, right 2x2 grid of small cards
- All cards have dark gradient overlay at bottom
- Amber pill badges top-right on small cards
- Tour count number right-aligned in bottom of each small card

HOW IT WORKS:
- 5 steps in a flex row with arrows between
- Step numbers are large (text-3xl font-bold) with icon inline
- Arrows between steps: use ChevronRight from lucide-react, text-[#CBD5E1]

TRUST CARDS:
- Glass effect same as gateway cards
- Icon wrapped in circle: w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center
- Icon color: text-[#0F766E]

FOOTER:
- Background: same #F9F8F7, border-top border-[#E2E8F0]
- Social icon buttons: w-9 h-9 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center

After all fixes: run bun run build. Fix any TypeScript or import errors before stopping.
"

Acceptance: bun run build passes with no errors.
```

---

## Phase 2 — Re-screenshot and verify

**Task**:
```
Use Playwright MCP browser tools:
  - Hard reload http://localhost:3000 (Ctrl+Shift+R or navigate again)
  - Wait for load
  - Take full page screenshot
  - Take screenshot of nav + hero
  - Take screenshot of gateway cards
  - Verify: Cormorant Garamond loading in network tab
  - Verify: body background is warm off-white not white or dark
  - Verify: nav has frosted glass appearance (translucent, not solid)
  - Verify: buttons are teal #0F766E

Report what still looks wrong (if anything). Do NOT fix in this phase — just report.

Acceptance: screenshot taken, visual state reported.
```

---

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\dev\projects\provodnik\PLAN-visual-fix.md fully. Execute phases 0, 1, 2 in order. In Phase 0 use Playwright MCP browser tools to inspect http://localhost:3000 — navigate, screenshot, inspect DOM. In Phase 1 call cursor-agent with context7 MCP injected into the prompt exactly as specified. After Phase 1 run bun run build in D:\dev\projects\provodnik\provodnik.app and fix any errors. In Phase 2 re-screenshot and report remaining issues." 2>&1 &
echo "Codex PID: $!"
```
