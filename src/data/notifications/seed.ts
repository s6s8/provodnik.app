import type { NotificationRecord } from "@/data/notifications/types";

function isoHoursAgo(hoursAgo: number) {
  const value = new Date();
  value.setHours(value.getHours() - hoursAgo);
  return value.toISOString();
}

const seededNotifications: readonly NotificationRecord[] = [
  {
    id: "ntf_seed_offer_kazan_1",
    userId: "usr_traveler_you",
    kind: "new_offer",
    severity: "success",
    createdAt: isoHoursAgo(18),
    readAt: null,
    title: "New offer on your Kazan request",
    body: "A guide responded with a proposal. Compare details and shortlist if it fits.",
    href: "/traveler/requests/req_seed_kazan_city_1",
    metadata: { requestId: "req_seed_kazan_city_1", offerId: "offer_kazan_1" },
  },
  {
    id: "ntf_seed_booking_deposit_ready_1",
    userId: "usr_traveler_you",
    kind: "booking_update",
    severity: "info",
    createdAt: isoHoursAgo(6),
    readAt: isoHoursAgo(2),
    title: "Deposit is ready",
    body: "Secure the dates with a deposit (payment is a placeholder in MVP baseline).",
    href: "/traveler/bookings/bk_seed_kazan_deposit_ready_1",
    metadata: { bookingId: "bk_seed_kazan_deposit_ready_1" },
  },
  {
    id: "ntf_seed_review_reminder_1",
    userId: "usr_traveler_you",
    kind: "review_reminder",
    severity: "warning",
    createdAt: isoHoursAgo(2),
    readAt: null,
    title: "Review reminder",
    body: "If your trip is completed, leave a quick review to help future travelers.",
    href: "/traveler/bookings",
    metadata: { guideSlug: "maria-rostov" },
  },
  {
    id: "ntf_seed_system_1",
    userId: "usr_traveler_you",
    kind: "system",
    severity: "info",
    createdAt: isoHoursAgo(1),
    readAt: null,
    title: "Local-first demo data",
    body: "This baseline uses seeded marketplace data and local storage for some flows. No real payments or persistence.",
  },
  {
    id: "ntf_seed_guide_new_request_match_1",
    userId: "usr_guide_you",
    kind: "request_update",
    severity: "info",
    createdAt: isoHoursAgo(20),
    readAt: null,
    title: "New request match: Kazan (food-focused)",
    body: "A traveler request matches your profile. Review the constraints before making an offer.",
    href: "/guide/requests",
    metadata: { requestId: "trq_20018", destination: "Kazan" },
  },
  {
    id: "ntf_seed_guide_booking_needs_confirmation_1",
    userId: "usr_guide_you",
    kind: "booking_update",
    severity: "warning",
    createdAt: isoHoursAgo(5),
    readAt: null,
    title: "Booking needs confirmation",
    body: "Confirm availability and lock itinerary structure to keep the booking moving.",
    href: "/guide/bookings/gb_seed_spb_awaiting_confirmation_1",
    metadata: { bookingId: "gb_seed_spb_awaiting_confirmation_1" },
  },
  {
    id: "ntf_seed_guide_message_1",
    userId: "usr_guide_you",
    kind: "message",
    severity: "info",
    createdAt: isoHoursAgo(3),
    readAt: isoHoursAgo(1),
    title: "Traveler follow-up question",
    body: "A traveler asked about pacing and museum breaks. Reply when you’re ready (messaging is a placeholder).",
    href: "/guide/requests",
    metadata: { requestId: "trq_20014" },
  },
  {
    id: "ntf_seed_admin_dispute_opened_1",
    userId: "usr_admin_you",
    kind: "system",
    severity: "warning",
    createdAt: isoHoursAgo(8),
    readAt: null,
    title: "New dispute opened",
    body: "A booking dispute needs triage. Capture a summary and assign next steps (admin ops scaffold).",
    href: "/admin/disputes",
    metadata: { queue: "disputes" },
  },
  {
    id: "ntf_seed_admin_listing_flagged_1",
    userId: "usr_admin_you",
    kind: "system",
    severity: "info",
    createdAt: isoHoursAgo(4),
    readAt: null,
    title: "Listing flagged for review",
    body: "A listing was flagged for content and policy review. Verify the issue and resolve.",
    href: "/admin/listings",
    metadata: { queue: "listings" },
  },
  {
    id: "ntf_seed_admin_guide_verification_ready_1",
    userId: "usr_admin_you",
    kind: "system",
    severity: "success",
    createdAt: isoHoursAgo(2),
    readAt: isoHoursAgo(1),
    title: "Guide verification ready",
    body: "A guide submitted verification details and is ready for approval (seeded moderation surface).",
    href: "/admin",
    metadata: { queue: "guide_verification" },
  },
] as const;

export function listSeededNotificationsForUser(
  userId: string,
): NotificationRecord[] {
  return seededNotifications
    .filter((item) => item.userId === userId)
    .map((item) => ({
      ...item,
      metadata: item.metadata ? { ...item.metadata } : undefined,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countSeededUnreadNotifications(userId: string): number {
  return seededNotifications.filter(
    (item) => item.userId === userId && item.readAt === null,
  ).length;
}

