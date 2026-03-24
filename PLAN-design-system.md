# Provodnik — Homepage Design System Consistency Fix

> Executor: Codex (orchestrator) → cursor-agent (code writer)
> Workspace: D:\dev\projects\provodnik\provodnik.app
> Package manager: bun
>
> Before writing any code or calling Cursor, read the relevant superpowers skill:
> - Executing a plan → C:\Users\x\.agents\skills\superpowers\subagent-driven-development\SKILL.md
> Read it and follow its process exactly.
>
> context7: inject into every cursor-agent call (resolve tailwindcss, next.js)
> After every cursor-agent call: run bun run build. Fix errors before next subtask.

---

## Problem

The homepage has no unified button or text system. Every component invented its own sizing,
padding, shadow, and font-weight. The result is visual inconsistency the user notices:
buttons feel different across sections, text colors are arbitrary, badges are defined multiple ways.

## Target design system (define once, apply everywhere)

### Button system — 2 sizes × 2 variants

**Size md** (used in hero CTA row):
  h-10, px-6, text-[0.875rem], font-semibold, rounded-full

**Size sm** (used in section headers, search bar):
  h-9, px-5, text-[0.8125rem], font-semibold, rounded-full

**Variant primary** (both sizes):
  bg-[var(--color-primary)] text-white
  shadow-[0_8px_24px_rgba(15,118,110,0.28)]
  hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(15,118,110,0.32)]
  transition-[transform,box-shadow] duration-200

**Variant secondary** (both sizes):
  border border-[rgba(203,213,225,0.92)] bg-[rgba(255,255,255,0.62)]
  text-[var(--color-text)] backdrop-blur-md
  shadow-[0_4px_14px_rgba(15,23,42,0.06)]
  hover:-translate-y-px
  transition-[transform,box-shadow] duration-200

### Badge system — single pattern, color via prop

All badges: inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide shadow-sm

Badge colors (use these exact rgba values — no CSS variable shorthand for amber since it isn't defined in theme):
  amber/orange: bg-[rgba(217,119,6,0.92)] text-white
  teal/new:     bg-[var(--color-primary)] text-white (if used as teal badge)

### Text scale (section bodies, captions — NOT headings)
  Section subtitle/description: text-[0.8125rem] text-[var(--color-text-secondary)] leading-relaxed
  Card label/caption:           text-[0.6875rem] text-[var(--color-text-secondary)]
  Card name (primary):          text-[0.9375rem] font-semibold text-[var(--color-text)]
  Nav links:                    text-[0.9375rem] font-medium text-[var(--color-text-secondary)]

---

## Files to touch

1. src/features/homepage/components/homepage-hero.tsx
2. src/features/homepage/components/homepage-gateway.tsx
3. src/features/homepage/components/homepage-destinations.tsx
4. src/features/homepage/components/homepage-footer.tsx

---

## Phase 1 — Audit + fix buttons and badges

cursor-agent prompt:

```
Use context7 MCP — resolve tailwindcss, next.js.

Read ALL four files completely before changing anything:
  src/features/homepage/components/homepage-hero.tsx
  src/features/homepage/components/homepage-gateway.tsx
  src/features/homepage/components/homepage-destinations.tsx
  src/features/homepage/components/homepage-footer.tsx

Then apply the design system defined below. Change only what is needed
to reach consistency — do not restructure components or add new abstraction layers.

━━━ BUTTON SYSTEM ━━━

Two sizes:
  md → h-10 px-6 text-[0.875rem] font-semibold rounded-full
  sm → h-9  px-5 text-[0.8125rem] font-semibold rounded-full

Two variants (apply to BOTH sizes):
  primary   → bg-[var(--color-primary)] text-white shadow-[0_8px_24px_rgba(15,118,110,0.28)] hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(15,118,110,0.32)] transition-[transform,box-shadow] duration-200
  secondary → border border-[rgba(203,213,225,0.92)] bg-[rgba(255,255,255,0.62)] text-[var(--color-text)] backdrop-blur-md shadow-[0_4px_14px_rgba(15,23,42,0.06)] hover:-translate-y-px transition-[transform,box-shadow] duration-200

Mapping:
  homepage-hero.tsx  — hero CTA "Создать запрос" / "Найти группу":  size md
  homepage-hero.tsx  — search bar "Найти" button:                    size sm, primary only
  homepage-gateway.tsx — GatewayAction:                              size sm
  homepage-destinations.tsx — "Смотреть туры" featured card button:  size sm, primary only

━━━ BADGE SYSTEM ━━━

All badge spans/divs must use:
  inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide shadow-sm

Colors:
  amber/orange badges (Новинка, Хит, НОВИНКА): bg-[rgba(217,119,6,0.92)] text-white
  — replace any existing amber/orange badge background with this exact value

In homepage-gateway.tsx: the MiniTourCard badge currently uses bg-[rgba(217,119,6,0.92)] — keep it.
  The MiniRequestCard "Группа" badge uses a different color — keep that unchanged.
  The "Новинка" badge on MiniRequestCard (Калмыкия) — if it uses bg-[var(--color-amber)],
  change to bg-[rgba(217,119,6,0.92)] text-white.

━━━ FOOTER TEXT FIX ━━━

In homepage-footer.tsx, the "О нас" body text (platform description):
  "Платформа для путешествий по России с локальными проводниками и открытыми группами."
  This text must be text-[var(--color-text-secondary)] — NOT inheriting link/teal color.
  Find these <p> elements and explicitly set text-[var(--color-text-secondary)].

Also: footer section headings (О нас, Помощь, Правила) should be
  text-[0.8125rem] font-semibold text-[var(--color-text)] — verify and fix if different.

Footer nav links (Как это работает, Безопасность и доверие, etc.) should be
  text-[0.8125rem] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors
  — they should NOT be teal. Remove any text-[var(--color-primary)] from footer links.

━━━ DO NOT TOUCH ━━━
  - Homepage hero image, overlays, headline, kicker
  - Nav bar styles
  - Destination card photo gradients
  - Process section
  - Trust section icons/colors
  - Any section heading (h2, h3) font sizes or weights
  - Any layout, spacing, or structural classes

After all changes: bun run build — fix any errors.
Commit: "fix: homepage design system — unified buttons, badges, footer text colors"
```

---

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\\dev\\projects\\provodnik\\PLAN-design-system.md fully. Read C:\\Users\\x\\.agents\\skills\\superpowers\\subagent-driven-development\\SKILL.md and follow its delegation process. Execute Phase 1: call cursor-agent --model auto --yolo -p --workspace D:\\dev\\projects\\provodnik\\provodnik.app with the exact prompt from the plan. After cursor-agent finishes run bun run build and fix any errors. Then git push origin main." 2>&1 &
echo "Codex PID: $!"
```
