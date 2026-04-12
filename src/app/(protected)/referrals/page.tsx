import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BonusLedger } from "@/features/referrals/components/BonusLedger";
import { ReferralCode } from "@/features/referrals/components/ReferralCode";
import { hasSupabaseEnv } from "@/lib/env";
import { flags } from "@/lib/flags";
import type { BonusLedgerRow } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Рефералы и бонусы",
};

export default async function ReferralsPage() {
  if (!flags.FEATURE_TRIPSTER_REFERRALS) notFound();

  if (!hasSupabaseEnv()) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Рефералы и бонусы</h1>
        <p className="text-sm text-muted-foreground">
          Раздел станет доступен после подключения Supabase.
        </p>
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/auth");

  const { data: myCodeRow } = await supabase
    .from("referral_codes")
    .select("id, code")
    .eq("user_id", user.id)
    .maybeSingle();

  let redemptionCount = 0;
  if (myCodeRow?.id) {
    const { count } = await supabase
      .from("referral_redemptions")
      .select("code_id", { count: "exact", head: true })
      .eq("code_id", myCodeRow.id);
    redemptionCount = count ?? 0;
  }

  const { data: ledgerRows } = await supabase
    .from("bonus_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ledger = (ledgerRows ?? []) as BonusLedgerRow[];

  return (
    <section className="mx-auto grid max-w-3xl gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Рефералы и бонусы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Приглашайте друзей и копите бонусные баллы.
        </p>
      </div>
      <ReferralCode code={myCodeRow?.code ?? null} redemptionCount={redemptionCount} />
      <BonusLedger ledger={ledger} />
    </section>
  );
}
