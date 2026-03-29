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
    group: {
      sizeTarget: 6,
      sizeCurrent: 4,
      openToMoreMembers: true,
    },
    destinationLabel: "Горно-Алтайск, Республика Алтай",
    regionLabel: "Республика Алтай",
    imageUrl:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1600&h=1200&q=80",
    dateRangeLabel: "10–16 июня",
    budgetPerPersonRub: 110_000,
    priceScenarios: [
      { groupSize: 6, pricePerPersonRub: 96_000 },
      { groupSize: 5, pricePerPersonRub: 110_000 },
      { groupSize: 4, pricePerPersonRub: 132_000 },
      { groupSize: 3, pricePerPersonRub: 168_000 },
    ],
    highlights: [
      "Чуйский тракт, перевалы и Телецкое озеро",
      "Умеренные треки, комфортное жильё",
      "Открыты для присоединения к группе",
    ],
  },
  {
    id: "or_seed_spb_culture_1",
    status: "open",
    visibility: "invite_only",
    createdAt: isoDaysAgo(2),
    updatedAt: isoDaysAgo(0),
    travelerRequestId: "trq_20014",
    group: {
      sizeTarget: 4,
      sizeCurrent: 2,
      openToMoreMembers: true,
    },
    destinationLabel: "Санкт-Петербург, Ленинградская область",
    regionLabel: "Ленинградская область",
    imageUrl:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&h=1200&q=80",
    dateRangeLabel: "10–13 апреля",
    budgetPerPersonRub: 120_000,
    priceScenarios: [
      { groupSize: 5, pricePerPersonRub: 98_000 },
      { groupSize: 4, pricePerPersonRub: 120_000 },
      { groupSize: 3, pricePerPersonRub: 156_000 },
      { groupSize: 2, pricePerPersonRub: 228_000 },
    ],
    highlights: ["Эрмитаж, Русский музей, белые ночи", "Спокойный ритм, без спешки", "Предпочтение утренним визитам"],
  },
  {
    id: "karelia-ladoga",
    status: "forming_group",
    visibility: "public",
    createdAt: isoDaysAgo(3),
    updatedAt: isoDaysAgo(0),
    travelerRequestId: "req_seed_karelia_1",
    group: {
      sizeTarget: 5,
      sizeCurrent: 3,
      openToMoreMembers: true,
    },
    destinationLabel: "Ладожское озеро, Карелия",
    regionLabel: "Карелия",
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&h=1200&q=80",
    dateRangeLabel: "15–18 июля",
    budgetPerPersonRub: 82_000,
    priceScenarios: [
      { groupSize: 5, pricePerPersonRub: 72_000 },
      { groupSize: 4, pricePerPersonRub: 82_000 },
      { groupSize: 3, pricePerPersonRub: 102_000 },
    ],
    highlights: [
      "Ладога, скалы, баня",
      "Лодочный маршрут по шхерам, ночёвка на острове",
      "Неспешный темп, место для тишины и природы",
    ],
  },
  {
    id: "altai-chuysky",
    status: "forming_group",
    visibility: "public",
    createdAt: isoDaysAgo(6),
    updatedAt: isoDaysAgo(2),
    travelerRequestId: "req_seed_altai_chuysky_1",
    group: {
      sizeTarget: 6,
      sizeCurrent: 4,
      openToMoreMembers: true,
    },
    destinationLabel: "Чуйский тракт, Республика Алтай",
    regionLabel: "Республика Алтай",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&h=1200&q=80",
    dateRangeLabel: "2–5 августа",
    budgetPerPersonRub: 104_000,
    priceScenarios: [
      { groupSize: 6, pricePerPersonRub: 90_000 },
      { groupSize: 5, pricePerPersonRub: 104_000 },
      { groupSize: 4, pricePerPersonRub: 128_000 },
    ],
    highlights: [
      "Чуйский тракт и перевалы",
      "Длинные остановки, один резервный блок под погоду",
      "Панорамные точки, минимум суеты",
    ],
  },
  {
    id: "olkhon-ice",
    status: "open",
    visibility: "public",
    createdAt: isoDaysAgo(8),
    updatedAt: isoDaysAgo(1),
    travelerRequestId: "req_seed_baikal_olkhon_1",
    group: {
      sizeTarget: 4,
      sizeCurrent: 3,
      openToMoreMembers: true,
    },
    destinationLabel: "Ольхон, озеро Байкал",
    regionLabel: "Иркутская область",
    imageUrl:
      "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1600&h=1200&q=80",
    dateRangeLabel: "24–26 июля",
    budgetPerPersonRub: 96_000,
    priceScenarios: [
      { groupSize: 4, pricePerPersonRub: 84_000 },
      { groupSize: 3, pricePerPersonRub: 96_000 },
    ],
    highlights: [
      "Ольхон и лёд Малого Моря",
      "Камерный темп, городское завершение в Иркутске",
      "Скалы, закаты, байкальский воздух",
    ],
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

