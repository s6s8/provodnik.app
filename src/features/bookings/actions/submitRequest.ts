"use server";

import { redirect } from "next/navigation";

import { logFunnelEvent } from "@/lib/analytics/marketplace-events";
import { notifyGuidesNewRequest } from "@/lib/notifications/triggers";
import { createTravelerRequest } from "@/lib/supabase/requests";
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

  // Same active-account gate as the canonical homepage path — a restricted account
  // must not be able to create requests through the listing entry point either.
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.account_status && profile.account_status !== "active") {
    throw new Error("account_restricted");
  }

  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, status, price_from_minor, guide_id")
    .eq("id", input.listingId)
    .single();

  if (listingErr || !listing) {
    throw new Error("listing_unavailable");
  }
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
  const format =
    input.formatPreference === "group"
      ? "group"
      : input.formatPreference === "private"
        ? "private"
        : null;

  // Canonical creation service: destination sanitization, validation, and the
  // correct lock defaults (date/time open so guides can propose — same as the
  // homepage path). Maps the listing category to an interest; traveler_requests
  // has no category column, so the old direct insert wrote a non-existent field.
  const request = await createTravelerRequest(
    {
      // D17-8: a request started from one guide's excursion belongs to that guide only.
      // Pass the listing, not an addressee — the DB re-checks it is published and derives
      // target_guide_id from it, so no id from here (or from the client) can be a target.
      listing_id: listing.id,
      destination: input.destination,
      region: input.region,
      interests: input.category ? [input.category] : [],
      starts_on: input.startsOn,
      ends_on: endsOn ?? input.startsOn,
      budget_minor: null,
      participants_count: input.participantsCount,
      format_preference: format,
      notes: input.notes ?? null,
      open_to_join: input.formatPreference === "group",
      date_flexibility: "exact",
      date_locked: false,
      time_locked: false,
    },
    user.id,
  );

  try {
    await notifyGuidesNewRequest(request.id);
  } catch {
    // Notification delivery must not block request creation.
  }
  await logFunnelEvent({
    event_type: "request_created",
    scope: "request",
    request_id: request.id,
    actor_id: user.id,
    summary: "Запрос создан со страницы экскурсии",
  });

  redirect(`/requests/${request.id}`);
}
