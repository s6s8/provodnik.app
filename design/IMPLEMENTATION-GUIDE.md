# Provodnik — Design Implementation Guide

> For the coder AI. This document is the single source of truth for rebuilding all
> public-facing and workspace pages with a unified dark-theme design system.
> Follow this document top-to-bottom. Do not deviate from it unless explicitly told to.
>
> **Companion doc**: `design/STAKEHOLDER-FEEDBACK.md` — detailed analysis of
> stakeholder comments that drove the homepage dual-entry architecture, price
> scenario cards, itinerary travel segments, and other product requirements
> incorporated below.
>
> **Design system**: `design-system/provodnik/MASTER.md` — machine-readable
> global design rules (colors, spacing, typography, interaction states, checklists).
> Check this before building any page. Page-specific overrides go in
> `design-system/provodnik/pages/[page-name].md`.

---

## 0. Context & Scope

### What this is

A **demand-first** travel marketplace where travelers create requests, form groups,
and local guides bid on them. Alongside the exchange (биржа), the platform also
hosts a traditional catalog of existing tour offers — two equal entry points.
Russian-language product ("Provodnik" = проводник = guide).

The core paradigm: **the human request is at the center**, entrepreneurs compete
with price and service. This is catalog-second, demand-first — a fundamental
shift from aggregators like Tripster and Sputnik8.

### What exists today

The app has 32 route files under `src/app/`. A public marketing shell (light theme)
and protected workspace pages already render. The homepage uses a dark theme via
an isolated layout. The `(site)` pages use a light theme. The `(reference)` folder
contains two earlier homepage experiments (page2, page3) — treat these as archived;
do not delete them but do not reference their style.

### What needs to happen

Rebuild the 8 core pages to a **single cohesive dark theme** with glassmorphism,
cinematic travel photography, and consistent card patterns. Every page should feel
like it belongs to one premium product. No custom CSS classes beyond what is
already in `globals.css`. Use only Tailwind utilities + shadcn/ui primitives.

### Key constraints

- Tailwind CSS v4 (config is in `globals.css` via `@theme inline`, no tailwind.config file)
- shadcn/ui with `radix-nova` style (see `components.json`)
- Package manager: `bun`
- Framework: Next.js 16 App Router, React 19, TypeScript
- Fonts: Manrope (sans), Cormorant (display/headings), Geist Mono
- Module boundary rule: features use `@/components/ui` and `@/components/shared`
  but never import across feature folders
- All copy in Russian

---

## 1. Design Philosophy

### Principles (in priority order)

1. **Dark, cinematic, premium** — Background #0f0f0f, not generic dark-gray.
   Think Apple product page meets Airbnb experience page.
2. **Glassmorphism is structural, not decorative** — Glass panels (`backdrop-blur` +
   semi-transparent bg) are used for navigation, cards, and overlays. Never for
   random decoration.
3. **Dense but breathable** — Cards fill the grid generously but always have
   consistent spacing. Prefer 3-column grid on desktop, 1-column on mobile.
4. **Photography-forward** — Travel photos are large and cinematic. Gradients overlay
   photos to ensure text readability. Never use placeholder boxes — always use
   Unsplash URLs from the existing seed data.
5. **Rounded everything** — Buttons: `rounded-full`. Cards: `rounded-[1.5rem]` to
   `rounded-[2rem]`. Inputs: `rounded-full` or `rounded-[1.2rem]`.
6. **Systematic spacing** — Section gaps: `gap-16` on mobile, `gap-20` on md,
   `gap-24` on lg. Card internal padding: `p-5 sm:p-6`.

### What to avoid

- Light backgrounds anywhere (even cards — use semi-transparent dark glass)
- Custom CSS keyframes, custom properties not in globals.css, or inline `style` attributes
- Generic placeholder content — always use the seeded data
- Overlapping or clipping elements (the design images have these as artifacts
  from image generation; ignore them)
- Walls of identical cards with no visual hierarchy — vary card sizes or
  use a featured/hero card in the first position
- Complex hover animations beyond translate/scale/opacity — never animate
  width, height, or margin
- Missing focus-visible rings on interactive elements — keyboard users must
  be able to see what's focused

### Spacing system

Follow the **8px base grid**. Tailwind's spacing scale maps to this naturally:
`1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `5` = 20px, `6` = 24px, etc.

| Context                         | Spacing                             |
|---------------------------------|-------------------------------------|
| Between sections on a page       | `gap-16` (64px) → `md:gap-20` (80px) → `lg:gap-24` (96px) |
| Between cards in a grid          | `gap-4` (16px) → `md:gap-5` (20px)  |
| Card internal padding            | `p-5` (20px) → `sm:p-6` (24px)     |
| Between content blocks in a card | `space-y-4` (16px)                  |
| Between a kicker and its heading | `space-y-2` (8px) or `space-y-3` (12px) |
| Between a heading and body text  | `mt-2` (8px)                        |
| Between badges/pills in a row   | `gap-2` (8px)                       |

Whitespace is a design tool: more space between sections = more importance.
Less space within a card = tighter grouping. Never collapse spacing to "fit
more" — let the grid scroll.

### Interaction feedback

Every interactive element needs clear visual feedback across **four states**:

| State    | Treatment                                                      |
|----------|----------------------------------------------------------------|
| Default  | Base styling + `cursor-pointer` on all clickable elements      |
| Hover    | Subtle lift or glow: `hover:-translate-y-0.5 hover:shadow-lg` or `hover:bg-white/10` |
| Focus    | Visible ring: `focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none` |
| Active   | Slight press: `active:translate-y-px active:scale-[0.98]`     |

For **photo overlay cards**, hover zooms the image (`group-hover:scale-[1.03]`)
and deepens the gradient overlay. Use `transition-all duration-300` everywhere.

For **loading states**, use the shadcn `Skeleton` component with
`bg-white/8 animate-pulse rounded-[1.5rem]` to match card shapes.

For **empty states** (no results, no requests yet), show a glass card with:
- Icon (muted, `size-10 text-white/20`)
- Short message (h3 size)
- Single CTA button

### Motion guidelines

- **Duration**: 200–300ms for micro-interactions (hover, focus, button press).
  300–500ms for layout transitions (tab switch, card enter).
- **Easing**: Use Tailwind defaults (`ease-in-out`). For enter animations,
  `ease-out` feels snappier.
- **What to animate**: opacity, transform (translate/scale), background-color,
  box-shadow. Never animate layout properties (`width`, `height`, `margin`).
- **Restraint**: If you can't tell why something is animated, remove it.
  Motion should guide attention, not entertain.
- Use `transition-all duration-300` as the standard base on interactive elements.
- For staggered card entrances (optional): framer-motion `staggerChildren: 0.05`.
- **Reduced motion**: Respect `prefers-reduced-motion: reduce`. Wrap transforms
  and opacity animations in `@media (prefers-reduced-motion: no-preference)` or
  use Tailwind's `motion-safe:` prefix: `motion-safe:hover:-translate-y-0.5`.
- **No infinite decorative animation**: `animate-spin`, `animate-bounce` etc.
  are only for loading indicators, never for decorative icons or badges.

### Accessibility on dark backgrounds

Dark themes are easy to get wrong on contrast. Follow these minimums:

| Element               | Minimum ratio | How to achieve                  |
|-----------------------|---------------|---------------------------------|
| Body text on bg       | 4.5:1 (AA)    | `text-white/90` on `#0f0f0f` ≈ 14:1 (safe) |
| Muted text on bg      | 4.5:1 (AA)    | `text-white/50` on `#0f0f0f` ≈ 7:1 (safe) |
| Text on glass card    | 4.5:1 (AA)    | `text-white/80` on `bg-white/6` ≈ 6:1 (safe if bg is dark) |
| Text on photo overlay | 4.5:1 (AA)    | Gradient `from-black/80` must extend far enough under text |
| Interactive focus ring | 3:1 (AA)      | `ring-primary/50` on dark bg (blue on near-black = fine) |
| Buttons               | 4.5:1 (AA)    | White text on `bg-primary` (blue) must be checked |

