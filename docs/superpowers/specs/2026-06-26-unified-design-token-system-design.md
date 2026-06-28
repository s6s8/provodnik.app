# Unified Design-Token System — design spec

**Goal:** one global theme (`globals.css @theme`), zero arbitrary/per-component values, every visual decision expressed as a semantic Tailwind utility backed by a **finite** scale. Reusable atom components encapsulate repeated UI patterns. A scoped lint gate makes drift un-mergeable. Homepage is the reference implementation; rollout follows.

**Decisions locked (this session):** snap off-scale values to the nearest scale step (small visual shifts accepted); hard lint gate (scoped to migrated files now, global after rollout); do it manually (no cursor/codex).

---

## 1. Single source of truth
- **All** design tokens live in `src/app/globals.css` — the raw palette in `:root` (the ONLY place hex literals exist) and the semantic + scale tokens in `@theme inline` (so `.dark` var-swaps keep working).
- **`tailwind.config.ts` stops defining theme values.** Its `theme.extend.{colors,fontFamily,spacing,maxWidth,borderRadius,boxShadow}` all move into `@theme`. The file is reduced to an empty `satisfies Config` (or deleted with the `@config` line). No token is defined in two places.

## 2. Color vocabulary (the ONLY color utilities components may use)
Private palette stays (navy/amber/green ramps, ink/body/muted/faint, canvas/white/surface-2, hairlines) — components never touch it directly. Semantic roles:

| role / utility | value (palette ref) | replaces (homepage) |
|---|---|---|
| `background` | canvas `#FAFAF9` | — |
| `card` | white `#FFFFFF` | — |
| `muted` | surface-2 `#F4F4F2` | — |
| `foreground` | ink `#141C28` | — |
| `ink-2` | body `#414B59` | — |
| `muted-foreground` | `#8A93A1` | — |
| `placeholder` (NEW role) | `#C2C9D3` | `text-[#C2C9D3]` |
| `primary` / `primary-hover` | navy-500 / navy-600 | — |
| `primary-soft` (NEW role) | navy-50 `#EAF1FA` | `bg-[#EAF1FA]` **and** `bg-primary/10` (unified) |
| `gold` (amber accent) / `gold-hover` | amber-400 `#D4872B` | — |
| `gold-soft` (NEW role) | amber-50 `#FBF3E8` | `bg-[rgba(212,135,43,.14)]` (snap) |
| `gold-ink` (NEW role) | amber-600 `#8F5817` | `text-[#9A5712]` (snap, reuses palette) |
| `success` | green-500 `#2F8F66` | `text-[#2F8F66]`; **and `text-[#1F7A52]` (old green → snap to canon)** |
| `success-soft` (NEW role) | green-50 `#E9F5EF` | `bg-[rgba(47,143,102,.12)]` (snap) |
| `destructive` | `#C8453B` | — |
| `border` / `line` / `line-2` | hairlines | — |
| `overlay` (NEW role) | photo-scrim navy `#080E18` | the `rgba(8,14,24,.55)` on-photo chip |
| `ring` | primary | focus rings (via Tailwind `ring-*`, not box-shadow) |

The four NEW soft roles all **snap onto existing palette-50 steps** — no invented colors. `gold-ink` reuses amber-600.

## 3. Radius scale (finite — retire `card/step/hero/glass` aliases)
`--radius-sm:8 · md:12 · lg:16 · xl:20 · btn:10 · pill:9999`. Snap map:
- cards (`rounded-2xl`, `rounded-lg`=16) → `rounded-lg`
- field shells `rounded-[13px]` → `rounded-md` (12)
- buttons `rounded-[11px]`/`rounded-[13px]` → `rounded-btn` (10)
- number chip `rounded-[14px]`, toggles → `rounded-md` (12)
- hero form card `rounded-[22px]` → `rounded-xl` (20)
- pills `rounded-full` → `rounded-pill`

