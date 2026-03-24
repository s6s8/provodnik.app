# Provodnik — Homepage Polish + Dead Code Purge

> Executor: Codex (orchestrator) — assigns each phase as a separate cursor-agent subtask
> Workspace: D:\dev\projects\provodnik\provodnik.app
> Package manager: bun
> Active components: src/features/homepage/components/homepage-*.tsx (NEW)
> Dead code: src/features/home/components/* (OLD — never render, must be deleted)
>
> SUPERPOWERS: Before delegating to cursor-agent, read
> C:\Users\x\.agents\skills\superpowers\subagent-driven-development\SKILL.md
> and follow its process for delegating and reviewing each subtask.
>
> context7: inject into every cursor-agent call.
> After every cursor-agent call: run bun run build. Fix errors before next subtask.

---

## What renders (source of truth)

src/app/(home)/page.tsx → HomePageShell → these files:
  src/features/homepage/components/homepage-shell.tsx
  src/features/homepage/components/homepage-content.ts   ← all copy/data
  src/features/homepage/components/homepage-navbar.tsx
  src/features/homepage/components/homepage-hero.tsx
  src/features/homepage/components/homepage-gateway.tsx
  src/features/homepage/components/homepage-destinations.tsx
  src/features/homepage/components/homepage-process.tsx
  src/features/homepage/components/homepage-trust.tsx
  src/features/homepage/components/homepage-footer.tsx

## Dead code (never imported by any live route)

src/features/home/components/  ← entire directory, DELETE ALL
src/features/reference/        ← dev reference pages, DELETE ALL
src/features/homepage/components/homepage-shell.tsx plans/ and specs/ subdirs if created

---

## Phase 0 — Delete dead code

Codex runs this directly (no cursor-agent needed):

```bash
rm -rf "D:\dev\projects\provodnik\provodnik.app\src\features\home"
rm -rf "D:\dev\projects\provodnik\provodnik.app\src\features\reference"
cd D:\dev\projects\provodnik\provodnik.app && bun run build
```

If build fails after deletion, check for any remaining imports from the deleted paths and patch them.
Commit: "chore: delete dead home-* components and reference pages"

---

## Phase 1 — Hero image + positioning

cursor-agent subtask:

```
Use context7 MCP — resolve next.js, tailwindcss. Query: Next.js Image component, object-position.

File: src/features/homepage/components/homepage-content.ts

ISSUE: hero.imageUrl is photo-1506905925346-21bda4d32df4 — this renders as a dark dramatic
mountain sunset. The design requires a BRIGHT airy lakeside/hiking scene with morning light.

Fix: Replace hero.imageUrl with a verified Unsplash photo that shows:
- Bright daylight, open sky, no dramatic sunset
- Hikers or natural landscape near water
- Light and airy feel — not moody or dark
Use one of these verified-working IDs (pick the brightest/most open):
  photo-1469474968028-56623f02e42e  (mountain valley, bright sky, sunlit)
  photo-1458668383970-8ddd3927deed  (mountain landscape, very bright)
  photo-1497436072909-60f360e1d4b1  (mountain valley green, morning light)
Format: https://images.unsplash.com/photo-XXXX?auto=format&fit=crop&w=1600&h=900&q=85

File: src/features/homepage/components/homepage-hero.tsx

ISSUE: hero content uses justify-end which puts everything at the bottom. Design shows
content centered vertically in the hero — headline and search bar roughly mid-height.

Fix:
- Change: flex-col items-center justify-end px-5 pb-12
- To:     flex-col items-center justify-center px-5 pb-8 pt-4

ISSUE: object-[center_42%] crops poorly for the new bright photo.
Fix: Change to object-cover object-center (let the image center naturally).

After changes: bun run build — fix any errors.
Commit: "fix: hero image replaced with bright lakeside photo, content centered"
```

---

## Phase 2 — Nav border + step number font

cursor-agent subtask:

```
Use context7 MCP — resolve tailwindcss. Query: Tailwind v4 border color, CSS variable override.

File: src/features/homepage/components/homepage-navbar.tsx

ISSUE: border-b border-white/55 is being overridden by the global CSS variable --color-border:#CBD5E1.
Computed border-bottom renders as rgb(203,213,225) gray instead of white/55.
The nav border reads as a hard gray line instead of a subtle glass edge.

Fix: On the <nav> element:
- Remove border-b and border-white/55 from className
- Add style={{ borderBottom: '1px solid rgba(255,255,255,0.45)' }} directly on the element
- Keep all other classes unchanged

File: src/features/homepage/components/homepage-process.tsx

ISSUE: Step numbers use font-display which maps to Cormorant Garamond (serif).
Design shows step numbers "1.", "2." etc. in bold sans-serif (Inter).

Fix: In the ProcessStep component, change:
  font-display text-[1.65rem] font-bold
to:
  font-sans text-[1.65rem] font-bold

After changes: bun run build — fix any errors.
Commit: "fix: nav border inline style, process step numbers use Inter"
```

---

## Phase 3 — Destinations featured card cleanup

cursor-agent subtask:

```
Use context7 MCP — resolve next.js. Query: Next.js Image fill, TypeScript conditional rendering.

File: src/features/homepage/components/homepage-destinations.tsx

ISSUE: The featured Озеро Байкал card shows a long description paragraph
("Большая вода, утренний свет и маршруты...") inside the card content.
The design shows only: city name + 1-line subtitle + CTA button. Clean, minimal.

Fix: In the DestinationCard component, find the block that renders card.description:
  {card.description ? (
    <p className="mt-2 max-w-[24rem] text-[0.75rem] leading-relaxed text-white/78">
      {card.description}
    </p>
  ) : null}

Remove this block entirely. The description field can stay in homepage-content.ts for
future use but should not render on the card.

ISSUE: Tour count label (e.g. "24 тура") sits at bottom-right of the featured card.
In the design this is not visible on the large featured card. Remove from featured card only.

Fix: In the bottom row of the featured card content, the toursLabel paragraph is always shown.
Conditionally hide it when card.featured is true:
  {!card.featured && (
    <p className="mb-1 shrink-0 self-end text-right text-[0.6875rem] font-medium text-white/88 drop-shadow-sm">
      {card.toursLabel}
    </p>
  )}

After changes: bun run build — fix any errors.
Commit: "fix: featured destination card — remove description text and tour count"
```

---

## Phase 4 — Gateway mini request card status badge

cursor-agent subtask:

```
Use context7 MCP — resolve next.js, tailwindcss.

File: src/features/homepage/components/homepage-content.ts

ISSUE: Mini request card 2 (Алтай) has no status indicator.
Design shows card 2 with a small green checkmark badge in top-right,
indicating the request has been confirmed/matched.

Fix: Add confirmed: true to the second request card data object:
  {
    destination: "Алтай",
    datesLabel: "2-5 августа",
    groupLabel: "3-5 чел.",
    priceLabel: "28-42 тыс. ₽",
    href: "/requests",
    confirmed: true,      ← ADD THIS
    avatars: [...]
  }

Update the HomeMiniRequest type in homepage-content.ts to add: confirmed?: boolean

File: src/features/homepage/components/homepage-gateway.tsx

Fix: In MiniRequestCard, add a confirmed badge alongside the existing badge:
  {card.confirmed ? (
    <span className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
      <CheckCircle2 className="size-3 text-white" strokeWidth={2.5} />
    </span>
  ) : null}

Import CheckCircle2 from lucide-react (already available in the project).
Place this BEFORE the existing badge conditional so both can coexist.

After changes: bun run build — fix any errors.
Commit: "feat: confirmed status badge on gateway mini request card"
```

---

## Phase 5 — Final build verification + git log

Codex runs directly:

```bash
cd D:\dev\projects\provodnik\provodnik.app
bun run build
git log --oneline -8
```

Report: build status, list of commits made, any remaining issues observed.

---

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\\dev\\projects\\provodnik\\PLAN-visual-polish.md fully. Read C:\\Users\\x\\.agents\\skills\\superpowers\\subagent-driven-development\\SKILL.md and follow its delegation process. Execute phases 0 through 5 in order. Phase 0 runs directly (bash commands). Phases 1-4 each become a separate cursor-agent --model auto --yolo -p --workspace D:\\dev\\projects\\provodnik\\provodnik.app call with the exact prompt from the plan. After each cursor-agent call run bun run build and fix any errors before proceeding. Phase 5 is a final build + git log report." 2>&1 &
echo "Codex PID: $!"
```
