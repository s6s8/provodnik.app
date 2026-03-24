# Provodnik — Tailwind Refactor Instructions
## Static HTML Source of Truth (design/html/)
### For AI Coder

---

## 0. Scope and Goal

**What exists:**
- `design/html/` — 8 static `.html` files + one monolithic `css/home.css` (~1,600 lines)
- CSS has three conflicting theme layers stacked via body classes (`hw-theme-cool`, `hw-theme-alice`) on top of `:root` — everything fights everything else
- Custom `.hw-` BEM class names throughout

**Goal:**
Refactor only the files inside `design/html/`. Replace all custom CSS with Tailwind utility classes directly in the HTML. Keep the files static HTML — no React, no Next.js, no build framework yet. These files are the design source of truth that will later be migrated to Next.js.

**Preserve:**
- All content, copy, and Russian text exactly as-is
- All images (Unsplash URLs)
- All SVG icons
- The two fonts: Cormorant Garamond (serif headings) + Manrope (sans body)
- The overall layout structure of each page

**Delete entirely:**
- `css/home.css` (and any other .css files in the folder) — replaced by Tailwind
- All `body.hw-theme-*` class logic
- All `.hw-` class names

---

## 1. Tooling Setup

Use **Tailwind CLI** — not the CDN Play script. The CLI produces a real compiled stylesheet that all HTML files link to, and the config will transfer directly to Next.js later.

File structure after setup:

```
design/html/
  package.json
  tailwind.config.js
  input.css                 ← source fed to Tailwind CLI
  css/
    tailwind.css            ← compiled output, linked by all HTML files
  index.html
  requests.html
  request-details.html
  create-request.html
  destination.html
  tour.html
  guide.html
  dashboard.html
```

`package.json`:
```json
{
  "name": "provodnik-html",
  "scripts": {
    "dev":   "tailwindcss -i ./input.css -o ./css/tailwind.css --watch",
    "build": "tailwindcss -i ./input.css -o ./css/tailwind.css --minify"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0"
  }
}
```

Run: `npm install && npm run dev`

---

## 2. Tailwind Config (`tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      colors: {
        // Backgrounds — cold slate, zero blue cast
        surface: {
          DEFAULT: "#f8fafc",   // Slate-50  (replaces broken #f0f8ff Alice Blue)
          panel:   "#f1f5f9",   // Slate-100
          muted:   "#e2e8f0",   // Slate-200
        },

        // Primary accent
        teal: {
          DEFAULT: "#16605d",   // kept from original
          light:   "#0d9488",   // Teal-600  (was #14b8a6 — too cyan)
          bright:  "#14b8a6",   // focus rings only
        },

        // Secondary accent
        amber: {
          DEFAULT: "#d97706",
          bright:  "#f97316",
        },

        // Typography
        ink: {
          DEFAULT: "#0f172a",   // Slate-900
          muted:   "#475569",   // Slate-600
          faint:   "#94a3b8",   // Slate-400
        },

        // Borders
        edge: {
          DEFAULT: "#cbd5e1",   // Slate-300 (replaces blue-200 #bfdbfe)
          soft:    "#e2e8f0",   // Slate-200
        },
      },

      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Cormorant"', 'Georgia', 'serif'],
        sans:  ['"Manrope"', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        pill: "9999px",
        card: "1.75rem",
      },

      boxShadow: {
        card:  "0 4px 16px rgba(15,23,42,0.07)",
        panel: "0 8px 32px rgba(15,23,42,0.10)",
        nav:   "0 10px 34px rgba(15,23,42,0.12)",
      },
    },
  },
  plugins: [],
};
```

---

## 3. `input.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

  body {
    margin: 0;
    font-family: "Manrope", system-ui, sans-serif;
    color: #0f172a;
    background: #f8fafc;
    line-height: 1.5;
    overflow-x: hidden;
  }

  h1, h2, h3 {
    font-family: "Cormorant Garamond", Georgia, serif;
  }
}

@layer utilities {
  /* Frosted glass — nav and cards on white backgrounds */
  .glass {
    background: rgba(248, 250, 252, 0.60);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(203, 213, 225, 0.55);
  }

  /* Frosted glass on dark hero backgrounds */
  .glass-dark {
    background: rgba(15, 23, 42, 0.30);
    backdrop-filter: blur(16px) saturate(150%);
    -webkit-backdrop-filter: blur(16px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  /* Hero overlay — dark slate, no blue tint */
  .hero-overlay {
    background: linear-gradient(
      180deg,
      rgba(15,23,42,0.45) 0%,
      rgba(15,23,42,0.20) 30%,
      rgba(15,23,42,0.25) 55%,
      rgba(15,23,42,0.58) 100%
    );
  }

  /* Image scrim for cards with photo + text overlay */
  .img-scrim {
    background: linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.85) 100%);
  }

  /* Visually hidden — accessibility */
  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }
}
```

---

## 4. Every HTML File — `<head>` Block

Replace the `<head>` in all 8 files with this identical block (only `<title>` changes per page):

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Provodnik — [Page Name]</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Manrope:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="css/tailwind.css" />
</head>
<body class="bg-surface font-sans text-ink antialiased">
```

No more `body class="hw-theme-cool hw-theme-alice"`. No more three CSS file links.

---

## 5. Reusable HTML Patterns

These patterns appear on every page. Copy them verbatim — do not reinvent per page.

### 5.1 Skip Link (first element inside `<body>`)

