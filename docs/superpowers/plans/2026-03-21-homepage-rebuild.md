# Homepage Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `/` homepage with a clean desktop-first rebuild that matches the approved warm editorial glassmorphism design.

**Architecture:** The route becomes a thin wrapper around a new `features/homepage` module. Static homepage content is centralized in one source file, and each visual section is implemented as an isolated component with clear responsibilities.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, `next/image`, `lucide-react`.

---

### Task 1: Freeze Route Ownership

**Files:**
- Modify: `src/app/(home)/page.tsx`
- Inspect: `src/features/homepage/components/homepage-shell.tsx`

- [ ] **Step 1: Replace the route-level section assembly with a single shell import**

The route should only import and render `HomePageShell`.

- [ ] **Step 2: Keep route behavior minimal**

No homepage content, styles, or card logic should remain in the route file.

- [ ] **Step 3: Verify imports stay on repo aliases**

Use `@/features/...` imports only.

### Task 2: Centralize Homepage Content

**Files:**
- Create: `src/features/homepage/components/homepage-content.ts`

- [ ] **Step 1: Define typed static content for the homepage**

Include:
- nav items
- hero copy
- gateway card copy
- mini request card data
- mini listing card data
- destination grid data
- process steps
- trust card copy
- footer links

- [ ] **Step 2: Normalize corrupted generated copy**

Preserve meaning from the approved reference while removing broken Russian strings from old docs.

- [ ] **Step 3: Store image URLs in the content file**

Keep all homepage-specific image decisions in one place.

### Task 3: Rebuild Homepage Shell

**Files:**
- Modify: `src/features/homepage/components/homepage-shell.tsx`
- Create: `src/features/homepage/components/homepage-navbar.tsx`
- Create: `src/features/homepage/components/homepage-hero.tsx`
- Create: `src/features/homepage/components/homepage-gateway.tsx`
- Create: `src/features/homepage/components/homepage-destinations.tsx`
- Create: `src/features/homepage/components/homepage-process.tsx`
- Create: `src/features/homepage/components/homepage-trust.tsx`
- Create: `src/features/homepage/components/homepage-footer.tsx`

- [ ] **Step 1: Make `homepage-shell.tsx` the composition root**

It should render the full homepage in order and own the shared page wrapper only.

- [ ] **Step 2: Implement the floating frosted navbar**

Match the desktop glass bar treatment from the approved image.

- [ ] **Step 3: Implement the compact hero**

Use bright editorial photography, centered serif headline, frosted search shell, and pill CTAs.

- [ ] **Step 4: Implement the overlapping dual gateway cards**

The cards should feel layered into the hero and include dense mini-card content.

- [ ] **Step 5: Implement the destinations grid**

Use one large featured card plus four smaller image cards with overlays and badges.

- [ ] **Step 6: Implement the five-step process strip**

Use a lighter, editorial horizontal rhythm rather than dashboard-like blocks.

- [ ] **Step 7: Implement the trust cards and footer**

Keep them compact, refined, and visually subordinate to the hero and gateway.

### Task 4: Keep The Build Isolated From Legacy Home Sections

**Files:**
- Inspect only: `src/features/home/components/*`

- [ ] **Step 1: Do not depend on the old home section files**

The rebuild should stand on the new homepage module.

- [ ] **Step 2: Leave legacy files untouched unless absolutely required**

Avoid mixing old and new homepage systems.

### Task 5: Visual Verification

**Files:**
- Output artifact: `D:\dev\projects\provodnik\design\live-home-actual.png`

- [ ] **Step 1: Run the production build**

Run: `bun run build`
Expected: build completes successfully.

- [ ] **Step 2: Open the homepage in a browser and capture a fresh screenshot**

Use the desktop viewport used during review.

- [ ] **Step 3: Compare against the approved reference**

Check:
- nav position and treatment
- hero crop and text block
- gateway overlap and card density
- destination grid proportions
- process strip weight
- trust and footer refinement

- [ ] **Step 4: Fix obvious deltas before closeout**

Only finish once the page reads as the approved design at a glance.
