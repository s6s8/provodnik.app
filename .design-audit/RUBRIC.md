# Audit rubric — extracted rules and skill source identity

Run date: 2026-07-13. All four required skills fully read before auditing.

## Skill source identity (proof of read)

| Skill key | Source | Files read (full) |
|---|---|---|
| `shadcn` | Local skill `/Users/idev/.hermes/skills/shadcn/SKILL.md` (275 lines; `rules/*.md` sub-files not present on disk — SKILL.md is complete rule surface) | SKILL.md |
| `tailwind` | `wshobson/agents@tailwind-design-system` resolved via `npx skills find tailwind` (53.8K installs, top design-system match), installed outside repo at scratchpad `.agents/skills/tailwind-design-system/` | SKILL.md (385-line references/details.md included) |
| `frontend` | `anthropics/skills@frontend-design` from local marketplace mirror `/Users/idev/.claude/plugins/marketplaces/anthropic-agent-skills/skills/frontend-design/SKILL.md` | SKILL.md (55 lines, full) |
| `ux-ui-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill@ui-ux-pro-max` v2.5.0 from local marketplace mirror `/Users/idev/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md` | SKILL.md (659 lines, full) |

Rule IDs below are cited in FINDINGS.md as `rule(skill)`, e.g. `SC-3(shadcn)`.

## shadcn — rules (SC-*)

- **SC-1** Use existing components/variants before custom UI; compose, don't reinvent.
- **SC-2** Semantic colors only: `bg-primary`, `text-muted-foreground`; never raw values (`bg-blue-500`, hex).
- **SC-3** No `space-x-*`/`space-y-*`; use `flex`/`flex-col` + `gap-*`.
- **SC-4** `size-*` when width == height (`size-10`, not `w-10 h-10`).
- **SC-5** `truncate` shorthand, not the 3-class expansion.
- **SC-6** No manual `dark:` color overrides; semantic tokens carry dark mode.
- **SC-7** `cn()` for conditional classes; no template-literal ternaries.
- **SC-8** No manual `z-index` on overlay components (Dialog/Sheet/Popover self-stack).
- **SC-9** Forms: label per field, validation via `aria-invalid` on control (+ error text tied by `aria-describedby`); no raw div soup for form layout.
- **SC-10** Dialog/Sheet/Drawer always need a Title (sr-only allowed).
- **SC-11** Full Card composition (`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`); don't dump all in `CardContent`.
- **SC-12** Button loading = `Spinner` + `disabled`, not ad-hoc.
- **SC-13** `Avatar` always needs `AvatarFallback`.
- **SC-14** Callouts → `Alert`; empty states → `Empty`/consistent empty pattern; toast → `sonner`; separators → `Separator`; loading → `Skeleton`; status chips → `Badge`. No custom styled divs for these.
- **SC-15** Icons inside components: no per-icon sizing classes where the component sizes them; one icon library only.
- **SC-16** `className` for layout, not to override component colors/typography.
- **SC-17** Option sets (2–7 choices) → `ToggleGroup`, not looped Buttons with manual active state.

## tailwind (tailwind-design-system) — rules (TW-*)

- **TW-1** Design-token hierarchy: brand → semantic → component; components consume semantic tokens (`bg-primary`), never raw values.
- **TW-2** Tailwind v4 CSS-first: tokens defined in `@theme` in the global CSS file; dark mode via `@custom-variant dark` + token overrides, not per-usage `dark:` classes.
- **TW-3** Variants via CVA with a defined, finite set of variants/sizes; no ad-hoc per-page restyling of the same component.
- **TW-4** Consistent radius scale (`--radius-sm/md/lg/xl`); no arbitrary radii.
- **TW-5** Consistent focus ring recipe everywhere: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (or ring-[3px] token recipe); disabled = `disabled:pointer-events-none disabled:opacity-50`.
- **TW-6** Grid/containers: consistent container widths (`max-w-screen-xl`-class scale) with `px-4 sm:px-6 lg:px-8` gutters; responsive grids collapse 1→2→3/4 cols at sm/lg.
- **TW-7** Gap scale from spacing tokens: gap-2/4/6/8 (8px-based rhythm); no off-scale one-off gaps.
- **TW-8** Motion: keyframes as `--animate-*` tokens; entry/exit ≤300ms; use transform/opacity.
- **TW-9** Errors on inputs: `border-destructive` + `focus-visible:ring-destructive`, message in `text-destructive` with `role="alert"` and `aria-describedby`.
- **TW-10** OKLCH-based semantic palette with paired light/dark values designed together.