```html
<a
  href="#main-content"
  class="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-teal focus-visible:text-white focus-visible:rounded-lg focus-visible:font-semibold focus-visible:text-sm"
>
  Перейти к основному содержимому
</a>
```

### 5.2 Navbar

One navbar pattern — works on both hero pages (dark glass) and plain pages (light glass). The difference is only the wrapper class: use `glass-dark` on hero pages, `glass` on light-background pages.

```html
<div class="absolute top-3 inset-x-0 z-30 px-5">
  <nav
    aria-label="Основная навигация"
    class="glass-dark rounded-pill px-5 py-2.5 flex items-center justify-between max-w-5xl mx-auto shadow-nav"
  >
    <!-- Logo -->
    <a href="index.html" class="flex items-center gap-3 font-serif font-semibold text-[1.25rem] text-white no-underline tracking-wide shrink-0">
      <span class="w-10 h-10 rounded-full bg-teal/90 border border-white/40 flex items-center justify-center shadow-sm" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.5)" stroke-width="1.2"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </span>
      Provodnik
    </a>

    <!-- Desktop links -->
    <ul class="hidden md:flex items-center gap-1 list-none m-0 p-0">
      <li><a href="index.html"          class="nav-link">Направления</a></li>
      <li><a href="requests.html"       class="nav-link">Запросы</a></li>
      <li><a href="guide.html"          class="nav-link">Гиды</a></li>
      <li><a href="tour.html"           class="nav-link">Экскурсии</a></li>
      <li><a href="dashboard.html"      class="nav-link">Профиль</a></li>
    </ul>

    <!-- Mobile burger (details/summary — no JS needed) -->
    <details class="md:hidden relative">
      <summary class="list-none cursor-pointer p-2 flex flex-col gap-[5px]" aria-label="Открыть меню">
        <span class="block w-5 h-[2px] bg-white rounded"></span>
        <span class="block w-5 h-[2px] bg-white rounded"></span>
        <span class="block w-5 h-[2px] bg-white rounded"></span>
      </summary>
      <div class="absolute right-0 top-full mt-2 glass rounded-2xl p-4 flex flex-col gap-1 min-w-[180px] shadow-panel">
        <a href="index.html"     class="nav-link-mobile">Направления</a>
        <a href="requests.html"  class="nav-link-mobile">Запросы</a>
        <a href="guide.html"     class="nav-link-mobile">Гиды</a>
        <a href="tour.html"      class="nav-link-mobile">Экскурсии</a>
        <a href="dashboard.html" class="nav-link-mobile">Профиль</a>
      </div>
    </details>
  </nav>
</div>
```

Add these two utilities to `input.css` under `@layer components`:
```css
@layer components {
  .nav-link {
    @apply text-white/90 text-[13px] font-medium px-3.5 py-2 rounded-pill border border-transparent
           hover:bg-white/10 transition-colors no-underline;
  }
  .nav-link.active {
    @apply border-teal-light/80 bg-white/10;
  }
  .nav-link-mobile {
    @apply block text-ink text-sm font-medium px-3 py-2 rounded-lg hover:bg-surface-muted transition-colors no-underline;
  }
}
```

Add `class="active"` to the link matching the current page.

**On pages without a hero image** (create-request, dashboard): wrap the nav in `<div class="relative bg-surface-panel border-b border-edge-soft px-5 py-3">`, use `glass` instead of `glass-dark`, and change logo + link colors from `text-white` to `text-ink`.

### 5.3 Hero Section — Full (Homepage)

```html
<section class="relative min-h-[88vh] flex flex-col overflow-hidden">
  <!-- Background image -->
  <div class="absolute inset-0 bg-[#1a2e2c] bg-cover bg-center"
       style="background-image: url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=85');"
       aria-hidden="true">
    <div class="absolute inset-0 hero-overlay"></div>
  </div>

  <!-- Nav sits here (pattern 5.2) -->

  <!-- Hero content -->
  <div class="relative z-10 flex-1 flex items-center justify-center pt-32 pb-16 px-6">
    <div class="text-center max-w-3xl w-full">
      <p class="text-[11px] uppercase tracking-[0.18em] text-white/90 font-medium mb-3">Provodnik</p>
      <h1 class="font-serif font-semibold text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.12] text-white mb-7 [text-wrap:balance]"
          style="text-shadow: 0 2px 24px rgba(0,0,0,0.35)">
        Настоящие места не ищут в турагентствах
      </h1>
      <!-- Search bar — pattern 5.4 -->
    </div>
  </div>
</section>
```

### 5.4 Hero Section — Subpage (all other pages)

Shorter, `min-h-[42vh]`, same structure:

```html
<section class="relative min-h-[42vh] flex flex-col overflow-hidden">
  <div class="absolute inset-0 bg-[#1a2e2c] bg-cover bg-center"
       style="background-image: url('[PAGE_IMAGE_URL]');" aria-hidden="true">
    <div class="absolute inset-0 hero-overlay"></div>
  </div>

  <!-- Nav (5.2) -->

  <div class="relative z-10 flex-1 flex items-end pb-12 px-6">
    <div class="max-w-5xl w-full mx-auto">
      <p class="text-[11px] uppercase tracking-[0.18em] text-white/90 font-medium mb-2">[KICKER]</p>
      <h1 class="font-serif font-semibold text-3xl md:text-4xl lg:text-5xl leading-tight text-white"
          style="text-shadow: 0 2px 16px rgba(0,0,0,0.35)">
        [PAGE TITLE]
      </h1>
      <p class="text-white/80 text-sm mt-2 max-w-xl">[SUBTITLE IF ANY]</p>
    </div>
  </div>
</section>
```

