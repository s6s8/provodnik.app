# Home Page Redesign — Implementation Plan

Reference design: `public/image.png`
Layout spec: `docs/design/LAYOUT.md`

---

## 0. Current State Summary

| Aspect | Current | Target |
|---|---|---|
| Theme | Warm light (oklch cream/beige), serif display font | Dark immersive (`#0f0f0f`), sans-serif |
| Hero | Card-based left/right grid with CTA buttons, no full-bleed image | Full-viewport background photo with centered headline + search |
| Navigation | Sticky `SiteHeader` with logo, search pill, nav links, auth buttons | Floating glassmorphic pills over the hero image, top-right |
| Cards | White cards with separate image + text body below | Full-bleed photo cards with gradient-overlaid text (no white body) |
| Grid | Standard 3-column equal grid | Bento grid (tall left card spanning 2 rows, 2×2 right) |
| Content | Russian market data (Rostov, Baikal) | International demo data (Kyoto, Marrakech, Venice, Berlin) |
| Footer | Visible on homepage | Remains, but homepage focus is above-the-fold immersion |

### Files that will change

| File | Action |
|---|---|
| `src/app/(home)/page.tsx` | Current dark homepage (uses `src/features/homepage`) |
| `src/app/(home)/layout.tsx` | Home layout; `(site)` holds other public pages with shared shell |
| `src/data/public-listings/seed.ts` | **Extend** — add international demo listings |
| `src/data/public-listings/types.ts` | **Extend** — add optional `imageUrl` and `guideAvatarUrl` fields |
| `src/data/public-guides/seed.ts` | **Extend** — add international demo guide profiles |
| `src/data/public-guides/types.ts` | **Extend** — add optional `avatarUrl` field |
| `src/app/globals.css` | **No change** — homepage uses scoped dark overrides, does not touch global light theme |

### Files that must NOT change

- `src/components/ui/*` — stable primitives
- `src/components/shared/site-header.tsx` — used by other public pages
- `src/components/shared/site-footer.tsx` — used by other public pages
- Any protected route code

---

## 1. Layout Strategy

### Problem
The public inner layout (`src/app/(site)/layout.tsx`) wraps listings, guides, auth, trust, policies. The home route (`src/app/(home)`) has its own layout.
```
SiteHeader → constrained <main> (max-w-[1280px], padding, gap) → SiteFooter
```
The target design needs:
- **No visible header** — navigation is embedded inside the hero as floating pills
- **Edge-to-edge** content — no `max-w` constraint or horizontal padding on the hero
- **Dark background** that bleeds to the viewport edges

### Solution: Conditional layout for the home route
Next.js App Router doesn't support per-page layout opt-out within the same route group. Two clean options:

**Option A (recommended): Render layout chrome conditionally inside the page itself.**
Keep the homepage at `src/app/(home)/page.tsx` but have it render its own full-bleed wrapper that overrides the `<main>` constraints. The page renders with `negative margin` or an absolutely-positioned full-width container that breaks out of the parent padding. The `SiteHeader` renders but is visually hidden or overlaid on the homepage.

**Option B (current): Separate route group.** `(home)` exists with its own layout; `/` is the homepage.

**Recommended: Option A** — keep the page in `(home)` and use CSS to break out of the constrained `<main>`:
1. Add a `data-page="home"` attribute on the homepage wrapper.
2. In the public layout, detect the home page via children inspection or via a CSS approach:
   - The homepage wrapper uses `class="fixed inset-0"` or negative-margin technique to escape the `max-w` + padding constraint.
   - OR, modify the public layout to make `<main>` constraints conditional: when children have `[data-home-hero]`, remove padding/max-width.

**Simplest practical approach**: Modify `(site)/layout.tsx` to pass through the children without the constrained wrapper when the page signals it (via a CSS class). The homepage JSX renders its own full-width dark container.

Actually the simplest: the homepage `page.tsx` renders a `<div>` that uses Tailwind's negative margin utilities to break out:
```
className="-mx-4 -mt-6 sm:-mx-6 md:-mt-10 lg:-mx-8"
```
to negate the layout padding. But this is fragile.

