# Phase 12.5 — Guide onboarding quiz

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-5`
**Branch:** `feat/tripster-v1-p12-5`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_QUIZ`

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**shadcn/ui:** Button, Card, Badge, Progress, RadioGroup, RadioGroupItem, Label, Textarea, Separator, Alert

**NOTE:** `radio-group` shadcn component is already installed at `src/components/ui/radio-group.tsx`. Do NOT run `bunx shadcn add radio-group` — it will stall. Import directly.

## SCOPE

**Create:**
1. `src/app/(protected)/guide/onboarding/page.tsx` — onboarding quiz page (server entry point)
2. `src/features/guide/components/onboarding/OnboardingWizard.tsx` — multi-step wizard (client)
3. `src/features/guide/actions/completeOnboarding.ts` — Server Action

**DO NOT touch:** Profile pages, listings.

## TASK

### 1. completeOnboarding.ts

```ts
"use server";

export async function saveOnboardingStep(step: number, data: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  // Store in guide_profiles as JSONB in a new column or as metadata
  // Check if guide_profiles has an onboarding_data column — if not, use any available jsonb column
  // Store as: { step: data, completed_steps: [...] }
  const { data: profile } = await supabase.from("guide_profiles")
    .select("notification_prefs").eq("user_id", user.id).single();
  
  const existing = (profile?.notification_prefs ?? {}) as Record<string, unknown>;
  const onboardingData = (existing._onboarding ?? {}) as Record<string, unknown>;
  const completedSteps = (onboardingData.completed_steps ?? []) as number[];
  
  await supabase.from("guide_profiles").update({
    notification_prefs: {
      ...existing,
      _onboarding: {
        ...onboardingData,
        [`step_${step}`]: data,
        completed_steps: [...new Set([...completedSteps, step])],
      }
    }
  }).eq("user_id", user.id);
  
  return { success: true };
}

export async function markOnboardingComplete() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase.from("guide_profiles")
    .select("notification_prefs").eq("user_id", user.id).single();
  const existing = (profile?.notification_prefs ?? {}) as Record<string, unknown>;
  
  await supabase.from("guide_profiles").update({
    notification_prefs: {
      ...existing,
      _onboarding: { ...(existing._onboarding as Record<string, unknown> ?? {}), completed_at: new Date().toISOString() }
    }
  }).eq("user_id", user.id);
  
  return { success: true };
}
```

### 2. OnboardingWizard.tsx (client)

Steps (5 total):

**Step 1 — Приветствие**
- Title: "Добро пожаловать в Проводник!"
- Text: "Расскажите немного о себе, чтобы мы могли настроить ваш профиль"
- No inputs, just "Начать" button

**Step 2 — Тип деятельности**
- RadioGroup: "Я провожу экскурсии" | "Я организую туры" | "Предлагаю трансферы" | "Всё перечисленное"
- Save with `saveOnboardingStep(2, { activity_type: value })`

**Step 3 — Регион**
- Text Input: "Ваш основной регион деятельности"
- Textarea: "Расскажите о себе (необязательно)"
- Save step 3

**Step 4 — Первое объявление**
- Text: "Готовы создать первое объявление?"
- Two buttons: "Создать сейчас" → `/guide/listings/new` | "Позже"

**Step 5 — Завершение**
- Title: "Профиль настроен!"
- Progress bar: 100%
- "Перейти к кабинету" Button → `/guide/dashboard`
- Calls `markOnboardingComplete()`

Progress bar at top shows step/5.

State: `const [step, setStep] = useState(1)`.

### 3. page.tsx (server)

```ts
import { flags } from "@/lib/flags";
if (!flags.FEATURE_TRIPSTER_QUIZ) notFound();
```

Check if onboarding already completed (from `notification_prefs._onboarding.completed_at`). If completed, redirect to `/guide/dashboard`.

Render `<OnboardingWizard initialStep={1} />`.

## INVESTIGATION RULE

Read before writing:
- `src/lib/supabase/types.ts` — GuideProfileRow notification_prefs type
- `src/lib/flags.ts` — FEATURE_TRIPSTER_QUIZ flag

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-5`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 5-step wizard navigates step by step
- Progress bar advances
- Step data saved via Server Action
- Completion redirects to dashboard
- FEATURE_TRIPSTER_QUIZ=0 returns 404
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(onboarding): guide onboarding quiz — 5-step wizard with progress tracking`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
