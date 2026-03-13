# Home Page Layout — Forensic Specification

Reference: `public/image.png`

---

## 1. Global Canvas

| Property         | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| Background       | Near-black `#0f0f0f` – `#111111`                         |
| Max-width        | Edge-to-edge; content grid constrained to ~1400px center |
| Side padding     | 16–24px on mobile, 24–32px on desktop                    |
| Font stack       | Modern geometric sans-serif (Plus Jakarta Sans or Inter) |
| Base text color  | `#ffffff`                                                |
| Radius language  | 16–20px cards, full-pill for nav/search/buttons          |
| Grid gap         | 12–16px between all cards                                |

---

## 2. Hero Section

Full-bleed area occupying roughly **55–60 vh** of the initial viewport.

### 2.1 Background Image

- **Content**: Wide-angle lifestyle photo of a small group walking through a historic European old town (Mediterranean stone architecture, warm natural light).
- **Treatment**: Dark gradient overlay bottom → center, roughly `linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, transparent 80%)` so the upper image stays vivid while the lower portion fades into the page background.
- **Sizing**: `object-fit: cover`, full width + height of the hero container.

### 2.2 Navigation Bar

| Property      | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Position      | Top-right, `absolute` within hero, ~24px from top and right edges   |
| Layout        | Horizontal flex row, gap 6–8px                                      |
| Items         | 4 pills: **Destinations** · **Experiences** · **About** · **Profile** |
| Pill style    | `rounded-full`, semi-transparent bg `rgba(255,255,255,0.10–0.15)`, backdrop-blur |
| Active pill   | Slightly more opaque bg `rgba(255,255,255,0.20)` or subtle border  |
| Typography    | 14px, font-weight 500, white, tracking normal                      |
| Pill padding  | `px-4 py-2`                                                        |

### 2.3 Headline

| Property       | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Text           | "Discover authentic experiences with local experts"        |
| Position       | Centered horizontally and vertically in the hero           |
| Font size      | 48–56px desktop, 32–36px mobile                            |
| Font weight    | 600 (semibold)                                             |
| Line height    | 1.1                                                        |
| Color          | `#ffffff`                                                  |
| Max width      | ~720px to force a 2-line wrap                              |
| Text align     | Center                                                     |
| Text shadow    | Subtle `0 2px 12px rgba(0,0,0,0.4)` for legibility        |

### 2.4 Search Bar

| Property           | Value                                                         |
| ------------------ | ------------------------------------------------------------- |
| Position           | Centered, ~24–32px below headline                             |
| Width              | 420–480px desktop, 90% on mobile                              |
| Height             | 50–54px                                                       |
| Shape              | `rounded-full` pill                                           |
| Background         | Semi-transparent dark `rgba(255,255,255,0.08–0.12)` + `backdrop-blur-md` |
| Border             | 1px `rgba(255,255,255,0.10)`                                  |
| Left icon          | Magnifying glass (Search), `size-5`, `text-white/50`          |
| Placeholder        | "Where to next?", 15px, `text-white/50`                       |
| Submit button      | Circular, 38–40px, filled blue `#3B82F6`, white arrow-up-right icon inside |
| Submit hover       | Brighten to `#60A5FA`                                         |

---

## 3. Experience Cards Grid (Bento Grid)

Immediately below the hero, **no visible section break** — the dark background continues seamlessly.

### 3.1 Grid Structure

```
┌───────────────────┬────────────────┬────────────────┐
│                   │                │                │
│   TALL CARD (A)   │   CARD (B)     │   CARD (D)     │
│   spans 2 rows    │   ~50% height  │   ~50% height  │
│                   │                │                │
│                   ├────────────────┼────────────────┤
│                   │                │                │
│                   │   CARD (C)     │   CARD (E)     │
│                   │   ~50% height  │   ~50% height  │
│                   │                │                │
└───────────────────┴────────────────┴────────────────┘
```

