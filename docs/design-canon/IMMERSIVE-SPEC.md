# Handoff: Trip Request Detail — "Immersive" (Проводник / Элиста)

## Overview
A trip detail + guide-selection page for **Проводник**, a marketplace where travellers
join a group day-trip (here: **Элиста, Калмыкия**) and pick one of several local guides.
The page presents the trip, its availability, and three guides; the traveller selects a
guide and is led to booking. UI copy is in **Russian**.

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing the
intended look and behaviour, **not production code to copy directly**. The task is to
**recreate this design in the target codebase's existing environment** (React, Vue, Svelte,
SwiftUI, etc.) using its established components, tokens, and patterns. If no environment
exists yet, choose the most appropriate framework and implement there.

The prototype is authored as a single self-contained component with a small client-side
state model. Treat the markup as a spec for structure/spacing, not as files to ship.

## Fidelity
**High-fidelity (hifi).** Final colours, typography, spacing, and interactions are specified.
Recreate the UI pixel-faithfully using the codebase's libraries. Exact hex values, sizes, and
copy are listed below.

---

## Layout (desktop, design width 1160px)

Two stacked regions on a warm-white canvas (`#FAFAF9`):

1. **Full-bleed hero** — `position:relative; height:560px`. A background photo with a dark
   bottom gradient. A centered content rail (`max-width:1160px; padding:0 32px`) holds:
   - a transparent **header/nav** pinned to the top (`height:74px`),
   - a **title block** absolutely positioned bottom-left (`left:32px; bottom:48px`),
   - a **floating booking panel** absolutely positioned bottom-right (`right:32px; bottom:48px; width:334px`).
2. **Guides section** — centered (`max-width:1160px; padding:54px 32px 120px`): an eyebrow +
   H2 header row, then a vertical stack of 3 guide cards (`display:flex; flex-direction:column; gap:16px`).
3. **Sticky action bar** — `position:fixed; bottom:0; left:0; right:0`, appears only after a
   guide is selected.

---

## Components

### 1. Header (over hero, transparent)
- Row: `display:flex; align-items:center; gap:34px; height:74px`. White text.
- **Logo**: 26×26 rounded-8 white tile with a blue (`#1A56A4`) location-pin SVG, + wordmark
  "Проводник" (18px / 700 / `-0.02em`, white).
- **Nav links** (`gap:24px`): "Как это работает", "Поездки", "Гиды", "Отзывы" — 14.5px / 500 /
  `rgba(255,255,255,.82)`, hover → `#fff`.
- **Right cluster** (`margin-left:auto; gap:18px`): "Чаты" (with chat-bubble icon), "Войти",
  and a **"Стать гидом"** outline button (`height:38px; padding:0 16px; radius:10px;
  border:1px solid rgba(255,255,255,.35)`, hover bg `rgba(255,255,255,.12)`).

### 2. Hero title block (bottom-left, max-width 540px)
- **Breadcrumb**: "Поездки › Калмыкия › Элиста" — 12.5px / 500 / `rgba(255,255,255,.82)`,
  separators at `opacity:.5`, `margin-bottom:16px`.
- **H1**: "Элиста" — 68px / 700 / line-height .98 / `-0.04em`, white, `margin-bottom:16px`.
- **Intro**: 16.5px / line-height 1.5 / `rgba(255,255,255,.92)`, `max-width:470px`.
  Text: "Погрузитесь в буддийскую культуру, увидите Золотую обитель Будды Шакьямуни и
  почувствуете спокойствие калмыцкой степи."

### 3. Floating booking panel (bottom-right, 334px) — holds ALL trip info
White glass card: `background:rgba(255,255,255,.97); backdrop-filter:blur(12px);
border:1px solid rgba(20,28,40,.06); border-radius:16px;
box-shadow:0 26px 56px -22px rgba(8,14,24,.6); overflow:hidden`.
Stacked sections divided by 1px hairlines (`background:rgba(20,28,40,.08)`):

- **Детали поездки** (`padding:20px 22px`): uppercase eyebrow (11.5px / 600 / `#8A93A1` /
  `letter-spacing:.06em`), then two rows (`gap:11px`), each an icon (17px, stroke `#1A56A4`)
  + label (14.5px / 500 / `#141C28`):
  - 📅 "24 мая, сб"
  - 🕐 "10:00 — 18:00" + muted "· ≈ 8 часов" (13px / `#8A93A1`)
