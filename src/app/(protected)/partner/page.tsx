import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { ApiTokenManager } from "@/features/partner/components/ApiTokenManager";
import { PayoutsLedger } from "@/features/partner/components/PayoutsLedger";
import { buildAuthLoginRedirect } from "@/lib/auth/safe-redirect";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PartnerPayoutsLedgerRow } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Партнёрский кабинет",
};

export default async function PartnerCabinetPage() {
  if (!flags.FEATURE_TR_PARTNER) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(buildAuthLoginRedirect("/partner"));

  const { data: account, error: accountError } = await supabase
    .from("partner_accounts")
    .select("id, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountError) throw accountError;

  let ledger: PartnerPayoutsLedgerRow[] = [];
  if (account?.id) {
    const { data, error } = await supabase
      .from("partner_payouts_ledger")
      .select("*")
      .eq("partner_id", account.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    ledger = data ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-semibold text-foreground">
        Партнёрский кабинет
      </h1>
      <ApiTokenManager
        hasExistingToken={!!account}
        generatedAt={account?.created_at ?? null}
      />
      <Separator />
      <PayoutsLedger ledger={ledger} />
    </div>
  );
}