| Property          | Value                                                   |
| ----------------- | ------------------------------------------------------- |
| Columns           | 3 equal-width (desktop); 1 column on mobile             |
| Grid definition   | `grid-template-columns: 1fr 1fr 1fr`                    |
| Row behavior      | Card A: `grid-row: span 2`; cards B–E each occupy 1 row |
| Gap               | 12–16px                                                 |
| Container padding | 24–32px horizontal, 0 top (flush with hero bottom)      |

### 3.2 Card A — Left, Tall

| Property     | Value                                                            |
| ------------ | ---------------------------------------------------------------- |
| Image        | Kyoto autumn scene — stone path, red maples, Japanese pagoda     |
| Aspect       | Tall — spans both grid rows (~600–640px on desktop)              |
| Radius       | 16–20px                                                          |
| Overlay      | Bottom gradient: `linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)` |
| Guide avatar | 48–52px circle, bottom-left, ~20px from edges                   |
| Guide name   | "Sakura Tanaka" — white, 15–16px, font-weight 700               |
| Location     | "Kyoto, Japan" — `text-white/70`, 12–13px                       |
| Title        | "Ancient Forest & Temple Hike" — white, 13–14px, font-weight 600 |
| Rating       | 5 gold stars (`#FACC15`) + "4.9" + "(124)" — 12px, `text-white/70` |
| Price        | "From $85 / person" — 12–13px, `text-white/80`                  |

### 3.3 Card B — Center, Top

| Property     | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Image        | Marrakech spice souk — vibrant spice mounds, market stalls      |
| Guide avatar | 44–48px circle                                                  |
| Guide name   | "Hassan El-Fassi"                                               |
| Location     | "Marrakech, Morocco"                                            |
| Title        | "Medina Food & Spice Tour"                                      |
| Rating       | "4.8 (68)"                                                      |
| Price        | "From $60 / person"                                             |

### 3.4 Card C — Center, Bottom

| Property     | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| Image        | Venice canal — gondola, historic facades, golden light         |
| Guide avatar | 44–48px circle                                                |
| Guide name   | "Marco Rossi"                                                 |
| Location     | "Venice, Italy"                                               |
| Title        | "Hidden Canals Gondola Tour"                                  |
| Rating       | "4.7 (215)"                                                   |
| Price        | "From $120 / person"                                          |

### 3.5 Card D — Right, Top

| Property     | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| Image        | Street art / urban tour — graffiti walls, group with guide     |
| Note         | Guide info overlay is **not visible** or minimal in the reference image; the card may rely on the image alone at this position to create visual breathing room |

### 3.6 Card E — Right, Bottom

| Property     | Value                                                       |
| ------------ | ----------------------------------------------------------- |
| Image        | Berlin street art — colorful murals, small group with guide |
| Guide avatar | 44–48px circle                                              |
| Guide name   | "Lena Weber"                                                |
| Location     | "Berlin, Germany"                                           |
| Title        | "Urban Street Art Safari"                                   |
| Rating       | "4.8 (198)"                                                 |
| Price        | "From $50 / person"                                         |

---

## 4. Shared Card Anatomy

Every experience card follows this structure:

```
┌──────────────────────────────────────┐
│                                      │
│          FULL-BLEED PHOTO            │
│        (object-fit: cover)           │
│                                      │
│  ┌─ gradient overlay ─────────────┐  │
│  │  ○ Avatar   Guide Name        │  │
│  │             Location           │  │
│  │             Experience Title   │  │
│  │  ★★★★★ 4.9 (124)             │  │
│  │  From $85 / person            │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### 4.1 Info Overlay

| Property            | Value                                              |
| ------------------- | -------------------------------------------------- |
| Position            | `absolute bottom-0 left-0 right-0`                 |
| Padding             | 16–20px                                            |
| Background          | Bottom gradient (see per-card specs)                |
| Layout              | Flex column; avatar + text block in a horizontal row, rating + price below |

### 4.2 Avatar

| Property | Value                                             |
| -------- | ------------------------------------------------- |
| Size     | 44–52px                                           |
| Shape    | Circle, `rounded-full`                            |
| Border   | 2px white `border-white/60`                       |
| Position | Inline-start of the text block, vertically centered with name + location |

### 4.3 Typography Stack

| Element           | Size     | Weight | Color           |
| ----------------- | -------- | ------ | --------------- |
| Guide name        | 15–16px  | 700    | `#ffffff`       |
| Location          | 12–13px  | 400    | `text-white/70` |
| Experience title  | 13–14px  | 600    | `#ffffff`       |
| Star icons        | 12px     | —      | `#FACC15` fill  |
| Rating number     | 12–13px  | 600    | `text-white/80` |
| Review count      | 12px     | 400    | `text-white/60` |
| Price ("From...") | 12–13px  | 500    | `text-white/80` |