**Final recommendation**: Modify `(site)/layout.tsx` minimally — wrap children in a container that homepage can opt out of using a special class. Or better: move homepage to `src/app/page.tsx` (root, outside route group) with its own inline layout. But that changes URL routing.

**Decision: Modify `(site)/layout.tsx`** to conditionally not render `SiteHeader` and to remove the constrained `<main>` wrapper for the homepage. Use a parallel layout approach:

```tsx
// src/app/(site)/layout.tsx
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell min-h-screen bg-background">
      <SiteHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-16 px-4 py-6 sm:px-6 md:gap-20 md:py-10 lg:px-8 lg:gap-24">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
```

The cleanest approach: **the homepage renders a full-viewport overlay on top** using `fixed` or negative margins, effectively becoming the entire viewport. The `SiteHeader` is behind it. On scroll past the hero, the regular layout takes over.

**FINAL DECISION**: Use negative margins on the homepage root div to escape the `<main>` constraints, combined with hiding the `SiteHeader` by layering the hero on top with `relative z-20`. This avoids touching the layout file.

```tsx
// In page.tsx:
<div className="home-dark -mx-4 -mt-6 sm:-mx-6 md:-mt-10 lg:-mx-8 -mb-16 md:-mb-20 lg:-mb-24">
  {/* full-bleed dark homepage */}
</div>
```

This negates the exact padding/margin values from the layout's `<main>` tag. Combined with a high `z-index`, the hero overlays the sticky header.

---

## 2. Data Layer Extensions

### 2.1 Add `imageUrl` to listing types

In `src/data/public-listings/types.ts`, add:
```ts
imageUrl?: string;
guideAvatarUrl?: string;
```

### 2.2 Add international seed listings

In `src/data/public-listings/seed.ts`, add 5 new listings after the existing ones:

| slug | title | city | guide | image (Unsplash) |
|---|---|---|---|---|
| `kyoto-temple-hike` | Ancient Forest & Temple Hike | Kyoto, Japan | sakura-tanaka | Autumn temple scene |
| `marrakech-food-tour` | Medina Food & Spice Tour | Marrakech, Morocco | hassan-el-fassi | Spice souk |
| `venice-gondola-tour` | Hidden Canals Gondola Tour | Venice, Italy | marco-rossi | Gondola canal |
| `berlin-street-art` | Urban Street Art Safari | Berlin, Germany | lena-weber | Graffiti walls |
| `dubrovnik-old-town` | Old Town Walking Tour | Dubrovnik, Croatia | — | Mediterranean stone streets (hero background) |

### 2.3 Add `avatarUrl` to guide types

In `src/data/public-guides/types.ts`, add:
```ts
avatarUrl?: string;
```

### 2.4 Add international seed guides

In `src/data/public-guides/seed.ts`, add 4 new guides:

| slug | displayName | homeBase | rating | reviews |
|---|---|---|---|---|
| `sakura-tanaka` | Sakura Tanaka | Kyoto, Japan | 4.9 | 124 |
| `hassan-el-fassi` | Hassan El-Fassi | Marrakech, Morocco | 4.8 | 68 |
| `marco-rossi` | Marco Rossi | Venice, Italy | 4.7 | 215 |
| `lena-weber` | Lena Weber | Berlin, Germany | 4.8 | 198 |

### 2.5 Unsplash image URLs

All images use `images.unsplash.com` which is already allowed in `next.config.ts` `remotePatterns`.

Curated URLs to use (all with `auto=format&fit=crop&q=80`):

| Purpose | URL |
|---|---|
| Hero background (Dubrovnik) | `https://images.unsplash.com/photo-1555990538-1e15a14e611d?auto=format&fit=crop&w=2400&h=1350&q=80` |
| Kyoto autumn temple | `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&h=1600&q=80` |
| Marrakech spice souk | `https://images.unsplash.com/photo-1534759926787-89fa60bb2df2?auto=format&fit=crop&w=1200&h=900&q=80` |
| Venice gondola canal | `https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&h=900&q=80` |
| Berlin street art | `https://images.unsplash.com/photo-1551966775-a4ddc8df052b?auto=format&fit=crop&w=1200&h=900&q=80` |
| Street art group (card D) | `https://images.unsplash.com/photo-1569880153113-76e33fc52b5f?auto=format&fit=crop&w=1200&h=900&q=80` |

