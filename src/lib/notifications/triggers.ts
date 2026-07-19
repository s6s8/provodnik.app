import "server-only";

import * as Sentry from "@sentry/nextjs";
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
  renderNewRequestEmail,
} from "@/lib/email/templates/notification-emails";

const uuidSchema = z.string().uuid("Некорректный UUID.");
const cancelledByRoleSchema = z.enum(["traveler", "guide", "admin"]);
type BookingCancelRecipient = {
  userId: string;
  role: "traveler" | "guide";
};

function captureNotificationLookupError(error: unknown): void {
  Sentry.captureException(error, {
    tags: { context: "notification_trigger" },
  });
}

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function getGuideDisplayName(guideId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", guideId)
    .maybeSingle();

  if (error) {
    captureNotificationLookupError(error);
    return resolveDisplayName("guide", { full_name: undefined });
  }

  return resolveDisplayName("guide", { full_name: profile?.full_name });
}

async function getTravelerDisplayName(travelerId: string): Promise<string> {
  const admin = createSupabaseAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", travelerId)
    .maybeSingle();

  if (error) {
    captureNotificationLookupError(error);
    return resolveDisplayName(
      "traveler",
      { full_name: undefined },
      { context: "trusted" },
    );
  }

  return resolveDisplayName(
    "traveler",
    { full_name: profile?.full_name },
    { context: "trusted" },
  );
}

async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    captureNotificationLookupError(error);
    return null;
  }
  return data?.email ?? null;
}

async function guideEmailDisabled(
  guideUserId: string,
  eventKey: string,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("guide_profiles")
    .select("notification_prefs")
    .eq("user_id", guideUserId)
    .maybeSingle();
  if (error) {
    captureNotificationLookupError(error);
    return false;
  }
  const prefs = (data?.notification_prefs ?? {}) as Record<string, unknown>;
  return prefs[`guide.${eventKey}.email`] === false;
}

async function travelerEmailDisabled(
  travelerUserId: string,
  eventKey: string,
): Promise<boolean> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("notification_prefs")
      .eq("id", travelerUserId)
      .maybeSingle();

    if (error) {
      captureNotificationLookupError(error);
      return false;
    }

    const prefs = (data?.notification_prefs ?? {}) as Record<string, unknown>;
    return prefs[`traveler.${eventKey}.email`] === false;
  } catch {
    return false;
  }
}