## 4. Elevation scale (finite)
`shadow-card` (subtle, existing) · `shadow-raised` (snap the hero form card's bespoke shadow) · `shadow-overlay` (nav glass, existing). Focus states use Tailwind **ring** utilities (`ring-2 ring-primary/40` etc.) — the bespoke `shadow-[0_0_0_3px_rgba(navy,.12/.18)]` focus rings are retired.

## 5. Type scale (finite `--text-*`) + tracking
`2xs:11 · xs:12 · sm:13 · base:15 · md:17 · lg:18 · xl:clamp(24,3vw,30) · display:clamp(46,6vw,68)`.
Snaps: 11.5→2xs(11) · 12.5→xs(12) · 15.5→base(15) · 19→lg(18). Tracking: `tight:-.02 · tighter:-.03 · tightest:-.04 · wide:.04`.

## 6. Spacing / width / gutter (Tailwind-native, single values)
- Container: one width `--max-w:1160` → `max-w-page` everywhere (homepage `1180`→snap `1160`).
- Gutter: one `--spacing-gutter: clamp(20px,4vw,48px)` → `px-gutter` (homepage `44`→snap `48`).
- All ad-hoc paddings/gaps/icon sizes snap to Tailwind's native 4px scale (`p-3/gap-4/size-3.5/...`) — no arbitrary `[..px]`.

## 7. Atom layer (reusable, in `src/components/ui/` or `src/components/shared/`)
Encapsulate the repeated inline patterns so feature code composes instead of restyling:
- **`<Badge variant>`** / **`<StatusPill>`** — `success | waiting(gold) | info(primary) | count(primary-soft)`. Replaces the inline `inline-flex h-6 rounded-full bg-X px-2.5 text-… font-bold` status chips in `open-group-card`.
- **`<Tag>`** — bordered theme/interest chip (icon + label). Replaces the inline interest tags.
- **`<FieldShell>`** — the `rounded-md border-border bg-surface px-3 py-3 focus-within:ring` input wrapper (today the `FBX` string constant). Replaces the homepage form field shells.
- **`<Scrim variant="photo|hero">`** — the image-overlay gradient. Replaces all `rgba(8,14,24,…)` gradients.
- **`<PhotoChip>`** — the on-photo region pill (`overlay` bg). 
- Buttons already = `Button` primitive; the homepage's raw CTA `<button>`s either adopt `Button` or, where the homepage's larger CTA is intentional, a `Button` size variant — TBD-resolved in the plan, not left arbitrary.

## 8. Enforcement (scoped now, global later)
ESLint `no-restricted-syntax` selectors (added in `eslint.config.mjs` under a `files:` override for the migrated paths only) banning, in string literals: raw hex (`/#[0-9a-fA-F]{3,8}/`), `rgb(`/`rgba(`/`hsl(`, and Tailwind arbitrary brackets for color/radius/shadow (`-[#`, `rounded-[`, `shadow-[` for non-ring). The `lint-ratchet` baseline holds the rest of the app flat. Global flip after full rollout.

## 9. Migration order (homepage reference impl)
1. `globals.css` single theme + finite scales + new roles; consolidate `tailwind.config.ts`. **Verify: `next build` still generates all utilities.**
2. Build atoms (§7).
3. Refactor live homepage files to tokens + atoms, applying snaps: `homepage-shell2-classic`, `homepage-hero-form-classic`, `homepage-request-form-classic`, `shared/open-group-card`, `shared/destination-tile`.
4. Remove dead legacy tree: `homepage-shell2`, `homepage-hero-form`, `homepage-request-form`, `homepage-discovery` + dead-only tests (`homepage-hero-form.test`, `homepage-discovery.test`); trim `homepage-request-form.test` to the Classic only.
5. Scoped lint override.
6. Verify: `typecheck` + `lint` + `test:run` + `build`; visual spot-check homepage at 375/768/1160 and the shared-card ripple on `/requests` + `/favorites`.

## 10. Ripple / risk
`open-group-card` + `destination-tile` are shared (also `/requests`, `/favorites`, `/destinations`). All swaps pixel-identical except the few flagged snaps (old-green, shadows, width/gutter, ~1px type/radius). No DB, no behavior change — purely presentational + structural.