---

## 5. Color Palette

| Token               | Hex / Value                    | Usage                          |
| -------------------- | ----------------------------- | ------------------------------ |
| `--bg-page`          | `#0f0f0f` – `#111111`         | Page background                |
| `--bg-card-overlay`  | `rgba(0,0,0,0.70–0.85)`       | Card bottom gradient end color |
| `--nav-pill-bg`      | `rgba(255,255,255,0.10–0.15)` | Nav pill background            |
| `--nav-pill-active`  | `rgba(255,255,255,0.20)`      | Active nav pill                |
| `--search-bg`        | `rgba(255,255,255,0.08–0.12)` | Search bar background          |
| `--accent-blue`      | `#3B82F6`                     | Search submit, primary CTA     |
| `--accent-blue-hover`| `#60A5FA`                     | Hover state                    |
| `--star-gold`        | `#FACC15`                     | Star rating fill               |
| `--text-primary`     | `#ffffff`                     | Headlines, names               |
| `--text-secondary`   | `rgba(255,255,255,0.70)`      | Location, metadata             |
| `--text-muted`       | `rgba(255,255,255,0.50)`      | Placeholders, subtle labels    |

---

## 6. Responsive Breakpoints (Intent)

| Breakpoint | Behavior                                                        |
| ---------- | --------------------------------------------------------------- |
| < 640px    | Single column cards; hero headline ~32px; search bar 90% width  |
| 640–1024px | 2-column grid; card A still spans 2 rows in left column         |
| > 1024px   | Full 3-column bento grid as specified                           |

- Navigation collapses to a hamburger or bottom bar on mobile.
- Cards stack vertically on mobile, each at roughly 16:9 aspect.
- Search bar stays centered, width adapts.

---

## 7. Interaction Notes

| Element           | Behavior                                                    |
| ----------------- | ----------------------------------------------------------- |
| Nav pills         | Hover: bg opacity increases; active: stays highlighted      |
| Search bar        | Focus: border glow `ring-1 ring-blue-400/40`                |
| Submit button     | Hover: scale 1.05 + color brighten                          |
| Experience cards  | Hover: subtle scale `1.02` + shadow lift; cursor pointer    |
| Card overlay      | On hover, gradient can intensify slightly for emphasis       |

---

## 8. Key Design Principles Observed

1. **Immersive-first**: No visible header chrome or page borders. The hero image IS the page.
2. **Dark canvas**: The near-black background makes photo cards "float" with cinematic contrast.
3. **Glassmorphism accents**: Nav pills and search bar use transparency + blur, not solid fills.
4. **Bento grid**: Asymmetric card heights (tall left, stacked center/right) create visual rhythm without feeling like a standard product grid.
5. **Photo-dominant cards**: No white card bodies — the full-bleed photo IS the card surface, with text overlaid via gradient.
6. **Minimal UI chrome**: No outlines, no drop shadows on cards, no decorative dividers. Rounded corners and gradient overlays are the only structural affordances.
7. **Guide-centric identity**: Each card leads with the guide's face and name before the experience, reinforcing the marketplace as people-first.
8. **Single CTA**: The search bar is the only interactive element in the hero — no competing buttons or links.
