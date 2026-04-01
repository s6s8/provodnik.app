# Provodnik Design System
> Source of truth for all page refactors. Every decision in this file was tested and validated in the `index.html` rebuild. Apply it as-is to all other pages — no exceptions, no improvisation.

---

## 1. Philosophy

**One idea per section. One action per screen.**

Provodnik is a marketplace for trust. Travelers hand money and free time to strangers. Every visual decision must earn that trust before a single word is read.

This means:

- **Space communicates confidence.** Crowded pages signal desperation. Generous whitespace signals a product that doesn't need to shout.
- **Photography is the product.** Russia's landscapes sell the platform. Give images room to breathe. Never clip them with busy overlays or badge spam.
- **Typography sets the emotional register.** Serif for aspiration, sans-serif for clarity. Never mix their roles.
- **Glass surfaces, not flat cards.** Every floating UI element should feel like it belongs in the environment — translucent, light, part of the scene.
- **Copy is load-bearing.** Every headline, label, and CTA was written to a specific purpose. Placeholder text is a defect, not a detail.

**The test:** If you removed all the colors and kept only the structure and copy, would the page still make sense? If yes, the design is working.

---

## 2. Design Tokens

All values live as CSS custom properties on `:root`. Never use hardcoded hex values outside this block.

```css
:root {
  /* Color */
  --primary:            #0058be;   /* anchor of trust — buttons, active states, nav */
  --primary-hover:      #2170e4;   /* hover elevation */
  --surface:            #f9f9ff;   /* page canvas — cool crisp white-blue */
  --surface-low:        #f3f3fa;   /* secondary section backgrounds */
  --surface-lowest:     #ffffff;   /* interactive cards — "lift" effect */
  --on-surface:         #191c20;   /* primary text — never pure black */
  --on-surface-muted:   #5a5e6b;   /* secondary text, labels, captions */
  --outline-variant:    #c2c6d6;   /* ghost borders — inputs only, at low opacity */
  --footer-bg:          #0f172a;   /* the only dark element — closure */

  /* Glass surface */
  --glass-bg:     rgba(249, 249, 255, 0.60);
  --glass-border: rgba(194, 198, 214, 0.18);
  --glass-blur:   blur(20px);
  --glass-shadow: 0 8px 32px rgba(25, 28, 32, 0.06);
  --glass-radius: 28px;

  /* Cards */
  --card-shadow:  0 4px 24px rgba(25, 28, 32, 0.07);
  --card-radius:  24px;

  /* Typography */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-ui:      'DM Sans', system-ui, sans-serif;

  /* Layout */
  --max-w:   1200px;
  --sec-pad: 80px;          /* vertical section padding */
  --px:      clamp(20px, 4vw, 48px);  /* horizontal page padding */
}
```

### Color Usage Rules

| Token | Where to use | Where NOT to use |
|---|---|---|
| `--primary` | Buttons, active nav, progress bars, icons, links | Section backgrounds, decorative fills |
| `--surface` | Default page background, main sections | Cards (use `--surface-lowest`) |
| `--surface-low` | Alternating section backgrounds (every other section) | Hero overlays |
| `--surface-lowest` | Cards, inputs, tooltips | Large background areas |
| `--on-surface-muted` | Labels, captions, secondary body text, metadata | Headlines, primary CTAs |
| `--footer-bg` | Footer only | Anywhere else on the page |
| `--glass-bg` | Nav, search bars, floating panels, overlaid cards | Inline content blocks |

---

## 3. Typography

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

### Scale

