# Design Spec: Phases 3-7 — Communication, Trust, SEO, Quality, Launch

> Written 2026-04-01. Covers all remaining work to go-live.
> Based on: PLAN.md, full schema audit, codebase exploration, self-Q&A with critique.

---

## 1. Current State

**Completed:** Phase 0 (visual), Phase 1 (auth), Phase 2 (marketplace loop)
**Remaining:** Phases 3-7 (communication, trust, SEO, quality, launch)

**Schema readiness:** All tables for Phases 3-7 already exist in `20260401000001_schema.sql`:
- Messaging: `conversation_threads`, `thread_participants`, `messages`
- Notifications: `notifications`, `notification_deliveries`
- Reviews: `reviews`
- Disputes: `disputes`, `dispute_notes`, `dispute_evidence`
- File storage: `storage_assets`, `guide_documents`, `listing_media`
- Moderation: `moderation_cases`, `moderation_actions`
- Audit: `marketplace_events`
- Quality: `quality_snapshots`

**Scaffolded UI (wired to Supabase but incomplete):**
- `notification-center-screen.tsx` — reads from `notifications` table, no realtime
- `traveler-booking-review-screen.tsx` — review form exists
- `public-reviews-section.tsx` — review display exists
- `admin/disputes/` — dispute pages exist
- `admin/listings/` — listing moderation page exists

**Not yet built:**
- Messaging UI (no conversation list, no chat window)
- File upload infrastructure
- Realtime subscriptions (zero Supabase Realtime usage)
- Email notifications
- SEO metadata on any route
- Any tests
- CI/CD pipeline

---

## 2. Architectural Decisions

### Messaging
- **Thread creation:** Lazy — created on first message attempt, not on entity creation
- **Realtime:** Supabase Realtime `postgres_changes` on `messages` table, filtered by `thread_id`
- **CRITICAL:** Must enable Realtime replication on `messages` table: `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`
- **Presence:** Not needed for launch (chat is async, not live video)
- **Message ordering:** `created_at` ascending (server timestamps only, never client), cursor-based pagination (50 per page)
- **Unread counts:** Computed from `thread_participants.last_read_at` vs latest message `created_at`
- **Connection management:** Share single Supabase client instance; multiple `.channel()` calls share one WebSocket. Always `removeChannel()` on unmount.
- **Channel naming:** `thread:<uuid>` — filter by thread_id in subscription
- **RLS:** Needs `is_thread_participant()` SECURITY DEFINER helper function to avoid recursive RLS. Messages are immutable (no UPDATE/DELETE policies). Thread participant insertion via service role only.

### Notifications
- **In-app:** Direct DB insert into `notifications` table from server actions
- **Realtime badge:** Supabase Realtime subscription on `notifications` table filtered by `user_id`
- **Email:** DEFERRED — no Resend API key yet. Build the notification trigger infrastructure (DB inserts + in-app display) but skip actual email sending. Email templates and Resend integration will be added when API key is available.
- **Push:** Deferred to v2 (no service worker registration)
- **Auth emails (magic links):** Set Resend as custom SMTP in Supabase Auth settings

### File Uploads
- **Pattern:** Presigned URL from Server Action → direct browser upload to Supabase Storage → confirm via server action
- **Buckets:** `guide-avatars`, `guide-documents`, `listing-media`, `dispute-evidence`
- **Validation:** Server-side MIME type + file size checks before generating presigned URL
- **Max sizes:** Avatars 2MB, Documents 10MB, Listing photos 5MB

### Admin Moderation
- **Queue:** Simple filterable table from `moderation_cases`
- **Actions:** approve/reject/request_changes → creates `moderation_actions` row, updates entity status
- **Auto-queue:** When guide submits verification or listing, auto-create moderation case

### Reviews
- **Trigger:** Available after booking status = 'completed'
- **Constraint:** One review per booking (DB unique constraint on `booking_id`)
- **Display:** On guide public profile + listing detail page

### SEO
- **Metadata:** `generateMetadata()` on all `(site)` routes
- **Root layout:** Must set `metadataBase: new URL('https://provodnik.app')` for relative URLs to resolve
- **Title template:** `{ default: 'Provodnik — Найди своего гида', template: '%s — Provodnik' }` in root layout
- **JSON-LD:** `TouristAttraction` for listings (with `offers`), `TravelAgency` for guides, `BreadcrumbList` for nav
- **JSON-LD placement:** Inline `<script type="application/ld+json">` in component body (NOT in generateMetadata, NOT via next/script)
- **JSON-LD XSS prevention:** Always `.replace(/</g, '\\u003c')` in dangerouslySetInnerHTML
- **Sitemap:** Dynamic via `app/sitemap.ts` querying destinations + published listings + approved guides
- **Robots:** Standard via `app/robots.ts`, disallow `/admin/`, `/api/`, `/traveler/settings/`, `/guide/dashboard/`

