# Provodnik — Homepage Implementation Spec

> Source of truth: image `01-home-full-202621031513.jpeg` + color prompt
> This document is the pixel-level spec for Cursor to implement the homepage exactly.
> Language: Russian throughout UI copy. No placeholder text. No lorem ipsum.

---

## Global design tokens

Apply these to `tailwind.config.ts` CSS variables and `globals.css`:

```
background:     #F9F8F7  (warm off-white — page bg)
surface:        #F2EDE6  (elevated sections)
card:           #FFFFFF  (pure white where needed)
glass:          rgba(255,255,255,0.55) with backdrop-filter: blur(16px)
glass-border:   rgba(255,255,255,0.6) thin border

primary:        #0F766E  (teal — CTAs, active nav, buttons)
primary-mid:    #14B8A6  (links, secondary CTAs)
primary-light:  #2DD4BF  (highlights, focus)

amber:          #D97706  (badge accent)
amber-mid:      #F97316  (tags)

text-primary:   #0F172A
text-secondary: #475569
text-muted:     #94A3B8
border:         #CBD5E1
border-light:   #E2E8F0

success:        #10B981
warning:        #F59E0B
error:          #EF4444

radius-card:    28px–32px (large rounded corners throughout)
radius-pill:    9999px (buttons and badges)
radius-sm:      12px (mini cards)
```

Typography:
- Display/hero headline: Cormorant Garamond or Playfair Display (serif) — import from Google Fonts
- Body/UI: Inter (sans-serif)
- Hero headline font-size: ~52–56px, font-weight: 600, line-height: 1.15
- Section headings: 28–32px Inter semibold
- Body: 14–15px Inter regular

---

## Section 1 — Navigation bar

Floating glassmorphism navbar. Sits above the hero, not sticky on scroll in initial state.

Structure:
```
<nav> — full width, position: absolute top-0, z-index: 50
  background: rgba(255,255,255,0.6), backdrop-filter: blur(16px)
  border-bottom: 1px solid rgba(255,255,255,0.5)
  padding: 16px 48px
  display: flex, align-items: center, justify-content: space-between

  LEFT:
    compass/route icon (teal #0F766E, ~20px) + text "Provodnik" (Inter semibold 18px, #0F172A)

  RIGHT:
    5 nav links, Inter medium 15px, #475569, hover: #0F766E
    - Направления (active — underline in #0F766E)
    - Запросы
    - Гиды
    - Экскурсии
    - Профиль
    gap between links: 32px
```

---

## Section 2 — Hero

Full-width cinematic photo background. Height: ~520px.

Background image:
- Use Unsplash photo: `photo-1506905925346-21bda4d32df4` at w=1600&h=900
- Object-fit: cover, object-position: center
- Overlay: subtle gradient from rgba(255,255,255,0.15) top to rgba(0,0,0,0.05) bottom — keep image bright and visible, NOT dark

Content (centered, position: absolute, bottom ~120px from hero bottom):
```
Small kicker line:
  "Маршруты с локальными проводниками"
  font: Inter 13px, color: #475569, letter-spacing: 0.05em, text-align: center
  margin-bottom: 16px

Hero headline:
  "Объединяйтесь. Договаривайтесь."  (line 1)
  "Путешествуйте по России лучше."   (line 2)
  font: Cormorant Garamond or Playfair Display, 52px, weight 600
  color: #0F172A
  text-align: center
  line-height: 1.15
  margin-bottom: 24px

Search bar (frosted glass):
  width: 480px, centered
  background: rgba(255,255,255,0.75), backdrop-filter: blur(12px)
  border: 1px solid #CBD5E1
  border-radius: 9999px
  padding: 14px 16px 14px 24px
  display: flex, align-items: center, justify-content: space-between

  LEFT: placeholder text "Куда едем?" — Inter 15px, color: #94A3B8
  RIGHT: teal pill button — background: #0F766E, border-radius: 9999px, padding: 10px 20px
    content: 🔍 icon + " Найти" — Inter 14px semibold, color: white

  margin-bottom: 20px

CTA buttons row (centered, gap: 12px):
  Button 1 PRIMARY: "Создать запрос"
    background: #0F766E, color: white, border-radius: 9999px
    padding: 13px 28px, Inter 14px semibold
    subtle shadow: 0 4px 16px rgba(15,118,110,0.3)

  Button 2 SECONDARY: "Найти группу"
    background: rgba(255,255,255,0.7), backdrop-filter: blur(8px)
    border: 1px solid #CBD5E1, color: #0F172A
    border-radius: 9999px, padding: 13px 28px, Inter 14px medium
```