**Rule of thumb**: if text is on a photo, the gradient overlay beneath it must
be `from-black/75` or darker. If text looks dim on screen, bump from `/50` to `/60`.

Focus rings (`focus-visible:ring-2`) must be visible on every interactive
element — buttons, links, inputs, toggles. This is non-negotiable.

### Layout patterns

**Standard card grid** — Default for most content sections:
`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5`

**Featured + grid** — When one item should draw the eye (homepage destinations,
top request). First card spans full width or 2 columns; rest fill the grid:
```
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="md:col-span-2 lg:col-span-2">
    {/* Featured card — taller, bigger photo */}
  </div>
  {/* Remaining standard cards */}
</div>
```

**Bento grid** — For dashboard-style sections with mixed content types
(stats + charts + activity feed). Use varying `col-span` and `row-span`:
```
<div className="grid grid-cols-4 gap-4">
  <div className="col-span-2 row-span-2">{/* Large stat */}</div>
  <div className="col-span-1">{/* Small card */}</div>
  <div className="col-span-1">{/* Small card */}</div>
  <div className="col-span-2">{/* Wide card */}</div>
</div>
```
Use this sparingly — only for dashboards and the homepage gateway section.

**Split layout** — For detail pages (request detail, listing detail):
main content takes 2/3, sidebar takes 1/3:
`grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8`

**Stacked sections** — For full-width page flow (homepage, about):
`flex flex-col gap-16 md:gap-20 lg:gap-24`

---

## 2. Color System — Dark Theme

### What to change in `globals.css`

Replace the current `:root` light palette with a dark palette. The `@theme inline`
block maps CSS variables to Tailwind tokens — this mechanism stays the same.

```
:root {
  --background: oklch(0.09 0.005 260);          /* #0f0f0f — near-black */
  --foreground: oklch(0.95 0.01 90);             /* off-white text */
  --card: oklch(0.13 0.005 260 / 80%);           /* glass card bg, semi-transparent */
  --card-foreground: oklch(0.93 0.01 90);
  --popover: oklch(0.14 0.005 260 / 90%);
  --popover-foreground: oklch(0.93 0.01 90);
  --primary: oklch(0.65 0.15 250);               /* vibrant blue — #3B82F6 range */
  --primary-foreground: oklch(0.98 0.005 90);     /* white text on primary */
  --secondary: oklch(0.18 0.008 260);             /* slightly lighter dark */
  --secondary-foreground: oklch(0.88 0.01 90);
  --muted: oklch(0.16 0.005 260);
  --muted-foreground: oklch(0.6 0.01 260);        /* dimmed text */
  --accent: oklch(0.75 0.12 55);                  /* warm gold accent */
  --accent-foreground: oklch(0.12 0.005 260);
  --destructive: oklch(0.6 0.2 28);
  --border: oklch(0.22 0.005 260);                /* subtle dark borders */
  --input: oklch(0.14 0.005 260 / 90%);
  --ring: oklch(0.6 0.12 250);
  --radius: 1.6rem;
}
```

### Utility class updates in `globals.css`

```css
body {
  min-height: 100vh;
  color: var(--foreground);
  font-family: var(--font-manrope), sans-serif;
  background: #0f0f0f;
}

/* Remove the body::before radial gradient orbs (they were for light theme) */
/* body::before { ... } — DELETE this block */

.app-shell {
  position: relative;
  overflow: clip;
}

/* Remove .app-shell::after gradient overlay (light theme artifact) */
/* .app-shell::after { ... } — DELETE this block */

.glass-panel {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
/* Glassmorphism verification:
   ☐ backdrop-filter blur 10–24px applied
   ☐ Translucent bg at 6–15% white opacity
   ☐ Subtle border (border-white/8 to border-white/12)
   ☐ Text contrast ≥ 4.5:1 on glass surface
   ☐ No solid white background
   See design-system/provodnik/MASTER.md for full spec */

.section-frame {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.editorial-kicker {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}
```

### Semantic color usage guide

| Token             | Use for                                | Dark-theme value       |
|-------------------|----------------------------------------|------------------------|
| `bg-background`   | Page background                        | `#0f0f0f`              |
| `text-foreground`  | Primary text                           | off-white              |
| `text-muted-foreground` | Secondary/help text               | `rgba(255,255,255,0.5)` |
| `bg-card`         | Card backgrounds (glass)               | `rgba(255,255,255,0.06)` with backdrop-blur |
| `border-border`   | Subtle borders                         | `rgba(255,255,255,0.08)` |
| `border-white/10` | Glass card borders                     | white at 10% opacity   |
| `border-white/15` | Slightly more visible glass borders    | white at 15% opacity   |
| `bg-white/5`      | Very subtle glass fill                 | use for hover states   |
| `bg-white/8`      | Default glass card fill                | main card bg           |
| `bg-white/10`     | Elevated glass fill                    | nav bar, filter bar    |
| `bg-primary`      | CTA buttons                            | vibrant blue           |

---

## 3. Typography

### Font stack

Already configured in `src/app/layout.tsx` and `globals.css`:

- **Manrope** (`--font-manrope`) — body text, navigation, badges, labels
- **Cormorant** (`--font-cormorant`) — h1, h2, h3, display headings via
  `font-family: var(--font-display)` or heading elements (auto-applied in globals.css)
- **Geist Mono** — code/technical (rarely used)

### Heading hierarchy

| Level  | Size / Weight / Tracking                                  | Usage                                  |
|--------|-----------------------------------------------------------|----------------------------------------|
| h1     | `text-4xl sm:text-5xl font-semibold tracking-tight`       | Page hero headline                     |
| h2     | `text-2xl sm:text-3xl font-semibold tracking-tight`       | Section title                          |
| h3     | `text-xl font-semibold tracking-tight`                    | Card/subsection title                  |
| kicker | `.editorial-kicker` or equivalent Tailwind classes         | Above headline: `text-xs font-bold uppercase tracking-[0.24em] text-white/50` |
| body   | `text-sm sm:text-base leading-7 text-muted-foreground`    | Descriptions, card text                |
| label  | `text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground` | Filter labels, meta info |

---

## 4. Component Patterns

### 4a. Glass Navigation Bar

Used for the top sticky header. Consistent on EVERY page.

```
<header className="sticky top-0 z-50 border-b border-white/10 bg-white/8 backdrop-blur-xl">
```