### Testing
- **Unit (Vitest):** State machine, Zod schemas, data layer functions, notification triggers. Use `jsdom` environment + `@vitejs/plugin-react` + `vite-tsconfig-paths` for `@/` aliases.
- **IMPORTANT:** Async Server Components CANNOT be tested with Vitest — use Playwright for those
- **Supabase mocking:** Mock Supabase client in unit tests. Use `supabase start` with seeded DB for E2E.
- **E2E (Playwright):** 3 critical paths — signup→request→offer→booking, guide onboarding, admin moderation
- **E2E webServer:** Use `bun run build && bun run start` (production build, NOT dev mode)
- **CI:** GitHub Actions — lint+typecheck+vitest on PR, playwright on merge

### Rate Limiting
- **Where:** Auth endpoints, mutation server actions (create request, send message, create offer)
- **How:** Upstash Redis sliding window (already in deps)
- **Limits:** Auth: 5/min, Mutations: 20/min, Messages: 30/min

---

## 3. Wave Execution Plan

### WAVE 1 — Phase 3 (messaging + notifications) + Phase 5 (SEO) — 5 worktrees

#### WT-3A: Messaging Data Layer
- **Branch:** `phase3/messaging-data`
- **Creates:** `src/lib/supabase/conversations.ts`
- **Functions:** getOrCreateThread, sendMessage, getThreadMessages, getUserThreads, markThreadRead, getUnreadCount
- **Tests thread creation for each subject_type (request, offer, booking, dispute)**
- **Acceptance:** `bun run build` + typecheck pass

#### WT-3B: Chat UI + Realtime
- **Branch:** `phase3/messaging-ui`
- **Depends on:** WT-3A merged into main
- **Creates:**
  - `src/features/messaging/components/conversation-list.tsx`
  - `src/features/messaging/components/chat-window.tsx`
  - `src/features/messaging/components/message-bubble.tsx`
  - `src/features/messaging/components/chat-input.tsx`
  - `src/features/messaging/hooks/use-realtime-messages.ts`
  - `src/features/messaging/hooks/use-unread-count.ts`
  - `src/app/(protected)/messages/page.tsx`
  - `src/app/(protected)/messages/[threadId]/page.tsx`
- **Design:** Mobile-first. Thread list → tap → chat. Desktop: two-panel layout.
- **Realtime:** Subscribe to `postgres_changes` on `messages` where `thread_id = ?`
- **Unread badge:** Subscribe to `notifications` table for current user, show count in site header
- **Acceptance:** Can send/receive messages between two users in real time

#### WT-3C: Notification Triggers + Email
- **Branch:** `phase3/notifications`
- **Creates:**
  - `src/lib/notifications/create-notification.ts`
  - `src/lib/notifications/triggers.ts` (notifyNewOffer, notifyBookingCreated, etc.)
  - `src/lib/email/resend-client.ts`
  - `src/lib/email/templates/` (booking-confirmation.tsx, new-offer.tsx, tour-reminder.tsx, review-prompt.tsx)
  - `src/lib/email/send.ts`
- **Wires into:** Existing server actions for offer creation, booking creation, booking confirmation
- **Updates:** `notification-center-screen.tsx` to remove demo session dependency
- **New dep:** `resend` package
- **Acceptance:** Creating an offer generates in-app notification + email to traveler

#### WT-5A: SEO Metadata + JSON-LD
- **Branch:** `phase5/seo-metadata`
- **Modifies:** All `(site)` route page.tsx files to add `generateMetadata()`
- **Creates:** JSON-LD script tags for listings, guides, destinations
- **Acceptance:** Each public page has unique title, description, og:image

#### WT-5B: Sitemap + Robots + Seed Data
- **Branch:** `phase5/sitemap-seed`
- **Creates:**
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
- **Extends:** `supabase/migrations/20260401000002_seed.sql` with launch region data
- **Acceptance:** `/sitemap.xml` returns valid XML with all public URLs

### WAVE 2 — Phase 4 (trust + moderation) — 3 worktrees

#### WT-4A: File Upload Infrastructure + Guide Verification
- **Branch:** `phase4/file-uploads-verification`
- **Creates:**
  - `src/lib/storage/upload.ts` (getPresignedUploadUrl, confirmUpload)
  - `src/lib/storage/buckets.ts` (bucket config)
  - `src/features/guide/components/verification/verification-upload-form.tsx`
  - `src/features/guide/components/verification/document-upload-card.tsx`
  - `src/app/(protected)/guide/verification/page.tsx`
