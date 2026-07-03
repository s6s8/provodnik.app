import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CabinetSectionUnavailable } from "@/components/shared/cabinet-section-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApiTokenManager } from "@/features/partner/components/ApiTokenManager";
import { PayoutsLedger } from "@/features/partner/components/PayoutsLedger";
import { BonusLedger } from "@/features/referrals/components/BonusLedger";
import { ReferralCode } from "@/features/referrals/components/ReferralCode";
import { buildAuthLoginRedirect } from "@/lib/auth/safe-redirect";
import { hasSupabaseEnv } from "@/lib/env";
import { flags } from "@/lib/flags";
import type { BonusLedgerRow, PartnerPayoutsLedgerRow } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Рефералы и бонусы",
};

export default async function ReferralsPage() {
  if (!flags.FEATURE_TR_REFERRALS) {
    return (
      <CabinetSectionUnavailable
        title="Приглашения и бонусы"
        description="Программа приглашений и бонусов появится в ближайших обновлениях. Пока вы можете находить гидов и оставлять запросы в кабинете."
      />
    );
  }

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

  if (authError || !user) redirect(buildAuthLoginRedirect("/referrals"));

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
  let hasPartnerAccount = false;
  let partnerAccountCreatedAt: string | null = null;
  let partnerLedger: PartnerPayoutsLedgerRow[] = [];

  if (flags.FEATURE_TR_PARTNER) {
    const { data: account, error: accountError } = await supabase
      .from("partner_accounts")
      .select("id, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountError) throw accountError;

    hasPartnerAccount = !!account;
    partnerAccountCreatedAt = account?.created_at ?? null;

    if (account?.id) {
      const { data, error } = await supabase
        .from("partner_payouts_ledger")
        .select("*")
        .eq("partner_id", account.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      partnerLedger = data ?? [];
    }
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-8">
      <PageHeader
        title="Приглашения и бонусы"
        subtitle="Приглашайте друзей — вы и друг получаете бонусные баллы."
      />
      <ReferralCode code={myCodeRow?.code ?? null} redemptionCount={redemptionCount} />
      <BonusLedger ledger={ledger} />
      {flags.FEATURE_TR_PARTNER ? (
        <Card>
          <CardHeader>
            <CardTitle>Партнёрский API</CardTitle>
            <CardDescription>
              Для интеграторов и агрегаторов. Управляйте токеном доступа к Partner API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ApiTokenManager
              hasExistingToken={hasPartnerAccount}
              generatedAt={partnerAccountCreatedAt}
            />
            <Separator />
            <PayoutsLedger ledger={partnerLedger} />
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
