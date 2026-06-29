# Public Page Look & Feel Unification — Opus Task Packet

## Goal
Unify Provodnik public pages into one coherent product experience. Pages should keep separate user intents, but share the same visual language, layout rhythm, search/filter treatment, card shell, spacing, and page family rules.

## User complaint / product problem
The user specifically called out:
- `/requests` and `/listings` look similar in intent but visually odd/inconsistent.
- `/guides` looks like a different product.
- We already decided to have one reusable design/page system, but public pages still look custom/fragmented.
- All pages should feel like the same product.

## Important constraints
- Do not push.
- Preserve Provodnik brand colors and existing design tokens.
- Keep page intents separate; do not blindly merge routes.
- Keep route URLs stable unless a low-risk redirect/hide is explicitly necessary.
- Keep changes scoped to public page look/feel and supporting reusable components/tests.
- Do not touch unrelated request-card grid/infinite-scroll work unless required by shared shell integration.
- Do not remove existing real data behavior.
- Respect feature flags and existing nav refactor.
- Avoid huge decorative hero-first pages; use compact, user-first discovery structure.
- Use Context7 MCP for Next.js/React/Tailwind/shadcn APIs as needed.
- Use sequential thinking: reason step-by-step before editing, inventory before coding, verify after each phase.

## Current evidence from audit
Public pages checked:
- `https://dev.provodnik.app/requests`
- `https://dev.provodnik.app/listings`
- `https://dev.provodnik.app/guides`
- `https://dev.provodnik.app/destinations`
- `https://dev.provodnik.app/how-it-works`
- `https://dev.provodnik.app/become-a-guide`
- `https://dev.provodnik.app/trust`
- `https://dev.provodnik.app/help`
- `https://dev.provodnik.app/search`

Observed:
- `/requests` H1 still says `Открытые запросы`; nav says `Запросы`.
- `/listings` H1/title still says `Готовые экскурсии`; nav says `Экскурсии`.
- `/requests`, `/listings`, `/guides`, `/destinations` use different hero/search/filter/card rhythms.
- `/search` overlaps heavily with `/listings` and adds another marketplace layout.
- `/help` returns status 200 but renders a 404 UI while linked from nav/footer/account surfaces.
- Info pages (`/how-it-works`, `/become-a-guide`, `/trust`) do not share a single info/conversion layout language.

## Desired architecture
Create two public page families and shared primitives:

### 1) Discovery page family
Use for:
- `/requests`
- `/listings`
- `/guides`
- `/destinations`

Common structure:
```text
Header
Compact discovery hero
Search/intent bar
Filter chips / category row
Results count / sort/status line where relevant
Consistent 3-column desktop grid / 2-column tablet / 1-column mobile
Consistent card frame rhythm
CTA strip / footer
```

Only content/card type changes per page.

Suggested reusable components:
- `DiscoveryPageShell`
- `DiscoveryHero`
- `DiscoveryToolbar`
- `DiscoveryGrid`
- `DiscoveryCardFrame` or shared card wrapper if feasible without risky rewrites
- `DiscoveryEmptyState` if needed

### 2) Info/conversion page family
Use for:
- `/how-it-works`
- `/become-a-guide`
- `/trust`
- `/help`

Common structure:
```text
Header
Simple text hero
Primary CTA
Step/trust/FAQ cards
Secondary CTA
Footer
```

Suggested reusable components:
- `InfoPageShell`
- `InfoHero`
- `InfoSection`
- `StepSection`
- `ConversionCTA`
- `FaqSection` where useful

### 3) Search page decision
Low-risk recommendation:
- Do not add `/search` to nav.
- Either align `/search` to the same Discovery shell or redirect it to `/listings` if it is truly duplicative and tests/routes allow.
- Prefer not breaking external links: if redirecting, use a Next redirect from `/search` to `/listings`; otherwise refactor `/search` to use the same shell and label it as all offerings.