Guide avatar URLs (placeholder faces from randomuser or UI Faces equivalent — or use initials-based avatars):
- Use `https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=128&h=128&q=80` with portrait crop
- Alternatively, generate avatar circles with initials (no external dependency)

**Recommendation**: Use initials-based avatars rendered as colored circles with white text. This avoids external avatar image licensing issues and matches the "people-first" design intent without needing real face photos.

---

## 3. Component Architecture

The homepage should be built as a **single server component** (`page.tsx`) with extracted sub-components in the same file (no new component files needed since this is page-specific).

### 3.1 Component Tree

```
HomePage (server component)
├── HeroSection
│   ├── HeroNav (floating pill navigation)
│   ├── HeroHeadline (centered text)
│   └── HeroSearch (glassmorphic search bar)
├── BentoGrid
│   ├── ExperienceCard (×5, reusable)
│   │   ├── CardImage (next/image, fill, priority for card A)
│   │   ├── CardGradient (overlay div)
│   │   └── CardInfo
│   │       ├── GuideAvatar (initials circle or image)
│   │       ├── GuideDetails (name, location)
│   │       ├── ExperienceTitle
│   │       ├── StarRating (gold stars + count)
│   │       └── Price
```

### 3.2 Component specs

#### `HeroSection`
- Container: `relative w-full h-[60vh] min-h-[480px] max-h-[720px] overflow-hidden`
- Background: `next/image` with `fill`, `priority`, `sizes="100vw"`, `className="object-cover"`
- Gradient overlay: `absolute inset-0` with `bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent`
- Content: `absolute inset-0 flex flex-col items-center justify-center`

#### `HeroNav`
- Container: `absolute top-6 right-6 z-10 flex gap-2`
- Each pill: `<Link>` with `rounded-full bg-white/10 backdrop-blur-md px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors`
- Active state (Destinations): `bg-white/20`
- Items: Destinations → `/listings`, Experiences → `/listings`, About → `/trust`, Profile → `/auth`

#### `HeroSearch`
- Container: `relative flex items-center w-full max-w-[480px] h-[52px] rounded-full bg-white/10 backdrop-blur-md border border-white/10`
- Search icon: `lucide-react` `Search`, `size-5`, `text-white/50`, positioned `ml-4`
- Input: native `<input>` styled with Tailwind (not shadcn Input — different visual language): `bg-transparent text-white placeholder:text-white/50 text-[15px] flex-1 px-3 outline-none`
- Submit button: `<button>` or `<Link>`, `absolute right-1.5`, `size-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors`
- Arrow icon: `lucide-react` `ArrowUpRight`, `size-5 text-white`

#### `ExperienceCard`
- Container: `relative overflow-hidden rounded-2xl cursor-pointer group`
- Image: `next/image` with `fill`, `sizes` responsive, `className="object-cover transition-transform duration-500 group-hover:scale-105"`
- Gradient: `absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent`
- Info block: `absolute bottom-0 left-0 right-0 p-4 sm:p-5`

#### `GuideAvatar` (initials-based)
- Container: `flex items-center justify-center size-11 sm:size-12 rounded-full bg-white/20 border-2 border-white/40 text-white text-sm font-bold backdrop-blur-sm`
- Content: first letter of first name + first letter of last name
- If `avatarUrl` is provided: `next/image` with `fill` inside the circle instead

#### `StarRating`
- Render N filled `Star` icons from lucide-react with `className="size-3 fill-yellow-400 text-yellow-400"`
- Rating number: `text-xs font-semibold text-white/80`
- Review count: `text-xs text-white/60`

---

## 4. Styling Approach

### 4.1 Dark theme scoping
The homepage wraps everything in a container with a near-black background. This does NOT modify global CSS variables — it applies dark colors inline via Tailwind utilities.

```tsx
<div className="bg-[#0f0f0f] text-white">
  {/* entire homepage content */}
</div>
```

