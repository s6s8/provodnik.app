# Phase 8.1 — Profile: personal settings + notification prefs

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p8-1`
**Branch:** `feat/tripster-v1-p8-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, react-hook-form + Zod, Supabase (@supabase/ssr), Bun.

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`
**Supabase browser client:** `import { createSupabaseBrowserClient } from "@/lib/supabase/client";`

**Existing profile page(s):** Find them in `src/app/(protected)/profile/` or `src/app/(guide)/settings/`.

**Relevant guide profile fields:**
```ts
// From GuideProfileRow:
locale: string;              // "ru" | "en"
preferred_currency: string;  // "RUB" | "USD" | "EUR"
notification_prefs: Record<string, unknown>; // 3D matrix: event × channel × frequency
```

**ADR-035:** Notification prefs are a 3D matrix: event × channel × frequency, stored as `notification_prefs jsonb` on profiles.

**shadcn/ui:** Button, Input, Select, Label, Switch, Separator, Card, Alert

## SCOPE

**Create:**
1. `src/app/(protected)/profile/personal/page.tsx` — personal settings page (server)
2. `src/features/profile/components/PersonalSettingsForm.tsx` — form (client)
3. `src/features/profile/components/NotificationPrefsMatrix.tsx` — 3D matrix UI (client)
4. `src/features/profile/actions/updatePersonalSettings.ts` — Server Action

**DO NOT touch:** Guide-specific sections, editor, listing pages.

## TASK

### 1. updatePersonalSettings.ts (Server Action)

```ts
"use server";
export async function updatePersonalSettings(data: {
  locale: string;
  preferredCurrency: string;
  notificationPrefs: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  await supabase.from("guide_profiles")
    .update({
      locale: data.locale,
      preferred_currency: data.preferredCurrency,
      notification_prefs: data.notificationPrefs,
    })
    .eq("user_id", user.id);
  
  return { success: true };
}
```

### 2. NotificationPrefsMatrix.tsx (client component)

Props: `{ prefs: Record<string, unknown>; onChange: (prefs: Record<string, unknown>) => void; }`

3D matrix: events × channels × frequency

Events (rows):
```ts
const NOTIFICATION_EVENTS = [
  { key: "new_offer",       label: "Новое предложение" },
  { key: "booking_created", label: "Новое бронирование" },
  { key: "booking_confirmed", label: "Бронирование подтверждено" },
  { key: "booking_completed", label: "Завершена поездка" },
  { key: "review_requested", label: "Запрос отзыва" },
  { key: "dispute_opened",  label: "Открыт спор" },
];
```

Channels (columns): "in_app" → "В приложении", "email" → "Email", "telegram" → "Telegram"

For each event × channel: a Switch (on/off).

Internal structure:
```ts
// prefs = { "new_offer.in_app": true, "new_offer.email": false, ... }
const key = `${event}.${channel}`;
const value = prefs[key] ?? true; // default on
```

Render as a table with sticky first column.

### 3. PersonalSettingsForm.tsx (client component)

Props: `{ initialLocale: string; initialCurrency: string; initialNotificationPrefs: Record<string, unknown>; }`

Fields:
- `locale` — Select: "ru" → "Русский", "en" → "English"
- `preferred_currency` — Select: "RUB" → "₽ Рубль", "USD" → "$ Доллар", "EUR" → "€ Евро"
- `<NotificationPrefsMatrix>` section

Submit Button → `updatePersonalSettings(...)` → show success toast (simple Alert banner).

### 4. page.tsx (server)

Fetch profile, render form.

## INVESTIGATION RULE

Read before writing:
- `src/app/(protected)/profile/` — existing profile pages
- `src/lib/supabase/types.ts` — GuideProfileRow notification_prefs field

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p8-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 4 files created
- Personal settings page shows locale/currency/notification matrix
- Save works via Server Action
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(profile): personal settings + 3D notification prefs matrix`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
