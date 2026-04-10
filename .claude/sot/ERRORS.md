# ERRORS.md — Bug & Failure Log

_Append-only. Never delete entries. Format: ERR-NNN_

---

### ERR-001: getListingsByDestination slug mismatch
- **Symptom:** Destination pages show 0 tours despite listings existing in DB
- **Root Cause:** Query uses slug string directly in ilike: `.or('city.ilike.%kazan-tatarstan%')` — but city column contains Russian name 'Казань', not the slug
- **Fix:** First fetch destination by slug to get `.name` and `.region`, then query listings with those values
- **Files Affected:** `src/data/supabase/queries.ts` fn `getListingsByDestination`
- **Date:** 2026-04-06
- **Prevention:** Never use slug directly in data column queries. Always resolve slug → record first.

### ERR-002: Demo bar visible in production
- **Symptom:** WorkspaceRoleNav renders signInAs() buttons unconditionally — any user can switch roles
- **Root Cause:** Demo controls block not guarded by NODE_ENV check
- **Fix:** Wrap demo controls `<div>` in `{process.env.NODE_ENV !== 'production' && (...)}` 
- **Files Affected:** `src/components/shared/workspace-role-nav.tsx`
- **Date:** 2026-04-06
- **Prevention:** Any dev-only UI must be wrapped in NODE_ENV guard

### ERR-003: Wrong hero images for Kazan and Nizhny destinations
- **Symptom:** Kazan destination page shows non-Kazan photo (possibly Dubai skyline)
- **Root Cause:** Seed SQL has incorrect Unsplash photo IDs for kazan-tatarstan and nizhny-novgorod rows
- **Fix:** Replace hero_image_url with correct Russian city photos in seed.sql; run bun run db:reset
- **Files Affected:** `supabase/migrations/20260401000002_seed.sql`
- **Date:** 2026-04-06
- **Prevention:** Verify photo URLs visually before committing to seed

### ERR-004: Listing images fall back to generic mountain photo
- **Symptom:** All listing cards show same mountain photo regardless of destination
- **Root Cause:** `mapListingRow` calls `parseImageFromJson(row.description)` but description is plain text, not JSON. Always falls back to fallbackHeroImage
- **Fix:** Add `image_url` column to listings table; update mapListingRow to read image_url first
- **Files Affected:** `src/data/supabase/queries.ts` fn `mapListingRow`, `supabase/migrations/`
- **Date:** 2026-04-06
- **Prevention:** Never store image URLs inside description/notes JSON. Use dedicated columns.

### ERR-005: listingCount shows static seed value not actual tour count
- **Symptom:** Destination stats row shows "2 tours" even when real query returns different count
- **Root Cause:** destination-detail-screen.tsx uses `destination.listingCount ?? listings.length` — prefers static column over live count
- **Fix:** Change to `listings.length > 0 ? listings.length : (destination.listingCount ?? 0)`
- **Files Affected:** `src/features/destinations/components/destination-detail-screen.tsx`
- **Date:** 2026-04-06
- **Prevention:** Prefer live query results over static denormalized counts for accuracy

### ERR-006: Browser native validation tooltip on empty form submit
- **Symptom:** Auth form shows browser tooltip instead of styled red error box on empty submit
- **Root Cause:** Input elements have `required` HTML attributes which trigger browser validation before JS handler runs
- **Fix:** Remove `required` attributes from all Input elements in auth-entry-screen.tsx
- **Files Affected:** `src/features/auth/components/auth-entry-screen.tsx`
- **Date:** 2026-04-06
- **Prevention:** Use JS validation only in forms with custom error UI. Never mix HTML5 required with custom validation.

