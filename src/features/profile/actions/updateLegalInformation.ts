"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateLegalInformation(data: {
  legalStatus: string | null;
  inn: string | null;
  documentCountry: string | null;
  isTourOperator: boolean;
  tourOperatorRegistryNumber: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("guide_profiles")
    .update({
      legal_status: data.legalStatus as "self_employed" | "individual" | "company" | null,
      inn: data.inn,
      document_country: data.documentCountry,
      is_tour_operator: data.isTourOperator,
      tour_operator_registry_number: data.tourOperatorRegistryNumber,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return { success: true };
}
