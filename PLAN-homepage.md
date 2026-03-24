# Provodnik — Homepage Redesign + Color Palette

> Executor: Codex (orchestrator) + Cursor (code writer)
> Workspace: D:\dev\projects\provodnik\provodnik.app
> Package manager: bun
> Stack: Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react
>
> Source documents — read ALL before starting:
> - D:\dev\projects\provodnik\design\HOMEPAGE-SPEC.md  ← pixel-level spec, primary source
> - D:\dev\projects\provodnik\design\images\01-home-full-202621031513.md  ← original color/style prompt
>
> Execution rules:
> - Codex reads, plans, delegates. Cursor writes all code.
> - Each phase = one Cursor task. Do not combine phases.
> - After each phase: run bun run build. Fix errors before moving on.
> - Do not touch files outside phase scope.

---

## Phase 0 — Apply color palette globally

**What**: Update Tailwind config and globals.css with the full design token palette and import serif font.

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read first:
  D:\dev\projects\provodnik\design\HOMEPAGE-SPEC.md  (section: "Global design tokens")
  D:\dev\projects\provodnik\provodnik.app\tailwind.config.ts
  D:\dev\projects\provodnik\provodnik.app\src\app\globals.css

Task: Apply the full color palette and typography from the spec.

Files to change:

1. src/app/globals.css
   - Add at the top:
     @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
   - Add CSS variables in :root:
     --color-bg: #F9F8F7;
     --color-surface: #F2EDE6;
     --color-primary: #0F766E;
     --color-primary-mid: #14B8A6;
     --color-primary-light: #2DD4BF;
     --color-amber: #D97706;
     --color-amber-mid: #F97316;
     --color-text: #0F172A;
     --color-text-secondary: #475569;
     --color-text-muted: #94A3B8;
     --color-border: #CBD5E1;
     --color-border-light: #E2E8F0;
   - Set body background: var(--color-bg) and font-family: 'Inter', sans-serif

2. tailwind.config.ts
   - Extend theme.colors with the full palette using the hex values from HOMEPAGE-SPEC.md
   - Add fontFamily: { serif: ['Cormorant Garamond', 'serif'], sans: ['Inter', 'sans-serif'] }

Acceptance: bun run build passes with no errors.
```

---

## Phase 1 — Rebuild homepage

**What**: Completely replace the homepage with the design from HOMEPAGE-SPEC.md. Build every section exactly as specified: glassmorphism nav, hero with search, dual gateway cards, destinations grid, how-it-works steps, trust cards, footer.

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read first — read the ENTIRE file carefully before writing any code:
  D:\dev\projects\provodnik\design\HOMEPAGE-SPEC.md

This spec is the pixel-level implementation guide. Follow it exactly:
- All Russian copy must match the spec exactly
- Colors must use the tokens from Phase 0 (--color-primary etc. or Tailwind classes)
- Every section must be built — nav, hero, gateway cards, destinations, how-it-works, trust, footer
- Glassmorphism: use backdrop-blur-xl, bg-white/60, border border-white/50 pattern throughout
- Serif font on hero headline only: font-family Cormorant Garamond
- All other text: Inter

Files to create/modify:

1. src/app/(home)/page.tsx  (or wherever the homepage route renders — check which file serves /)
   - Import and compose all section components
   - Replace all existing content entirely

2. src/features/home/components/home-nav.tsx  (create)
   - Glassmorphism floating nav
   - Logo: compass-style icon + "Provodnik" text
   - 5 nav links in Russian: Направления, Запросы, Гиды, Экскурсии, Профиль
   - "Направления" has active underline in #0F766E

3. src/features/home/components/home-hero.tsx  (create or replace)
   - Background image: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&h=900&q=80
   - Kicker: "Маршруты с локальными проводниками"
   - Headline (serif): "Объединяйтесь. Договаривайтесь. Путешествуйте по России лучше."
   - Glass search bar: placeholder "Куда едем?" + teal pill button "🔍 Найти"
   - Two buttons: "Создать запрос" (teal filled) + "Найти группу" (glass outline)

4. src/features/home/components/home-gateway.tsx  (create)
   - Two frosted glass cards side by side
   - LEFT — "Биржа запросов":
     Title, subtitle, two buttons ("Создать запрос", "Найти группу")
     3 mini request cards: destination "Байкал", 4-6 чел., 35-50 тыс. Р, avatar circles
     Third mini card has amber "Новинка" badge
   - RIGHT — "Готовые предложения":
     Title, subtitle, two buttons ("Смотреть каталог", "По направлениям")
     3 mini listing cards with photos, Камчатка (Новинка) и Алтай (Хит), rating 4.9/5, от 15 000 Р

5. src/features/home/components/home-destinations.tsx  (create)
   - Section title: "Популярные направления"
   - Grid: 1 large card left spanning 2 rows + 4 smaller cards 2x2 right
   - Large: Озеро Байкал — dark overlay, white text, "Смотреть туры" teal button
   - Small cards: Казань (14 туров, Новинка), Калининград (20 туров, Хит), Суздаль (16 туров, Новинка), Мурманск (19 туров, Новинка)
   - Each small card: photo bg, dark gradient overlay, city name white, subtitle muted white, tour count right
   - Amber pill badges top-right on each small card

6. src/features/home/components/home-how-it-works.tsx  (create)
   - Section title: "Как это работает"
   - 5 steps horizontal with arrows between:
     1. Создать запрос (Search icon)
     2. Группа формируется (Users icon)
     3. Гиды предлагают цену (Banknote icon)
     4. Договариваетесь (Handshake icon — use MessageSquare if Handshake not available)
     5. Экскурсия подтверждена (CheckCircle icon)
   - Each: large step number + icon on same line, label below
   - Arrows between steps: ChevronRight, color #CBD5E1

7. src/features/home/components/home-trust.tsx  (create)
   - 3 frosted glass cards in a row
   - Card 1: ShieldCheck icon, "Проверенные гиды", subtitle
   - Card 2: ScrollText icon, "Прозрачные условия", subtitle
   - Card 3: Percent icon, "Комиссия ниже крупных агрегаторов", subtitle
   - Icon in teal circle: bg-teal-50, icon color #0F766E

8. src/features/home/components/home-footer.tsx  (create)
   - 4 columns: О нас (with body text), Помощь (links), Правила (links), social icons
   - Social: VK, Telegram, Instagram — circular bordered buttons
   - Bottom bar: copyright left, two links right

Rules:
- Use next/image for all photos (or img with unoptimized if next/image causes issues)
- All Unsplash URLs: use the exact photo IDs from HOMEPAGE-SPEC.md
- Do NOT use any component that doesn't exist in the codebase — build inline
- Tailwind only for all styling — no inline style except backdrop-filter if needed
- After all files written: run bun run build and fix any errors

Acceptance: bun run build passes. Homepage renders with all 7 sections.
```

---

## Final verification

```bash
cd D:\dev\projects\provodnik\provodnik.app
bun run build
```

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\dev\projects\provodnik\PLAN-homepage.md fully. Read D:\dev\projects\provodnik\design\HOMEPAGE-SPEC.md fully. Execute Phase 0 then Phase 1 in order. For each phase delegate the Cursor task verbatim to: cursor-agent --model auto --yolo -p --workspace D:\dev\projects\provodnik\provodnik.app. After each phase run: cd D:\dev\projects\provodnik\provodnik.app && bun run build. Fix any errors before moving to the next phase. Do not skip phases." 2>&1 &
echo "Codex PID: $!"
```