### ERR-008: cursor-agent rejects model name claude-sonnet-4-6
- **Symptom:** cursor-agent exits with "Cannot use this model" when `--model claude-sonnet-4-6` is passed
- **Root Cause:** cursor-agent uses its own model registry; Claude model IDs differ from Anthropic API IDs
- **Fix:** Use `--model claude-4.6-sonnet-medium` (or `--model auto`) for Claude Sonnet in cursor-agent
- **Files Affected:** All cursor-agent dispatch commands in prompts
- **Date:** 2026-04-07
- **Prevention:** Always use `--model auto` for cursor-agent unless a specific model name is confirmed from `cursor-agent --help`

### ERR-009: null as any passed as Supabase client in route pages
- **Symptom:** Dynamic route pages (`/guide/[id]`, `/listings/[slug]`, etc.) had `null as any` as client arg in cache wrapper functions — causes runtime type errors
- **Root Cause:** 7 route pages were missed in the first null-as-any fix pass (only 4 were fixed)
- **Fix:** Import `createSupabaseServerClient` and await it inside each cache wrapper or page function
- **Files Affected:** 7 files in `src/app/(protected)/guide/requests/[requestId]/`, `src/app/(site)/destinations/[slug]/`, `src/app/(site)/guide/[id]/`, `src/app/(site)/guides/[slug]/`, `src/app/(site)/listings/[slug]/`, `src/app/(site)/requests/[requestId]/`, `src/app/(site)/requests/`
- **Date:** 2026-04-07
- **Prevention:** After fixing any null-as-any client pattern, grep entire codebase for `null as any` to find all instances

### ERR-010: ESLint silently broken — 47 errors undetected
- **Symptom:** `bun run lint` was never run after Phase 6; 47 lint errors accumulated across 15+ files
- **Root Cause:** No enforcement hook or CI check required lint before commits
- **Fix:** Added PostToolUse Bash hook in `.claude/settings.json` that prints LINT_REMINDER after every commit/merge; added lint gate to CLAUDE.md acceptance criteria
- **Files Affected:** `.claude/settings.json`, `CLAUDE.md`
- **Date:** 2026-04-07
- **Prevention:** `bun run typecheck && bun run lint` must pass before every commit — enforced via hook

### ERR-011: Guide seed avatars — wrong gender photos
- **Symptom:** Elena Voronina (female) displayed male face photo; Maksim Korolev (male) displayed female face; Maria Grechko (female) same photo as Алексей Соколов
- **Root Cause:** Unsplash photo IDs copy-pasted without checking gender/uniqueness
- **Fix:** Updated seed.sql with correct-gender unique Unsplash IDs for three guides
- **Files Affected:** `supabase/migrations/20260401000002_seed.sql`
- **Date:** 2026-04-10
- **Prevention:** When adding seed avatar URLs, verify photo gender matches name and no URL is reused across profiles

### ERR-012: Policy pages text at borders — no container
- **Symptom:** /trust, /policies/terms, /policies/privacy, /policies/cancellation, /policies/refunds content rendered edge-to-edge with no horizontal padding
- **Root Cause:** No layout.tsx existed for /policies group; /trust page had no container wrapper
- **Fix:** Added `src/app/(site)/policies/layout.tsx` with max-w-[860px] + clamp padding; wrapped /trust page content in same container
- **Files Affected:** `src/app/(site)/policies/layout.tsx` (new), `src/app/(site)/trust/page.tsx`
- **Date:** 2026-04-10
- **Prevention:** All public content pages must have a layout with max-w + px-[clamp(20px,4vw,48px)]

### ERR-007: guide@provodnik.test has no listings
- **Symptom:** Login as test guide → /guide/listings shows empty state
- **Root Cause:** Seed listings belong to guide IDs 10000000-...-101 and 10000000-...-102, but test guide ID is 30000000-0000-4000-8000-000000000001
- **Fix:** Add seed listings with guide_id = '30000000-0000-4000-8000-000000000001'
- **Files Affected:** `supabase/migrations/20260401000002_seed.sql`
- **Date:** 2026-04-06
- **Prevention:** Test accounts must have corresponding seed data. Check guide_id alignment when adding listings.
