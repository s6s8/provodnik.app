import type {
  TravelerOffer,
  TravelerRequestRecord,
  TravelerRequestTimelineEvent,
} from "@/data/traveler-request/types";

function isoDaysAgo(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

export const seededTravelerRequests: TravelerRequestRecord[] = [
  {
    id: "req_seed_kazan_city_1",
    status: "offers_received",
    createdAt: isoDaysAgo(7),
    updatedAt: isoDaysAgo(2),
    request: {
      experienceType: "city",
      destination: "Kazan",
      startDate: "2026-05-02",
      endDate: "2026-05-05",
      groupSize: 2,
      groupPreference: "private",
      openToJoiningOthers: false,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 75_000,
      notes:
        "Food-forward itinerary. Walkable days, no very early mornings. A bit of history is great if it's paced.",
    },
  },
  {
    id: "req_seed_altai_nature_1",
    status: "submitted",
    createdAt: isoDaysAgo(3),
    updatedAt: isoDaysAgo(3),
    request: {
      experienceType: "nature",
      destination: "Altai",
      startDate: "2026-06-10",
      endDate: "2026-06-16",
      groupSize: 4,
      groupPreference: "group",
      openToJoiningOthers: true,
      allowGuideSuggestionsOutsideConstraints: false,
      budgetPerPersonRub: 110_000,
      notes:
        "Moderate hikes ok. Prefer comfortable stays, but not luxury. We'd love lakes + viewpoints.",
    },
  },
  {
    id: "req_seed_baikal_relax_1",
    status: "shortlisted",
    createdAt: isoDaysAgo(15),
    updatedAt: isoDaysAgo(1),
    request: {
      experienceType: "relax",
      destination: "Lake Baikal",
      startDate: "2026-07-20",
      endDate: "2026-07-25",
      groupSize: 1,
      groupPreference: "private",
      openToJoiningOthers: false,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 160_000,
      notes:
        "Slow pace, photography spots, and a couple of curated local meals. Prefer minimal transfers.",
    },
  },
];

export const seededTravelerOffers: TravelerOffer[] = [
  {
    id: "offer_kazan_1",
    requestId: "req_seed_kazan_city_1",
    status: "new",
    createdAt: isoDaysAgo(2),
    guide: {
      name: "Amina K.",
      rating: 4.9,
      completedTrips: 64,
      homeBase: "Kazan",
      responseTimeHours: 3,
    },
    priceTotalRub: 138_000,
    durationDays: 4,
    groupSizeMin: 1,
    groupSizeMax: 3,
    highlights: [
      "Old Tatar Quarter + craft coffee loop",
      "Kremlin at golden hour with quiet viewpoints",
      "Private tasting: chak-chak and local tea ceremony",
    ],
    included: [
      "Local guide + planning",
      "Museum tickets (2)",
      "Restaurant reservations",
    ],
    message:
      "I’ll keep mornings relaxed and cluster sights by neighborhood. Day 2 is the main food day; I can adjust cuisine style based on your preferences.",
  },
  {
    id: "offer_kazan_2",
    requestId: "req_seed_kazan_city_1",
    status: "shortlisted",
    createdAt: isoDaysAgo(1),
    guide: {
      name: "Sergey I.",
      rating: 4.7,
      completedTrips: 31,
      homeBase: "Kazan",
      responseTimeHours: 6,
    },
    priceTotalRub: 112_000,
    durationDays: 3,
    groupSizeMin: 2,
    groupSizeMax: 6,
    highlights: [
      "Architectural contrasts + photo walk",
      "Street food route with 6 curated stops",
      "Evening riverfront plan with backup options",
    ],
    included: ["Local guide", "Tasting set", "Transit guidance"],
    message:
      "If you’re ok with a tighter schedule on Day 1, I can free up Day 3 for a slower day with optional add-ons (craft market or day-trip).",
  },
  {
    id: "offer_baikal_1",
    requestId: "req_seed_baikal_relax_1",
    status: "shortlisted",
    createdAt: isoDaysAgo(2),
    guide: {
      name: "Irina S.",
      rating: 4.8,
      completedTrips: 47,
      homeBase: "Irkutsk",
      responseTimeHours: 4,
    },
    priceTotalRub: 189_000,
    durationDays: 6,
    groupSizeMin: 1,
    groupSizeMax: 2,
    highlights: [
      "Two sunrise photo locations with easy access",
      "Slow day on Olkhon with a private driver",
      "Local meal plan: fish, berries, and tea rituals",
    ],
    included: ["Guide + driver coordination", "Transfers", "Photo spots map"],
    message:
      "I’ll minimize transfers by anchoring you in one base and planning short loops. We’ll keep flexible windows for lighting and weather.",
  },
];

export const seededTravelerTimeline: TravelerRequestTimelineEvent[] = [
  {
    id: "tl_kazan_1",
    requestId: "req_seed_kazan_city_1",
    at: isoDaysAgo(7),
    title: "Request created",
    description: "Your preferences were captured and shared with matching guides.",
  },
  {
    id: "tl_kazan_2",
    requestId: "req_seed_kazan_city_1",
    at: isoDaysAgo(2),
    title: "First offers arrived",
    description: "Two guides responded with comparable proposals.",
  },
  {
    id: "tl_kazan_3",
    requestId: "req_seed_kazan_city_1",
    at: isoDaysAgo(1),
    title: "Offer shortlisted",
    description: "You marked one offer to compare details more closely.",
  },
  {
    id: "tl_altai_1",
    requestId: "req_seed_altai_nature_1",
    at: isoDaysAgo(3),
    title: "Request submitted",
    description: "We’re matching you with guides who can cover this terrain.",
  },
  {
    id: "tl_baikal_1",
    requestId: "req_seed_baikal_relax_1",
    at: isoDaysAgo(15),
    title: "Request created",
  },
  {
    id: "tl_baikal_2",
    requestId: "req_seed_baikal_relax_1",
    at: isoDaysAgo(2),
    title: "Offers arrived",
    description: "A guide proposed a low-transfer itinerary and photo plan.",
  },
  {
    id: "tl_baikal_3",
    requestId: "req_seed_baikal_relax_1",
    at: isoDaysAgo(1),
    title: "Shortlist updated",
    description: "You’re narrowing down to the best fit before booking.",
  },
];

