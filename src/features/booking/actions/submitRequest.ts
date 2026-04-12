"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitRequest(formData: {
  listingId: string;
  guideId: string;
  destination: string;
  region: string;
  category: string;
  startsOn: string;
  endsOn?: string;
  participantsCount: number;
  formatPreference?: string;
  notes?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const endsOn =
    formData.endsOn && formData.endsOn.trim() !== "" ? formData.endsOn.trim() : undefined;

  const { data: request, error } = await supabase
    .from("traveler_requests")
    .insert({
      traveler_id: user.id,
      destination: formData.destination,
      region: formData.region,
      category: formData.category,
      starts_on: formData.startsOn,
      ends_on: endsOn ?? null,
      participants_count: formData.participantsCount,
      format_preference: formData.formatPreference ?? null,
      notes: formData.notes ?? null,
      open_to_join: false,
      allow_guide_suggestions: true,
      budget_minor: null,
      currency: "RUB",
      status: "open",
    })
    .select("id")
    .single();

  if (error || !request) throw new Error(error?.message ?? "Failed to create request");

  redirect(`/requests/${request.id}`);
}