Structure:
- Logo (Compass icon + "Provodnik" text)
- Center: glass search pill (on desktop) → links to `/listings`
- Nav links: pill-shaped ghost buttons with `text-white/70 hover:text-white hover:bg-white/10 rounded-full`
- Right: CTA button (primary), "Войти" button
- Mobile: hamburger menu

Nav items: `Создать запрос` (primary CTA), `Направления` → `/destinations`,
`Запросы` → `/requests`, `Экскурсии` → `/listings`, `Гидам` → `/guide`,
`Войти` → `/auth`

The "Создать запрос" CTA is the first visible action in the nav — consistent
with the stakeholder-directed priority: create request > find group > browse.

### 4b. Glass Filter Bar

Used on marketplace/discovery pages below the nav.

```
<div className="glass-panel rounded-[1.5rem] border border-white/10 p-4">
```

Contains filter buttons (pill-shaped, `rounded-full`). Active filter uses
`bg-primary text-white`, inactive uses `bg-white/8 text-white/70 border border-white/10`.

### 4c. Travel Card — Photo Overlay

Used for listings, requests, destinations. The signature card of the product.

```
<article className="group relative overflow-hidden rounded-[1.5rem] bg-black">
  <!-- Full-bleed Image -->
  <Image ... fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
  <!-- Gradient overlay for text readability -->
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
  <!-- Content pinned to bottom -->
  <div className="absolute inset-x-0 bottom-0 p-5">
    <!-- Guide avatar, title, rating, price -->
  </div>
</article>
```

Aspect ratios: use min-height (`min-h-[280px]`, `min-h-[360px]`, `min-h-[420px]`)
rather than aspect-ratio to avoid layout shifts with fill images.

### 4d. Glass Info Card

Used for non-photo structured content (request details, forms, offer cards).

```
<div className="glass-panel rounded-[1.5rem] border border-white/10 p-5 sm:p-6">
```

Or use the existing shadcn `Card` component — it already applies `glass-panel`:
```tsx
<Card className="border-white/10">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### 4e. Info Pill

Small metadata chips used inside cards and detail pages.

```
<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm text-white/80">
  <Icon className="size-4" />
  Label text
</span>
```

### 4f. Progress Indicator (group formation)

```
<div className="h-2 rounded-full bg-white/10">
  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
</div>
```

### 4g. Participant Avatars (stacked)

```
<div className="flex -space-x-2">
  {members.map(m => (
    <div key={m.id} className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-white/15 text-xs font-bold text-white">
      {initials}
    </div>
  ))}
</div>
```

### 4h. Button usage

Use the existing shadcn `Button` component. It already renders `rounded-full`.

| Context                   | Variant     | Size     |
|---------------------------|-------------|----------|
| Primary CTA               | `default`   | `lg`     |
| Secondary action           | `outline`   | `default`|
| Filter pill (inactive)     | `outline`   | `sm`     |
| Filter pill (active)       | `default`   | `sm`     |
| Ghost nav link             | `ghost`     | `default`|
| Icon-only                  | `ghost`     | `icon`   |

Override colors for the dark theme as needed with classes:
`border-white/10 bg-white/8 text-white/80 hover:bg-white/12`

### 4i. Badge usage

Use the existing shadcn `Badge` component.

| Context                   | Variant      | Extra classes            |
|---------------------------|--------------|--------------------------|
| Status (open, forming)     | `default`    | —                        |
| Category/theme tags        | `secondary`  | `rounded-full`           |
| Meta info                  | `outline`    | `rounded-full border-white/10 bg-white/5 text-white/70` |

---

## 5. Shared Layout Components

### 5a. `SiteHeader` — REWRITE

Path: `src/components/shared/site-header.tsx`

New nav structure:

```
| Logo | --- Center Search Pill (desktop) --- | Nav Links | CTA + Auth |
```

Nav links: `Направления` → `/destinations`, `Запросы` → `/requests`,
`Экскурсии` → `/listings`, `Гидам` → `/guide`

Styling:
- `sticky top-0 z-50`
- `border-b border-white/10`
- `bg-[rgba(15,15,15,0.7)] backdrop-blur-xl`
- Max-width container: `max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8`
- All buttons: `rounded-full`
- Search pill: `rounded-full border border-white/10 bg-white/8 backdrop-blur-md`

### 5b. `SiteFooter` — REWRITE

Path: `src/components/shared/site-footer.tsx`

Dark footer: `bg-[#0a0a0a] border-t border-white/8`

Keep the same two-column layout and links. Update text colors to
`text-white/50` for body, `text-white/80` for titles.

### 5c. Layouts

**Root layout** (`src/app/layout.tsx`): Keep as-is but verify fonts include Manrope.
The `<body>` gets its dark background from the updated `globals.css`.

**`(home)` layout**: SIMPLIFY to just pass children. Background comes from globals.
```tsx
export default function HomeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

**`(site)` layout**: REWRITE to dark theme.
```tsx
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
```

**`(protected)` layout**: REWRITE to dark theme. Remove light background.
```tsx
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const auth = await readAuthContextFromServer();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <WorkspaceRoleNav auth={auth} />
      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
```

---

## 6. Page-by-Page Specifications

---

### PAGE 1: Homepage `/`

**Route**: `src/app/(home)/page.tsx`
**Feature screen**: `src/features/homepage/components/homepage-shell.tsx` — REWRITE

**Design ref**: `design/images/01-home.md`, `design/LAYOUT.md` slide 1–2,
`design/STAKEHOLDER-FEEDBACK.md` change 1

> **CRITICAL**: The homepage uses a **dual-entry architecture**. The exchange
> (биржа) and the traditional catalog are presented as two equal entry points.
> This is a stakeholder requirement — do not collapse into a single-path flow.

#### Layout

```
┌──────────────────────────────────────────────────┐
│ Glass nav bar (SiteHeader)                        │
├──────────────────────────────────────────────────┤
│ HERO SECTION (compact, min-h-[50vh])              │
│  Cinematic photo background with gradient         │
│  Centered:                                        │
│    Kicker: "Маршруты с локальными проводниками"   │
│    H1: "Объединяйтесь. Договаривайтесь.          │
│         Путешествуйте дешевле."                   │
│    Search bar (rounded-full, glass)               │
├──────────────────────────────────────────────────┤
│ DUAL GATEWAY (two equal columns)                  │
│ ┌────────────────────────┬─────────────────────┐ │
│ │ LEFT: БИРЖА            │ RIGHT: ГОТОВЫЕ ТУРЫ │ │
│ │                        │                     │ │
│ │ Glass card, large      │ Glass card, large   │ │
│ │                        │                     │ │
│ │ Icon + H2: "Биржа      │ Icon + H2: "Готовые │ │
│ │ запросов"              │ предложения"        │ │
│ │                        │                     │ │
│ │ "Объединяйтесь в       │ "Выбирайте из       │ │
│ │  группы и               │  действующих        │ │
│ │  договаривайтесь        │  предложений гидов  │ │
│ │  о цене с гидами"       │  и турагенств"      │ │
│ │                        │                     │ │
│ │ CTA1: Создать запрос   │ CTA1: Смотреть      │ │
│ │       (primary)        │       каталог        │ │
│ │ CTA2: Найти группу     │ CTA2: По            │ │
│ │       (outline)        │       направлениям   │ │
│ │                        │                     │ │
│ │ Mini-grid: 2-3 open    │ Mini-grid: 2-3      │ │
│ │ request preview cards  │ featured listing     │ │
│ │                        │ cards               │ │
│ └────────────────────────┴─────────────────────┘ │
├──────────────────────────────────────────────────┤
│ HOW IT WORKS (5-step horizontal flow)             │
│ 1. Создать запрос → 2. Группа формируется →      │
│ 3. Гиды предлагают цену → 4. Договариваетесь →  │
│ 5. Экскурсия подтверждена                        │
├──────────────────────────────────────────────────┤
│ POPULAR DESTINATIONS (dense card grid)            │
│ Kicker + H2: "Популярные направления"             │
│ Grid of DestinationCards (photo overlay)          │
├──────────────────────────────────────────────────┤
│ SiteFooter                                        │
└──────────────────────────────────────────────────┘
```

#### Hero section

- Full-width `min-h-[50vh]` with `<Image>` fill from seed listing cover
- Gradient: `bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent`
- Nav overlaid on hero (absolute positioning) or sticky glass nav above hero
- Headline: Cormorant font, `text-4xl sm:text-5xl lg:text-6xl`, centered
- Search bar: `rounded-full border border-white/10 bg-white/8 backdrop-blur-md`
  with Search icon, input, and blue submit button
- Hero is intentionally shorter than before to push the dual gateway above
  the fold on desktop

#### Dual gateway section

Two equal-width glass cards (`grid grid-cols-1 lg:grid-cols-2 gap-6`):
- Each card: `glass-panel rounded-[2rem] border border-white/10 p-8`
- Left card (exchange): icon (Users), blue accent border-top or glow
- Right card (catalog): icon (Compass/Map), warm accent
- Each card contains H2, description, two CTAs, and a mini-preview grid
  of 2-3 compact cards (request cards on left, listing cards on right)
- Action priority within the left card: "Создать запрос" button is
  primary (default variant), "Найти группу" is outline

#### How it works section

Five steps in a horizontal row (`grid grid-cols-2 sm:grid-cols-5 gap-4`):
- Each step: numbered circle + short label
- Connected by subtle lines or arrows between circles
- Steps: Запрос → Группа → Предложения → Переговоры → Подтверждение

#### Content sections

Each section follows the pattern:
```
<section className="space-y-8">
  <div className="space-y-3">
    <p className="editorial-kicker">Section kicker</p>
    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
      Section heading
    </h2>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards */}
  </div>
