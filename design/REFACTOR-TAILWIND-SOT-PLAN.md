# Provodnik Static HTML SOT Refactor Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `design/html/` into the clean static source of truth for the 8 core Provodnik pages by replacing the legacy `hw-*` + `home.css` system with Tailwind-based static HTML.

**Architecture:** Keep everything in plain HTML plus one compiled Tailwind stylesheet. Treat the current HTML files as the structural baseline, and treat `design/NBP.md`, `design/NBP-01..08`, `design/HOMEPAGE-SPEC.md`, and `design/STAKEHOLDER-FEEDBACK.md` as the content and UX authority. Do not involve Next.js in this pass.

**Tech Stack:** Static HTML, Tailwind CLI, one shared `input.css`, one compiled `css/tailwind.css`, Google Fonts.

---

## Observed Reality

- `design/html/` has the expected 8 HTML files, but no `package.json`, no `tailwind.config.js`, no `input.css`, and no compiled `css/tailwind.css`.
- All 8 pages still import `css/home.css`.
- All 8 pages still use `hw-theme-*` and `hw-*` classes.
- `design/html/css/home.css` still exists and is the active styling dependency.
- The current plan in `REFACTOR-TAILWIND-SHADCN.md` describes the desired end state, but it does not match the actual current workspace.

### Current page inventory

- `index.html`: `hw` token count 204
- `requests.html`: `hw` token count 175
- `request-details.html`: `hw` token count 97
- `create-request.html`: `hw` token count 72
- `destination.html`: `hw` token count 121
- `tour.html`: `hw` token count 91
- `guide.html`: `hw` token count 113
- `dashboard.html`: `hw` token count 86

## Source-of-Truth Hierarchy

When conflicts appear, use this order:

1. `design/NBP.md`
2. `design/NBP-01-home.md` through `design/NBP-08-dashboard.md`
3. `design/STAKEHOLDER-FEEDBACK.md`
4. `design/HOMEPAGE-SPEC.md` for homepage visual tokens only
5. `design/LAYOUT.md`
6. Existing `design/html/*.html` only for structure worth preserving
7. `design/REFACTOR-TAILWIND-SHADCN.md` only as a migration sketch, not as the canonical product spec

## Key Discrepancies To Fix

- The current plan assumes Tailwind scaffolding exists. It does not.
- The current plan assumes `create-request.html` and `dashboard.html` have already dropped the subpage hero treatment. They have not.
- The current plan assumes legacy classes and `home.css` are gone. They are still the only active styling path.
- The current plan does not explicitly define which product docs outrank it when copy or structure conflicts appear.
- The `design/` folder contains non-SOT artifacts (`output/`, screenshots, `tmp_openclaw_src/`) that should not drive markup decisions.

## In Scope

- Refactor only `design/html/`
- Add Tailwind CLI scaffolding inside `design/html/`
- Move visual tokens into Tailwind config and `input.css`
- Replace custom `hw-*` markup classes with utility-driven HTML
- Keep pages static and browsable without app code
- Align copy and layout with the approved design docs listed above

## Out Of Scope

- Next.js migration
- React or shadcn componentization
- App data wiring
- New product scope beyond the 8 static pages
- Cleaning non-HTML artifacts outside `design/html/` unless explicitly requested

## File Map

### Create

- `design/html/package.json`
- `design/html/tailwind.config.js`
- `design/html/input.css`
- `design/html/css/tailwind.css`

### Modify

- `design/html/index.html`
- `design/html/requests.html`
- `design/html/request-details.html`
- `design/html/create-request.html`
- `design/html/destination.html`
- `design/html/tour.html`
- `design/html/guide.html`
- `design/html/dashboard.html`

### Delete at the end

- `design/html/css/home.css`

## Implementation Tasks

### Task 1: Lock the design authority before editing markup

**Files:**
- Review: `design/NBP.md`
- Review: `design/NBP-01-home.md`
- Review: `design/NBP-02-requests.md`
- Review: `design/NBP-03-request-details.md`
- Review: `design/NBP-04-create-request.md`
- Review: `design/NBP-05-destination.md`
- Review: `design/NBP-06-tour-listing.md`
- Review: `design/NBP-07-guide-profile.md`
- Review: `design/NBP-08-dashboard.md`
- Review: `design/STAKEHOLDER-FEEDBACK.md`
- Review: `design/HOMEPAGE-SPEC.md`

- [ ] Read the design docs in the source-of-truth order above.
- [ ] Write down page-by-page content and layout requirements before changing HTML.
- [ ] Note every place where existing `design/html/*.html` conflicts with the design docs.
- [ ] Treat those notes as the editing checklist for the rest of the work.

### Task 2: Create the Tailwind static workspace

**Files:**
- Create: `design/html/package.json`
- Create: `design/html/tailwind.config.js`
- Create: `design/html/input.css`

- [ ] Create `package.json` with only the Tailwind CLI scripts needed for static HTML work.
- [ ] Create `tailwind.config.js` with content scanning for the 8 local HTML files.
- [ ] Add the Provodnik static design tokens to the config.
- [ ] Create `input.css` with base styles, reusable utility classes, and the minimum shared component classes required for repeated patterns.
- [ ] Keep shared classes minimal. The target is utility-first HTML, not a new custom CSS framework.

### Task 3: Standardize the shared shell

