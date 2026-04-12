import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LegalInformationForm } from "@/features/profile/components/LegalInformationForm";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Правовая информация",
};

export default async function LegalInformationPage() {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/profile/guide/legal-information");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialData = {
    legalStatus: null as string | null,
    inn: null as string | null,
    documentCountry: null as string | null,
    isTourOperator: false,
    tourOperatorRegistryNumber: null as string | null,
  };

  if (user) {
    const { data: profile } = await supabase
      .from("guide_profiles")
      .select(
        "legal_status, inn, document_country, is_tour_operator, tour_operator_registry_number"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      initialData = {
        legalStatus: profile.legal_status ?? null,
        inn: profile.inn ?? null,
        documentCountry: profile.document_country ?? null,
        isTourOperator: profile.is_tour_operator ?? false,
        tourOperatorRegistryNumber: profile.tour_operator_registry_number ?? null,
      };
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-8">
      <h1 className="font-display text-2xl text-foreground md:text-3xl">
        Правовая информация
      </h1>
      <LegalInformationForm initialData={initialData} />
    </div>
  );
}