| Role | Font | Size | Weight | Usage |
|---|---|---|---|---|
| Hero headline | Cormorant Garamond | `clamp(2.25rem, 5vw, 3.625rem)` | 600 | One per page — the emotional anchor |
| Section title | Cormorant Garamond | `clamp(1.875rem, 3.5vw, 2.375rem)` | 600 | Section openers |
| Card title large | Cormorant Garamond | `2.375rem` | 600 | Featured destination names |
| Card title small | DM Sans | `1.125rem` | 600 | Inline card headings |
| UI label (kicker) | DM Sans | `0.6875rem` | 500 | UPPERCASE + tracking — section pre-labels |
| Body | DM Sans | `0.875–1rem` | 400 | Paragraphs, descriptions |
| Metadata | DM Sans | `0.75–0.8125rem` | 500 | Prices, counts, dates, tags |
| Button | DM Sans | `0.875rem` | 600 | All CTAs |

### Rules

- **Serif for emotion, sans for function.** Cormorant on headlines and destination names. DM Sans on everything interactive.
- **Never use Inter or Roboto.** They read as generic SaaS. DM Sans has warmth.
- **Line-height on headlines:** `1.05–1.1`. Tight but not cramped.
- **Letter-spacing on kicker labels:** `0.16–0.18em`. Always uppercase. These are wayfinding, not decoration.
- **Body line-height:** `1.55–1.65`. Comfortable for Russian text which tends to run longer.

---

## 4. Glass Morphism — The Most Important Pattern

Every floating UI element (nav, search bar, gateway panel, destination labels) must be frosted, not opaque.

### Required Implementation

```css
.glass-element {
  background: rgba(249, 249, 255, 0.60);          /* --glass-bg */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);             /* Safari */
  border: 1px solid rgba(194, 198, 214, 0.18);     /* --glass-border */
  box-shadow: 0 8px 32px rgba(25, 28, 32, 0.06);   /* --glass-shadow */
  border-radius: 28px;                             /* --glass-radius */
}
```

### Where Glass Applies

| Element | Radius | Notes |
|---|---|---|
| Nav bar | `9999px` (pill) | Fixed position, blurs page content behind it |
| Search bar | `9999px` (pill) | Inside hero, blurs the photo behind it |
| Gateway panel | `28px` | Large frosted container holding request cards |
| Destination overlay labels | `9999px` | Tour count pills on photo cards |
| Hero kicker pill | `9999px` | Lighter glass: `rgba(255,255,255,0.14)` |

### Glass Dos and Don'ts

✓ Apply glass to elements that float over photography or colored backgrounds
✓ Use `--glass-bg` (60% opacity) — not more, not less
✓ Always pair with `box-shadow` for depth
✗ Never use glass on full-width section backgrounds
✗ Never use fully opaque white cards where glass is specified
✗ Never omit `-webkit-backdrop-filter` — Safari will break

---

## 5. Layout System

### Container

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: clamp(20px, 4vw, 48px);
}
```

Every section's content goes inside a `.container`. The container never has background color — the `<section>` does.

### Section Rhythm

Sections alternate between `--surface` and `--surface-low`. This creates visual separation without any divider lines.

```
hero          → no background (full-bleed photo from top:0, nav glass floats above)
gateway       → --surface-low
destinations  → --surface
how it works  → --surface-low
trust strip   → --surface (with very subtle top/bottom rule)
footer        → --footer-bg
```

**The No-Line Rule:** Never use `<hr>`, `border-top`, or any 1px line to separate sections. Use background shifts and `--sec-pad` (80px) spacing. The only exception is the trust strip, which uses a single subtle line at 40% opacity to frame the strip — not separate it from adjacent sections.

### Section Padding

```css
.section { padding-block: var(--sec-pad); } /* 80px top and bottom */
```

Reduce to `56px` on mobile (`max-width: 767px`).

### Grid Patterns Used in This Project

| Pattern | CSS | Used on |
|---|---|---|
| 3-equal | `grid-template-columns: repeat(3, 1fr)` | Request cards, trust strip, footer |
| Featured + 2×2 | `grid-template-columns: 1.35fr 1fr 1fr` + `grid-template-rows: Xpx Xpx` | Destinations |
| Flex steps with connectors | `display: flex` + `.connector` dividers | How it works |
| Tab bar + panel swap | `role="tablist"` React state | Gateway |

---

## 6. Component Patterns

### 6.1 Buttons

Two variants only. No tertiary, no icon-only (except social).

```css
/* Primary — filled blue pill */
.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 22px; border-radius: 9999px;
  background: var(--primary); color: #fff;
  font-size: 0.875rem; font-weight: 600;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.87; }