### 5.5 Search Bar

```html
<form class="flex items-center gap-3 w-full max-w-[600px] mx-auto
             bg-white/90 border border-white/60 rounded-pill
             px-6 py-2 shadow-panel backdrop-blur-sm"
      action="[target].html" method="get" role="search">
  <span class="sr-only"><label for="search-q">Поиск</label></span>
  <input id="search-q" name="q" type="search"
         placeholder="Куда едем?"
         class="flex-1 min-w-0 bg-transparent border-0 outline-none text-base text-ink placeholder:text-ink-faint" />
  <button type="submit"
          class="shrink-0 bg-teal text-white text-sm font-semibold px-5 py-2 rounded-pill
                 hover:bg-teal-light transition-colors flex items-center gap-2">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>
    </svg>
    Найти
  </button>
</form>
```

### 5.6 Request Card

```html
<a href="request-details.html"
   class="block bg-white border border-edge-soft rounded-card p-4 shadow-card
          hover:-translate-y-0.5 hover:shadow-panel transition-all no-underline">

  <!-- Optional badge -->
  <div class="flex items-start justify-between mb-3">
    <span class="font-serif font-semibold text-lg text-ink">[DESTINATION]</span>
    <span class="text-[11px] font-semibold bg-teal text-white px-2.5 py-0.5 rounded-pill">[BADGE]</span>
    <!-- or: <span class="text-[11px] font-semibold bg-amber text-white px-2.5 py-0.5 rounded-pill">Новинка</span> -->
  </div>

  <!-- Date row -->
  <div class="flex items-center gap-1.5 text-xs text-ink-muted mb-1.5">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
    </svg>
    [DATES]
  </div>

  <!-- Price row -->
  <div class="flex items-center gap-1.5 text-xs text-ink-muted mb-3">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
    [PRICE_RANGE]
  </div>

  <!-- Progress bar -->
  <div class="mb-3">
    <div class="flex justify-between text-[11px] text-ink-faint mb-1">
      <span>[N] из [TOTAL] мест</span><span>[N]/[TOTAL]</span>
    </div>
    <div class="h-1.5 bg-surface-muted rounded-pill overflow-hidden">
      <div class="h-full bg-teal-light rounded-pill" style="width: [PERCENT]%"></div>
    </div>
  </div>

  <!-- Avatars -->
  <div class="flex -space-x-2">
    <span class="w-6 h-6 rounded-full border-2 border-white bg-cover bg-center"
          style="background-image: url('https://i.pravatar.cc/80?img=12')" aria-hidden="true"></span>
    <span class="w-6 h-6 rounded-full border-2 border-white bg-cover bg-center"
          style="background-image: url('https://i.pravatar.cc/80?img=33')" aria-hidden="true"></span>
    <span class="w-6 h-6 rounded-full border-2 border-white bg-cover bg-center"
          style="background-image: url('https://i.pravatar.cc/80?img=45')" aria-hidden="true"></span>
  </div>
</a>
```

### 5.7 Tour Card (with photo)

```html
<a href="tour.html"
   class="block bg-white border border-edge-soft rounded-card overflow-hidden shadow-card
          hover:-translate-y-0.5 hover:shadow-panel transition-all no-underline">

  <!-- Photo -->
  <div class="relative h-36 bg-cover bg-center"
       style="background-image: url('[IMAGE_URL]');">
    <div class="absolute inset-0 img-scrim"></div>
    <span class="absolute top-2 left-2 text-[11px] font-semibold bg-teal text-white px-2.5 py-0.5 rounded-pill">Хит</span>
  </div>

  <!-- Body -->
  <div class="p-3">
    <p class="font-serif font-semibold text-base text-ink">[DESTINATION]</p>
    <p class="text-xs text-ink-muted mt-0.5 mb-2">[SUBTITLE]</p>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1 text-amber text-xs font-semibold">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
        </svg>
        [RATING]
      </div>
      <span class="text-xs font-semibold text-ink">от [PRICE]</span>
    </div>
    <div class="flex items-center gap-2 mt-2">
      <span class="w-6 h-6 rounded-full bg-cover bg-center border border-edge-soft"
            style="background-image: url('https://i.pravatar.cc/80?img=12')" aria-hidden="true"></span>
      <span class="text-xs text-ink-muted">[GUIDE_NAME]</span>
    </div>
  </div>
</a>
```

### 5.8 Footer