- **Storage setup:** Create Supabase Storage buckets via migration or setup script
- **Guide flow:** Upload passport + selfie → creates `guide_documents` rows → sets verification_status='submitted' → auto-creates moderation case
- **Acceptance:** Guide can upload docs, files appear in Supabase Storage

#### WT-4B: Admin Moderation Queue
- **Branch:** `phase4/admin-moderation`
- **Creates:**
  - `src/lib/supabase/moderation.ts`
  - `src/features/admin/components/moderation-queue.tsx`
  - `src/features/admin/components/moderation-action-dialog.tsx`
  - `src/app/(protected)/admin/guides/page.tsx` (guide approval)
  - `src/app/(protected)/admin/guides/[id]/page.tsx` (guide detail + docs viewer)
- **Wires:** `admin/listings/page.tsx` to real data
- **Actions:** approve → updates entity status + creates moderation_actions row + sends notification
- **Acceptance:** Admin can view pending guides/listings, approve/reject with notes

#### WT-4C: Reviews + Disputes + Trust Badges
- **Branch:** `phase4/reviews-disputes-trust`
- **Creates:**
  - `src/lib/supabase/reviews.ts`
  - `src/lib/supabase/disputes.ts`
- **Wires:**
  - `traveler-booking-review-screen.tsx` → actual Supabase insert
  - `admin/disputes/` pages → actual Supabase queries
  - `public-guide-trust-markers.tsx` → real data (rating, completed_tours, verified badge)
  - Review display on guide profile + listing detail
- **Acceptance:** Traveler can leave review after completed booking, admin can manage disputes

### WAVE 3 — Phase 6 (quality + devops) — 2 worktrees

#### WT-6A: Vitest Unit Tests
- **Branch:** `phase6/vitest-unit`
- **New devDeps:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `happy-dom`
- **Creates:**
  - `vitest.config.ts`
  - `src/lib/bookings/__tests__/state-machine.test.ts`
  - `src/lib/notifications/__tests__/triggers.test.ts`
  - Schema validation tests for all Zod schemas
- **Acceptance:** `bun run test` passes with >80% coverage on tested modules

#### WT-6B: E2E + CI/CD + Monitoring + Security
- **Branch:** `phase6/e2e-ci-security`
- **New devDeps:** `@playwright/test`, `@sentry/nextjs`
- **Creates:**
  - `playwright.config.ts`
  - `tests/e2e/signup-to-booking.spec.ts`
  - `tests/e2e/guide-onboarding.spec.ts`
  - `.github/workflows/ci.yml`
  - Sentry config files
  - Rate limiting middleware (Upstash Redis)
  - Security headers in `next.config.ts`
- **Acceptance:** CI runs on PR, E2E passes locally, Sentry captures errors

### WAVE 4 — Phase 7 (launch prep) — 1 worktree

#### WT-7: Launch Preparation
- **Branch:** `phase7/launch-prep`
- **Creates:**
  - `src/app/(site)/policies/terms/page.tsx`
  - `src/app/(site)/policies/privacy/page.tsx`
  - Footer support link
  - `docs/runbook.md`
- **Updates:** Cancellation policy page with real terms structure
- **Final:** Lighthouse audit, mobile QA checklist
- **Acceptance:** All policy pages render, support link works, Lighthouse >90

---

## 4. Codex Prompt Templates

Each worktree agent gets a prompt following this pattern:

```
Read D:\dev\projects\provodnik\provodnik.app\AGENTS.md first.
Workspace: D:\dev\projects\provodnik\worktrees\<worktree-name>

Before writing any code, read:
- D:\dev\projects\provodnik\DESIGN.md
- D:\dev\projects\provodnik\docs\superpowers\specs\2026-04-01-phases-3-7-execution-design.md
- C:\Users\x\.agents\skills\superpowers\systematic-debugging\SKILL.md
- C:\Users\x\.agents\skills\superpowers\verification-before-completion\SKILL.md

Then use Context7 MCP to fetch latest docs for:
- [relevant libraries: Supabase Realtime, Supabase Storage, Resend, Next.js metadata, Vitest, Playwright]

## Task: <task title>

<detailed task description from worktree spec above>

## Global Constraints
- All styles: globals.css CSS custom properties only. No per-component <style> blocks.
- All mutations: Zod validation before Supabase insert/update.
- All data fetching: TanStack Query where pattern exists. Server actions for mutations.
- All forms: React Hook Form + Zod.
- RLS: Do NOT change RLS policies. Work within them.
- auth.userId: Always from server auth context. Never from client input.
- Build gate: bun run build AND bun run typecheck must pass.
- Do NOT push. Commit only.
- Commit message: feat(<scope>): <description>

ACCEPTANCE: bun run build passes. bun run typecheck passes. Do NOT push — commit only.
```

