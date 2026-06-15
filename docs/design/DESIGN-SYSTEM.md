# Provodnik Redesign — Canonical Design System
Single source of truth. Derived from the approved mockup 06-font-rubik. The look is LIGHT, soft, clean, high-contrast — solid white cards on a soft green-white surface. NO dark content backgrounds, NO glassmorphism / backdrop-blur. Font = Rubik everywhere (already the app font).

## Tokens (already in src/app/globals.css)
- Page background: var(--surface) #f7faf6. Cards: var(--surface-lowest) #fff. Soft-tint blocks: var(--brand-50) #eef7f2. Low surface: var(--surface-low) #edf2ee.
- Text: ink var(--on-surface) #16241d; muted var(--on-surface-muted) #5d7669; ink-2 #47584e.
- Brand: var(--primary) #1f7a5c, --primary-hover #1a6149, brand-50..950 (brand-950 #0a271e). Accent: var(--gold) #e0a126.
- Border: var(--outline) #dce5df. Radii: cards var(--card-radius) 24px, nav/pills var(--pill-radius) 18px, buttons/inputs 14px, chips/steps 14-16px, tags/badges 30px (pill). Shadows: var(--card-shadow) 0 4px 24px #0a281c14; var(--lift-shadow) 0 18px 44px -22px #0a281c33.

## Component recipes (match these exactly)
- **Card**: bg #fff, border 1px var(--outline), rounded-[24px], shadow card-shadow, padding ~26px. Sticky/elevated: lift-shadow.
- **Primary button (.btn / CTA)**: bg var(--primary), text #fff, Rubik font-semibold, px-24 py-15, rounded-[14px]; hover bg var(--primary-hover) + translateY(-2px) + soft shadow. ONE primary CTA per view.
- **Inputs**: bg #fff, border 1px var(--outline), rounded-[14px], dark ink text, brand focus ring. Keep icons + password show/hide.
- **Eyebrow/label**: Rubik font-semibold, 12px, UPPERCASE, letter-spacing .1em, color var(--primary).
- **Lead heading**: Rubik font-semibold, clamp(30px,4.4vw,44px), line-height 1.04, ink; a muted span for the secondary clause.
- **Nav**: white rounded card — bg #fff, border outline, rounded-[18px], shadow card-shadow.
- **Hero/banner** (where a page has one): rounded-[28px] image, green gradient overlay linear-gradient(180deg, rgba(10,39,30,.12), rgba(10,39,30,.66)), white badge pill, big white Rubik title.
- **Tag/chip**: bg var(--brand-50), color var(--primary), font-semibold, rounded-pill. **Momentum/live dot**: var(--gold), gentle pulse.
- **Avatar stack**: overlapping circles, 2px white border, brand-scale fills, host gets a gold ring.
- **Footer**: bg var(--brand-950) #0a271e, rounded top, muted text, links hover gold.

## Principles (Jobs lens)
One job per screen · one primary CTA · cut the non-essential · surface momentum/social-proof · high contrast (dark ink on light) · generous whitespace · brand greens with the single gold accent.