### 4.2 Tailwind utilities used

| Effect | Tailwind Classes |
|---|---|
| Glassmorphism | `bg-white/10 backdrop-blur-md border border-white/10` |
| Card gradient | `bg-gradient-to-t from-black/80 via-black/20 to-transparent` |
| Hero gradient | `bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent` |
| Bento grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4` |
| Tall card span | `lg:row-span-2` |
| Fixed row heights | `auto-rows-[280px] lg:auto-rows-[300px]` (cards B–E) |
| Pill shape | `rounded-full` |
| Card radius | `rounded-2xl` |
| Card hover | `group-hover:scale-105` on image, `transition-transform duration-500` |
| Text shadow | `[text-shadow:0_2px_12px_rgba(0,0,0,0.4)]` (arbitrary Tailwind value) |

### 4.3 No new CSS classes needed
Everything is achievable with Tailwind v4 utilities. No additions to `globals.css`.

### 4.4 Fonts
Keep `Plus Jakarta Sans` (already loaded in current page.tsx) as the `--font-sans` for the homepage. The current root layout loads `Geist` — the homepage can load its own font instance the same way the current page already does.

---

## 5. Bento Grid Implementation

### 5.1 Grid CSS

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
  <!-- Card A: tall left -->
  <div class="lg:row-span-2 min-h-[400px] md:min-h-[500px] lg:min-h-0">...</div>
  <!-- Card B: center top -->
  <div class="min-h-[280px]">...</div>
  <!-- Card D: right top -->
  <div class="min-h-[280px]">...</div>
  <!-- Card C: center bottom -->
  <div class="min-h-[280px]">...</div>
  <!-- Card E: right bottom -->
  <div class="min-h-[280px]">...</div>
</div>
```

DOM order matters for CSS Grid auto-placement:
- Card A (row-span-2) must be first
- Cards B, D, C, E follow in reading order (left-to-right, top-to-bottom)

With `grid-auto-flow: dense` (Tailwind: `grid-flow-dense`), the grid engine fills gaps automatically even if the DOM order doesn't match visual order.

### 5.2 Row height control

Use `auto-rows` with a fixed height so that 2× the row height equals the tall card:

```
lg:auto-rows-[300px]
```

Card A with `lg:row-span-2` → 600px + gap = ~616px total.
Cards B–E each → 300px.

On mobile/tablet: all cards get `min-h-[280px]` and stack in a single or two columns.

---

## 6. Responsive Behavior

### Mobile (< 640px)
- Hero: `h-[50vh] min-h-[400px]`
- Headline: `text-3xl` (30–32px)
- Search bar: `w-[90%]`
- Nav pills: hidden; hamburger or bottom bar instead (use a `Sheet` from shadcn for mobile menu, triggered by a floating menu button)
- Cards: single column, each `min-h-[240px]`, `aspect-video` or similar
- Card A loses `row-span-2`, becomes same height as others

### Tablet (640–1023px)
- Hero: `h-[55vh]`
- Headline: `text-4xl`
- Grid: `grid-cols-2`
- Card A: `row-span-2` still works in 2-col mode (takes left column full height)
- Cards B–E: stack in right column

### Desktop (1024px+)
- Hero: `h-[60vh] max-h-[720px]`
- Headline: `text-5xl` (48px)
- Grid: `grid-cols-3` — full bento layout
- All spacing and sizes per LAYOUT.md spec

---

## 7. Step-by-Step Implementation Order

### Step 1: Extend data layer
1. Add `imageUrl?: string` and `guideAvatarUrl?: string` to `PublicListing` type
2. Add `avatarUrl?: string` to `PublicGuideProfile` type
3. Add 5 international seed listings with Unsplash URLs
4. Add 4 international seed guides
5. Verify TypeScript compiles: `bun run typecheck`

### Step 2: Build the hero section
1. Clear the existing `page.tsx` content
2. Build the dark wrapper div with negative margins to escape layout constraints
3. Add the hero section with `next/image` background, gradient overlay, floating nav, centered headline, and search bar
4. Verify visually with `bun dev`

