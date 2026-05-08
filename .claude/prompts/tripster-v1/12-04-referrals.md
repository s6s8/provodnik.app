# Phase 12.4 — Referrals + bonuses

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-4`
**Branch:** `feat/tripster-v1-p12-4`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_REFERRALS`

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types:**
```ts
export type ReferralCodeRow = {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
};

export type ReferralRedemptionRow = {
  code_id: string;
  redeemed_by: string;
  redeemed_at: string;
};

export type BonusLedgerRow = {
  id: string;
  user_id: string;
  delta: number;  // bonus points
  reason: string;
  ref_id: string | null;
  created_at: string;
};
```

**shadcn/ui:** Button, Card, Input, Label, Badge, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Alert

## SCOPE

**Create:**
1. `src/app/(protected)/referrals/page.tsx` — referrals page (server)
2. `src/features/referrals/components/ReferralCode.tsx` — code display + copy (client)
3. `src/features/referrals/components/BonusLedger.tsx` — bonus history (client)
4. `src/features/referrals/actions/referralActions.ts` — Server Actions

**DO NOT touch:** Partner cabinet (Phase 12.3).

## TASK

### 1. referralActions.ts

```ts
"use server";
import crypto from "crypto";

export async function generateReferralCode() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  // Check if user already has a code
  const { data: existing } = await supabase.from("referral_codes")
    .select("code").eq("user_id", user.id).single();
  if (existing) return { code: existing.code };
  
  // Generate 8-char uppercase code
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  await supabase.from("referral_codes").insert({ user_id: user.id, code });
  return { code };
}

export async function redeemReferralCode(code: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: referralCode } = await supabase.from("referral_codes")
    .select("id, user_id").eq("code", code.toUpperCase()).single();
  if (!referralCode) return { error: "Код не найден" };
  if (referralCode.user_id === user.id) return { error: "Нельзя использовать свой код" };
  
  // Check not already redeemed by this user
  const { data: existing } = await supabase.from("referral_redemptions")
    .select("code_id").eq("code_id", referralCode.id).eq("redeemed_by", user.id).single();
  if (existing) return { error: "Вы уже использовали реферальный код" };
  
  await supabase.from("referral_redemptions").insert({ code_id: referralCode.id, redeemed_by: user.id });
  // Add bonus to both parties
  await supabase.from("bonus_ledger").insert([
    { user_id: user.id, delta: 100, reason: "referral_redeemed", ref_id: referralCode.id },
    { user_id: referralCode.user_id, delta: 100, reason: "referral_used", ref_id: referralCode.id },
  ]);
  return { success: true };
}
```

### 2. ReferralCode.tsx (client)

Props: `{ code: string | null; redemptionCount: number; }`

If no code: "Сгенерировать реферальный код" Button → `generateReferralCode()`.

If code:
- Display code in large monospace Input (read-only)
- "Скопировать" Button → `navigator.clipboard.writeText(code)`
- Share link: `https://provodnik.app/invite/{code}` (display only, copy button)
- "{redemptionCount} человек использовали ваш код"

Below: Input field "Ввести реферальный код" + "Применить" Button → `redeemReferralCode()`.

### 3. BonusLedger.tsx (client)

Props: `{ ledger: BonusLedgerRow[]; }`

Show balance at top: sum of all delta values.

Table: Дата | Тип | Бонусы (+ green for positive, - red for negative).

Reason labels:
```ts
const REASON_LABELS: Record<string, string> = {
  referral_redeemed: "Использован реферальный код",
  referral_used: "Ваш код использован",
};
```

### 4. page.tsx (server)

```ts
if (!flags.FEATURE_TRIPSTER_REFERRALS) notFound();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth");

const { data: myCode } = await supabase.from("referral_codes")
  .select("code").eq("user_id", user.id).single();
const { count: redemptionCount } = await supabase.from("referral_redemptions")
  .select("code_id", { count: "exact" })
  .eq("code_id", myCode?.id ?? "none");
const { data: ledger } = await supabase.from("bonus_ledger")
  .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
```

Render components.

## INVESTIGATION RULE

Read before writing:
- `src/lib/supabase/types.ts` — ReferralCodeRow, BonusLedgerRow
- `src/lib/flags.ts` — FEATURE_TRIPSTER_REFERRALS flag

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-4`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Referral code generation + display + copy
- Code redemption awards bonuses to both parties
- Bonus ledger shows balance + history
- FEATURE_TRIPSTER_REFERRALS=0 returns 404
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(referrals): referral code generation/redemption + bonus ledger`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