async function createNotificationForUser(data: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  payload?: Record<string, unknown>;
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
        .select("id, traveler_id, destination, starts_on, participants_count")
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
    body: `${requestRow.destination} · ${formatShortDate(requestRow.starts_on)} · ${requestRow.participants_count} чел.`,
    href: `/requests/${requestRow.id}`,
    payload: {
      actor_id: offerRow.guide_id,
      actor_name: guideName,
      request_id: requestRow.id,
      offer_id: parsedOfferId,
      destination: requestRow.destination,
      participants: requestRow.participants_count,
    },
  });

  try {
    if (!(await travelerEmailDisabled(requestRow.traveler_id, "new_offer"))) {
      const to = await getUserEmail(requestRow.traveler_id);
      if (to) {
        const { subject, html } = renderNewOfferEmail({
          guideName,
          requestUrl: `${getSiteUrl()}/requests/${requestRow.id}`,
        });
        await sendNotificationEmail({
          kind: "new_offer",
          entityId: parsedOfferId,
          to,
          subject,
          html,
        });
      }
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

  const travelerName = await getTravelerDisplayName(bookingRow.traveler_id);

  await createNotificationForUser({
    userId: bookingRow.guide_id,
    kind: "booking_created",
    title: `Новое бронирование от ${travelerName}`,
    href: `/guide/bookings/${bookingRow.id}`,
    payload: {
      actor_id: bookingRow.traveler_id,
      actor_name: travelerName,
      booking_id: parsedBookingId,
    },
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
    .select("id, traveler_id, guide_id")
    .eq("id", parsedBookingId)
    .single();

  if (error) throw error;

  const guideName = await getGuideDisplayName(bookingRow.guide_id);

  await createNotificationForUser({
    userId: bookingRow.traveler_id,
    kind: "booking_confirmed",
    title: `${guideName} подтвердил бронирование`,
    body: "Можно готовиться к поездке",
    href: `/bookings/${bookingRow.id}`,
    payload: {
      actor_id: bookingRow.guide_id,
      actor_name: guideName,
      booking_id: parsedBookingId,
    },
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

  const actorName =
    role === "traveler"
      ? await getTravelerDisplayName(bookingRow.traveler_id)
      : role === "guide"
        ? await getGuideDisplayName(bookingRow.guide_id)
        : "Администратор";
  const body =
    role === "admin"
      ? "Администратор отменил бронирование"
      : `${actorName} отменил бронирование`;

  const recipients: BookingCancelRecipient[] =
    role === "traveler"
      ? [{ userId: bookingRow.guide_id, role: "guide" }]
      : role === "guide"
        ? [{ userId: bookingRow.traveler_id, role: "traveler" }]
        : [
            { userId: bookingRow.traveler_id, role: "traveler" },
            { userId: bookingRow.guide_id, role: "guide" },
          ];

  await Promise.all(
    recipients.map((recipient) =>
      createNotificationForUser({
        userId: recipient.userId,
        kind: "booking_cancelled",
        title: "Бронирование отменено",
        body,
        href: recipient.role === "traveler"
          ? `/bookings/${bookingRow.id}`
          : `/guide/bookings/${bookingRow.id}`,
        payload: {
          booking_id: parsedBookingId,
          cancelled_by: role,
          actor_name: actorName,
        },
      }),
    ),
  );

  for (const recipient of recipients) {
    try {
      const emailDisabled =
        recipient.role === "guide"
          ? await guideEmailDisabled(recipient.userId, "booking_status")
          : await travelerEmailDisabled(recipient.userId, "booking_status");
      if (emailDisabled) continue;

      const to = await getUserEmail(recipient.userId);
      if (!to) continue;
      const { subject, html } = renderBookingCancelledEmail({
        bookingUrl: recipient.role === "traveler"
          ? `${getSiteUrl()}/bookings/${bookingRow.id}`
          : `${getSiteUrl()}/guide/bookings/${bookingRow.id}`,
      });
      await sendNotificationEmail({
        kind: "booking_cancelled",
        entityId: `${parsedBookingId}:${recipient.userId}`,
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
    .select("id, traveler_id, guide_id")
    .eq("id", parsedBookingId)
    .single();

  if (error) throw error;

  const guideName = await getGuideDisplayName(bookingRow.guide_id);

  await createNotificationForUser({
    userId: bookingRow.traveler_id,
    kind: "review_requested",
    title: `Как прошёл тур с ${guideName}?`,
    body: "Поделитесь впечатлениями — это важно для других путешественников",
    href: `/bookings/${bookingRow.id}/review`,
    payload: {
      booking_id: parsedBookingId,
      actor_id: bookingRow.guide_id,
      actor_name: guideName,
    },
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
        payload: {
          dispute_id: parsedDisputeId,
        },
      }),
    ),
  );
}

export async function notifyGuidesNewRequest(requestId: string): Promise<void> {
  const parsedRequestId = uuidSchema.parse(requestId);
  const supabase = await createSupabaseServerClient();

  const { data: request, error: requestError } = await supabase
    .from("traveler_requests")
    .select("id, destination, interests, participants_count, target_guide_id")
    .eq("id", parsedRequestId)
    .single();

  if (requestError) throw requestError;

  type GuideCandidate = {
    user_id: string;
    specialties: string[] | null;
    max_group_size: number | null;
  };
  const directedGuideId =
    (request as { target_guide_id?: string | null }).target_guide_id ?? null;
  let matchingGuides: GuideCandidate[];

  if (directedGuideId) {
    // Item 8: a request addressed to a specific guide is private — notify ONLY that
    // guide, never the marketplace fan-out.
    matchingGuides = [{ user_id: directedGuideId, specialties: null, max_group_size: null }];
  } else {
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

    matchingGuides = candidates.filter((guide) => {
      const guideSpecialties: string[] = Array.isArray(guide.specialties)
        ? guide.specialties
        : [];
      if (guideSpecialties.length === 0) return true;
      if (requestInterests.length === 0) return true;
      return guideSpecialties.some((s) => requestInterests.includes(s));
    });
  }

  if (!matchingGuides.length) return;

  const results = await Promise.allSettled(
    matchingGuides.map((guide) =>
      createNotificationForUser({
        userId: guide.user_id,
        kind: "new_request",
        title: `Новый запрос: ${request.destination} · ${request.participants_count} чел.`,
        href: `/guide/inbox`,
        payload: {
          request_id: parsedRequestId,
          destination: request.destination,
          participants: request.participants_count,
        },
      }),
    ),
  );

  // Item 8: a matching guide used to learn about a new request ONLY from the in-app
  // bell — so a guide who was not in the app at that moment learned nothing, and the
  // request sat unanswered. Marketplace liquidity depends on this one email.
  //
  // entityId folds in the recipient. `notification_email_log` is keyed
  // PRIMARY KEY (kind, entity_id), so a bare requestId would let the first guide's row
  // swallow the key and every other guide's mail would be dropped as "already sent" —
  // silently. Same shape as notifyBookingCancelled, the other multi-recipient path.
  // Fan out per-guide emails concurrently — each guide's send is independent, so
  // a sequential loop only added latency (it ran on the request's critical path
  // before this became an after()-scheduled side effect).
  await Promise.allSettled(
    matchingGuides.map(async (guide) => {
      try {
        if (await guideEmailDisabled(guide.user_id, "new_request")) return;
        const to = await getUserEmail(guide.user_id);
        if (!to) return;
        const { subject, html } = renderNewRequestEmail({
          destination: request.destination,
          participants: request.participants_count ?? 1,
          inboxUrl: `${getSiteUrl()}/guide/inbox`,
        });
        await sendNotificationEmail({
          kind: "new_request",
          entityId: `${parsedRequestId}:${guide.user_id}`,
          to,
          subject,
          html,
        });
      } catch (e) {
        // An email must never fail the request that triggered it.
        console.error(
          "[notifyGuidesNewRequest] email skipped:",
          e instanceof Error ? e.message : e,
        );
      }
    }),
  );

  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    const error = new AggregateError(
      failures.map((failure) => failure.reason),
      "Не удалось отправить часть уведомлений гидам.",
    );
    console.error("[notifyGuidesNewRequest] notification failures:", error);
    throw error;
  }
}