</section>
```

#### Data sources

- Destinations: `seededDestinations` from `src/data/destinations/seed.ts`
  (enhance with Russian names and imageUrl fields)
- Listings: `seededPublicListings` from `src/data/public-listings/seed.ts`
- Open requests: seed data from `src/data/open-requests/` (may need to create
  a public seed if one doesn't exist)
- Guides: `seededPublicGuides` from `src/data/public-guides/seed.ts`

---

### PAGE 2: Requests Marketplace `/requests`

**Route**: NEW — `src/app/(site)/requests/page.tsx`
**Feature screen**: NEW — `src/features/requests/components/public/public-requests-marketplace-screen.tsx`

**Design ref**: `design/images/02-requests-marketpalce-page.md`, `design/LAYOUT.md` slide 3

> **Note**: Cards must show **city AND region** (e.g. "Элиста, Калмыкия"), not
> just city. Multi-day tours can span locations 140+ km apart. Dates are always
> **periods** (ranges), not single dates — tourists often don't know exact
> locations and the guide assembles the tour like a constructor.

#### Layout

```
┌─────────────────────────────────────────────────┐
│ SiteHeader                                       │
├─────────────────────────────────────────────────┤
│ Page header                                      │
│  Kicker: "Биржа запросов"                        │
│  H1: "Открытые группы путешественников"          │
│  Subtitle: explain the exchange concept briefly  │
├─────────────────────────────────────────────────┤
│ Glass Filter Bar                                 │
│  Filters: Регион | Даты | Бюджет | Размер группы│
├─────────────────────────────────────────────────┤
│ Dense card grid (3 cols desktop)                 │
│ Each card: photo overlay with:                   │
│  - City + region, date range                    │
│  - Participants joined / target (progress bar)  │
│  - Estimated price per person                   │
│  - Stacked participant avatars                  │
│  - "Присоединиться" button                     │
├─────────────────────────────────────────────────┤
│ SiteFooter                                       │
└─────────────────────────────────────────────────┘
```

#### Request Card Component

NEW: `src/features/requests/components/public/public-request-card.tsx`

```
<article className="group relative overflow-hidden rounded-[1.5rem] min-h-[300px] bg-black">
  <Image fill ... />
  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
  <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
    <h3 className="text-lg font-semibold text-white">{destinationLabel}</h3>
    <p className="text-xs text-white/50">{regionLabel}</p>
    <p className="text-sm text-white/70">{dateRangeLabel}</p>
    <div className="flex items-center justify-between">
      <AvatarStack members={...} />
      <span className="text-sm text-white/70">{sizeCurrent}/{sizeTarget} участников</span>
    </div>
    <ProgressBar current={sizeCurrent} target={sizeTarget} />
    {budgetPerPersonRub && (
      <p className="text-lg font-semibold text-white">~{formatRub(budgetPerPersonRub)} / чел.</p>
    )}
    <Button size="sm" className="w-full rounded-full">Присоединиться</Button>
  </div>
