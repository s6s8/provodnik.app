# Design System Master File — Provodnik

> **LOGIC:** When building a specific page, first check `design-system/provodnik/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Provodnik
**Updated:** 2026-03-18
**Category:** Travel/Tourism Demand-First Marketplace
**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (radix-nova)

---

## Global Rules

### Color Palette (Dark Theme — OKLCH)

All colors are defined as CSS custom properties in `globals.css` inside the
`@theme inline` block. Use Tailwind semantic tokens (`bg-primary`, `text-muted-foreground`)
— never hardcode hex values in components.

| Role              | OKLCH Value                           | Approx Hex  | Tailwind Token         |
|-------------------|---------------------------------------|-------------|------------------------|
| Background        | `oklch(0.09 0.005 260)`               | `#0f0f0f`   | `bg-background`        |
| Foreground (text) | `oklch(0.95 0.01 90)`                 | off-white   | `text-foreground`      |
| Card              | `oklch(0.13 0.005 260 / 80%)`         | dark glass  | `bg-card`              |
| Primary           | `oklch(0.65 0.15 250)`                | ~`#3B82F6`  | `bg-primary`           |
| Primary foreground| `oklch(0.98 0.005 90)`                | white       | `text-primary-foreground` |
| Secondary         | `oklch(0.22 0.01 260 / 60%)`          | glass tint  | `bg-secondary`         |
| Muted             | `oklch(0.18 0.005 260)`               | dark gray   | `bg-muted`             |
| Muted foreground  | `oklch(0.65 0.02 90)`                 | mid-gray    | `text-muted-foreground`|
| Accent            | `oklch(0.70 0.18 70)`                 | warm amber  | `bg-accent`            |
| Destructive       | `oklch(0.55 0.22 25)`                 | red         | `bg-destructive`       |
| Border            | `oklch(0.25 0.01 260 / 40%)`          | subtle line | `border-border`        |
| Ring              | `oklch(0.65 0.15 250 / 50%)`          | blue glow   | `ring-ring`            |