---

## Section 3 — Dual gateway cards

Immediately below the hero. Overlaps the hero bottom by ~40px (negative margin-top or absolute positioning).

Container: max-width 1100px, centered, display: grid, grid-template-columns: 1fr 1fr, gap: 20px
Section background: #F9F8F7 behind the cards but the cards themselves are frosted glass.

### LEFT CARD — Биржа запросов

```
Card:
  background: rgba(255,255,255,0.75), backdrop-filter: blur(20px)
  border: 1px solid rgba(255,255,255,0.6)
  border-radius: 28px
  padding: 28px
  box-shadow: 0 8px 32px rgba(0,0,0,0.08)

Title: "Биржа запросов" — Inter 20px semibold, #0F172A
Subtitle (2 lines):
  "Присоединяйте путешественника, формировать группу"
  "и договаривать цены с месклыми ровадниками."
  Inter 13px, color: #475569, margin: 8px 0 20px

Buttons row (gap: 10px):
  "Создать запрос" — teal filled, border-radius: 9999px, padding: 10px 20px, Inter 13px semibold
  "Найти группу" — outline, border: 1px solid #CBD5E1, border-radius: 9999px, padding: 10px 20px, Inter 13px

Mini request cards (3 cards in a row, gap: 10px):
  Each mini card:
    background: rgba(255,255,255,0.8)
    border: 1px solid #E2E8F0
    border-radius: 14px
    padding: 12px
    width: ~33%

  CARD 1 (no badge):
    Top row: group icon (people outline, #475569, 16px)
    Title: "Байкал" — Inter 13px semibold, #0F172A
    Detail row: 📅 icon + "4-6 чел." — Inter 11px, #475569
    Detail row: ₽ icon + "35-50 тыс. Р" — Inter 11px, #475569
    Bottom: 3 small avatar circles (18px diameter, overlapping -6px)
      avatar 1: photo-1438761681033 cropped circle
      avatar 2: photo-1506794778202 cropped circle
      avatar 3: photo-1494790108377 cropped circle

  CARD 2 (no badge):
    Same structure as Card 1
    Same destination "Байкал", same details
    Different avatar order

  CARD 3 (amber badge "Новинка"):
    Badge: top-right corner, "Новинка", background: #D97706, color: white
    border-radius: 9999px, font-size: 10px, padding: 2px 8px
    Same structure, "Байкал", same details
    Avatar circles same size
```

### RIGHT CARD — Готовые предложения

```
Card: same glass styling as left card

Title: "Готовые предложения" — Inter 20px semibold, #0F172A
Subtitle (2 lines):
  "Брозуйте существую жалные туры и"
  "предложений туды и предложения."
  Inter 13px, color: #475569, margin: 8px 0 20px

Buttons row:
  "Смотреть каталог" — teal filled, same style
  "По направлениям" — outline, same style

Mini listing cards (3 cards in a row — partially visible, scrollable feel):
  Each mini listing card:
    border-radius: 14px, overflow: hidden
    width: ~33%

  CARD 1: Камчатка
    Photo: photo-1508193638397-1c4234db14d8 (volcanic landscape), height: 80px, object-fit: cover
    Badge top-left: "Новинка", amber pill
    Below photo:
      "Камчатка" — Inter 12px semibold, #0F172A
      Rating: ⭐ 4.9/5 — Inter 11px, #475569
      Guide avatar circle 20px + "от 15 000 Р" — Inter 11px, #0F172A

  CARD 2: Алтай
    Photo: photo-1551632811-561732d1e306 (mountain), height: 80px
    Badge: "Хит", amber
    "Алтай", ⭐ 4.9/5, от 15 000 Р

  CARD 3: Алтай (partially visible, clipped)
    Same structure, partially cut off to suggest scroll
```