/* Ghost — outlined, primary-tinted */
.btn-ghost {
  padding: 9px 18px; border-radius: 9999px;
  border: 1px solid rgba(0, 88, 190, 0.22);
  color: var(--primary);
  font-size: 0.875rem; font-weight: 500;
  transition: background 0.15s, border-color 0.15s;
}
.btn-ghost:hover { background: rgba(0, 88, 190, 0.05); border-color: var(--primary); }
```

**Button placement rules:**
- One primary CTA per section maximum
- Ghost button for secondary actions (login, "view all", cancel)
- Never place two primary buttons side by side
- CTAs inside glass panels use `.btn-primary` centered below content

### 6.2 Section Labels (Kickers)

Every section opener has a kicker label above the headline:

```html
<p class="sec-label">Как это работает</p>
<h2 class="sec-title">Три шага от идеи до поездки</h2>
```

```css
.sec-label {
  font-size: 0.6875rem; font-weight: 500;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--on-surface-muted);
  margin-bottom: 8px;
}
.sec-title {
  font-family: var(--font-display);
  font-size: clamp(1.875rem, 3.5vw, 2.375rem);
  font-weight: 600; line-height: 1.1;
  color: var(--on-surface);
}
```

### 6.3 Cards

Cards come in two weights:

**Content cards** (request cards, guide cards) — white background, soft shadow, no border:
```css
.card {
  background: var(--surface-lowest);
  border-radius: var(--card-radius); /* 24px */
  padding: 20px;
  box-shadow: var(--card-shadow);
  transition: transform 0.15s;
}
.card:hover { transform: translateY(-3px); }
```

**Photo cards** (destinations, tour listings) — full bleed image, dark gradient overlay, no background color:
```css
.photo-card {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}
.photo-card-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.78) 0%,
    rgba(15, 23, 42, 0.06) 55%
  );
}
```

**Rules:**
- Cards never have `border: 1px solid` for decoration — only glass elements do
- Card hover is always `translateY(-3px)` — consistent, subtle, responsive
- No rounded corners below `20px` on any card element

### 6.4 Progress Bars

Used in request cards to show group fill rate:

```css
.bar { height: 4px; background: var(--surface-low); border-radius: 9999px; }
.bar-fill { height: 100%; background: var(--primary); border-radius: 9999px; }
```

Set width via inline `style="width: X%"` based on data.

### 6.5 Avatar Stack

```css
.avatars { display: flex; }
.avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--surface-low);
  border: 2px solid var(--surface-lowest);
  margin-left: -6px;
  font-size: 0.5625rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.avatar:first-child { margin-left: 0; }
```

### 6.6 Nav

Fixed pill nav. Glass surface. Three center links only. Two CTAs on the right.

```
[Provodnik wordmark]  [Направления · Гиды · Как это работает]  [Войти ghost] [Создать запрос primary]
```

Active state: `color: var(--primary)` + 4px dot below via `::after` pseudo-element.
Mobile: hide center links, hide ghost CTA, keep logo + primary CTA.

**Nav / hero relationship — DECIDED:**
The nav is `position: fixed` and floats above the page as a glass pill. Hero sections are **full-bleed from `top: 0`** — the photo runs behind the nav. The layout wrapper adds `padding-top: var(--nav-h)` (88px) to push non-hero pages below the nav. Hero pages cancel this with `.hero-bleed { margin-top: calc(-1 * var(--nav-h)) }` to reclaim the full viewport. Hero content (title, kicker) must have its own `padding-top` of at least `calc(var(--nav-h) + 48px)` so text starts clearly below the glass nav.

```css
:root {
  --nav-h: 88px; /* single source of truth — matches site-header height */
}