**Color Notes:** Dark cinematic base (#0f0f0f) + blue primary + warm amber accent.
Sky-blue trust tones with warm adventure accents. No light backgrounds anywhere.

### Typography

| Role     | Font             | Tailwind Class  | Usage                           |
|----------|------------------|------------------|---------------------------------|
| Display  | Cormorant        | `font-serif`     | Hero headlines, section titles  |
| Body     | Manrope          | `font-sans`      | Everything else                 |
| Mono     | Geist Mono       | `font-mono`      | Prices, codes, technical text   |

**Type Scale (mobile → desktop):**

| Level | Size                          | Weight    | Font       |
|-------|-------------------------------|-----------|------------|
| H1    | `text-3xl sm:text-4xl lg:text-5xl` | `font-bold` | Cormorant  |
| H2    | `text-2xl sm:text-3xl`        | `font-semibold` | Cormorant or Manrope |
| H3    | `text-xl sm:text-2xl`         | `font-semibold` | Manrope    |
| Body  | `text-base`                   | `font-normal`   | Manrope    |
| Small | `text-sm`                     | `font-normal`   | Manrope    |
| Kicker| `text-xs uppercase tracking-widest` | `font-medium` | Manrope |

### Spacing System (8px grid)

| Token              | Tailwind  | Value  | Usage                              |
|--------------------|-----------|--------|------------------------------------|
| Section gap        | `gap-16 md:gap-20 lg:gap-24` | 64–96px | Between page sections    |
| Card grid gap      | `gap-4 md:gap-5`    | 16–20px | Between cards in a grid            |
| Card padding       | `p-5 sm:p-6`        | 20–24px | Inside card content                |
| Content block gap  | `space-y-4`          | 16px    | Between blocks inside a card       |
| Kicker to heading  | `space-y-2`          | 8px     | Kicker label above heading         |
| Heading to body    | `mt-2`               | 8px     | Below heading                      |
| Badge/pill gap     | `gap-2`              | 8px     | Between inline pills               |

### Border Radius

| Element  | Radius                | Tailwind            |
|----------|-----------------------|---------------------|
| Buttons  | Fully round           | `rounded-full`      |
| Cards    | Large round           | `rounded-[1.5rem]` to `rounded-[2rem]` |
| Inputs   | Round or large        | `rounded-full` or `rounded-[1.2rem]` |
| Badges   | Fully round           | `rounded-full`      |
| Images   | Match parent card     | `rounded-[1.5rem]`  |

### Glassmorphism Spec

This is the structural design language for cards, nav, and overlays.

| Property              | Value                                      | Tailwind                        |
|-----------------------|--------------------------------------------|---------------------------------|
| Background            | `rgba(255, 255, 255, 0.06)`               | `bg-white/6` or `bg-card`      |
| Backdrop blur         | `blur(24px)`                               | `backdrop-blur-xl`              |
| Border                | `1px solid rgba(255, 255, 255, 0.08)`     | `border border-white/8`         |
| Box shadow (optional) | `0 8px 32px rgba(0,0,0,0.4)`              | `shadow-xl`                     |

**Implementation checklist for glass elements:**
- [ ] `backdrop-filter: blur()` applied (10–24px range)
- [ ] Translucent background 6–15% white opacity
- [ ] Subtle border 1px `border-white/8` to `border-white/12`
- [ ] Text contrast 4.5:1 verified on glass surface
- [ ] No white (#FFFFFF) background anywhere
- [ ] Works without backdrop-filter (graceful degradation)

### Shadow Depths

| Level  | Value                           | Tailwind       | Usage                    |
|--------|--------------------------------|----------------|--------------------------|
| None   | `none`                          | `shadow-none`  | Most glass cards         |
| Small  | `0 1px 3px rgba(0,0,0,0.3)`   | `shadow-sm`    | Subtle lift              |
| Medium | `0 4px 12px rgba(0,0,0,0.4)`  | `shadow-md`    | Raised cards             |
| Large  | `0 10px 24px rgba(0,0,0,0.5)` | `shadow-lg`    | Modals, featured cards   |
| XL     | `0 20px 40px rgba(0,0,0,0.6)` | `shadow-xl`    | Hero images              |

Note: On dark backgrounds, shadows need higher opacity than on light.

---

## Interaction States

Every interactive element needs four states:

| State   | Treatment                                                           |
|---------|---------------------------------------------------------------------|
| Default | Base styling + `cursor-pointer` on all clickable elements           |
| Hover   | `hover:-translate-y-0.5 hover:shadow-lg` or `hover:bg-white/10`    |
| Focus   | `focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none` |
| Active  | `active:translate-y-px active:scale-[0.98]`                        |

**Photo overlay cards:** `group-hover:scale-[1.03]` on image + deepen gradient overlay.

**Standard transition:** `transition-all duration-300` on all interactive elements.

**Loading:** shadcn `Skeleton` with `bg-white/8 animate-pulse rounded-[1.5rem]`.

**Empty states:** Glass card with muted icon (`size-10 text-white/20`), message, single CTA.

---

## Motion Guidelines

- **Micro-interactions** (hover, focus, press): 200–300ms
- **Layout transitions** (tab switch, card enter): 300–500ms
- **Easing**: Tailwind default (`ease-in-out`). Enter animations: `ease-out`.
- **Safe to animate**: `opacity`, `transform`, `background-color`, `box-shadow`
- **Never animate**: `width`, `height`, `margin`, layout properties
- **Staggered entrances** (optional): framer-motion `staggerChildren: 0.05`
- **Reduced motion**: Respect `prefers-reduced-motion: reduce` — disable
  transforms and opacity transitions for users who opt out.

---

## Component Specs (shadcn/ui)

### Buttons

Use shadcn `Button` with variants — never custom button components.

```tsx
<Button variant="default" size="lg" className="rounded-full">
  Создать запрос
</Button>
<Button variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/10">
  Найти группу
</Button>
```

### Cards

Use shadcn `Card` — the `glass-panel` class in `globals.css` provides the glass styling:

```tsx
<Card className="glass-panel rounded-[2rem] border-white/8 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Inputs

```tsx
<Input className="rounded-full border-white/10 bg-white/8 backdrop-blur-md text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-primary/50" />
```

### Dialogs/Sheets

Use shadcn compound component pattern:
```tsx
<Dialog>
  <DialogTrigger asChild>...</DialogTrigger>
  <DialogContent className="glass-panel border-white/10">
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

---

## Accessibility (Dark Theme)

| Element               | Minimum ratio | Achievement                       |
|-----------------------|---------------|-----------------------------------|
| Body text on bg       | 4.5:1 (AA)    | `text-white/90` on `#0f0f0f`     |
| Muted text on bg      | 4.5:1 (AA)    | `text-white/50` on `#0f0f0f`     |
| Text on glass card    | 4.5:1 (AA)    | `text-white/80` on `bg-white/6`  |
| Text on photo overlay | 4.5:1 (AA)    | Gradient `from-black/75` minimum |
| Focus ring            | 3:1 (AA)      | `ring-primary/50` on dark bg     |

**Non-negotiable rules:**
- Focus rings (`focus-visible:ring-2`) on every interactive element
- All images have `alt` text (Russian)
- Form inputs have labels (use shadcn `FormLabel`)
- Color is never the only indicator (add icons or text)
- `prefers-reduced-motion` disables transforms and complex animations

---

## Page Pattern

**Pattern:** Demand-First Marketplace (Dual Entry)

| Section              | Purpose                                          |
|----------------------|--------------------------------------------------|
| Hero                 | Search bar as primary CTA, compact cinematic photo|
| Dual gateway         | Two paths: Exchange (биржа) + Catalog (готовые туры) |
| How it works         | 5-step visual flow                                |
| Featured destinations| Photo-overlay cards with listing/request counts   |
| Active requests      | Request cards showing group formation progress    |
| Popular tours        | Listing cards with itineraries                    |
| Trust section        | Transparency, safety, group formation logic       |

---

## Anti-Patterns (Forbidden)

- **Emojis as icons** — Use Lucide React icons (already installed). Never 🎨 🚀 ⚙️
- **Missing cursor:pointer** — Every clickable element (`<Link>`, `<Button>`, clickable cards)
- **Layout-shifting hovers** — No `hover:scale` that shifts surrounding content; use
  `hover:-translate-y-0.5` which lifts without shifting layout
- **Light backgrounds** — No `bg-white`, no `bg-gray-100`, no light cards
- **Hardcoded colors** — Always use Tailwind tokens (`bg-primary`, `text-muted-foreground`)
- **Raw CSS** — No custom CSS files, no inline `style`, no `@keyframes` outside `globals.css`
- **Instant state changes** — Always `transition-all duration-300`
- **Infinite decorative animation** — `animate-*` only for loading indicators
- **Content behind navbar** — Account for fixed navbar height in page padding

---

## Pre-Delivery Checklist

Before delivering any page or component:

### Visual Quality
- [ ] No emojis used as icons (Lucide React SVGs only)
- [ ] All icons from Lucide with consistent sizing (`size-4`, `size-5`, `size-6`)
- [ ] Glass panels have backdrop-blur + translucent bg + subtle border
- [ ] Hover states don't cause layout shift
- [ ] All colors use Tailwind semantic tokens, no hardcoded hex

### Interaction
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states provide clear visual feedback
- [ ] `transition-all duration-300` on interactive elements
- [ ] `focus-visible:ring-2` on buttons, links, inputs
- [ ] Active/pressed state on buttons (`active:scale-[0.98]`)

### Accessibility
- [ ] Text contrast 4.5:1 minimum on dark backgrounds
- [ ] Photo overlay text has gradient `from-black/75` or darker beneath
- [ ] All images have Russian `alt` text
- [ ] Form inputs have `<FormLabel>` (shadcn)
- [ ] `prefers-reduced-motion` respected
- [ ] Color is not the sole indicator

### Responsive
- [ ] Works at 375px (mobile)
- [ ] Works at 768px (tablet)
- [ ] Works at 1024px (laptop)
- [ ] Works at 1440px (desktop)
- [ ] No horizontal scroll on any breakpoint
- [ ] No content hidden behind fixed navbar

### All copy in Russian