```html
<footer class="bg-surface-panel border-t border-edge-soft mt-16 py-12">
  <div class="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
    <nav aria-label="О нас">
      <h4 class="font-semibold text-sm text-ink mb-3">О нас</h4>
      <ul class="list-none p-0 m-0 flex flex-col gap-2">
        <li><a href="#" class="text-sm text-ink-muted hover:text-ink no-underline transition-colors">О сервисе</a></li>
        <li><a href="#" class="text-sm text-ink-muted hover:text-ink no-underline transition-colors">Команда</a></li>
        <li><a href="#" class="text-sm text-ink-muted hover:text-ink no-underline transition-colors">Контакты</a></li>
      </ul>
    </nav>
    <nav aria-label="Помощь">
      <h4 class="font-semibold text-sm text-ink mb-3">Помощь</h4>
      <ul class="list-none p-0 m-0 flex flex-col gap-2">
        <li><a href="#" class="text-sm text-ink-muted hover:text-ink no-underline transition-colors">Центр поддержки</a></li>
        <li><a href="#" class="text-sm text-ink-muted hover:text-ink no-underline transition-colors">Для гидов</a></li>
        <li><a href="#" class="text-sm text-ink-muted hover:text-ink no-underline transition-colors">Для путешественников</a></li>
      </ul>
    </nav>
    <nav aria-label="Правила">
      <h4 class="font-semibold text-sm text-ink mb-3">Правила</h4>
      <ul class="list-none p-0 m-0 flex flex-col gap-2">
        <li><a href="#" class="text-sm text-ink-muted hover:text-ink no-underline transition-colors">Условия использования</a></li>
        <li><a href="#" class="text-sm text-ink-muted hover:text-ink no-underline transition-colors">Политика конфиденциальности</a></li>
      </ul>
    </nav>
    <div>
      <h4 class="font-semibold text-sm text-ink mb-3">Соцсети</h4>
      <div class="flex gap-3">
        <a href="#" class="text-sm font-medium text-ink-muted hover:text-teal transition-colors" aria-label="ВКонтакте">VK</a>
        <a href="#" class="text-sm font-medium text-ink-muted hover:text-teal transition-colors" aria-label="Telegram">TG</a>
        <a href="#" class="text-sm font-medium text-ink-muted hover:text-teal transition-colors" aria-label="Instagram">IG</a>
      </div>
    </div>
  </div>
  <div class="max-w-5xl mx-auto px-6 mt-8 pt-6 border-t border-edge-soft flex flex-wrap justify-between gap-3 text-xs text-ink-faint">
    <span>© 2024 Provodnik</span>
    <div class="flex gap-4">
      <a href="#" class="hover:text-ink-muted no-underline transition-colors">Условия сервиса</a>
      <a href="#" class="hover:text-ink-muted no-underline transition-colors">Конфиденциальность</a>
    </div>
  </div>
</footer>
```

---

## 6. Page-by-Page Rebuild

For each page: start from the `<head>` pattern (§4), then compose from the patterns above. Full layout class structure listed below.

### 6.1 `index.html`

```
<body>
  skip-link (5.1)
  <hero section — full height (5.3)>
    nav (5.2, glass-dark)
    h1 + search bar (5.5)
    <!-- Gateway panels — inside the hero, bottom of hero content -->
    <div class="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Left: "Биржа запросов" -->
      <div class="glass-dark rounded-card p-5">
        <h2 class="font-serif text-2xl text-white font-semibold mb-1">Биржа запросов</h2>
        <p class="text-white/70 text-sm mb-4">Присоединяйтесь...</p>
        <div class="flex gap-2 mb-4">
          <a href="create-request.html" class="bg-teal text-white text-sm font-semibold px-4 py-2 rounded-pill hover:bg-teal-light transition-colors no-underline">Создать запрос</a>
          <a href="requests.html" class="bg-white/10 border border-white/25 text-white text-sm font-semibold px-4 py-2 rounded-pill hover:bg-white/20 transition-colors no-underline">Найти группу</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- 3× RequestCard (5.6) in compact form, white bg -->
        </div>
      </div>
      <!-- Right: "Готовые предложения" -->
      <div class="glass-dark rounded-card p-5">
        <h2 class="font-serif text-2xl text-white font-semibold mb-1">Готовые предложения</h2>
        <p class="text-white/70 text-sm mb-4">Выбирайте из действующих предложений...</p>
        <div class="flex gap-2 mb-4">
          <a href="tour.html" class="bg-teal ...">Смотреть каталог</a>
          <a href="destination.html" class="bg-white/10 ...">По направлениям</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- 3× TourCard (5.7) -->
        </div>
      </div>
    </div>
  </hero>

  <main id="main-content">
    <!-- Popular destinations -->
    <section class="max-w-5xl mx-auto px-6 py-12">
      <h2 class="font-serif text-3xl font-semibold text-ink mb-7">Популярные направления</h2>
      <div class="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-5">
        <!-- Feature card (Baikal) -->
        <div class="relative rounded-card min-h-[420px] overflow-hidden bg-cover bg-center"
             style="background-image: url('...')">
          <div class="absolute inset-0 img-scrim"></div>
          <span class="absolute top-4 left-4 text-[11px] font-bold bg-teal text-white px-2.5 py-0.5 rounded-pill">Хит</span>
          <div class="absolute left-6 right-6 bottom-6 text-white z-10">
            <h3 class="font-serif text-2xl font-semibold mb-1">Озеро Байкал</h3>
            <p class="text-sm text-white/80 mb-4">Лёд, тайга и горы — маршруты с проверенными гидами...</p>
            <a href="destination.html" class="inline-block bg-teal text-white text-sm font-semibold px-5 py-2.5 rounded-pill hover:bg-teal-light transition-colors no-underline">Смотреть туры</a>
          </div>
        </div>
        <!-- 2×2 small tiles -->
        <div class="grid grid-cols-2 gap-3">
          <!-- 4× DestinationTile -->
          <a href="#" class="relative rounded-xl overflow-hidden aspect-square block bg-cover bg-center"
             style="background-image: url('...')">
            <div class="absolute inset-0 img-scrim"></div>
            <div class="absolute bottom-3 left-3">
              <strong class="block text-white text-sm font-semibold">Казань</strong>
              <span class="block text-white/70 text-xs">Кремль</span>
              <span class="inline-block mt-1 text-[10px] font-medium text-white border border-white/30 px-2 py-0.5 rounded-pill">14 туров</span>
            </div>
          </a>
          <!-- repeat for Kaliningrad, Suzdal, Murmansk -->
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="bg-surface-panel py-14 px-6">
      <div class="max-w-5xl mx-auto">
        <p class="text-[11px] uppercase tracking-[0.18em] text-teal font-semibold mb-2">Как это работает</p>
        <h2 class="font-serif text-3xl font-semibold text-ink mb-2">Два клика — и твоя поездка уже ищет попутчиков.</h2>
        <p class="text-ink-muted text-sm mb-8">Остальное происходит само.</p>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <!-- 5× StepCard -->
          <div class="bg-white border border-edge-soft rounded-xl p-5 shadow-card">
            <div class="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center mb-3">
              <!-- icon svg -->
            </div>
            <span class="text-xs font-bold text-teal">1</span>
            <h3 class="text-sm font-semibold text-ink mt-1.5 mb-1">Опиши, куда зовёт душа</h3>
            <p class="text-xs text-ink-muted">Направление, даты, компания — за две минуты.</p>
          </div>
          <!-- steps 2–5 -->
        </div>
      </div>
    </section>

    <!-- Trust signals -->
    <section class="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- 3× TrustCard -->
      <div class="flex gap-4 p-5 bg-white border border-edge-soft rounded-xl shadow-card">
        <div class="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
          <!-- icon -->
        </div>
        <div>
          <h3 class="text-sm font-semibold text-ink mb-1">Проверенные гиды</h3>
          <p class="text-xs text-ink-muted">Документы, отзывы и история сделок — до бронирования.</p>
        </div>
      </div>
    </section>
  </main>

  footer (5.8)
</body>
```