### 4) Help page fix
Must fix:
- `/help` must not show 404 UI if it is linked.
- Implement a real lightweight help center page using the info/conversion family, or hide every `/help` link behind the feature flag if the feature is intentionally off.
- Preferred: real lightweight help page with FAQ/support cards.

## Task breakdown

### Task 0 — Read/inventory first
- Read `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md` if present.
- Read current navigation/design components.
- Inspect current public page implementations:
  - `src/app/(site)/requests/page.tsx`
  - `src/features/requests/components/public-requests-marketplace-screen.tsx`
  - `src/app/(site)/listings/page.tsx`
  - `src/features/listings/components/public/public-listing-discovery-screen.tsx`
  - `src/app/(site)/guides/page.tsx`
  - guide discovery feature components
  - `src/app/(site)/destinations/page.tsx`
  - destination components
  - `src/app/(site)/how-it-works/page.tsx`
  - `src/app/(site)/become-a-guide/page.tsx`
  - `src/app/(site)/trust/page.tsx`
  - `src/app/(site)/help/page.tsx`
  - `src/app/(site)/search/page.tsx`
- Identify existing shared primitives (`ListHero`, cards, toolbars, page headers) before creating new ones.

### Task 1 — Create shared page family primitives
- Add/extend reusable discovery/info page primitives in `src/components/shared/` or a suitable existing shared folder.
- Keep tokens Tailwind/native to the project; no new UI library.
- Write focused tests for the primitives if they include logic/structure.

### Task 2 — Align labels and metadata
- `/requests` H1 should be `Запросы`.
- `/listings` H1 and metadata should use `Экскурсии` where user-facing; keep SEO description sensible.
- Avoid stale public copy like `Готовые экскурсии` in nav-facing page headings unless there is a strong content reason.
- Keep internal code names if renaming files is too risky.

### Task 3 — Migrate discovery pages
- Migrate `/requests`, `/listings`, `/guides`, `/destinations` onto the shared discovery page family.
- Same hero height/spacing/search/filter rhythm.
- Same grid behavior: 3 cols desktop, 2 tablet, 1 mobile where appropriate.
- Preserve page-specific card data and actions.
- Avoid overbuilding: card internals can remain unique, but outer rhythm should feel unified.

### Task 4 — Fix/help and unify info pages
- Implement real `/help` page if currently 404 behind 200.
- Migrate `/how-it-works`, `/become-a-guide`, `/trust`, `/help` to shared info/conversion family.
- Keep copy concise and product-specific.

### Task 5 — Decide `/search`
- If simple: align `/search` with discovery shell.
- If it is duplicative and tests are easy: redirect `/search` to `/listings` or document why not.
- Do not leave it as a third inconsistent marketplace template.

### Task 6 — Tests and visual QA
- Add/update targeted component/page tests for:
  - label changes
  - `/help` renders real help content, not 404
  - discovery pages render shared shell/expected headings
  - `/search` redirect/alignment behavior if changed
- Run:
  - `bun run typecheck`
  - `bun run lint`
  - `bun run build`
  - targeted tests for changed components/pages
  - full `bun run test` if feasible before commit
- Production smoke after build:
  - restart local `bun run start --hostname 127.0.0.1 --port 3000`
  - Playwright check public routes at desktop and mobile widths
  - verify no 404 body on `/help`
  - verify no console/page errors
  - verify no horizontal overflow at mobile width
  - capture screenshots into `docs/qa/finish-website-2026-06-28/public-page-unification/`

### Task 7 — Commit
If all gates pass, commit exactly:
```text
refactor(public): unify page look and feel
```

## Acceptance criteria
- Public discovery pages visually feel like one reusable system.
- Info/conversion pages visually feel like one reusable system.
- `/help` no longer renders 404 UI while linked.
- `/search` is no longer an inconsistent duplicate layout.
- Nav labels and page headings are coherent with the latest nav naming.
- Tests/build/checks pass.
- No unrelated changes or pushes.

## Return contract
Return concise final report:
- files changed
- reusable components created/changed
- per-page changes
- `/search` decision
- `/help` fix
- commands run + results
- screenshot artifact paths
- commit hash or concrete blocker