.hero-bleed {
  margin-top: calc(-1 * var(--nav-h));
}

/* Inner content must clear the nav */
.photo-hero-content {
  padding-top: calc(var(--nav-h) + 48px);
}
```

All pages with photo heroes use `.hero-bleed` + `.photo-hero` on the `<section>`, and `.photo-hero-content` on the inner container. No inline `style` padding overrides.

### 6.7 Gateway Tab Bar

The homepage gateway uses a **tab bar** pattern — not two side-by-side boxes. This is the decided, final pattern.

Two tabs: **"Я путешественник"** | **"Я гид"**

Each tab reveals a glass panel with 3 request cards + a CTA below. One panel visible at a time.

```tsx
const [activeTab, setActiveTab] = useState<"traveler" | "guide">("traveler");

<div role="tablist" className="gateway-tabs">
  <button role="tab" aria-selected={isTraveler} aria-controls="panel-traveler">Я путешественник</button>
  <button role="tab" aria-selected={!isTraveler} aria-controls="panel-guide">Я гид</button>
</div>

<div role="tabpanel" id="panel-traveler" hidden={!isTraveler} className="glass-panel gateway-panel">
  {/* 3 request cards + Создать запрос CTA */}
</div>
<div role="tabpanel" id="panel-guide" hidden={isTraveler} className="glass-panel gateway-panel">
  {/* 3 request cards + Предложить цену CTA */}