### Step 3: Build the ExperienceCard component
1. Create the `ExperienceCard` function component inside `page.tsx`
2. Implement: full-bleed image → gradient overlay → info block (avatar, name, location, title, rating, price)
3. Wire up to seed data

### Step 4: Build the bento grid
1. Create the 3-column bento grid container
2. Place 5 `ExperienceCard` instances with correct grid placement
3. Card A gets `lg:row-span-2`
4. Verify responsive behavior at all breakpoints

### Step 5: Mobile navigation
1. Add a floating menu button (hamburger) visible only on `sm:hidden`
2. Consider using shadcn `Sheet` for the slide-out mobile menu
3. This requires `"use client"` — extract the mobile nav into a tiny client component

### Step 6: Polish and interactions
1. Add hover effects on cards (`group-hover:scale-105` on images)
2. Add `transition-colors` on nav pills
3. Add focus ring on search bar
4. Verify `priority` is set on the hero image and Card A image for LCP
5. Run `bun run lint` and `bun run typecheck`

### Step 7: Visual verification
1. Screenshot the page at 1440px, 768px, and 375px widths
2. Compare against `public/image.png` reference
3. Adjust spacing, font sizes, gradient intensity as needed

---

## 8. Dependencies Check

| Need | Status | Action |
|---|---|---|
| `next/image` | Available (Next.js 16) | None |
| `lucide-react` | Available (v0.577) | Uses: `Search`, `ArrowUpRight`, `Star`, `Menu` |
| `framer-motion` | Available (v12) | Optional: card entrance animations |
| Tailwind CSS v4 | Available | Uses: `backdrop-blur-md`, `bg-white/10`, `grid`, `row-span-2`, arbitrary values |
| shadcn `Sheet` | Not installed | Install via `bunx shadcn@latest add sheet` if mobile nav uses slide-out |
| shadcn `Avatar` | Not installed | Not needed — use custom initials circle |
| `Plus Jakarta Sans` font | Already loaded in current `page.tsx` | Reuse same font loading pattern |
| Unsplash images | `next.config.ts` already allows `images.unsplash.com` | None |

### Install before starting (if mobile sheet is needed):
```bash
bunx shadcn@latest add sheet
```

---

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Breaking out of layout padding with negative margins is fragile | Medium | Test at all breakpoints; the negative margin values must exactly match `(site)/layout.tsx` padding values (`px-4 py-6 sm:px-6 md:py-10 lg:px-8`) |
| Hero image LCP regression | High | Set `priority` on hero image; use static import with `placeholder="blur"` if possible; else use `sizes="100vw"` |
| Unsplash images load slowly on first visit | Low | `next/image` handles srcset and format optimization; use `quality={80}` |
| Existing Russian seed data must remain intact | Low | Only add new entries; don't modify existing seeds |
| Mobile nav requires client component | Low | Extract only the mobile nav toggle into a small `"use client"` component; the rest stays server |
| SiteHeader is visible before hero loads and then gets overlaid | Low | Set `z-index` on homepage wrapper higher than header's `z-40`; use `z-50` on the hero |

---

## 10. Quality Checklist

After implementation, verify:

- [ ] Homepage renders the dark theme with full-bleed hero at `/`
- [ ] Hero image loads with priority, no layout shift
- [ ] Navigation pills are visible and clickable over the hero
- [ ] Search bar is glassmorphic with working input and blue submit button
- [ ] Bento grid shows 5 cards in the correct layout on desktop (3-col, A spans 2 rows)
- [ ] Each card shows: photo, guide avatar/initials, name, location, experience title, star rating, price
- [ ] Cards have hover effect (image scale + gradient intensify)
- [ ] Responsive: single column on mobile, 2-col on tablet, 3-col on desktop
- [ ] Mobile nav works (hamburger → sheet or pill collapse)
- [ ] No TypeScript errors (`bun run typecheck`)
- [ ] No lint errors (`bun run lint`)
- [ ] Other public pages (`/listings`, `/trust`, etc.) still use the light theme and `SiteHeader` — not affected
- [ ] Footer still renders below the homepage content
- [ ] Page is a server component (no `"use client"` on the main page)
