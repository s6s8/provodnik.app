# Phase 12.3 — Partner cabinet

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-3`
**Branch:** `feat/tripster-v1-p12-3`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_PARTNER`

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types:**
```ts
export type PartnerAccountRow = {
  id: string;
  user_id: string;
  api_token_hash: string;
  created_at: string;
};

export type PartnerPayoutsLedgerRow = {
  id: string;
  partner_id: string;
  delta: number;  // in minor units
  ref_id: string | null;
  created_at: string;
};
```

**shadcn/ui:** Button, Card, Badge, Input, Label, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Alert

## SCOPE

**Create:**
1. `src/app/(protected)/partner/page.tsx` — partner cabinet (server)
2. `src/features/partner/components/ApiTokenManager.tsx` — token display/regenerate (client)
3. `src/features/partner/components/PayoutsLedger.tsx` — payout history table (client)
4. `src/features/partner/actions/partnerActions.ts` — Server Actions

**DO NOT touch:** Referrals page (Phase 12.4).

## TASK

### 1. partnerActions.ts

```ts
"use server";
import crypto from "crypto";

export async function generateApiToken() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  
  // Upsert partner account
  await supabase.from("partner_accounts").upsert({
    user_id: user.id,
    api_token_hash: tokenHash,
  }, { onConflict: "user_id" });
  
  // Return plaintext token ONCE (not stored)
  return { token };
}
```

### 2. ApiTokenManager.tsx (client)

Props: `{ hasExistingToken: boolean; }`

State: shows "API токен" section.

If `hasExistingToken`:
- "Токен настроен. Последний раз сгенерирован: {date}"
- "Сгенерировать новый токен" Button (with confirmation warning)

If `!hasExistingToken`:
- "Токен не настроен" + "Сгенерировать токен" Button

On generate: calls `generateApiToken()` → shows the returned token in a read-only Input with copy button.
Shows Alert: "Сохраните токен — он показывается только один раз."

### 3. PayoutsLedger.tsx (client)

Props: `{ ledger: PartnerPayoutsLedgerRow[]; }`

Table with columns: Дата | Сумма | Источник (ref_id)

Show running total at top: "Итого: {total ÷ 100} ₽"

If ledger is empty: "Начислений пока нет"

### 4. page.tsx (server)

```ts
import { flags } from "@/lib/flags";
if (!flags.FEATURE_TRIPSTER_PARTNER) notFound();

const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth");

const { data: account } = await supabase.from("partner_accounts")
  .select("id, created_at").eq("user_id", user.id).single();

const { data: ledger } = await supabase.from("partner_payouts_ledger")
  .select("*").eq("partner_id", account?.id ?? "none")
  .order("created_at", { ascending: false }).limit(50);
```

Layout:
- h1 "Партнёрский кабинет"
- `<ApiTokenManager hasExistingToken={!!account} />`
- Separator
- `<PayoutsLedger ledger={ledger ?? []} />`

## INVESTIGATION RULE

Read before writing:
- `src/lib/supabase/types.ts` — PartnerAccountRow, PartnerPayoutsLedgerRow
- `src/lib/flags.ts` — FEATURE_TRIPSTER_PARTNER flag

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-3`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Partner cabinet shows API token manager + payout ledger
- Token generation works (returns plaintext once)
- FEATURE_TRIPSTER_PARTNER=0 returns 404
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(partner): partner cabinet — API token management + payout ledger`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