</article>
```

#### Data source

- `OpenRequestRecord` from `src/data/open-requests/types.ts`
- Need: public seed file `src/data/open-requests/seed.ts` with 6-9 sample
  records. Each should reference a destination (use cities from existing listings:
  Ростов, Иркутск, Казань, Калининград, Суздаль, Мурманск) and include
  Unsplash imageUrls.
- Add optional `imageUrl?: string` and `regionLabel?: string` to
  `OpenRequestRecord` type.
- `destinationLabel` should contain "Город, Регион" format in seed data.

---

### PAGE 3: Request Details `/requests/[requestId]`

**Route**: NEW — `src/app/(site)/requests/[requestId]/page.tsx`
**Feature screen**: NEW — `src/features/requests/components/public/public-request-detail-screen.tsx`

**Design ref**: `design/images/03-requests-details-page.md`, `design/LAYOUT.md` slide 3

#### Layout

```
┌─────────────────────────────────────────────────┐
│ SiteHeader                                       │
├─────────────────────────────────────────────────┤
│ Hero banner (destination photo, min-h-[300px])   │
│ Gradient overlay + city name + date              │
├─────────────────────────────────────────────────┤
│ Three-panel grid (lg:grid-cols-3)                │
│ ┌──────────┬──────────────┬───────────────┐     │
│ │ Left:    │ Center:      │ Right:        │     │
│ │ Request  │ Participants │ "Join Group"  │     │
│ │ details  │ + progress   │ + price card  │     │
│ │ (glass)  │ bar (glass)  │ (glass)       │     │
│ └──────────┴──────────────┴───────────────┘     │
├─────────────────────────────────────────────────┤
│ Guide Offers section                             │
│  Kicker + H2 + Badge (count)                    │
│  Grid of OfferCards (glass info cards):          │
│   Guide photo, name, rating, price, highlights  │
│   "Принять предложение" / "Встречная цена" btns│
├─────────────────────────────────────────────────┤
│ SiteFooter                                       │
└─────────────────────────────────────────────────┘
```

#### Left panel — Request details

Glass card with:
- City name (h3)
- Date range
- Target group size
- Budget target (per person)
- Experience type badge

#### Center panel — Participants

Glass card with:
- Stacked avatars of current members
- `{sizeCurrent} из {sizeTarget} участников`
- Progress bar component
- Member names list (optional)

#### Right panel — Join action

Glass card with:
- Estimated price per person (large text)
- "Если присоединится ещё один участник, цена: ..."
- **"Присоединиться к группе"** button (primary, full-width, `rounded-full`)
- Fine print about cancellation policy

#### Price scenarios card (NEW — stakeholder requirement)

> **CRITICAL**: Tourist must see what happens if the group shrinks (force
> majeure). They must agree to a price range before joining.

Glass card showing a price table by group size:

```
┌─ Как цена зависит от группы ─────────────────────────┐
│                                                       │
│  6 участников   ~4 200 ₽ / чел.                      │
│  5 участников   ~5 000 ₽ / чел.                      │
│  4 участника    ~6 300 ₽ / чел.  ← текущий прогноз   │
│  3 участника    ~8 400 ₽ / чел.                      │
│                                                       │
│  При бронировании вы соглашаетесь на диапазон         │
│  от 4 200 до 8 400 ₽ на случай изменения состава.    │
└───────────────────────────────────────────────────────┘
```

Each row is a simple flex row. Highlight the current group-size row with
`bg-primary/10 rounded-lg`. Show the range in a muted footer note.

Price scenarios can be computed from `priceTotalRub / groupSize` for each
variant, or use a `priceScenarios` array on the offer/request data.

#### Data source

- `OpenRequestRecord` + `OpenRequestGroupRosterMember` from `src/data/open-requests/types.ts`
- Guide offers: `TravelerOffer` type or new `GuideOfferForRequest` type
- Need seed data linking open requests to guide offers
- Price scenarios: compute from offer's `priceTotalRub` divided by group size
  variants, or add `priceScenarios?: Array<{groupSize: number; pricePerPersonRub: number}>`

---

### PAGE 4: Create Request `/traveler/requests/new`

**Route**: EXISTS — `src/app/(protected)/traveler/requests/new/page.tsx`
**Feature screen**: EXISTS — `src/features/traveler/components/request-create/traveler-request-create-screen.tsx` — REWRITE

**Design ref**: `design/images/04-create-request-page.md`, `design/LAYOUT.md` slide 4

#### Layout

```
┌─────────────────────────────────────────────────┐
│ SiteHeader + WorkspaceRoleNav                    │
├─────────────────────────────────────────────────┤
│ Two-column layout (lg:grid-cols-[1.1fr_0.9fr])  │
│ ┌─────────────────────┬──────────────────────┐  │
│ │ LEFT: Form card     │ RIGHT: Preview card  │  │
│ │ (glass-panel)       │ (glass-panel)        │  │
│ │                     │                      │  │
│ │ • Destination city  │ Live preview of how  │  │
│ │ • Date range picker │ the request will     │  │
│ │ • Group size        │ appear in the        │  │
│ │ • Budget per person │ marketplace.         │  │
│ │ • Toggle: open group│                      │  │
│ │ • Toggle: allow     │ Shows: city photo,   │  │
│ │   guide offers      │ group size, target   │  │
│ │ • Experience type   │ price, date.         │  │
│ │   dropdown          │                      │  │
│ │                     │ Updates live as user  │  │
│ │ [Создать запрос]    │ fills the form.      │  │
│ └─────────────────────┴──────────────────────┘  │
├─────────────────────────────────────────────────┤
│ SiteFooter                                       │
└─────────────────────────────────────────────────┘
```

#### Form inputs

Use shadcn `Input` component. Override for dark theme:
`border-white/10 bg-white/5 text-white placeholder:text-white/40`

Toggle switches: Use shadcn Switch if available, otherwise use a button toggle.

The form already uses React Hook Form + Zod (`traveler-request` schema).
Keep the existing validation; just restyle the layout.

#### Preview card

The preview card renders a mini version of the PublicRequestCard to show the
user what their request will look like on the marketplace.

---

### PAGE 5: Destination Page `/destinations/[slug]`

**Route**: NEW — `src/app/(site)/destinations/[slug]/page.tsx`
**Feature screen**: NEW — `src/features/destinations/components/public/public-destination-detail-screen.tsx`

**Design ref**: `design/images/05-destination-page.md`, `design/LAYOUT.md` slide 5

#### Layout

```
┌─────────────────────────────────────────────────┐
│ SiteHeader                                       │
├─────────────────────────────────────────────────┤
│ Hero: city skyline photo (min-h-[400px])         │
│  Gradient overlay                               │
│  City name (h1), region, description            │
├─────────────────────────────────────────────────┤
│ Section: "Открытые группы в этом городе"         │
│  Grid of PublicRequestCards                     │
│  (reuse from page 2)                            │
│  If none: "Пока нет открытых групп" + CTA       │
├─────────────────────────────────────────────────┤
│ Section: "Популярные туры"                       │
│  Grid of ListingCards (photo overlay w/ guide)  │
│  (reuse from homepage)                          │
├─────────────────────────────────────────────────┤
│ Section: "Гиды в этом городе"  ← NEW            │
│  Grid of GuideCards (compact: avatar, name,     │
│  rating, specialties, tour count, link)         │
│  If none: "Гидов пока нет" + CTA               │
├─────────────────────────────────────────────────┤
│ SiteFooter                                       │
└─────────────────────────────────────────────────┘
```

#### Data sources

- `DestinationDetail` from `src/data/destinations/types.ts`
- Enhance `seededDestinations` with: imageUrl, description, experienceTypes
- Filter `seededPublicListings` by city matching destination
- Filter open requests seed by destinationLabel matching destination
- Filter `seededPublicGuides` by `regions` or `homeBase` matching destination

---

### PAGE 6: Tour Listing Detail `/listings/[slug]`

**Route**: EXISTS — `src/app/(site)/listings/[slug]/page.tsx` — REWRITE
**Feature screen**: Inline in route file (current pattern) — REWRITE

**Design ref**: `design/images/06-tour-lsiting-page.md`, `design/LAYOUT.md` slide 6

#### Layout

```
┌─────────────────────────────────────────────────┐
│ SiteHeader                                       │
├─────────────────────────────────────────────────┤
│ Hero image (large, min-h-[420px])                │
│  Use ListingCoverArt component (already exists)  │
│  Restyle for dark theme                         │
├─────────────────────────────────────────────────┤
│ Two-column layout (xl:grid-cols-[1.15fr_0.85fr])│
│ ┌────────────────────┬───────────────────────┐  │
│ │ LEFT: Content      │ RIGHT: Sticky sidebar │  │
│ │                    │                       │  │
│ │ • Tour description │ Price card (glass):   │  │
│ │ • Itinerary steps  │ • От {price} ₽       │  │
│ │   (numbered cards) │ • Inclusions badges   │  │
│ │ • Highlights       │ • "Создать запрос"    │  │
│ │ • What's included  │ • "Присоединиться     │  │
│ │                    │    к группе"          │  │
│ │                    │ • Guide mini-card     │  │
│ │                    │ • Quality metrics     │  │
│ └────────────────────┴───────────────────────┘  │
├─────────────────────────────────────────────────┤
│ Reviews section (full width)                     │
├─────────────────────────────────────────────────┤
│ Safety/trust CTA banner (section-frame)          │
├─────────────────────────────────────────────────┤
│ SiteFooter                                       │
└─────────────────────────────────────────────────┘
```

#### Key changes from current implementation

- Switch all `bg-white/72`, `bg-white/76` card backgrounds to dark glass
  (`bg-white/6 border-white/10`)
- Itinerary step cards: dark glass, numbered circles with `bg-primary`
- The right sidebar uses `xl:sticky xl:top-24`
- Two prominent buttons: "Создать запрос на этот тур" (primary) and
  "Присоединиться к существующей группе" (outline)
- Guide trust markers card
- Quality metrics card (reuse `MarketplaceQualityCard`)

#### Itinerary with travel segments (NEW — stakeholder requirement)

> **CRITICAL**: Tours consist of multiple locations at different distances.
> The itinerary must show **travel time and transport options between stops**.
> Example from Kalmykia: walking tour → 15min drive → khural → City Chess.
> Some tourists don't have transport — they need to see options.

Itinerary rendering pattern:

```
┌─ 1  Пешеходная экскурсия по центру (1.5 ч) ───────┐
│  Description text about this stop                   │
└─────────────────────────────────────────────────────┘
     ↕ 15 мин до следующей точки
     🚌 Автобус  🚕 Такси  🚗 Свой транспорт