- **Availability** (`padding:18px 22px`):
  - Top row: green dot (7px `#2F8F66`, ring `0 0 0 3px rgba(47,143,102,.16)`) + "Группа открыта"
    (13.5px / 600 / `#141C28`); right: "Осталось 2 места" (12.5px / `#8A93A1`).
  - "8 / 10 мест" (13.5px / 600 / `#414B59`).
  - **Progress bar**: track `height:6px; radius:999px; bg rgba(20,28,40,.07)`; fill `width:80%;
    bg #1A56A4`.
  - **Joined avatars**: overlapping stack (26px circles, `border:2px solid #fff`, `margin-left:-9px`),
    3 photos + a "+5" chip (`bg rgba(20,28,40,.06); 10.5px / 600`), then "Уже присоединились 8 человек"
    (12.5px / `#8A93A1`).

> Note: an earlier version had a price/CTA block and a guarantees list inside this panel; both
> were intentionally removed. The panel is now **information only** — booking is initiated from
> the guide cards / sticky bar. If a pre-selection primary CTA is desired, add it here.

### 4. Guide card (×3) — elevated, clickable, hover-lift
Container: `position:relative; display:grid; grid-template-columns:128px minmax(0,1fr) 200px;
gap:24px; align-items:stretch; padding:22px; background:#fff; border:1px solid rgba(20,28,40,.08);
border-radius:16px; box-shadow:0 1px 2px rgba(20,28,40,.04); cursor:pointer;
transition:transform .16s ease, box-shadow .16s ease`.
**Hover**: `transform:translateY(-3px); box-shadow:0 20px 38px -22px rgba(20,28,40,.42)`.
**Selected**: an absolutely-positioned overlay ring — `inset:0; border:2px solid #1A56A4;
border-radius:16px; box-shadow:0 0 0 4px rgba(26,86,164,.09); pointer-events:none`.

- **Portrait (col 1)**: `min-height:178px; border-radius:12px`, cover background image.
  - Overlaid **"Местный житель" badge** (bottom-left, `left:8px; bottom:8px`): pill
    `height:25px; padding:0 9px; radius:999px; bg rgba(8,14,24,.62); backdrop-filter:blur(4px);
    color:#fff; 11px / 600; white-space:nowrap`, with a 12px pin icon.
- **Body (col 2)**: `display:flex; flex-direction:column`.
  - **Name row**: name (21px / 700 / `#141C28` / `-0.02em`) + **verified** chip (check-circle icon +
    "Проверен"/"Проверена", 12.5px / 600 / `#2F8F66`); when selected, also a "Ваш выбор" pill
    (`bg rgba(26,86,164,.1); color:#1A56A4; 11.5px / 600`).
  - **Role line**: 13.5px / `#8A93A1` (e.g. "Говорит на калмыцком · 7 лет в туризме").
  - **Quote**: 15px / line-height 1.55 / `#414B59`, `max-width:58ch` (toggleable, see `showQuote`).
  - **Tags**: pill row (`gap:7px`), each `12.5px / 500 / #414B59; bg rgba(20,28,40,.05);
    padding:5px 12px; radius:999px`.
  - **Stats row** (pushed to bottom via `margin-top:auto`, `gap:9px`, 13.5px / `#8A93A1`,
    middot dividers `3px #AEB6C2`): ★ score (amber `#D4872B`, bold `#141C28`) · reviews ·
    trips ("126 поездок") · "% рекомендуют".
- **Action (col 3, 200px)**: `display:flex; flex-direction:column; justify-content:center;
  text-align:center; border-left:1px solid rgba(20,28,40,.07); padding-left:22px`.
  - **Price**: 23px / 700 / `#141C28`, + "с человека" (12.5px / `#8A93A1`).
  - **Button** (full width, `height:46px; radius:10px; 14.5px / 600`):
    - default → "Выбрать гида", `bg #1A56A4; color #fff` (hover `#15467F`).
    - selected → "Выбран" with check icon, `bg rgba(47,143,102,.12); color #2F8F66;
      border 1px rgba(47,143,102,.3)`.
  - **"уже выбрали"** mini avatar stack (22px circles) + "+N" + label (12px / `#8A93A1`).

### 5. Section header (above cards)
- Eyebrow "Ваши проводники" (11.5px / 600 / `#1A56A4` / `letter-spacing:.14em` / uppercase).
- Row: H2 "Кто покажет вам Элисту" (30px / 700 / `#141C28` / `-0.03em`) + right helper text
  "Нажмите на карточку, чтобы выбрать" (14px / `#8A93A1`).

