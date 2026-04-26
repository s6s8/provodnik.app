import "server-only";

import { z } from "zod";

import {
  createNotification,
  type NotificationKind,
} from "@/lib/notifications/create-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid("Некорректный UUID.");
const cancelledByRoleSchema = z.enum(["traveler", "guide", "admin"]);

async function getGuideDisplayName(guideId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const [{ data: guideProfile }, { data: profile }] = await Promise.all([
    supabase
      .from("guide_profiles")
      .select("display_name")
      .eq("user_id", guideId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", guideId)
      .maybeSingle(),
  ]);

  return guideProfile?.display_name?.trim() || profile?.full_name?.trim() || "гида";
}

async function createNotificationForUser(data: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
}) {
  return createNotification(data);
}

export async function notifyNewOffer(
  requestId: string,
  offerId: string,
): Promise<void> {
  const parsedRequestId = uuidSchema.parse(requestId);
  const parsedOfferId = uuidSchema.parse(offerId);
  const supabase = await createSupabaseServerClient();

  const [{ data: requestRow, error: requestError }, { data: offerRow, error: offerError }] =
    await Promise.all([
      supabase
        .from("traveler_requests")
        .select("id, traveler_id")
        .eq("id", parsedRequestId)
        .single(),
      supabase
        .from("guide_offers")
        .select("id, guide_id, request_id")
        .eq("id", parsedOfferId)
        .single(),
    ]);

  if (requestError) throw requestError;
  if (offerError) throw offerError;
  if (offerRow.request_id !== requestRow.id) {
    throw new Error("Предложение не относится к указанному запросу.");
  }

  const guideName = await getGuideDisplayName(offerRow.guide_id);

  await createNotificationForUser({
    userId: requestRow.traveler_id,
    kind: "new_offer",
    title: `Новое предложение от ${guideName}`,
    href: `/traveler/requests/${requestRow.id}`,
  });
}

export async function notifyBookingCreated(bookingId: string): Promise<void> {
  const parsedBookingId = uuidSchema.parse(bookingId);
  const supabase = await createSupabaseServerClient();

  const { data: bookingRow, error } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id")
    .eq("id", parsedBookingId)
    .single();

  if (error) throw error;

  await createNotificationForUser({
    userId: bookingRow.guide_id,
    kind: "booking_created",
    title: "Новое бронирование",
    href: `/guide/bookings/${bookingRow.id}`,
  });
}

export async function notifyBookingConfirmed(bookingId: string): Promise<void> {
  const parsedBookingId = uuidSchema.parse(bookingId);
  const supabase = await createSupabaseServerClient();

  const { data: bookingRow, error } = await supabase
    .from("bookings")
    .select("id, traveler_id")
    .eq("id", parsedBookingId)
    .single();

  if (error) throw error;

  await createNotificationForUser({
    userId: bookingRow.traveler_id,
    kind: "booking_confirmed",
    title: "Бронирование подтверждено",
    href: `/traveler/bookings/${bookingRow.id}`,
  });
}

export async function notifyBookingCancelled(
  bookingId: string,
  cancelledByRole: string,
): Promise<void> {
  const parsedBookingId = uuidSchema.parse(bookingId);
  const role = cancelledByRoleSchema.parse(cancelledByRole);
  const supabase = await createSupabaseServerClient();

  const { data: bookingRow, error } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id")
    .eq("id", parsedBookingId)
    .single();

  if (error) throw error;

  const recipientIds =
    role === "traveler"
      ? [bookingRow.guide_id]
      : role === "guide"
        ? [bookingRow.traveler_id]
        : [bookingRow.traveler_id, bookingRow.guide_id];

  await Promise.all(
    recipientIds.map((userId) =>
      createNotificationForUser({
        userId,
        kind: "booking_cancelled",
        title: "Бронирование отменено",
      }),
    ),
  );
}

export async function notifyReviewRequested(bookingId: string): Promise<void> {
  const parsedBookingId = uuidSchema.parse(bookingId);
  const supabase = await createSupabaseServerClient();

  const { data: bookingRow, error } = await supabase
    .from("bookings")
    .select("id, traveler_id")
    .eq("id", parsedBookingId)
    .single();

  if (error) throw error;

  await createNotificationForUser({
    userId: bookingRow.traveler_id,
    kind: "review_requested",
    title: "Оставьте отзыв о поездке",
    href: `/traveler/bookings/${bookingRow.id}/review`,
  });
}

export async function notifyDisputeOpened(disputeId: string): Promise<void> {
  const parsedDisputeId = uuidSchema.parse(disputeId);
  const supabase = createSupabaseAdminClient();

  const { data: admins, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (error) throw error;

  await Promise.all(
    (admins ?? []).map((admin) =>
      createNotificationForUser({
        userId: admin.id,
        kind: "dispute_opened",
        title: "Открыт новый спор",
        href: `/admin/disputes/${parsedDisputeId}`,
      }),
    ),
  );
}

export async function notifyGuidesNewRequest(requestId: string): Promise<void> {
  const parsedRequestId = uuidSchema.parse(requestId);
  const supabase = await createSupabaseServerClient();

  const { data: request, error: requestError } = await supabase
    .from("traveler_requests")
    .select("id, destination, interests, participants_count")
    .eq("id", parsedRequestId)
    .single();

  if (requestError) throw requestError;
  if (!request.destination?.trim()) return;

  let query = supabase
    .from("guide_profiles")
    .select("user_id, specialties, max_group_size")
    .eq("is_available", true)
    .eq("verification_status", "approved")
    .ilike("base_city", request.destination.trim());

  if (request.participants_count && request.participants_count > 0) {
    query = query.or(
      `max_group_size.is.null,max_group_size.gte.${request.participants_count}`,
    );
  }

  const { data: candidates, error: guidesError } = await query;
  if (guidesError) throw guidesError;
  if (!candidates?.length) return;

  const requestInterests: string[] = Array.isArray(request.interests)
    ? request.interests
    : [];

  const matchingGuides = candidates.filter((guide) => {
    const guideSpecialties: string[] = Array.isArray(guide.specialties)
      ? guide.specialties
      : [];
    if (guideSpecialties.length === 0) return true;
    if (requestInterests.length === 0) return true;
    return guideSpecialties.some((s) => requestInterests.includes(s));
  });

  if (!matchingGuides.length) return;

  await Promise.allSettled(
    matchingGuides.map((guide) =>
      createNotificationForUser({
        userId: guide.user_id,
        kind: "new_request",
        title: `Новый запрос: ${request.destination}`,
        href: `/guide/inbox`,
      }),
    ),
  );
}