</div>
```

Always use `role="tablist"` / `role="tab"` / `role="tabpanel"` + `aria-selected` for accessibility.

---

## 7. Copy Principles

### Voice

**Confident, warm, precise.** Not startup-excited. Not corporate-stiff. The voice of someone who has been to Baikal and knows exactly what makes it extraordinary.

### Headline Formula

Hero headlines follow a two-part structure:
1. **Action or state** — what the user does or experiences
2. **Differentiator** — why Provodnik makes it possible

> *"Путешествуйте по России / с теми, кто знает каждый камень"*

Section titles compress the value into one clause:
> *"Три шага от идеи до поездки"*
> *"Российские маршруты, которые собирают группы быстрее всего"*

### Label Hierarchy

Every section has three text levels:

```
SECTION LABEL       ← 0.6875rem, uppercase, muted — orients the user
Section Title       ← Cormorant Garamond, 2rem+, on-surface — emotional hook
Body / description  ← DM Sans, 0.875rem, muted — functional detail
```

Never skip a level. Never repeat information across levels.

### CTA Copy Rules

| Context | Copy |
|---|---|
| Primary hero CTA | "Создать запрос" — concrete action, not vague |
| Secondary hero link | "Найти группу →" — arrow signals it's a navigation, not commitment |
| Section CTA | Matches the section's goal: "Предложить цену", "Смотреть туры" |
| Nav primary | "Создать запрос" — same as hero, consistent anchor |
| Nav ghost | "Войти" — single word, no decoration |

**Arrow → only on text links, never on buttons.** The arrow signals "navigate", the pill button signals "act".

### What Never Appears in Copy

- Placeholder / lorem ipsum of any kind
- "Новинка" / "Хит" badges except one maximum per section where functionally meaningful
- Garbled or machine-translated Russian
- Redundant CTAs (same label in hero + card + section = zero)
- Exclamation marks in headlines

---

## 8. Image Strategy

### Photography Guidelines

All images are Unsplash. Use `?auto=format&fit=crop&q=80` params always.

| Section | Image style | Suggested subjects |
|---|---|---|
| Hero | Cinematic landscape, warm morning light, human presence (small scale) | Lake Baikal shoreline, mountain passes |
| Destination featured | Iconic, recognizable, rich color | Baikal blue, Kazan kremlin towers |
| Destination grid | Atmospheric, mood-first | Golden light, architectural silhouettes |
| Guide profiles | Portrait, authentic setting | Guide in natural environment, not studio |
| Tour listings | Activity in context | Small group, local setting |

### Overlay Gradient (photo cards)

Always dark-to-transparent from the bottom:
```css
background: linear-gradient(
  to top,
  rgba(15, 23, 42, 0.78) 0%,   /* dark base — readable text */
  rgba(15, 23, 42, 0.06) 55%    /* fades to photo */
);
```

For hero overlays (full-page) use top-to-bottom directional:
```css
background: linear-gradient(
  to bottom,
  rgba(25, 28, 32, 0.12) 0%,
  rgba(25, 28, 32, 0.38) 55%,
  rgba(25, 28, 32, 0.60) 100%
);
```

---

## 9. Responsive Breakpoints

```css
/* Desktop first — these are the only breakpoints needed */
@media (max-width: 1023px) { /* tablet */ }
@media (max-width: 767px)  { /* mobile */ }
@media (max-width: 479px)  { /* small mobile — flex-col adjustments only */ }
```

### Responsive Rules per Component

| Component | 1024px+ | 768–1023px | <768px |
|---|---|---|---|
| Nav links | Visible | Hidden | Hidden |
| Nav ghost CTA | Visible | Visible | Hidden |
| 3-col grid | 3 columns | 2 columns | 1 column |
| Destination grid | Featured spans 2 rows + 2×2 | Featured spans 2 cols + 2×2 | All stacked |
| HIW steps | Horizontal flex | Vertical flex | Vertical flex |
| HIW connector | Visible | Hidden | Hidden |
| Trust strip | 3 columns | 3 columns | 1 column |
| Footer grid | 3 columns | 2 columns | 1 column |
| Section padding | 80px | 80px | 56px |

---

## 10. What to Remove on Every Page

Before writing a single line, audit the existing page and strip these:

| Pattern | Why it's wrong |
|---|---|
| `border: 1px solid` between sections | Violates No-Line Rule — use background shifts |
| Opaque white cards over photography | Must be glass (`rgba(249,249,255,0.60)` + blur) |
| 5-item nav | 3 items + 2 CTAs only |
| Amber/orange "Новинка" / "Хит" badges | Dilutes premium feel — remove or max 1 per section |
| Lorem ipsum / garbled copy | Defect — replace with real Russian copy |
| Generic compass icon as logo | Replace with wordmark "Provodnik" in Cormorant |
| `<hr>` or decorative rules | No section dividers |
| Multiple CTAs in the same hero | One action per screen |
| Tailwind CSS dependency | All pages use embedded `<style>` with CSS custom properties |
| Instagram social link | VK + Telegram only |

---

## 11. Page-by-Page Refactor Notes

### `requests.html` — Marketplace / Birzha
- Hero: compact, no cinematic photo — surface-low background, centered search/filter bar
- Layout: sidebar filters (left) + request card list (right) — `grid-template-columns: 280px 1fr`
- Request card: same pattern as index gateway cards, full width
- Filter chips: ghost pill buttons, `--primary` fill when active
- Pagination: simple text links, no heavy pagination UI

### `request-details.html` — Single Request
- Header: destination name (serif large) + metadata strip (dates, group size, budget)
- Two-panel: request description (left) + guide bid sidebar (right)
- Guide bids: cards with avatar, name, price, short pitch — `btn-primary` "Принять"
- Status strip: progress bar showing group fill + current members

### `create-request.html` — Form
- Single-column layout, max-width 640px, centered
- Section label: "Новый запрос"
- Fields: glass input style (border: `1px solid rgba(194,198,214,0.35)`, focus: `border-color: var(--primary)`)
- Stepwise flow if long: 3 steps matching HIW pattern (numbered, visual progress)
- Submit: full-width `btn-primary` at bottom

### `destination.html` — Destination Profile
- Hero: full-width photo (same as homepage featured card, expanded)
- Description: serif large left, metadata right (best season, avg group size, avg price)
- Tour listings grid below: 3-column photo cards, same pattern as destination grid
- No badges

### `guide.html` — Guide Profile
- Hero: portrait photo left + credentials right
- Rating, verified badge (checkmark svg in `--primary`), trip count
- Tour cards: same photo-card pattern
- Reviews: clean list — no star decorations, just the rating number + review text

### `tour.html` — Tour Listing / Detail
- Photo gallery: large primary image + thumbnail strip
- Price block: glass panel, sticky on desktop, bottom sheet on mobile
- Itinerary: numbered list with day labels (DM Sans, bold, `--on-surface-muted`)

### `dashboard.html` — Traveler Dashboard
- Two-column: sidebar nav (left, 240px) + content area (right)
- Content cards match index request card pattern
- Tabs for: Active trips / Past trips / Saved

---

## 12. CSS File Pattern

Every page uses **embedded CSS** in a `<style>` block. No external CSS dependencies except Google Fonts.

### Starter Template

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Provodnik — [Page Name]</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    /* 1. Design tokens (:root) */
    /* 2. Base reset */
    /* 3. Layout helpers (.container) */
    /* 4. Button primitives (.btn-primary, .btn-ghost) */
    /* 5. Nav (copy verbatim from index.html) */
    /* 6. Page-specific sections */
    /* 7. Responsive breakpoints */
  </style>
</head>
<body>
  <!-- Nav: copy verbatim from index.html — identical across all pages -->
  <!-- Page content -->
  <!-- Footer: copy verbatim from index.html — identical across all pages -->
</body>
</html>
```

