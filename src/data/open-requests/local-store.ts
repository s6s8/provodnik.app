import {
  getSeededOpenRequestById,
  getSeededOpenRequests,
  listSeededRosterForOpenRequest,
} from "@/data/open-requests/seed";
import type {
  OpenRequestGroupRosterMember,
  OpenRequestRecord,
} from "@/data/open-requests/types";
import {
  getOpenRequestDetailFromSupabase,
  joinOpenRequestInSupabase,
  leaveOpenRequestInSupabase,
  listOpenRequestsFromSupabase,
} from "@/data/open-requests/supabase-client";

const STORAGE_KEY = "provodnik.traveler.open-requests.membership.v1";
const CURRENT_USER_ID = "usr_traveler_you";
const CURRENT_USER_LABEL = "You";

type LocalMembershipStatus = "joined" | "left";
type LocalMembershipStore = Record<string, LocalMembershipStatus | undefined>;

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getUuid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function getLocalMembership(): LocalMembershipStore {
  if (typeof window === "undefined") return {};
  const parsed = safeParseJson<LocalMembershipStore>(
    window.localStorage.getItem(STORAGE_KEY),
  );
  if (!parsed || typeof parsed !== "object") return {};
  return parsed;
}

function saveLocalMembership(store: LocalMembershipStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function setLocalOpenRequestMembership(
  openRequestId: string,
  status: LocalMembershipStatus,
) {
  const current = getLocalMembership();
  saveLocalMembership({ ...current, [openRequestId]: status });
}

export function clearLocalOpenRequestMembershipOverride(openRequestId: string) {
  const current = getLocalMembership();
  if (!(openRequestId in current)) return;
  const next = { ...current };
  delete next[openRequestId];
  saveLocalMembership(next);
}

function hasCurrentUser(roster: OpenRequestGroupRosterMember[]) {
  return roster.some((member) => member.userId === CURRENT_USER_ID);
}

function buildCurrentUserMember(openRequestId: string): OpenRequestGroupRosterMember {
  return {
    id: getUuid("orm_local"),
    requestId: openRequestId,
    userId: CURRENT_USER_ID,
    displayName: CURRENT_USER_LABEL,
    role: "member",
    joinedAt: new Date().toISOString(),
    note: "Joined locally (MVP baseline).",
  };
}

export type OpenRequestDetail = {
  record: OpenRequestRecord;
  roster: OpenRequestGroupRosterMember[];
  isJoined: boolean;
  remainingSpots: number;
  economics: {
    budgetPerPersonRub?: number;
    estimatedTotalCurrentRub?: number;
    estimatedTotalAtTargetRub?: number;
  };
};

function withDerivedFields(
  seedRecord: OpenRequestRecord,
  seedRoster: OpenRequestGroupRosterMember[],
  override: LocalMembershipStatus | undefined,
): OpenRequestDetail {
  const seedJoined = hasCurrentUser(seedRoster);

  let roster = seedRoster;
  if (override === "left") {
    roster = roster.filter((member) => member.userId !== CURRENT_USER_ID);
  } else if (override === "joined") {
    if (!seedJoined) roster = [...roster, buildCurrentUserMember(seedRecord.id)];
  }

  const effectiveJoined = hasCurrentUser(roster);
  const delta = seedJoined === effectiveJoined ? 0 : effectiveJoined ? 1 : -1;

  const sizeTarget = Math.max(1, seedRecord.group.sizeTarget);
  const sizeCurrentSeeded = Math.max(0, seedRecord.group.sizeCurrent);
  const sizeCurrent = Math.min(sizeTarget, Math.max(0, sizeCurrentSeeded + delta));
  const remainingSpots = Math.max(0, sizeTarget - sizeCurrent);

  const budgetPerPersonRub = seedRecord.budgetPerPersonRub;
  const estimatedTotalCurrentRub =
    typeof budgetPerPersonRub === "number" ? budgetPerPersonRub * sizeCurrent : undefined;
  const estimatedTotalAtTargetRub =
    typeof budgetPerPersonRub === "number" ? budgetPerPersonRub * sizeTarget : undefined;

  return {
    record: {
      ...seedRecord,
      group: {
        ...seedRecord.group,
        sizeTarget,
        sizeCurrent,
        openToMoreMembers:
          seedRecord.group.openToMoreMembers && sizeCurrent < sizeTarget,
      },
    },
    roster: roster.slice().sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
    isJoined: effectiveJoined,
    remainingSpots,
    economics: {
      budgetPerPersonRub,
      estimatedTotalCurrentRub,
      estimatedTotalAtTargetRub,
    },
  };
}

export async function listOpenRequests(): Promise<OpenRequestDetail[]> {
  try {
    const fromSupabase = await listOpenRequestsFromSupabase();
    if (fromSupabase.length > 0) {
      return fromSupabase as OpenRequestDetail[];
    }
  } catch {
  }

  const membership = getLocalMembership();

  return getSeededOpenRequests().map((record) => {
    const roster = listSeededRosterForOpenRequest(record.id);
    return withDerivedFields(record, roster, membership[record.id]);
  });
}

export async function getOpenRequestDetailById(
  openRequestId: string,
): Promise<OpenRequestDetail | null> {
  try {
    const fromSupabase = await getOpenRequestDetailFromSupabase(openRequestId);
    if (fromSupabase) {
      return fromSupabase as OpenRequestDetail;
    }
  } catch {
  }

  const record = getSeededOpenRequestById(openRequestId);
  if (!record) return null;
  const membership = getLocalMembership();
  const roster = listSeededRosterForOpenRequest(openRequestId);
  return withDerivedFields(record, roster, membership[openRequestId]);
}

export async function listJoinedOpenRequests(): Promise<OpenRequestDetail[]> {
  const all = await listOpenRequests();
  return all
    .filter((item) => item.isJoined)
    .sort((a, b) => b.record.updatedAt.localeCompare(a.record.updatedAt));
}

export async function joinOpenRequest(openRequestId: string) {
  try {
    await joinOpenRequestInSupabase(openRequestId);
    return { ok: true as const };
  } catch {
    const detail = await getOpenRequestDetailById(openRequestId);
    if (!detail) return { ok: false as const, reason: "not_found" as const };
    if (detail.isJoined) return { ok: true as const };
    if (!detail.record.group.openToMoreMembers)
      return { ok: false as const, reason: "closed" as const };
    if (detail.remainingSpots <= 0)
      return { ok: false as const, reason: "full" as const };

    setLocalOpenRequestMembership(openRequestId, "joined");
    return { ok: true as const };
  }
}

export async function leaveOpenRequest(openRequestId: string) {
  try {
    await leaveOpenRequestInSupabase(openRequestId);
    return { ok: true as const };
  } catch {
    const detail = await getOpenRequestDetailById(openRequestId);
    if (!detail) return { ok: false as const, reason: "not_found" as const };
    if (!detail.isJoined) return { ok: true as const };

    const currentMember = detail.roster.find(
      (member) => member.userId === CURRENT_USER_ID,
    );
    if (currentMember?.role === "organizer") {
      return { ok: false as const, reason: "organizer" as const };
    }

    setLocalOpenRequestMembership(openRequestId, "left");
    return { ok: true as const };
  }
}

