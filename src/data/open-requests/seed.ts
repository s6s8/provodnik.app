import type {
  OpenRequestGroupRosterMember,
  OpenRequestRecord,
} from "@/data/open-requests/types";

function isoDaysAgo(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

const seededOpenRequests: readonly OpenRequestRecord[] = [
  {
    id: "or_seed_altai_group_1",
    status: "forming_group",
    visibility: "public",
    createdAt: isoDaysAgo(5),
    updatedAt: isoDaysAgo(1),
    travelerRequestId: "req_seed_altai_nature_1",
    destinationSlug: "altai",
    group: {
      sizeTarget: 6,
      sizeCurrent: 4,
      openToMoreMembers: true,
    },
    destinationLabel: "Altai",
    regionLabel: "Горный Алтай",
    dateRangeLabel: "Jun 10–16, 2026",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=1200&q=80",
    budgetPerPersonRub: 110_000,
    transportLabel: "Джип + пешие выходы",
    highlights: [
      "Moderate hikes + scenic viewpoints",
      "Comfortable stays, not luxury",
      "Open to joining others (group)",
    ],
  },
  {
    id: "or_seed_spb_culture_1",
    status: "open",
    visibility: "invite_only",
    createdAt: isoDaysAgo(2),
    updatedAt: isoDaysAgo(0),
    travelerRequestId: "trq_20014",
    destinationSlug: "saint-petersburg",
    group: {
      sizeTarget: 4,
      sizeCurrent: 2,
      openToMoreMembers: true,
    },
    destinationLabel: "Saint Petersburg",
    regionLabel: "Северо-Запад России",
    dateRangeLabel: "Apr 10–13, 2026",
    coverImageUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&h=1200&q=80",
    budgetPerPersonRub: 120_000,
    transportLabel: "Пешком + такси между локациями",
    highlights: ["Museums", "Calm pace", "Morning starts preferred"],
  },
] as const;

const seededOpenRequestRoster: readonly OpenRequestGroupRosterMember[] = [
  {
    id: "orm_altai_organizer",
    requestId: "or_seed_altai_group_1",
    userId: "usr_traveler_you",
    displayName: "You",
    role: "organizer",
    joinedAt: isoDaysAgo(5),
    note: "Prefer lakes + viewpoints; moderate hikes ok.",
  },
  {
    id: "orm_altai_member_1",
    requestId: "or_seed_altai_group_1",
    userId: "usr_traveler_mina",
    displayName: "Mina",
    role: "member",
    joinedAt: isoDaysAgo(3),
    note: "Flexible on dates by ±1 day; prioritizing safe logistics.",
  },
  {
    id: "orm_altai_member_2",
    requestId: "or_seed_altai_group_1",
    userId: "usr_traveler_danylo",
    displayName: "Danylo",
    role: "member",
    joinedAt: isoDaysAgo(2),
    note: "Happy to share transfers if group matches pace.",
  },
  {
    id: "orm_altai_member_3",
    requestId: "or_seed_altai_group_1",
    userId: "usr_traveler_irina",
    displayName: "Irina",
    role: "member",
    joinedAt: isoDaysAgo(1),
    note: "Wants comfort-focused stays; ok with early photo stops.",
  },
  {
    id: "orm_spb_organizer",
    requestId: "or_seed_spb_culture_1",
    userId: "usr_traveler_irina",
    displayName: "Irina",
    role: "organizer",
    joinedAt: isoDaysAgo(2),
    note: "Museums + calmer pace, minimal long walks.",
  },
  {
    id: "orm_spb_member_1",
    requestId: "or_seed_spb_culture_1",
    userId: "usr_traveler_you",
    displayName: "You",
    role: "member",
    joinedAt: isoDaysAgo(1),
    note: "Can join, but needs breaks and lunch options.",
  },
] as const;

export function getSeededOpenRequests(): OpenRequestRecord[] {
  return seededOpenRequests
    .map((item) => ({
      ...item,
      group: { ...item.group },
      highlights: [...item.highlights],
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSeededOpenRequestById(requestId: string) {
  return getSeededOpenRequests().find((item) => item.id === requestId) ?? null;
}

export function listSeededRosterForOpenRequest(
  openRequestId: string,
): OpenRequestGroupRosterMember[] {
  return seededOpenRequestRoster
    .filter((member) => member.requestId === openRequestId)
    .map((member) => ({ ...member }))
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}
