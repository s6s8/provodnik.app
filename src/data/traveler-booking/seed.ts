import type {
  TravelerBookingRecord,
  TravelerBookingTimelineStep,
} from "@/data/traveler-booking/types";

function isoDaysAgo(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

function isoDaysFromNow(daysFromNow: number) {
  const value = new Date();
  value.setDate(value.getDate() + daysFromNow);
  return value.toISOString();
}

export const seededTravelerBookings: TravelerBookingRecord[] = [
  {
    id: "bk_seed_kazan_deposit_ready_1",
    status: "deposit_ready",
    createdAt: isoDaysAgo(1),
    updatedAt: isoDaysAgo(0),
    request: {
      id: "req_seed_kazan_city_1",
      destination: "Kazan",
      startDate: "2026-05-02",
      endDate: "2026-05-05",
      groupSize: 2,
    },
    traveler: {
      displayName: "You",
    },
    guide: {
      displayName: "Sergey I.",
      homeBase: "Kazan",
      rating: 4.7,
      completedTrips: 31,
      responseTimeHours: 6,
    },
    itinerary: {
      timezone: "Europe/Moscow",
      days: [
        {
          day: 1,
          title: "Arrival + neighborhood orientation",
          beats: [
            "Flexible arrival window and check-in buffer",
            "Old Tatar Quarter walk + coffee stop",
            "Dinner reservation options (vegetarian-friendly)",
          ],
        },
        {
          day: 2,
          title: "Food day + contrast architecture",
          beats: [
            "Curated street food route (6 stops)",
            "Kazan Kremlin highlights at a relaxed pace",
            "Golden-hour photo loop with quiet viewpoints",
          ],
        },
        {
          day: 3,
          title: "Slow day + markets (weather-adaptive)",
          beats: [
            "Local market + craft stalls",
            "Optional riverfront plan with indoor backup",
            "Wrap-up: handoff of map and recommendations",
          ],
        },
      ],
      notes:
        "This is a framing itinerary for MVP baseline: it shows structure and intent, not final logistics.",
    },
    payment: {
      currency: "RUB",
      lineItems: [
        {
          id: "li_guide_service",
          label: "Guide service (planning + hosting)",
          amountRub: 96_000,
          kind: "service",
        },
        {
          id: "li_experiences",
          label: "Experiences & tickets (estimated)",
          amountRub: 18_000,
          kind: "service",
        },
        {
          id: "li_platform_fee",
          label: "Platform fee",
          amountRub: 8_000,
          kind: "fee",
        },
        {
          id: "li_payment_fee",
          label: "Payment processing",
          amountRub: 2_500,
          kind: "fee",
        },
      ],
      depositRub: 31_125,
      depositDueAt: isoDaysFromNow(2),
    },
    cancellationPolicy: {
      summary: "Free cancellation up to 72h after deposit. After that, deposit is non‑refundable.",
      bullets: [
        "Cancel within 72h of paying deposit: full refund (deposit + fees).",
        "After 72h: deposit is retained to hold dates; remaining balance is not charged.",
        "If the guide cancels: full refund and priority re-matching.",
      ],
    },
  },
];

export const seededTravelerBookingTimeline: TravelerBookingTimelineStep[] = [
  {
    id: "btl_1",
    bookingId: "bk_seed_kazan_deposit_ready_1",
    at: isoDaysAgo(1),
    title: "Booking created",
    description: "You selected a guide offer and started the booking.",
    state: "done",
  },
  {
    id: "btl_2",
    bookingId: "bk_seed_kazan_deposit_ready_1",
    at: isoDaysAgo(0),
    title: "Deposit ready",
    description: "Deposit is available to secure the dates.",
    state: "current",
  },
  {
    id: "btl_3",
    bookingId: "bk_seed_kazan_deposit_ready_1",
    at: null,
    title: "Deposit paid",
    description: "Payment step placeholder in MVP baseline.",
    state: "upcoming",
  },
  {
    id: "btl_4",
    bookingId: "bk_seed_kazan_deposit_ready_1",
    at: null,
    title: "Confirmed",
    description: "Your itinerary is locked and the guide is introduced.",
    state: "upcoming",
  },
  {
    id: "btl_5",
    bookingId: "bk_seed_kazan_deposit_ready_1",
    at: null,
    title: "Trip day",
    description: "In-progress status when your travel dates begin.",
    state: "upcoming",
  },
  {
    id: "btl_6",
    bookingId: "bk_seed_kazan_deposit_ready_1",
    at: null,
    title: "Completed",
    description: "Leave a review and save this guide to favorites.",
    state: "upcoming",
  },
];

