# Provodnik App — Project Instructions

## Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui (23 components in `src/components/ui/`)
- Supabase (PostgreSQL + RLS + Auth)
- TanStack Query, React Hook Form + Zod
- Package manager: **bun** (never npm or yarn)

## Commands
```bash
bun dev                    # dev server (port 3000)
bun run build              # production build
bun run check              # typecheck + lint
bun run typecheck          # TS only
bun run lint               # ESLint only
bun run db:reset           # reset local Supabase + all migrations + seed
bun run db:diff            # schema diff → new migration file
bun run types              # regenerate src/types/supabase.ts
```

## Module Map
- `src/app` — routes + layouts (App Router)
- `src/features` — feature UI per role (home, listings, traveler, guide, admin)
- `src/components/ui` — shadcn/ui primitives (stable — don't modify casually)
- `src/components/shared` — shared app chrome (nav, footer, providers)
- `src/data` — service layer functions (accept typed Supabase client, work server+client)
- `src/lib` — env, utils, Supabase clients, flag registry (`src/lib/flags.ts`)
- `src/lib/supabase/database.types.ts` — generated DB types (run `bun run types` after schema changes)

## CSS Rules
- Tailwind utilities + shadcn/ui only — no custom CSS classes, no `<style>` blocks
- `globals.css`: ONLY `:root` design tokens and global resets — never add custom classes
- Glass pattern: `bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass`
- Design tokens via `tailwind.config.ts` — use `bg-surface-high`, `text-primary`, `rounded-card`, not raw `var()`

## Architecture Rules
- Server components fetch via `createServerClient` — no `useEffect` for SSR data
- Interactive/filtered data: TanStack Query with Supabase cache helpers
- Data queries: service functions in `src/data/` — accept typed Supabase client
- RLS is the security boundary — never rely on app-layer filtering alone
- File uploads: presigned URL via Server Action → direct browser upload to Supabase Storage

## Environment
Copy `.env.example` → `.env.local`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. App shell runs without credentials (Supabase helpers throw only if called unconfigured).

## Verification (definition of done)
1. `bun run typecheck` → 0 errors
2. `bun run lint` → 0 errors
3. No custom CSS classes added
4. No inline `style={{}}` for layout
5. Commit exists; message reads as written by a human engineer (NO automation co-author or attribution trailers)

## Git Rules
- **NEVER `git push`** — commit only, report hash, wait for push instruction
- Pushing to `origin/main` triggers immediate Vercel production deploy
- Format: `type(scope): description` only. NO `Co-Authored-By:` / any automation attribution trailer — commits read as human-written.

## Orchestration
Provodnik is isolated at `/Users/idev/provodnik`. Hermes/Quantumbek in Telegram topics owns coordination. Quantumbek is the thinking, planning, review, and verification layer and must not mutate product code. QuantumHands is the only product-code executor for code edits. SOT files live at `.claude/sot/` (`HOT.md`, `INDEX.md`, `ERRORS.md`, `ANTI_PATTERNS.md`, `DECISIONS.md`, `PATTERNS.md`, etc.). Prompt skeleton at `.claude/prompts/skeleton.md`. Post-deployment checklist at `.claude/checklists/post-deployment-verification.md`. See `.claude/CLAUDE.md` for the full flow + hand-edit conventions.
