import type { GuideBookingRecord } from "@/data/guide-booking/types";

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

export const seededGuideBookings: GuideBookingRecord[] = [
  {
    id: "gb_seed_spb_awaiting_confirmation_1",
    status: "awaiting_confirmation",
    createdAt: isoDaysAgo(2),
    updatedAt: isoDaysAgo(0),
    request: {
      id: "req_seed_spb_culture_1",
      destination: "Saint Petersburg",
      startDate: "2026-04-10",
      endDate: "2026-04-13",
      groupSize: 2,
    },
    travelerRoster: [
      {
        id: "trav_primary_irina",
        displayName: "Irina (primary)",
        isPrimaryContact: true,
        notes: "Prefers calmer pace, morning start, minimal long walks.",
      },
      {
        id: "trav_partner",
        displayName: "Andrei",
        notes: "Loves museums and photography spots.",
      },
    ],
    itinerary: {
      timezone: "Europe/Moscow",
      days: [
        {
          day: 1,
          title: "Arrival + orientation loop",
          beats: [
            "Flexible arrival buffer and hotel check-in",
            "Quiet canals walk + coffee stop",
            "Dinner reservation options near Nevsky",
          ],
        },
        {
          day: 2,
          title: "Museums day (paced)",
          beats: [
            "Hermitage highlights with breaks",
            "Short transfer plan (indoor-friendly)",
            "Evening viewpoints if energy allows",
          ],
        },
        {
          day: 3,
          title: "Culture + free pockets",
          beats: [
            "Neighborhood walk + local craft stops",
            "Optional small museum / indoor backup",
            "Wrap-up recommendations and handoff",
          ],
        },
      ],
      notes:
        "Seeded itinerary summary: structure only; final logistics come after confirmation.",
    },
    payment: {
      currency: "RUB",
      lineItems: [
        {
          id: "li_service",
          label: "Guide hosting + planning",
          amountRub: 78_000,
          kind: "service",
        },
        {
          id: "li_estimates",
          label: "Tickets & experiences (estimated)",
          amountRub: 24_000,
          kind: "service",
        },
        {
          id: "li_platform_fee",
          label: "Platform fee",
          amountRub: 7_000,
          kind: "fee",
        },
      ],
      depositRub: 24_000,
      depositDueAt: isoDaysFromNow(3),
      payoutEstimateRub: 74_000,
    },
  },
  {
    id: "gb_seed_kazan_confirmed_1",
    status: "confirmed",
    createdAt: isoDaysAgo(10),
    updatedAt: isoDaysAgo(1),
    request: {
      id: "req_seed_kazan_city_2",
      destination: "Kazan",
      startDate: "2026-05-02",
      endDate: "2026-05-05",
      groupSize: 3,
    },
    travelerRoster: [
      {
        id: "trav_primary_danylo",
        displayName: "Danylo (primary)",
        isPrimaryContact: true,
        notes: "Vegetarian options needed for one person.",
      },
      { id: "trav_friend_1", displayName: "Sasha" },
      { id: "trav_friend_2", displayName: "Mira", notes: "Likes street food." },
    ],
    itinerary: {
      timezone: "Europe/Moscow",
      days: [
        {
          day: 1,
          title: "Old Quarter + warm start",
          beats: [
            "Neighborhood loop + tea tasting",
            "Short Kremlin highlights with photo pockets",
            "Dinner plan with dietary flexibility",
          ],
        },
        {
          day: 2,
          title: "Food route (6 stops) + markets",
          beats: [
            "Street food cadence with breaks",
            "Local market + craft stalls",
            "Golden hour riverfront plan",
          ],
        },
        {
          day: 3,
          title: "Weather-adaptive day + wrap-up",
          beats: [
            "Optional indoor museum / craft space",
            "Short viewpoints loop (low transfers)",
            "Recommendations handoff and safety notes",
          ],
        },
      ],
    },
    payment: {
      currency: "RUB",
      lineItems: [
        {
          id: "li_service",
          label: "Guide hosting + planning",
          amountRub: 96_000,
          kind: "service",
        },
        {
          id: "li_estimates",
          label: "Tickets & experiences (estimated)",
          amountRub: 18_000,
          kind: "service",
        },
        {
          id: "li_platform_fee",
          label: "Platform fee",
          amountRub: 8_000,
          kind: "fee",
        },
      ],
      depositRub: 31_000,
      depositDueAt: isoDaysAgo(8),
      payoutEstimateRub: 92_000,
    },
  },
  {
    id: "gb_seed_altai_in_progress_1",
    status: "in_progress",
    createdAt: isoDaysAgo(30),
    updatedAt: isoDaysAgo(0),
    request: {
      id: "req_seed_altai_nature_2",
      destination: "Altai",
      startDate: "2026-03-12",
      endDate: "2026-03-16",
      groupSize: 4,
    },
    travelerRoster: [
      {
        id: "trav_primary_mina",
        displayName: "Mina (primary)",
        isPrimaryContact: true,
        notes: "Moderate hikes ok. Prioritize safe logistics.",
      },
      { id: "trav_group_1", displayName: "Liam" },
      { id: "trav_group_2", displayName: "Eva" },
      { id: "trav_group_3", displayName: "Noah" },
    ],
    itinerary: {
      timezone: "Asia/Barnaul",
      days: [
        {
          day: 1,
          title: "Transfer day + viewpoint warm-up",
          beats: [
            "Meet + supplies check",
            "Scenic drive with 2-3 short stops",
            "Early night / rest plan",
          ],
        },
        {
          day: 2,
          title: "Lake loop (moderate)",
          beats: [
            "Trail briefing and pacing",
            "Lunch spot + weather contingency",
            "Return with buffer for safety",
          ],
        },
      ],
      notes: "Seeded ops state for MVP: shows in-progress booking surface.",
    },
    payment: {
      currency: "RUB",
      lineItems: [
        {
          id: "li_service",
          label: "Guide hosting + planning",
          amountRub: 132_000,
          kind: "service",
        },
        {
          id: "li_platform_fee",
          label: "Platform fee",
          amountRub: 10_000,
          kind: "fee",
        },
      ],
      depositRub: 42_000,
      depositDueAt: isoDaysAgo(25),
      payoutEstimateRub: 120_000,
    },
  },
];

