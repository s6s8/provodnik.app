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

