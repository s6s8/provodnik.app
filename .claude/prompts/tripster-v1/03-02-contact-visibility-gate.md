# Phase 3.2 — Contact visibility gate: status chip + settings page

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p3`
**Branch:** `feat/tripster-v1-p3`

Tech stack: Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

Key paths:
- `src/app/` — App Router pages
- `src/components/` — shared components
- `src/lib/supabase/` — Supabase client helpers
- `src/lib/supabase/types.ts` — hand-maintained Supabase row types (DO NOT auto-generate)
- Design tokens in `tailwind.config.ts` — use token names not raw CSS vars

**Relevant types** (from `src/lib/supabase/types.ts`):
```ts
export interface GuideProfileRow {
  user_id: string;
  // ... existing fields ...
  average_rating: number | null;       // numeric(3,2)
  response_rate: number | null;        // numeric(4,3)
  contact_visibility_unlocked: boolean | null;
  // ...
}
```

**Supabase client pattern (server component):**
```ts
import { createServerClient } from "@/lib/supabase/server";
const supabase = await createServerClient();
const { data } = await supabase.from("guide_profiles").select("contact_visibility_unlocked, average_rating, response_rate").eq("user_id", userId).single();
```

**Supabase client pattern (client component):**
```ts
import { createBrowserClient } from "@/lib/supabase/client";
```

**CSS conventions:**
- Tailwind utilities only — no custom CSS classes, no `style={{}}`
- shadcn/ui Badge for chips: `import { Badge } from "@/components/ui/badge"`
- Use token names: `bg-surface-high`, `text-primary`, `rounded-card`, etc.
- Glass: `bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass`

## SCOPE

**Create these files:**
1. `src/components/guide/ContactVisibilityChip.tsx` — status chip
2. `src/app/(guide)/settings/contact-visibility/page.tsx` — explanation page

**DO NOT touch** any other files. Do not modify `types.ts`, migrations, or other components.

## KNOWLEDGE

**Business rule (ADR-020):**
- `contact_visibility_unlocked = true` → traveler can see guide's phone/email/telegram
- Unlocked when: `average_rating >= 4.0 AND response_rate >= 0.60`
- DB trigger (`tg_check_contact_visibility`) enforces this automatically on guide_profiles
- Guide cannot manually toggle — it unlocks automatically when thresholds are met

**Thresholds:**
- Rating threshold: 4.0 / 5.0
- Response rate threshold: 60%

## TASK

### 1. `src/components/guide/ContactVisibilityChip.tsx`

Props:
```ts
interface Props {
  unlocked: boolean;
  averageRating?: number | null;
  responseRate?: number | null;
  className?: string;
}
```

Render a shadcn/ui Badge:
- `unlocked = true`: green variant, text "Контакты видны путешественникам", lock-open icon (Lucide `LockOpen`)
- `unlocked = false`: muted/secondary variant, text "Контакты скрыты", lock icon (Lucide `Lock`)
- If unlocked=false, show progress toward thresholds as a tooltip or subtitle:
  - Rating: `{averageRating?.toFixed(1) ?? "–"} / 4.0`
  - Ответы: `{Math.round((responseRate ?? 0) * 100)}% / 60%`

Use `import { Badge } from "@/components/ui/badge"` and `import { Lock, LockOpen } from "lucide-react"`.

### 2. `src/app/(guide)/settings/contact-visibility/page.tsx`

Server component page. Reads the guide's profile from Supabase using `createServerClient`.

Layout:
- Title: "Видимость контактов"
- Show `<ContactVisibilityChip>` at top with live data
- Section "Как это работает":
  - Explain that when rating ≥ 4.0 and response rate ≥ 60%, travellers see your phone/email/telegram
  - When locked, travellers can only message you through the platform
- Section "Ваш прогресс":
  - Rating: progress bar or text `{averageRating.toFixed(1)} / 4.0` with check/cross icon
  - Ответы: `{Math.round(responseRate * 100)}% / 60%` with check/cross icon
- Note: "Порог обновляется автоматически после каждого бронирования и отзыва"

The page lives at route `/settings/contact-visibility`. Use the existing `(guide)` route group layout if it exists, otherwise just export a standard page component.

## INVESTIGATION RULE

Read every file you will import before writing. Check:
- `src/lib/supabase/server.ts` — exact export name of `createServerClient`
- `src/app/(guide)/` — layout structure
- `src/components/ui/badge.tsx` — Badge variant names

Never assume. If a file doesn't exist, note it and use the next best pattern you find.

## TDD CONTRACT

No unit tests required for UI components. Verify by TypeScript compile only.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p3`
Bun binary: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`

## DONE CRITERIA

- `src/components/guide/ContactVisibilityChip.tsx` created
- `src/app/(guide)/settings/contact-visibility/page.tsx` created
- `bun run typecheck` exits 0
- Commit message: `feat(pii): contact visibility chip + settings page`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