---

## 5. Orchestration Protocol

For each wave, Claude (me) will:

1. **Ensure main is clean:** `bun run build` passes on current main
2. **Create worktrees:** `git worktree add ../worktrees/<name> -b <branch>` + `bun install` in each
3. **Fire Codex agents:** One per worktree, in parallel where dependencies allow
4. **Monitor completion:** Check build status in each worktree
5. **Review work:**
   - Read all diffs (`git diff main...<branch>`)
   - Check for CSS violations (inline styles, per-component blocks)
   - Check for schema/type mismatches
   - Check for missing Zod validation on mutations
   - Check for client-side auth (should be server-side)
   - Verify build passes
6. **Fix issues:** Fire targeted Codex prompts for fixes
7. **Merge:** `git merge <branch> --no-edit` for each branch
8. **Verify merged state:** `bun run build` on merged main
9. **Clean up:** Remove worktrees and branches
10. **Proceed to next wave**

### Review Checklist (applied after each agent completes)

- [ ] `bun run build` passes in worktree
- [ ] `bun run typecheck` passes
- [ ] No inline styles or per-component `<style>` blocks
- [ ] No hardcoded hex values (uses CSS custom properties)
- [ ] All mutations use Zod validation
- [ ] Auth context from server, not client
- [ ] No `useEffect` for data that should be server-rendered
- [ ] Russian copy is correct (no English placeholders)
- [ ] No demo session references in new code
- [ ] Proper error handling (not just empty catch blocks)
- [ ] No secrets committed

---

## 6. Dependencies to Install

**Wave 1:**
- `resend` (email)

**Wave 3:**
- `vitest` (dev)
- `@vitejs/plugin-react` (dev)
- `vite-tsconfig-paths` (dev)
- `jsdom` (dev)
- `@testing-library/react` (dev)
- `@testing-library/dom` (dev)
- `@testing-library/jest-dom` (dev)
- `@playwright/test` (dev)
- `@sentry/nextjs`

**Wave 1 (SEO):**
- `schema-dts` (dev) — TypeScript types for JSON-LD schema.org

---

## 7. Supabase Storage Buckets

Need to create these buckets (via Supabase dashboard or migration):
- `guide-avatars` — public, 2MB limit, image/* only
- `guide-documents` — private, 10MB limit, image/* + application/pdf
- `listing-media` — public, 5MB limit, image/* only
- `dispute-evidence` — private, 10MB limit, image/* + application/pdf

---

## 8. Required Database Migrations

### Migration: Enable Realtime + Messaging RLS (Wave 1, WT-3A)

```sql
-- Enable Realtime replication on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Helper function for thread membership (SECURITY DEFINER avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_thread_participant(p_thread_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.thread_participants
    WHERE thread_id = p_thread_id AND user_id = (SELECT auth.uid())
  );
$$;

-- conversation_threads RLS
CREATE POLICY "Users view their threads"
  ON public.conversation_threads FOR SELECT
  USING (public.is_thread_participant(id) OR public.is_admin());

-- thread_participants RLS
CREATE POLICY "View participants in own threads"
  ON public.thread_participants FOR SELECT
  USING (public.is_thread_participant(thread_id) OR public.is_admin());

CREATE POLICY "Update own last_read_at"
  ON public.thread_participants FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- messages RLS
CREATE POLICY "Read messages in own threads"
  ON public.messages FOR SELECT
  USING (public.is_thread_participant(thread_id) OR public.is_admin());

CREATE POLICY "Send messages to own threads"
  ON public.messages FOR INSERT
  WITH CHECK (
    public.is_thread_participant(thread_id)
    AND sender_id = (SELECT auth.uid())
  );
-- Messages are immutable: no UPDATE/DELETE policies
```

### Migration: Supabase Storage Buckets (Wave 2, WT-4A)

Storage buckets are created via Supabase Dashboard or SQL:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('guide-avatars', 'guide-avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('guide-documents', 'guide-documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('listing-media', 'listing-media', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('dispute-evidence', 'dispute-evidence', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']);
```

---

## 9. Environment Variables Needed

```
# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@provodnik.app

# Error monitoring (Sentry)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Already configured
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase Realtime connection limits | Polling fallback for notification badge; Realtime only for active chat |
| Resend API key not configured at launch | Graceful degradation: log email, don't crash |
| File upload size abuse | Server-side validation before presigned URL generation |
| RLS blocks on new tables | Test all CRUD operations against RLS in each worktree |
| Merge conflicts between parallel worktrees | Minimize shared file edits; merge data layer first |
| Agent produces non-Russian copy | Review checklist item; fix in targeted followup |
