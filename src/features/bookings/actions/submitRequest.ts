"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { submitRequestSchema } from "./submitRequest.schema";

export async function submitRequest(formData: unknown) {
  const parsed = submitRequestSchema.safeParse(formData);
  if (!parsed.success) throw new Error("invalid_input");
  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("auth_expired");

  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, status, price_from_minor, guide_id")
    .eq("id", input.listingId)
    .single();

  if (listingErr || !listing) {
    throw new Error("listing_unavailable");
  }

  // Verify the listing belongs to the specified guide
  if (listing.guide_id !== input.guideId) {
    throw new Error("listing_unavailable");
  }
  if (listing.status !== "published") {
    throw new Error("listing_unavailable");
  }
  if (input.mode !== "question" && listing.price_from_minor == null) {
    throw new Error("listing_no_price");
  }

  const endsOn = input.endsOn && input.endsOn.trim() !== "" ? input.endsOn.trim() : undefined;

  const { data: request, error } = await supabase
    .from("traveler_requests")
    .insert({
      traveler_id: user.id,
      destination: input.destination,
      region: input.region,
      category: input.category,
      interests: input.category ? [input.category] : [],
      starts_on: input.startsOn,
      ends_on: endsOn ?? null,
      participants_count: input.participantsCount,
      format_preference: input.formatPreference ?? null,
      notes: input.notes ?? null,
      open_to_join: input.formatPreference === "group",
      budget_minor: null,
      currency: "RUB",
      status: "open",
    })
    .select("id")
    .single();

  if (error || !request) throw new Error("request_create_failed");

  redirect(`/requests/${request.id}`);
}
