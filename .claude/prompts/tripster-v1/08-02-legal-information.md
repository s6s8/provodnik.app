# Phase 8.2 — Profile: legal information page

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p8-2`
**Branch:** `feat/tripster-v1-p8-2`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, react-hook-form + Zod, Supabase (@supabase/ssr), Bun.

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant guide profile fields:**
```ts
// GuideProfileRow additions:
legal_status: "self_employed" | "individual" | "company" | null;
inn: string | null;
document_country: string | null;
is_tour_operator: boolean;
tour_operator_registry_number: string | null;
```

**shadcn/ui:** Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Separator, Card, Alert

## SCOPE

**Create:**
1. `src/app/(protected)/profile/guide/legal-information/page.tsx` — server component
2. `src/features/profile/components/LegalInformationForm.tsx` — client form
3. `src/features/profile/actions/updateLegalInformation.ts` — Server Action
4. `src/lib/data/countries.ts` — 252-country list (ISO 3166-1 alpha-2 + Russian name)

**DO NOT touch:** Personal settings page, license page.

## TASK

### 1. countries.ts

Create a constant:
```ts
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "RU", name: "Россия" },
  { code: "BY", name: "Беларусь" },
  { code: "KZ", name: "Казахстан" },
  { code: "UA", name: "Украина" },
  { code: "UZ", name: "Узбекистан" },
  { code: "AM", name: "Армения" },
  { code: "GE", name: "Грузия" },
  { code: "AZ", name: "Азербайджан" },
  { code: "KG", name: "Кыргызстан" },
  { code: "MD", name: "Молдова" },
  { code: "TJ", name: "Таджикистан" },
  { code: "TM", name: "Туркменистан" },
  // ... add remaining countries A-Z in Russian
  // Include at minimum: DE, FR, GB, US, CN, TR, EG, TH, AE, IT, ES, PL, CZ, FI, SE, NO, DK, NL, PT, GR, HU, RO, BG, HR, RS, BA, SK, SI, LT, LV, EE, IL, JP, KR, IN, ID, SG, MY, AU, NZ, CA, MX, BR, AR, CL, ZA, NG, KE, MA, EG
  // Add all 252 countries with their Russian names
];
```

Note: Include all 252 countries. Use their official Russian names.

### 2. updateLegalInformation.ts

```ts
"use server";
export async function updateLegalInformation(data: {
  legalStatus: string | null;
  inn: string | null;
  documentCountry: string | null;
  isTourOperator: boolean;
  tourOperatorRegistryNumber: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("guide_profiles").update({
    legal_status: data.legalStatus,
    inn: data.inn,
    document_country: data.documentCountry,
    is_tour_operator: data.isTourOperator,
    tour_operator_registry_number: data.tourOperatorRegistryNumber,
  }).eq("user_id", user.id);
  return { success: true };
}
```

### 3. LegalInformationForm.tsx (client)

Props: `{ initialData: { legalStatus: string | null; inn: string | null; documentCountry: string | null; isTourOperator: boolean; tourOperatorRegistryNumber: string | null } }`

Fields:
- `legal_status` — Select: "self_employed" → "Самозанятый", "individual" → "ИП", "company" → "Юридическое лицо", empty → "Не указано"
- `inn` — Input (text, optional): "ИНН"
- `document_country` — Select with searchable list from COUNTRIES (252 entries). Group Russia at top.
- `is_tour_operator` — Switch: "Туроператор"
- `tour_operator_registry_number` — Input (shown only when `is_tour_operator = true`): "Номер в реестре туроператоров"
- Save button → `updateLegalInformation()` → Alert "Сохранено"

### 4. page.tsx (server)

Fetch guide_profile, render LegalInformationForm with initial values.

## INVESTIGATION RULE

Read before writing:
- `src/lib/supabase/types.ts` — GuideProfileRow legal fields
- `src/app/(protected)/profile/` — existing profile page structure

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p8-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Legal information page shows all fields
- Country select includes 252 countries with Russian names
- Tour operator registry field shows/hides based on toggle
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(profile): legal information — status/INN/country/tour-operator`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