┌─ 2  Золотая обитель Будды Шакьямуни (1 ч) ─────────┐
│  Description text                                   │
└─────────────────────────────────────────────────────┘
     ↕ 20 мин до следующей точки
     🚕 Такси  🚗 Свой транспорт
┌─ 3  Сити Чесс (0.5 ч) ────────────────────────────┐
│  Description text                                   │
└─────────────────────────────────────────────────────┘
```

The travel segment between stops uses a thin vertical connector line and
transport option pills. Use `ItineraryTravelSegment` component for this.

Transport option pills: `TransportOptionPill` showing icon + label in a
compact badge. Icons: `Bus` for city bus, `Car` for taxi, `CarFront` for own
car, `Footprints` for walking (all from lucide-react).

#### Data sources

- `PublicListing`, `PublicGuideProfile` from existing seeds
- Reviews from existing seed/supabase helpers
- Quality from existing seed

---

### PAGE 7: Guide Profile `/guides/[slug]`

**Route**: EXISTS — `src/app/(site)/guides/[slug]/page.tsx` — REWRITE
**Feature screen**: Inline in route file — REWRITE

**Design ref**: `design/images/07-guide-profile.page.md`, `design/LAYOUT.md` slide 7

#### Layout

```
┌─────────────────────────────────────────────────┐
│ SiteHeader                                       │
├─────────────────────────────────────────────────┤
│ Guide header section                             │
│  Portrait photo (or avatar), name, rating,       │
│  tours completed count, cities served            │
│  Glass card with bio + trust markers             │
├─────────────────────────────────────────────────┤
│ Section: "Туры этого гида"                       │
│  Grid of ListingCards filtered by guide slug     │
├─────────────────────────────────────────────────┤
│ Section: "Активные предложения группам"           │
│  Grid of OfferCards (guide's bids on requests)   │
├─────────────────────────────────────────────────┤
│ Quality metrics + Reviews                        │
├─────────────────────────────────────────────────┤
│ Trust/safety CTA banner                          │
├─────────────────────────────────────────────────┤
│ SiteFooter                                       │
└─────────────────────────────────────────────────┘
```

#### Guide header

```
<section className="grid gap-6 lg:grid-cols-[auto_1fr]">
  <!-- Left: portrait -->
  <div className="relative size-32 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/8">
    {avatarImageUrl ? <Image ... /> : <InitialsAvatar />}
  </div>
  <!-- Right: info -->
  <div className="space-y-4">
    <h1>{displayName}</h1>
    <p className="text-muted-foreground">{headline}</p>
    <div className="flex flex-wrap gap-3">
      <InfoPill icon={Star} text={rating} />
      <InfoPill icon={MapPinned} text={cities.join(", ")} />
      <InfoPill icon={Award} text={`${yearsExperience} лет опыта`} />
    </div>
  </div>
</section>
```

#### Data sources

- `PublicGuideProfile` from existing seed
- Filter `seededPublicListings` by `guideSlug`
- Reviews from existing helpers
- Quality from existing seed

---

### PAGE 8: Traveler Dashboard `/traveler/requests`

**Route**: EXISTS — `src/app/(protected)/traveler/requests/page.tsx`
**Feature screen**: EXISTS — `src/features/traveler/components/requests/traveler-requests-workspace-screen.tsx` — REWRITE

**Design ref**: `design/images/08-traveler-dashboard.md`, `design/LAYOUT.md` slide 8

#### Layout

```
┌─────────────────────────────────────────────────┐
│ SiteHeader + WorkspaceRoleNav                    │
├─────────────────────────────────────────────────┤
│ Page header                                      │
│  Kicker: "Кабинет путешественника"               │
│  H1: "Ваши поездки"                            │
│  "Новый запрос" button (primary, right-aligned) │
├─────────────────────────────────────────────────┤
│ Tab bar (glass)                                  │
│  "Мои запросы" | "Группы" | "Предложения" |      │
│  "Бронирования"                                 │
├─────────────────────────────────────────────────┤
│ Tab content: grid of cards                       │
│ Each card is a TravelerRequestCard or            │
│ BookingCard with:                                │
│  - Destination photo (left side or top)          │
│  - City, date, group composition                │
│  - Status badge (color-coded)                   │
│  - Price or negotiation state                   │
│  - Participant avatars                          │
│  - "Открыть" or action button                   │
├─────────────────────────────────────────────────┤
│ SiteFooter (omitted in protected layout)         │
└─────────────────────────────────────────────────┘
```

#### Tab bar

Use shadcn `Tabs` if installed, or build with buttons:
```
<div className="flex gap-2 rounded-[1rem] border border-white/10 bg-white/5 p-1">
  {tabs.map(tab => (
    <button className={cn(
      "rounded-[0.8rem] px-4 py-2 text-sm font-medium transition-all",
      active === tab.id
        ? "bg-white/10 text-white"
        : "text-white/50 hover:text-white/70"
    )}>
      {tab.label}
    </button>
  ))}
</div>
```

#### Request cards in dashboard

Horizontal card layout (different from the photo-overlay cards on public pages):

```
<div className="glass-panel flex gap-4 rounded-[1.5rem] border border-white/10 p-4">
  <!-- Small destination photo (rounded, fixed size) -->
  <div className="relative size-20 shrink-0 overflow-hidden rounded-[1rem]">
    <Image fill ... />
  </div>
  <!-- Content -->
  <div className="flex-1 space-y-2">
    <div className="flex items-start justify-between">
      <h3>{destination}</h3>
      <StatusBadge status={status} />
    </div>
    <p className="text-sm text-muted-foreground">{dateLabel}</p>
    <div className="flex items-center gap-3">
      <AvatarStack />
      <span>{groupSize} чел.</span>
      <span>{formatRub(price)}</span>
    </div>
  </div>
  <!-- Action -->
  <Button variant="outline" size="sm" asChild>
    <Link href={...}>Открыть</Link>
  </Button>
</div>
```

#### Tabs content

| Tab                | Data source                    | Card type              |
|--------------------|---------------------------------|------------------------|
| Мои запросы        | `listTravelerRequests()`        | Horizontal request card|
| Группы             | `listOpenRequests()` (joined)   | Horizontal group card  |
| Предложения гидов  | `listOffersForTravelerRequest()`| Offer card             |
| Бронирования       | `listTravelerBookings()`        | Booking card           |

---

## 7. Listings Index `/listings` — RESTYLE

**Route**: EXISTS — `src/app/(site)/listings/page.tsx`
**Feature screen**: EXISTS — `src/features/listings/components/public/public-listing-discovery-screen.tsx` — RESTYLE

The existing page already works. Changes needed:
- All cards switch to dark glass style
- Filter bar uses dark glass pattern
- Section backgrounds: transparent (inherits dark page bg)
- Listing cards: photo-overlay style (reuse the card from homepage)

---

## 8. New Reusable Components to Create

| Component | Path | Description |
|-----------|------|-------------|
| `PublicRequestCard` | `src/features/requests/components/public/public-request-card.tsx` | Photo-overlay card for open requests. Shows city+region, date range, group progress, price. Used on homepage, requests marketplace, destination page. |
| `PublicRequestDetailScreen` | `src/features/requests/components/public/public-request-detail-screen.tsx` | Full detail view of a request with participants, guide offers, and price scenarios. |
| `PublicRequestsMarketplaceScreen` | `src/features/requests/components/public/public-requests-marketplace-screen.tsx` | Marketplace page with filters + request cards grid. |
| `PublicDestinationDetailScreen` | `src/features/destinations/components/public/public-destination-detail-screen.tsx` | Destination detail with hero, groups, tours, and guides. |
| `PublicGuideCard` | `src/features/guide/components/public/public-guide-card.tsx` | Compact guide card: avatar, name, rating, specialties, tour count. For destination page. |
| `AvatarStack` | `src/components/shared/avatar-stack.tsx` | Stacked participant avatar circles. |
| `GroupProgressBar` | `src/components/shared/group-progress-bar.tsx` | Thin progress bar for group formation. |
| `PriceScenarioCard` | `src/features/requests/components/public/price-scenario-card.tsx` | Price table showing cost per person at different group sizes. |
| `ItineraryTravelSegment` | `src/features/listings/components/public/itinerary-travel-segment.tsx` | Connector between itinerary stops showing travel time and transport options. |
| `TransportOptionPill` | `src/components/shared/transport-option-pill.tsx` | Compact pill with transport icon + label (bus, taxi, own car, walking). |
| `DestinationCard` | `src/features/destinations/components/public/destination-card.tsx` | Photo-overlay card for destination discovery on homepage. |

---

## 9. Seed Data Enhancements

### Destinations seed — ENHANCE

Path: `src/data/destinations/seed.ts`

Update to Russian names and add imageUrl + description:

```ts
export const seededDestinations: readonly DestinationSummary[] = [
  {
    slug: "rostov",
    name: "Ростов-на-Дону",
    region: "Ростовская область",
    imageUrl: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1400&q=80",
    listingCount: 4,
    openRequestCount: 2,
  },
  {
    slug: "irkutsk",
    name: "Иркутск",
    region: "Иркутская область",
    imageUrl: "https://images.unsplash.com/photo-1551845728-6820a30c64e1?auto=format&fit=crop&w=1400&q=80",
    listingCount: 3,
    openRequestCount: 1,
  },
  {
    slug: "kazan",
    name: "Казань",
    region: "Татарстан",
    imageUrl: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1400&q=80",
    listingCount: 5,
    openRequestCount: 3,
  },
  // ... etc for Калининград, Суздаль, Мурманск, Санкт-Петербург
];
```

### Open Requests seed — CREATE

Path: `src/data/open-requests/seed.ts`

Create 6-9 public open request records using existing destination/listing data:

```ts
export const seededOpenRequests: readonly OpenRequestRecord[] = [
  {
    id: "or-1",
    status: "open",
    visibility: "public",
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-03-15T14:00:00Z",
    travelerRequestId: "tr-seed-1",
    group: { sizeTarget: 6, sizeCurrent: 3, openToMoreMembers: true },
    destinationLabel: "Ростов-на-Дону",
    dateRangeLabel: "22–24 апреля",
    budgetPerPersonRub: 4500,
    highlights: ["Еда и рынки", "Вечерняя прогулка"],
  },
  // ... more
];
```

### DestinationDetail type — may need `imageUrl`

Already present in types as `imageUrl?: string`. Ensure seed populates it.

### Data model additions (from stakeholder feedback)

These are **optional new fields** to add to existing types. All are optional
to maintain backward compatibility. See `design/STAKEHOLDER-FEEDBACK.md` for
full rationale.

#### `PublicListingItineraryItem` — add travel segment fields

Path: `src/data/public-listings/types.ts`

```ts
export type PublicListingItineraryItem = {
  title: string;
  description: string;
  durationHours: number;
  /** Travel time to next stop in minutes. Omit for last stop. */
  travelToNextMinutes?: number;
  /** Human-readable distance label, e.g. "15 мин на машине" */
  travelToNextLabel?: string;
  /** Transport options between this stop and next */
  transportOptions?: Array<"walking" | "city_bus" | "taxi" | "own_car" | "guide_transport">;
};
```

#### `OpenRequestRecord` — add image and region

Path: `src/data/open-requests/types.ts`

```ts
// Add these optional fields to the existing type:
imageUrl?: string;
regionLabel?: string;
```

#### Transport option labels (for UI)

```ts
const TRANSPORT_LABELS: Record<string, { icon: string; label: string }> = {
  walking: { icon: "Footprints", label: "Пешком" },
  city_bus: { icon: "Bus", label: "Автобус" },
  taxi: { icon: "Car", label: "Такси" },
  own_car: { icon: "CarFront", label: "Свой транспорт" },
  guide_transport: { icon: "Truck", label: "Транспорт гида" },
};
```

---

## 10. Route Map Summary

| Route                        | Status      | Route group    | Data source              |
|------------------------------|-------------|----------------|--------------------------|
| `/`                          | REWRITE     | `(home)`       | listings, destinations, open-requests, guides |
| `/listings`                  | RESTYLE     | `(site)`       | public-listings          |
| `/listings/[slug]`           | REWRITE     | `(site)`       | public-listings, guides, reviews, quality |
| `/guides/[slug]`             | REWRITE     | `(site)`       | public-guides, listings, reviews, quality |
| `/requests`                  | NEW         | `(site)`       | open-requests            |
| `/requests/[requestId]`      | NEW         | `(site)`       | open-requests, guide-offers |
| `/destinations/[slug]`       | NEW         | `(site)`       | destinations, listings, open-requests |
| `/traveler/requests`         | REWRITE     | `(protected)`  | traveler-requests, open-requests, bookings |
| `/traveler/requests/new`     | REWRITE     | `(protected)`  | traveler-request schema  |
| `/trust`                     | RESTYLE     | `(site)`       | static content           |
| `/auth`                      | RESTYLE     | `(site)`       | auth flow                |
| `/policies/*`                | RESTYLE     | `(site)`       | static content           |

---

## 11. Implementation Order

Execute in this order to minimize rework and get shared pieces right first:

### Phase 1 — Foundation (do first)

1. **Update `globals.css`** — dark palette, utility classes
2. **Rewrite `SiteHeader`** — glass dark nav
3. **Rewrite `SiteFooter`** — dark footer
4. **Update `(site)/layout.tsx`** — remove light bg classes
5. **Update `(home)/layout.tsx`** — simplify
6. **Verify**: run `bun dev`, confirm dark background renders on all pages

### Phase 2 — Shared components

7. **Create `AvatarStack`** component
8. **Create `GroupProgressBar`** component
9. **Enhance destinations seed data** (Russian names, imageUrl)
10. **Create open-requests seed data**

### Phase 3 — Homepage

11. **Rewrite `homepage-shell.tsx`** per page 1 spec
12. **Create `DestinationCard`** component
13. **Create `PublicRequestCard`** component (reused on 3 pages)

### Phase 4 — Public discovery pages

14. **Create `/requests` page** (marketplace)
15. **Create `/requests/[requestId]` page** (request detail)
16. **Create `/destinations/[slug]` page**
17. **Restyle `/listings` page**
18. **Rewrite `/listings/[slug]` page**
19. **Rewrite `/guides/[slug]` page**

### Phase 5 — Protected workspace pages

20. **Rewrite `/traveler/requests` page** (dashboard with tabs)
21. **Rewrite `/traveler/requests/new` page** (form + preview)

### Phase 6 — Polish

22. **Restyle remaining pages** (`/trust`, `/auth`, `/policies/*`)
23. **Run `bun run lint && bun run typecheck`** — fix all errors
24. **Run `bun run build`** — verify production build
25. **Visual review** — all pages in browser at mobile and desktop widths

---

## 12. Pre-Delivery Checklist

Before considering a page complete, verify every item:

### Visual Quality
- [ ] Dark background (`#0f0f0f`), no light backgrounds visible anywhere
- [ ] Glass nav bar renders correctly with `backdrop-blur-xl`
- [ ] All cards use consistent rounding (`rounded-[1.5rem]` to `rounded-[2rem]`)
- [ ] All buttons are `rounded-full`
- [ ] Glass panels have `backdrop-blur` + translucent bg + subtle `border-white/8`
- [ ] No emojis used as icons — Lucide React SVGs only, consistent sizing
- [ ] All colors use Tailwind semantic tokens (`bg-primary`, `text-muted-foreground`),
  no hardcoded hex values in components
- [ ] Photos use `<Image>` from `next/image` with proper `sizes` attribute
- [ ] Gradient overlays ensure text readability on photos (`from-black/75` minimum)
- [ ] Typography hierarchy follows section 3 spec

### Interaction
- [ ] `cursor-pointer` on all clickable elements (cards, buttons, links, toggles)
- [ ] Hover states provide visual feedback (`hover:-translate-y-0.5`, `hover:bg-white/10`)
- [ ] Hover states do NOT cause layout shift (no `hover:scale` that pushes siblings)
- [ ] `transition-all duration-300` on all interactive elements
- [ ] `focus-visible:ring-2 focus-visible:ring-primary/50` on buttons, links, inputs
- [ ] `active:scale-[0.98]` on buttons for pressed state
- [ ] Loading states use shadcn `Skeleton` with `bg-white/8 animate-pulse`
- [ ] Empty states show glass card with muted icon, message, and CTA

### Accessibility
- [ ] Body text contrast ≥ 4.5:1 on dark backgrounds
- [ ] Muted text (`text-white/50`) contrast ≥ 4.5:1 on `#0f0f0f`
- [ ] Text on glass cards (`text-white/80` on `bg-white/6`) contrast ≥ 4.5:1
- [ ] All `<Image>` elements have Russian `alt` text
- [ ] Form inputs have `<FormLabel>` (shadcn compound pattern)
- [ ] `prefers-reduced-motion: reduce` respected — disable transforms and
  complex animations for users who opt out
- [ ] Color is never the sole indicator (always pair with icon or text)

### Responsive
- [ ] Works at 375px (mobile) — single column, no horizontal scroll
- [ ] Works at 768px (tablet)
- [ ] Works at 1024px (laptop)
- [ ] Works at 1440px (desktop) — max-width containers, no awkward stretching
- [ ] No content hidden behind fixed navbar (account for navbar height in padding)

### Code Quality
- [ ] Russian copy throughout (no English UI text in visible UI)
- [ ] No custom CSS outside of `globals.css` utility classes
- [ ] No inline `style` attributes
- [ ] No TypeScript or lint errors (`bun run lint && bun run typecheck`)
- [ ] Data comes from seed files, not hardcoded in components
- [ ] shadcn compound components used properly (e.g. `Card` + `CardHeader` +
  `CardContent`, not single component with many props)
- [ ] `<Toaster />` included in root layout (not in individual pages)

### Reference: Design System
- [ ] Cross-check against `design-system/provodnik/MASTER.md` for global rules
- [ ] Check `design-system/provodnik/pages/[page].md` for page-specific overrides

---

## 13. Files NOT to Modify

- `src/components/ui/*` — shadcn primitives. Only override via className props.
  Exception: if the Card component's `glass-panel` class needs dark-theme
  adjustment, that happens in `globals.css`, not in `card.tsx`.
- `src/data/*/types.ts` — Do not change existing type shapes. Only add new
  optional fields if needed (e.g. `imageUrl` on `OpenRequestRecord`).
- `src/app/(reference)/*` — Previous experiments. Leave untouched.
- `src/lib/*` — Utility and Supabase helpers. Leave untouched.
- `src/components/providers/*` — App-level providers. Leave untouched.

---

## 14. Reference: Design Prompt → Page Mapping

| Design file                            | Route                    | Component root                                        |
|----------------------------------------|--------------------------|------------------------------------------------------|
| `design/images/01-home.md`             | `/`                      | `src/features/homepage/components/homepage-shell.tsx`  |
| `design/images/02-requests-marketpalce-page.md` | `/requests`      | `src/features/requests/components/public/public-requests-marketplace-screen.tsx` |
| `design/images/03-requests-details-page.md` | `/requests/[requestId]` | `src/features/requests/components/public/public-request-detail-screen.tsx` |
| `design/images/04-create-request-page.md` | `/traveler/requests/new` | `src/features/traveler/components/request-create/traveler-request-create-screen.tsx` |
| `design/images/05-destination-page.md` | `/destinations/[slug]`   | `src/features/destinations/components/public/public-destination-detail-screen.tsx` |
| `design/images/06-tour-lsiting-page.md` | `/listings/[slug]`      | `src/app/(site)/listings/[slug]/page.tsx`              |
| `design/images/07-guide-profile.page.md` | `/guides/[slug]`       | `src/app/(site)/guides/[slug]/page.tsx`                |
| `design/images/08-traveler-dashboard.md` | `/traveler/requests`   | `src/features/traveler/components/requests/traveler-requests-workspace-screen.tsx` |