**Nav and Footer are identical on every page.** Copy them verbatim from `index.html`. Change only `aria-current="page"` on the active nav link.

---

## 13. Skills Used in the Index Rebuild

A record of every technique applied and why, for reference when making judgment calls on other pages.

| Skill | Application | Rationale |
|---|---|---|
| **CSS custom properties as design tokens** | All colors, spacing, fonts defined in `:root` | Single source of truth — change a token, every page updates |
| **`clamp()` for fluid type** | `font-size: clamp(2.25rem, 5vw, 3.625rem)` | Type scales smoothly between mobile and desktop without breakpoints |
| **`clamp()` for fluid padding** | `padding-inline: clamp(20px, 4vw, 48px)` | Container padding adjusts fluidly — no snapping |
| **`backdrop-filter` glassmorphism** | Nav, search bar, gateway panel | Creates depth without layering opaque elements |
| **`-webkit-backdrop-filter` prefix** | All glass elements | Safari requires the vendor prefix — omitting breaks iOS |
| **Fixed nav with glass** | `position: fixed` + glassmorphism | Nav blurs page content as user scrolls — cinematic effect |
| **Photo card gradient overlays** | Destination cards | Bottom-up dark gradient ensures text is always readable on any photo |
| **CSS Grid `grid-row: span 2`** | Destination featured card | Featured card spans full row height with no JS |
| **`display: flex` with `align-items: flex-start`** | HIW steps | Allows connector line to align with step number center via `margin-top` |
| **`role="tablist"` / `role="tabpanel"`** | Gateway role toggle | Accessible tab pattern — screen readers announce the toggle correctly |
| **`transform: translateY(-3px)` on hover** | Cards | Subtle lift — responsive and GPU-accelerated |
| **Avatar stack with negative `margin-left`** | Request cards | Classic overlap pattern — visually communicates group membership |
| **`aria-current="page"` on nav links** | Navigation | Tells screen readers which page is active without CSS-only reliance |
| **`border-bottom: 1px solid rgba(..., 0.40)`** | Trust strip | The single permitted rule — at low opacity it frames without dividing |
| **Alternating `--surface` / `--surface-low` sections** | All sections | Creates rhythm and separation with zero decorative elements |
| **Inline `style="width: X%"` on progress bars** | Request cards | Progress is data — belongs in HTML, not CSS |
| **`role="search"` on search form** | Hero search | ARIA landmark — assistive tech users can jump directly to search |
| **`font-size: 0.6875rem` for kicker labels** | Section pre-labels | 11px in a 16px base — small enough to be subordinate, bold enough to track |