### 6.2 `requests.html`

```
body
  skip-link
  hero subpage (5.4) — image: Unsplash mountains, kicker "Биржа", h1 "Открытые группы путешественников"
    nav (5.2 glass-dark)
  main#main-content
    <!-- Filter bar -->
    <div class="max-w-5xl mx-auto px-6 py-5 flex gap-2 flex-wrap">
      <!-- Filter chip button pattern: -->
      <button class="flex items-center gap-1.5 text-sm font-medium text-ink border border-edge rounded-pill px-4 py-2 hover:bg-surface-muted transition-colors">
        [SVG icon] [Label]
      </button>
      <!-- repeat for: Город, Даты, Бюджет, Размер группы -->
    </div>

    <!-- Feature grid -->
    <div class="max-w-5xl mx-auto px-6 mb-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      <!-- Large feature RequestCard (taller, with photo header) -->
      <article class="relative rounded-card overflow-hidden min-h-[280px] bg-cover bg-center shadow-panel"
               style="background-image: url('...')">
        <div class="absolute inset-0 img-scrim"></div>
        <span class="absolute top-3 left-3 text-[11px] font-bold bg-teal text-white px-2.5 py-0.5 rounded-pill">Активен</span>
        <div class="absolute left-5 right-5 bottom-5 text-white">
          <h2 class="font-serif text-xl font-semibold mb-1">Гастрономический тур по Риму</h2>
          <p class="text-sm text-white/80 mb-3">4 участника — Цель: 6 — ~42 $ за чел.</p>
          <div class="flex -space-x-2"><!-- avatars --></div>
        </div>
      </article>
      <!-- Stack of 2 smaller side cards -->
      <div class="flex flex-col gap-3">
        <!-- 2× compact horizontal card -->
        <article class="flex gap-3 bg-white border border-edge-soft rounded-xl p-3 shadow-card">
          <div class="w-20 h-20 rounded-lg bg-cover bg-center shrink-0" style="background-image: url('...')"></div>
          <div>
            <h3 class="font-serif font-semibold text-sm text-ink">Сакура в Киото</h3>
            <p class="text-xs text-ink-muted mt-0.5">2 участника · Цель: 4 · $350/чел.</p>
          </div>
        </article>
      </div>
    </div>

    <!-- Main request grid -->
    <div class="max-w-5xl mx-auto px-6 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- 6× RequestCard (5.6) -->
    </div>
  main
  footer (5.8)
```

### 6.3 `request-details.html`