### 6. Sticky action bar (fixed bottom; shows only when a guide is selected)
`bg rgba(250,250,249,.96); backdrop-filter:blur(10px); border-top:1px solid rgba(20,28,40,.1);
box-shadow:0 -10px 30px -24px rgba(20,28,40,.5)`. Inner rail `max-width:1160px; padding:14px 32px;
display:flex; align-items:center; gap:16px`:
- 42×42 rounded-10 selected-guide avatar; name (15px / 700) + meta line
  "{price} / чел. · группа открыта, 8/10" (12.5px / `#8A93A1`).
- Right: "Написать" (outline) + "Присоединиться" (`#1A56A4` solid) buttons, `height:44px; radius:10px`.

---

## Interactions & Behavior
- **Select a guide**: clicking anywhere on a card toggles selection (click again to deselect).
  On select: the card gets the blue overlay ring + "Ваш выбор" pill, its button flips to
  "Выбран", and the **sticky action bar** slides in at the bottom reflecting that guide
  (avatar, name, price). Only one guide selected at a time.
- **Hover**: cards lift (`translateY(-3px)`) with a larger shadow over 160ms ease.
  Nav links and buttons have hover colour/background shifts.
- The inner card **button has no own click handler** — the click bubbles to the card so a
  single handler governs selection (avoids double-toggle).
- **Responsive**: prototype is desktop-first at 1160px. For narrower viewports, stack the hero
  title above the panel (panel becomes a full-width card), collapse the guide card to a single
  column (portrait on top), and keep the sticky bar full-width.

## State Management
Single state value: `selected` = guide id or `null`.
Derived per render:
- `isSelected(guide)`, `showRing = highlightSelected && isSelected`.
- `selectedGuide` → drives the sticky bar (`selName`, `selPrice`, `selAvatar`) and `stickyHas`.
Behaviour flags (props/tweaks, all default `true`): `showQuote` (show/hide guide quotes),
`syncPanel` (whether selection feeds the panel — panel currently info-only), `highlightSelected`
(show the selected ring).

## Design Tokens
**Colours**
- Canvas `#FAFAF9` · Surface `#FFFFFF`
- Ink `#141C28` · Body `#414B59` · Muted `#8A93A1` · Faint `#AEB6C2`
- Primary `#1A56A4` · Primary-hover `#15467F`
- Success/verified `#2F8F66` · Star/amber `#D4872B`
- Hairline `rgba(20,28,40,.08)` · Border-2 `rgba(20,28,40,.12)`
- Avatar placeholder `#EDEBE6`
- Tints: primary `rgba(26,86,164,.10)`, success `rgba(47,143,102,.12)`

**Typography** — font family **Onest** (Google Fonts), weights 400/500/600/700.
Scale used: 68 (H1) · 30 (H2) · 25 · 23 · 21 · 18 · 16.5/16 · 15 · 14.5 · 13.5 · 12.5 · 11.5/11.
Antialiased; `::selection` = `rgba(26,86,164,.16)`.

**Radii**: 16 (cards/panel) · 12 (portrait/avatar tile) · 10 (buttons) · 999 (pills/progress).
**Shadows**: card rest `0 1px 2px rgba(20,28,40,.04)`; card hover `0 20px 38px -22px rgba(20,28,40,.42)`;
panel `0 26px 56px -22px rgba(8,14,24,.6)`; sticky bar `0 -10px 30px -24px rgba(20,28,40,.5)`.
**Spacing**: section padding 32 (x) / 54–120 (y); card padding 22; panel section padding 18–22;
grid gaps 16/24; icon-text gaps 7–11.

## Assets
- **Hero photo** & **guide portraits / joined-traveller avatars**: Unsplash placeholders
  (`images.unsplash.com/...`). Replace with real, licensed trip/guide photography in production.
- **Icons**: inline SVG (location pin, calendar, clock, users, chat bubble, check, check-circle,
  star). Swap for the codebase's icon set.
- **Font**: Onest via Google Fonts.

## Files
- `Request Detail - Immersive.dc.html` — the design prototype (markup + the small state class).
  Read it for exact structure and inline styles. A fully self-contained, offline build also
  exists in the project (`Request Detail - Immersive (standalone).html`) if a runnable copy is
  useful for reference.
