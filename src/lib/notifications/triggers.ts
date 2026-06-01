import "server-only";

import { z } from "zod";

import {
  createNotification,
  type NotificationKind,
} from "@/lib/notifications/create-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { sendNotificationEmail } from "@/lib/email/send-notification-email";
import {
  renderNewOfferEmail,
  renderBookingCreatedEmail,
  renderBookingCancelledEmail,
} from "@/lib/email/templates/notification-emails";

const uuidSchema = z.string().uuid("Некорректный UUID.");
const cancelledByRoleSchema = z.enum(["traveler", "guide", "admin"]);

async function getGuideDisplayName(guideId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", guideId)
    .maybeSingle();

  return resolveDisplayName("guide", { full_name: profile?.full_name });
}

async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  return data?.email ?? null;
}

async function guideEmailDisabled(
  guideUserId: string,
  eventKey: string,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("guide_profiles")
    .select("notification_prefs")
    .eq("user_id", guideUserId)
    .maybeSingle();
  const prefs = (data?.notification_prefs ?? {}) as Record<string, unknown>;
  return prefs[`guide.${eventKey}.email`] === false;
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

  try {
    const to = await getUserEmail(requestRow.traveler_id);
    if (to) {
      const { subject, html } = renderNewOfferEmail({
        guideName,
        requestUrl: `${getSiteUrl()}/traveler/requests/${requestRow.id}`,
      });
      await sendNotificationEmail({
        kind: "new_offer",
        entityId: parsedOfferId,
        to,
        subject,
        html,
      });
    }
  } catch (e) {
    console.error("[notifyNewOffer] email skipped:", e instanceof Error ? e.message : e);
  }
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

  try {
    if (!(await guideEmailDisabled(bookingRow.guide_id, "booking_status"))) {
      const to = await getUserEmail(bookingRow.guide_id);
      if (to) {
        const { subject, html } = renderBookingCreatedEmail({
          bookingUrl: `${getSiteUrl()}/guide/bookings/${bookingRow.id}`,
        });
        await sendNotificationEmail({
          kind: "booking_created",
          entityId: parsedBookingId,
          to,
          subject,
          html,
        });
      }
    }
  } catch (e) {
    console.error(
      "[notifyBookingCreated] email skipped:",
      e instanceof Error ? e.message : e,
    );
  }
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

  for (const userId of recipientIds) {
    try {
      const to = await getUserEmail(userId);
      if (!to) continue;
      const { subject, html } = renderBookingCancelledEmail({
        bookingUrl: `${getSiteUrl()}/traveler/bookings/${bookingRow.id}`,
      });
      await sendNotificationEmail({
        kind: "booking_cancelled",
        entityId: `${parsedBookingId}:${userId}`,
        to,
        subject,
        html,
      });
    } catch (e) {
      console.error(
        "[notifyBookingCancelled] email skipped:",
        e instanceof Error ? e.message : e,
      );
    }
  }
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
  const supabase = await createSupabaseServerClient();

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
