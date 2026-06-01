"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const legalInformationSchema = z.object({
  legalStatus: z.enum(["self_employed", "individual", "company", "null"]).nullable().optional(),
  inn: z.string().nullable().optional(),
  documentCountry: z.string().nullable().optional(),
  isTourOperator: z.boolean().optional(),
  tourOperatorRegistryNumber: z.string().nullable().optional(),
});

export async function updateLegalInformation(data: {
  legalStatus: string | null;
  inn: string | null;
  documentCountry: string | null;
  isTourOperator: boolean;
  tourOperatorRegistryNumber: string | null;
}) {
  const parsed = legalInformationSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Некорректные данные юридической информации.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: statusRow } = await supabase
    .from("guide_profiles")
    .select("verification_status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (statusRow?.verification_status === "approved") {
    throw new Error("Профиль одобрен — для изменения данных обратитесь к администраторам");
  }

  const { error } = await supabase
    .from("guide_profiles")
    .update({
      legal_status: (parsed.data.legalStatus === "null" ? null : parsed.data.legalStatus) as "self_employed" | "individual" | "company" | null,
      inn: parsed.data.inn,
      document_country: parsed.data.documentCountry,
      is_tour_operator: parsed.data.isTourOperator,
      tour_operator_registry_number: parsed.data.tourOperatorRegistryNumber,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return { success: true };
}