---

## Section 4 — Популярные направления

Section background: #F9F8F7
Padding: 64px 48px

Section title: "Популярные направления" — Inter 28px semibold, #0F172A, margin-bottom: 28px

Grid layout: display: grid
  grid-template-columns: 1.6fr 1fr 1fr
  grid-template-rows: auto auto
  gap: 12px

### Large featured card — Озеро Байкал
```
grid-row: 1 / span 2 (spans full left column height)
border-radius: 24px, overflow: hidden
position: relative, height: ~420px

Background photo: photo-1476514525535-07fb3b4ae5f1 (lake panoramic), object-fit: cover, full card

Gradient overlay: linear-gradient(to top, rgba(15,23,42,0.75) 0%, transparent 50%)

Bottom content (position: absolute, bottom: 24px, left: 24px, right: 24px):
  "Озеро Байкал" — Playfair Display or Cormorant, 26px, color: white, weight 600
  Subtitle (2 lines):
    "Обоссние виньх инспоусти птекшвайтесь,"
    "группе-группа с масаким проводниками."
    Inter 12px, color: rgba(255,255,255,0.8), margin: 6px 0 16px

  Button: "Смотреть туры"
    background: #0F766E, color: white
    border-radius: 9999px, padding: 10px 20px, Inter 13px semibold
```

### Top-right cards (2 cards in right 2 columns, row 1)

CARD: Казань
```
border-radius: 16px, overflow: hidden, position: relative, height: ~200px
Photo: photo-1513635269975-59663e0ac1ad (city/kremlin), object-fit: cover
Gradient: to-top dark overlay
Badge top-right: "Новинка" — amber pill, 10px, padding 3px 10px
Bottom left:
  "Казань" — Inter 15px semibold, white
  "Кремль" — Inter 12px, rgba(255,255,255,0.75)
Bottom right:
  "14 туров" — Inter 11px, rgba(255,255,255,0.8), right-aligned
```

CARD: Калининград
```
Same structure, height: ~200px
Photo: photo-1469474968028-56623f02e42e (amber/nature)
Badge: "Хит" — amber pill
"Калининград" — Inter 15px semibold, white
"Амберный музей" — Inter 12px, rgba(255,255,255,0.75)
"20 туров" right-aligned
```

### Bottom-right cards (2 cards in right 2 columns, row 2)

CARD: Суздаль
```
Same structure, height: ~200px
Photo: photo-1516483638261-f4dbaf036963 (old Russian city)
Badge: "Новинка" — amber
"Суздаль" — white
"Древний архитект" — muted white
"16 туров" right
```

CARD: Мурманск
```
Photo: photo-1527489377706-5bf97e608852 (northern lights/arctic)
Badge: "Новинка" — amber
"Мурманск" — white
"Северный лигт" — muted white
"19 туров" right
```

---

## Section 5 — Как это работает

Section background: #F9F8F7
Padding: 64px 48px

Section title: "Как это работает" — Inter 28px semibold, #0F172A, margin-bottom: 40px