```
body
  skip-link
  hero subpage (5.4) — destination photo
    nav (5.2 glass-dark)
  main#main-content class="max-w-5xl mx-auto px-6 py-8"
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <!-- Left: summary -->
      <div>
        <h2 class="font-serif text-2xl font-semibold text-ink mb-4">Байкал · 24–26 июля</h2>
        <!-- Meta chips -->
        <div class="flex gap-2 flex-wrap mb-5">
          <span class="text-xs font-medium border border-edge rounded-pill px-3 py-1 text-ink-muted">4–6 участников</span>
          <span class="text-xs font-medium border border-edge rounded-pill px-3 py-1 text-ink-muted">35–50 тыс. ₽/чел.</span>
        </div>
        <!-- Progress -->
        <p class="text-sm font-medium text-ink mb-1.5">Мест занято: 4 из 6</p>
        <div class="h-2 bg-surface-muted rounded-pill overflow-hidden mb-4">
          <div class="h-full bg-teal-light rounded-pill" style="width: 67%"></div>
        </div>
        <!-- Avatars -->
        <div class="flex -space-x-2 mb-6"><!-- 4 avatars --></div>
        <!-- Description -->
        <p class="text-sm text-ink-muted leading-relaxed">Описание запроса...</p>
      </div>
      <!-- Right: action sidebar -->
      <div class="lg:sticky lg:top-24 space-y-3">
        <a href="#"
           class="block w-full text-center bg-teal text-white font-semibold py-3 rounded-pill hover:bg-teal-light transition-colors no-underline">
          Вступить в группу
        </a>
        <div class="bg-surface-panel border border-edge-soft rounded-xl p-4 text-center">
          <p class="text-xs text-ink-muted mb-1">Если вступите вы:</p>
          <p class="font-serif text-2xl font-semibold text-teal">~42 тыс. ₽</p>
          <p class="text-xs text-ink-faint">за человека</p>
        </div>
      </div>
    </div>

    <!-- Guide offers -->
    <section class="mt-10">
      <h2 class="font-serif text-2xl font-semibold text-ink mb-4">Предложения гидов</h2>
      <div class="flex flex-col gap-3">
        <!-- offer row -->
        <div class="flex items-center gap-4 p-4 bg-white border border-edge-soft rounded-xl shadow-card">
          <span class="w-10 h-10 rounded-full bg-cover bg-center shrink-0"
                style="background-image: url('https://i.pravatar.cc/80?img=12')" aria-hidden="true"></span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ink">Иван Петров</p>
            <p class="text-xs text-ink-muted">★ 4.9 · 127 туров</p>
          </div>
          <span class="font-serif text-lg font-semibold text-ink shrink-0">38 тыс. ₽</span>
          <div class="flex gap-2 shrink-0">
            <button class="text-xs font-semibold border border-edge rounded-pill px-3 py-1.5 hover:bg-surface-muted transition-colors">
              Предложить цену
            </button>
            <button class="text-xs font-semibold bg-teal text-white rounded-pill px-3 py-1.5 hover:bg-teal-light transition-colors">
              Принять
            </button>
          </div>
        </div>
      </div>
    </section>
  main
  footer (5.8)
```

### 6.4 `create-request.html`

No hero image. White page with top nav (glass variant, dark text).

```
body class="bg-surface"
  skip-link
  <!-- Navbar — light variant -->
  <header class="bg-surface-panel border-b border-edge-soft py-3 px-5">
    <nav class="max-w-5xl mx-auto flex items-center justify-between">
      <!-- Logo with text-ink instead of text-white -->
      <!-- Nav links with text-ink -->
    </nav>
  </header>

  main#main-content class="max-w-4xl mx-auto px-6 py-14"
    <h1 class="font-serif text-4xl font-semibold text-ink mb-8">Создать запрос</h1>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Form card -->
      <div class="bg-white border border-edge-soft rounded-card p-6 shadow-panel">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5" for="dest">Направление</label>
            <input id="dest" type="text" placeholder="Байкал, Алтай, Камчатка..."
                   class="w-full border border-edge rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-teal transition-colors" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5" for="date-from">С</label>
              <input id="date-from" type="date" class="w-full border border-edge rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-teal transition-colors" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5" for="date-to">По</label>
              <input id="date-to" type="date" class="w-full border border-edge rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-teal transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5" for="participants">Участников</label>
            <input id="participants" type="number" min="1" max="20" placeholder="4"
                   class="w-full border border-edge rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-teal transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5" for="budget">Бюджет на человека (₽)</label>
            <input id="budget" type="text" placeholder="до 50 000"
                   class="w-full border border-edge rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-teal transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5" for="tour-type">Тип тура</label>
            <select id="tour-type" class="w-full border border-edge rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-teal transition-colors bg-white">
              <option>Активный отдых</option>
              <option>Культурный</option>
              <option>Гастрономический</option>
              <option>Природа и экология</option>
            </select>
          </div>
          <!-- Toggles -->
          <div class="flex items-center justify-between py-2 border-t border-edge-soft">
            <span class="text-sm font-medium text-ink">Открытая группа</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" />
              <div class="w-10 h-5 bg-surface-muted rounded-full peer peer-checked:bg-teal transition-colors"></div>
              <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
            </label>
          </div>
          <div class="flex items-center justify-between py-2 border-t border-edge-soft">
            <span class="text-sm font-medium text-ink">Принимать предложения гидов</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" />
              <div class="w-10 h-5 bg-surface-muted rounded-full peer peer-checked:bg-teal transition-colors"></div>
              <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
            </label>
          </div>
        </div>
        <button class="mt-6 w-full bg-teal text-white font-semibold py-3 rounded-pill hover:bg-teal-light transition-colors">
          Создать запрос
        </button>
      </div>

      <!-- Live preview card -->
      <div class="lg:sticky lg:top-8">
        <p class="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Так увидят твой запрос</p>
        <!-- RequestCard (5.6) — populated with placeholder/form values -->
      </div>
    </div>
  main
  footer (5.8)
```

### 6.5 `destination.html`