## frontend (frontend-design) — rules (FE-*)

- **FE-1** Hero is a thesis: open with the most characteristic content of the subject's world; no generic big-number-plus-gradient template.
- **FE-2** Typography carries personality: deliberate display/body pairing, clear type scale with intentional weights; type must not be a neutral default.
- **FE-3** Structure encodes information: eyebrows/numbering/dividers only when the content truly is a sequence/hierarchy.
- **FE-4** Motion is deliberate and few: one orchestrated moment beats scattered effects; respect reduced motion.
- **FE-5** Quality floor without announcing it: responsive to mobile, visible keyboard focus, reduced-motion respected.
- **FE-6** Copy is design material: name things by what users control; active voice; button says exactly what happens ("Save changes", not "Submit"); action keeps same name through flow.
- **FE-7** Errors state what went wrong and how to fix it; never vague. Empty screen = invitation to act.
- **FE-8** Consistent vocabulary across the interface; sentence case, plain verbs, no filler.
- **FE-9** Spend boldness in one signature place; everything else quiet and disciplined; remove one accessory.

## ux-ui-pro-max — rules (UX-*)

- **UX-1** Contrast: text ≥4.5:1 (large text/UI glyphs ≥3:1); verify both themes independently.
- **UX-2** Visible focus rings on all interactive elements; never removed.
- **UX-3** Icon-only buttons need `aria-label`; meaningful images need alt text.
- **UX-4** Heading hierarchy sequential h1→h6, no level skips; one h1 per page.
- **UX-5** Touch targets ≥44×44px with ≥8px spacing between targets.
- **UX-6** No hover-only affordances for primary interactions; `cursor-pointer` on clickables.
- **UX-7** Buttons disable + show spinner during async; feedback within 100ms.
- **UX-8** Images: dimensions/aspect-ratio declared (CLS <0.1); lazy-load below fold; reserve space for async content.
- **UX-9** Mobile-first; no horizontal scroll at 375px; systematic breakpoints (375/768/1024/1440); `min-h-dvh` over `100vh`.
- **UX-10** Body text ≥16px on mobile (prevents iOS zoom); line-height 1.5–1.75; line length 35–75ch; no body text <12px.
- **UX-11** 4/8px spacing rhythm; section spacing tiers (16/24/32/48) by hierarchy; consistent container max-width.
- **UX-12** Type scale consistent (12/14/16/18/24/32); weight hierarchy 600–700 headings / 400 body / 500 labels.
- **UX-13** Semantic color tokens, not raw hex in components; functional color (error/success) always paired with icon/text.
- **UX-14** Animation 150–300ms micro / ≤400ms complex; transform/opacity only; respect `prefers-reduced-motion`; exits faster than entries.
- **UX-15** Forms: visible label per input (no placeholder-only); error below field with recovery path; validate on blur; semantic input types; required indicators; focus first invalid field after submit error.
- **UX-16** Empty states: message + action, never blank. Loading >300ms: skeleton/shimmer, not blocking spinner.
- **UX-17** Nav: current location visibly highlighted; nav placement identical across pages; one primary CTA per screen; destructive actions visually separated.
- **UX-18** No emoji as structural icons; single icon family with consistent stroke/size tokens.
- **UX-19** Toasts auto-dismiss 3–5s, `aria-live="polite"`; confirmation before destructive actions; undo for destructive/bulk.
- **UX-20** Disabled = reduced opacity (0.38–0.5) + cursor + semantic attribute; pressed/hover/focus states distinct in both themes.
- **UX-21** Breadcrumbs for ≥3-level hierarchies; back behavior predictable, state preserved.
- **UX-22** Elevation/shadow scale consistent; effects match the chosen style; no random shadow values.

## Severity scale used in FINDINGS.md

- **P0** — broken UX/a11y at a required viewport (overflow, unusable control, contrast failure on primary content, missing labels on primary actions).
- **P1** — systemic rule violation on shared component or multiple pages (token misuse, focus states missing, off-scale rhythm).
- **P2** — local rule violation on one page (one-off spacing/typography/variant drift).
- **P3** — polish (micro-alignment, copy tone, motion nuance).