5 steps in a horizontal flex row. Between each step: a small arrow → (#CBD5E1, 16px).

Each step:
```
display: flex, flex-direction: column, align-items: flex-start
width: ~18% of container

Step number + icon:
  "1." — Inter 32px, color: #0F172A, font-weight 700, display: inline
  Icon: relevant lucide icon, 20px, #0F766E, inline after number
  Both on same line, gap: 4px

Label below (Inter 14px semibold, #0F172A):
  Step 1: "Создать запрос"       icon: Search
  Step 2: "Группа формируется"   icon: Users
  Step 3: "Гиды предлагают цену" icon: DollarSign or Banknote
  Step 4: "Договариваетесь"      icon: Handshake or MessageSquare
  Step 5: "Экскурсия подтверждена" icon: CheckCircle
```

Arrow between steps: "→" character or ChevronRight icon, color: #CBD5E1, font-size: 20px, align-self: center, margin-top: -16px

---

## Section 6 — Trust cards

Section background: #F9F8F7 (continuous with above)
Padding: 0 48px 64px (no top gap from step section)

3 cards in a row, gap: 16px, each card equal width.

Each trust card:
```
background: rgba(255,255,255,0.7), backdrop-filter: blur(12px)
border: 1px solid #E2E8F0
border-radius: 20px
padding: 24px
display: flex, align-items: flex-start, gap: 16px

LEFT: icon in teal circle:
  circle: 40px, background: rgba(15,118,110,0.1), border-radius: 50%
  icon: 20px, color: #0F766E

RIGHT: text block
  Title: Inter 15px semibold, #0F172A
  Subtitle: Inter 13px, #475569, margin-top: 4px
```

Card 1:
  Icon: ShieldCheck
  Title: "Проверенные гиды"
  Subtitle: "Проверенные гиды с которыми и проверенные гиды"

Card 2:
  Icon: FileText or ScrollText
  Title: "Прозрачные условия"
  Subtitle: "Прозрачное элезже поровления, прозрачные условия"

Card 3:
  Icon: Percent or Tag
  Title: "Комиссия ниже крупных агрегаторов"
  Subtitle: "Комиссия на комиссия ниже крупных агрегаторов"

---

## Section 7 — Footer

Background: #F9F8F7 (same page bg, separated by subtle top border #E2E8F0)
Padding: 48px 48px 32px

### Top footer row (4 columns):

Column 1 — О нас:
  "О нас" — Inter 13px semibold, #0F172A, margin-bottom: 12px
  Body text (2 lines, Inter 12px, #94A3B8):
    "Сохранных нутешурровны"
    "ноком-груводниковна"

Column 2 — Помощь:
  "Помощь" — Inter 13px semibold, #0F172A, margin-bottom: 12px
  Links (Inter 12px, #475569, hover: #0F766E):
    Всё
    Помощь
    Калининград

Column 3 — Правила:
  "Правила" — Inter 13px semibold, #0F172A, margin-bottom: 12px
  Links (Inter 12px, #475569):
    Поддержка
    Польза состояла
    Политика на поровне

Column 4 — Social icons (right-aligned):
  3 circular icon buttons, 36px, border: 1px solid #E2E8F0, border-radius: 50%
  background: white
  Icons: VK (or square icon), Telegram, Instagram (camera)
  icon color: #475569, hover: #0F766E
  gap: 8px

### Bottom footer row (border-top: 1px solid #E2E8F0, margin-top: 32px, padding-top: 20px):
  LEFT: "© 2024 Provodnik. Все права защищены." — Inter 12px, #94A3B8
  RIGHT:
    "Термин в сервисе" — Inter 12px, #94A3B8, hover: #475569
    "Политика в приватности" — same, gap: 24px between links

---

## Implementation notes for Cursor

Files to create/modify:
1. `src/app/(site)/page.tsx` or `src/app/(home)/page.tsx` — homepage route
   - If homepage already exists at `/`, replace its content entirely
   - Check which layout wraps it — do not break the layout

2. `src/features/home/components/` — create these components:
   - `home-nav.tsx` — glassmorphism nav
   - `home-hero.tsx` — hero section with search
   - `home-gateway.tsx` — dual gateway cards (Биржа / Готовые)
   - `home-destinations.tsx` — popular destinations grid
   - `home-how-it-works.tsx` — 5-step section
   - `home-trust.tsx` — 3 trust cards
   - `home-footer.tsx` — footer

3. `src/app/globals.css` — add CSS variables for the palette and import Google Fonts:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
   ```

4. `tailwind.config.ts` — extend colors with the palette tokens

General rules:
- Use `backdrop-filter: blur()` via Tailwind class `backdrop-blur-xl` or inline style
- All images use next/image with unoptimized={false} — Unsplash domain already whitelisted
- Use lucide-react for all icons
- No placeholder gray blocks — every section must have real Russian content
- Section max-width: 1200px, centered with mx-auto
- Mobile breakpoints: do NOT implement mobile layout — desktop only for now
- Do not import or use any component that does not exist — create what you need inline
- After writing all files, run: cd D:\dev\projects\provodnik\provodnik.app && bun run build