**Files:**
- Modify: `design/html/index.html`
- Modify: `design/html/requests.html`
- Modify: `design/html/request-details.html`
- Modify: `design/html/create-request.html`
- Modify: `design/html/destination.html`
- Modify: `design/html/tour.html`
- Modify: `design/html/guide.html`
- Modify: `design/html/dashboard.html`
- Modify: `design/html/input.css`

- [ ] Replace each page head with one consistent font + stylesheet pattern.
- [ ] Switch every page from `css/home.css` to `css/tailwind.css`.
- [ ] Replace `hw-theme-*` body classes with neutral Tailwind body classes.
- [ ] Introduce one reusable skip-link pattern across all pages.
- [ ] Introduce one reusable footer structure across all pages.
- [ ] Build one dark-hero nav variant and one light-page nav variant.

### Task 4: Refactor the homepage first

**Files:**
- Modify: `design/html/index.html`
- Modify: `design/html/input.css`

- [ ] Rebuild the homepage markup using Tailwind utilities directly in the HTML.
- [ ] Match hero, gateway cards, popular destinations, process section, and trust/footer sections to `NBP-01-home.md` and `HOMEPAGE-SPEC.md`.
- [ ] Preserve Russian copy and visual hierarchy.
- [ ] Remove all `hw-*` classes from `index.html`.
- [ ] Open the page and visually verify it as the reference for the remaining pages.

### Task 5: Refactor the requests marketplace

**Files:**
- Modify: `design/html/requests.html`

- [ ] Replace the current marketplace hero and cards with Tailwind markup aligned to `NBP-02-requests.md`.
- [ ] Keep filters, request cards, and join-group emphasis consistent with the design docs.
- [ ] Make sure the card content includes city plus region where required.
- [ ] Remove all `hw-*` classes from `requests.html`.

### Task 6: Refactor the request details page

**Files:**
- Modify: `design/html/request-details.html`

- [ ] Rebuild the page around the approved request-detail structure from `NBP-03-request-details.md`.
- [ ] Preserve the group-progress, guide-offer, and price-scenario concepts.
- [ ] Remove all `hw-*` classes from `request-details.html`.

### Task 7: Refactor the create-request page

**Files:**
- Modify: `design/html/create-request.html`

- [ ] Remove the current legacy subpage-hero treatment if it conflicts with the approved design direction.
- [ ] Implement the static form and preview layout from `NBP-04-create-request.md`.
- [ ] Keep it static HTML only. No JS form behavior is required in this pass.
- [ ] Remove all `hw-*` classes from `create-request.html`.

### Task 8: Refactor the destination page

**Files:**
- Modify: `design/html/destination.html`

- [ ] Align the page to `NBP-05-destination.md`.
- [ ] Keep the city hero, open groups, tours, and local guides sections.
- [ ] Remove all `hw-*` classes from `destination.html`.

### Task 9: Refactor the tour page

**Files:**
- Modify: `design/html/tour.html`

- [ ] Align the page to `NBP-06-tour-listing.md`.
- [ ] Preserve the tour detail, guide panel, route-builder flavor, and dual CTA intent.
- [ ] Remove all `hw-*` classes from `tour.html`.

### Task 10: Refactor the guide profile page

**Files:**
- Modify: `design/html/guide.html`

- [ ] Align the page to `NBP-07-guide-profile.md`.
- [ ] Preserve guide trust markers, listing grid, and offer activity.
- [ ] Remove all `hw-*` classes from `guide.html`.

### Task 11: Refactor the dashboard page

**Files:**
- Modify: `design/html/dashboard.html`

- [ ] Replace the current legacy hero treatment if it conflicts with the approved dashboard direction.
- [ ] Align the page to `NBP-08-dashboard.md`.
- [ ] Preserve the tabs, status cards, and summary widget.
- [ ] Remove all `hw-*` classes from `dashboard.html`.

### Task 12: Compile, verify, and remove the legacy stylesheet

**Files:**
- Modify: `design/html/package.json`
- Modify: `design/html/input.css`
- Delete: `design/html/css/home.css`

- [ ] Run the Tailwind build and verify `css/tailwind.css` is generated.
- [ ] Confirm all 8 pages render using only `css/tailwind.css`.
- [ ] Search `design/html/` for `hw-`, `hw-theme-`, `var(--hw-`, and `css/home.css`.
- [ ] Delete `design/html/css/home.css` only after the search is clean.
- [ ] Do a final pass for duplicate utilities or accidental regressions in spacing, type, and card hierarchy.

## Verification Checklist

- [ ] `design/html/package.json` exists
- [ ] `design/html/tailwind.config.js` exists
- [ ] `design/html/input.css` exists
- [ ] `design/html/css/tailwind.css` exists
- [ ] No HTML file links to `css/home.css`
- [ ] No HTML file contains `hw-theme-`
- [ ] No HTML file contains `hw-`
- [ ] `design/html/css/home.css` is removed
- [ ] All 8 pages open as standalone static documents
- [ ] Russian copy matches the approved design docs

## Suggested Commands

```powershell
cd D:\dev\projects\provodnik\design\html
npm install
npm run build
rg -n "hw-|hw-theme-|var\(--hw-|css/home\.css" .
```

## Definition Of Done

- `design/html/` is the clean static source of truth for the 8-page Provodnik experience
- The legacy `hw-*` system is gone
- Tailwind is the only styling path
- The HTML reflects the approved product docs, not stale prototype compromises