```
body
  skip-link
  hero subpage (5.4) — Baikal image, kicker "Направление", h1 "Озеро Байкал"
    nav (5.2 glass-dark)
  main#main-content class="max-w-5xl mx-auto px-6 py-10"
    <section class="mb-10">
      <h2 class="font-serif text-2xl font-semibold text-ink mb-5">Открытые группы</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 3× RequestCard (5.6) -->
      </div>
    </section>
    <hr class="border-edge-soft my-8" />
    <section>
      <h2 class="font-serif text-2xl font-semibold text-ink mb-5">Популярные туры</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 3× TourCard (5.7) -->
      </div>
    </section>
  main
  footer (5.8)
```

### 6.6 `tour.html`

```
body
  skip-link
  <!-- Full-width image "carousel" — static for prototype -->
  <div class="relative h-[50vh] bg-cover bg-center"
       style="background-image: url('...')">
    <div class="absolute inset-0 hero-overlay"></div>
    nav (5.2 glass-dark)
  </div>

  main#main-content class="max-w-5xl mx-auto px-6 py-8"
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
      <!-- Left content -->
      <div>
        <h1 class="font-serif text-3xl font-semibold text-ink mb-2">Камчатка: вулканы и океан</h1>
        <div class="flex items-center gap-2 mb-5">
          <span class="text-amber text-sm font-semibold">★ 4.9</span>
          <span class="text-xs text-ink-muted">· 47 отзывов</span>
        </div>
        <p class="text-sm text-ink-muted leading-relaxed mb-6">Описание тура...</p>

        <!-- Included checklist -->
        <h3 class="font-serif text-lg font-semibold text-ink mb-3">Включено в тур</h3>
        <ul class="space-y-2 mb-8">
          <li class="flex items-center gap-2 text-sm text-ink-muted">
            <svg class="text-teal shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Трансфер из аэропорта
          </li>
          <!-- more items -->
        </ul>

        <!-- Reviews -->
        <h3 class="font-serif text-lg font-semibold text-ink mb-3">Отзывы</h3>
        <div class="space-y-3">
          <div class="bg-surface-panel border border-edge-soft rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-8 h-8 rounded-full bg-cover bg-center" style="background-image: url('...')"></span>
              <span class="text-sm font-semibold text-ink">Анна М.</span>
              <span class="text-xs text-amber font-semibold ml-auto">★ 5.0</span>
            </div>
            <p class="text-sm text-ink-muted">Незабываемый опыт...</p>
          </div>
        </div>
      </div>

      <!-- Right sidebar -->
      <div class="lg:sticky lg:top-8 space-y-4">
        <!-- Guide card -->
        <div class="bg-white border border-edge-soft rounded-xl p-4 shadow-card">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-12 h-12 rounded-full bg-cover bg-center" style="background-image: url('...')"></span>
            <div>
              <p class="text-sm font-semibold text-ink">Иван Петров</p>
              <p class="text-xs text-ink-muted">★ 4.9 · 127 туров</p>
            </div>
          </div>
          <div class="border-t border-edge-soft pt-3">
            <p class="text-xs text-ink-muted mb-0.5">Стоимость</p>
            <p class="font-serif text-2xl font-semibold text-ink">от 120 тыс. ₽</p>
            <p class="text-xs text-ink-faint">за человека</p>
          </div>
        </div>
        <a href="create-request.html"
           class="block w-full text-center bg-teal text-white font-semibold py-3 rounded-pill hover:bg-teal-light transition-colors no-underline">
          Создать запрос
        </a>
        <a href="requests.html"
           class="block w-full text-center border border-edge text-ink font-semibold py-3 rounded-pill hover:bg-surface-muted transition-colors no-underline">
          Найти группу
        </a>
      </div>
    </div>
  main
  footer (5.8)
```

### 6.7 `guide.html`

```
body
  skip-link
  hero subpage (5.4) — muted city photo, kicker "Гид", h1 guide name, subtitle cities/specialties
    nav (5.2 glass-dark)
  main#main-content class="max-w-5xl mx-auto px-6 py-8"
    <!-- Profile summary panels -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
      <div class="bg-white border border-edge-soft rounded-xl p-5 shadow-card">
        <h2 class="font-serif text-xl font-semibold text-ink mb-3">Профиль</h2>
        <p class="text-sm text-ink-muted mb-4">Рейтинг 4,9 · 127 завершённых туров · ответ в течение 24 часов.</p>
        <div class="flex gap-2 flex-wrap">
          <span class="text-xs font-semibold bg-teal text-white px-3 py-1 rounded-pill">Верифицирован</span>
          <span class="text-xs font-semibold border border-edge text-ink-muted px-3 py-1 rounded-pill">Киото · Осака</span>
        </div>
      </div>
      <div class="bg-white border border-edge-soft rounded-xl p-5 shadow-card">
        <h2 class="font-serif text-xl font-semibold text-ink mb-3">Предложения на бирже</h2>
        <!-- 2 compact offer rows -->
      </div>
    </div>

    <!-- Tour grid -->
    <h2 class="font-serif text-2xl font-semibold text-ink mb-5">Туры гида</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- 3× TourCard (5.7) -->
    </div>
  main
  footer (5.8)
```

### 6.8 `dashboard.html`

No hero image. White top nav (same as create-request).

```
body class="bg-surface"
  skip-link
  <header class="bg-surface-panel border-b border-edge-soft py-3 px-5">
    <nav class="max-w-5xl mx-auto flex items-center justify-between">
      <!-- light nav — logo text-ink, links text-ink-muted -->
    </nav>
  </header>

  <!-- Subpage heading (no photo hero) -->
  <div class="bg-surface-panel border-b border-edge-soft py-8 px-6">
    <div class="max-w-5xl mx-auto">
      <p class="text-[11px] uppercase tracking-[0.18em] text-teal font-semibold mb-1">Кабинет</p>
      <h1 class="font-serif text-3xl font-semibold text-ink">Профиль путешественника</h1>
    </div>
  </div>

  main#main-content class="max-w-5xl mx-auto px-6 py-8"
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <!-- Main column: tabs -->
      <div>
        <!-- Tab nav (pure CSS — radio button trick for no-JS tabs) -->
        <div class="flex gap-1 border-b border-edge-soft mb-5" role="tablist">
          <button role="tab" aria-selected="true"
                  class="text-sm font-medium px-4 py-2.5 border-b-2 border-teal text-teal -mb-px">
            Мои запросы
          </button>
          <button role="tab" aria-selected="false"
                  class="text-sm font-medium px-4 py-2.5 border-b-2 border-transparent text-ink-muted hover:text-ink transition-colors -mb-px">
            Группы
          </button>
          <button role="tab" aria-selected="false"
                  class="text-sm font-medium px-4 py-2.5 border-b-2 border-transparent text-ink-muted hover:text-ink transition-colors -mb-px">
            Предложения
          </button>
          <button role="tab" aria-selected="false"
                  class="text-sm font-medium px-4 py-2.5 border-b-2 border-transparent text-ink-muted hover:text-ink transition-colors -mb-px">
            Бронирования
          </button>
        </div>

        <!-- Tab content — show "Мои запросы" active, others display:none for prototype -->
        <div class="flex flex-col gap-3">
          <!-- Dashboard request row card -->
          <div class="flex gap-4 bg-white border border-edge-soft rounded-xl p-4 shadow-card">
            <div class="w-16 h-16 rounded-lg bg-cover bg-center shrink-0"
                 style="background-image: url('...')"></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p class="font-serif font-semibold text-sm text-ink">Байкал</p>
                <span class="text-[11px] font-semibold bg-amber/10 text-amber border border-amber/20 px-2 py-0.5 rounded-pill shrink-0">Ожидает</span>
              </div>
              <p class="text-xs text-ink-muted mt-0.5">24–26 июля · 4 из 6 мест</p>
              <div class="h-1 bg-surface-muted rounded-pill overflow-hidden mt-2">
                <div class="h-full bg-teal-light rounded-pill" style="width: 67%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right summary widget -->
      <div class="lg:sticky lg:top-8">
        <div class="bg-white border border-edge-soft rounded-xl p-5 shadow-card">
          <h3 class="font-serif text-lg font-semibold text-ink mb-4">Обзор</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-ink-muted">Активных запросов</span>
              <span class="font-semibold text-ink">3</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-ink-muted">Предложений гидов</span>
              <span class="font-semibold text-amber">5</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-ink-muted">Подтверждённых</span>
              <span class="font-semibold text-teal">1</span>
            </div>
          </div>
          <a href="create-request.html"
             class="block mt-5 w-full text-center bg-teal text-white text-sm font-semibold py-2.5 rounded-pill hover:bg-teal-light transition-colors no-underline">
            Создать запрос
          </a>
        </div>
      </div>
    </div>
  main
  footer (5.8)
```

---

## 7. Color Replacement Cheat Sheet

Every blue-tinted value from the old CSS maps to:

| Old | Context | New |
|---|---|---|
| `#f0f8ff` | bg (Alice Blue) | `#f8fafc` = `bg-surface` |
| `#f3f7ff` | bg (cool) | `#f8fafc` = `bg-surface` |
| `#eaf1fb` | panel | `#f1f5f9` = `bg-surface-panel` |
| `rgba(191,219,254,…)` | borders | `rgba(203,213,225,…)` = `border-edge` |
| `rgba(30,64,175,0.28)` | hero overlay | `rgba(15,23,42,0.28)` — use `.hero-overlay` |
| `rgba(30,58,138,0.14)` | shadows | `rgba(15,23,42,0.10)` — use `shadow-card` |
| `#eef4ff → #e4edfb` | sections | `#f1f5f9 → #e2e8f0` = `bg-surface-panel` |
| `#14b8a6` | accent | `#0d9488` = `bg-teal-light` |

Accent `#16605d` (teal), `#d97706` (amber): keep exactly as-is.

---

## 8. Execution Order

1. Create `package.json` and `tailwind.config.js` in `design/html/`
2. Write `input.css`
3. Run `npm install && npm run dev` — verify `css/tailwind.css` is generated
4. Refactor `index.html` first — validate full design system looks correct
5. Refactor remaining pages in this order: `requests` → `request-details` → `create-request` → `destination` → `tour` → `guide` → `dashboard`
6. Delete `css/home.css` (and any other legacy CSS) only after all 8 pages are verified working
7. Do a final pass: check no `hw-` classes remain, no `body.hw-theme-*` classes remain, no `var(--hw-*)` references remain

---

## 9. What NOT to Do

- Do not add any JavaScript framework (no React, no Vue, no Alpine)
- Do not use the Tailwind CDN Play script — use CLI only
- Do not create per-page CSS files — all styling is Tailwind utility classes in the HTML
- Do not use `@apply` for anything except the `.nav-link`, `.glass`, `.hero-overlay` utilities defined in §3 — everything else goes directly in the HTML as utility classes
- Do not introduce any new dependencies beyond `tailwindcss`
