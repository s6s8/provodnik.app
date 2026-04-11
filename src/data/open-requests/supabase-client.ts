"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  OpenRequestMemberRow,
  TravelerRequestRow,
  Uuid,
} from "@/lib/supabase/types";
import type {
  OpenRequestGroupRosterMember,
  OpenRequestRecord,
} from "@/data/open-requests/types";

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

function getSupabaseClient() {
  return createSupabaseBrowserClient();
}

function formatDateRange(startsOn: string, endsOn: string | null): string {
  const start = new Date(startsOn);
  const end = endsOn ? new Date(endsOn) : start;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startsOn}${endsOn ? ` to ${endsOn}` : ""}`;
  }

  const startLabel = start.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  const endLabel = end.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  if (startLabel === endLabel) return startLabel;
  return `${startLabel} to ${endLabel}`;
}

function mapTravelerRequestRowToOpenRequestRecord(
  row: TravelerRequestRow,
  currentSize: number,
): OpenRequestRecord {
  const sizeTarget = row.group_capacity ?? currentSize;

  return {
    id: row.id,
    status: row.status === "open" ? "open" : "closed",
    visibility: row.open_to_join ? "public" : "invite_only",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    travelerRequestId: row.id,
    group: {
      sizeTarget,
      sizeCurrent: currentSize,
      openToMoreMembers:
        row.open_to_join &&
        row.status === "open" &&
        currentSize < sizeTarget,
    },
    destinationLabel: row.destination,
    dateRangeLabel: formatDateRange(row.starts_on, row.ends_on),
    budgetPerPersonRub: row.budget_minor ?? undefined,
    highlights: [
      row.category,
      row.format_preference === "group" ? "Group" : "Private",
      row.open_to_join ? "Open to joining" : "Closed",
    ],
  };
}

function buildRosterEntries(
  request: TravelerRequestRow,
  members: OpenRequestMemberRow[],
  profileNames: Map<Uuid, string>,
): OpenRequestGroupRosterMember[] {
  const roster: OpenRequestGroupRosterMember[] = [];

  roster.push({
    id: `orm_owner_${request.id}`,
    requestId: request.id,
    userId: request.traveler_id,
    displayName: profileNames.get(request.traveler_id) ?? "Organizer",
    role: "organizer",
    joinedAt: request.created_at,
    note: undefined,
  });

  for (const member of members) {
    const isLeft = member.status === "left" || member.left_at !== null;
    if (isLeft) continue;

    roster.push({
      id: `orm_member_${member.request_id}_${member.traveler_id}`,
      requestId: member.request_id,
      userId: member.traveler_id,
      displayName: profileNames.get(member.traveler_id) ?? "Traveler",
      role: "member",
      joinedAt: member.joined_at,
      note: undefined,
    });
  }

  return roster.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

export async function listOpenRequestsFromSupabase(): Promise<
  OpenRequestDetail[]
> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: requests, error: requestsError } = await supabase
    .from("traveler_requests")
    .select(
      "id, traveler_id, destination, region, category, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at",
    )
    .eq("open_to_join", true)
    .eq("status", "open")
    .order("updated_at", { ascending: false });

  if (requestsError) {
    throw requestsError;
  }

  const requestRows = (requests ?? []) as TravelerRequestRow[];
  if (requestRows.length === 0) return [];

  const requestIds = requestRows.map((row) => row.id as Uuid);

  const { data: memberRows, error: membersError } = await supabase
    .from("open_request_members")
    .select("request_id, traveler_id, status, joined_at, left_at")
    .in("request_id", requestIds);

  if (membersError) {
    throw membersError;
  }

  const members = (memberRows ?? []) as OpenRequestMemberRow[];
  const travelerIds = Array.from(
    new Set([
      ...requestRows.map((row) => row.traveler_id as Uuid),
      ...members.map((row) => row.traveler_id as Uuid),
    ]),
  );

  const profileNames = new Map<Uuid, string>();

  if (travelerIds.length > 0) {
    const supabaseProfiles = getSupabaseClient();
    const { data: profiles, error: profilesError } = await supabaseProfiles
      .from("profiles")
      .select("id, full_name, email")
      .in("id", travelerIds);

    if (profilesError) {
      throw profilesError;
    }

    for (const profile of profiles ?? []) {
      const id = profile.id as Uuid;
      const fullName = (profile as { full_name?: string | null }).full_name;
      const email = (profile as { email?: string | null }).email;
      profileNames.set(id, fullName || email || "Traveler");
    }
  }

  const membersByRequest = new Map<Uuid, OpenRequestMemberRow[]>();
  for (const member of members) {
    const list = membersByRequest.get(member.request_id) ?? [];
    list.push(member);
    membersByRequest.set(member.request_id, list);
  }

  const details: OpenRequestDetail[] = [];

  for (const request of requestRows) {
    const rosterMembers = membersByRequest.get(request.id) ?? [];
    const activeMembers = rosterMembers.filter(
      (member) => member.status === "joined" && !member.left_at,
    );
    const currentSize =
      request.participants_count + (request.open_to_join ? activeMembers.length : 0);

    const record = mapTravelerRequestRowToOpenRequestRecord(
      request,
      currentSize,
    );
    const roster = buildRosterEntries(request, rosterMembers, profileNames);

    const sizeTarget = record.group.sizeTarget;
    const sizeCurrent = record.group.sizeCurrent;
    const remainingSpots = Math.max(0, sizeTarget - sizeCurrent);
    const budgetPerPersonRub = record.budgetPerPersonRub;

    const economics = {
      budgetPerPersonRub,
      estimatedTotalCurrentRub:
        typeof budgetPerPersonRub === "number"
          ? budgetPerPersonRub * sizeCurrent
          : undefined,
      estimatedTotalAtTargetRub:
        typeof budgetPerPersonRub === "number"
          ? budgetPerPersonRub * sizeTarget
          : undefined,
    };

    const { data: membershipRow } = user
      ? await supabase
          .from("open_request_members")
          .select("status, left_at")
          .eq("request_id", request.id)
          .eq("traveler_id", user.id)
          .maybeSingle()
      : { data: null };

    const isJoined =
      !!membershipRow &&
      (membershipRow as OpenRequestMemberRow).status === "joined" &&
      !(membershipRow as OpenRequestMemberRow).left_at;

    details.push({
      record,
      roster,
      isJoined,
      remainingSpots,
      economics,
    });
  }

  return details;
}

export async function getOpenRequestDetailFromSupabase(
  openRequestId: Uuid,
): Promise<OpenRequestDetail | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: request, error: requestError } = await supabase
    .from("traveler_requests")
    .select(
      "id, traveler_id, destination, region, category, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at",
    )
    .eq("id", openRequestId)
    .maybeSingle();

  if (requestError) {
    if (requestError.code === "PGRST116") return null;
    throw requestError;
  }

  if (!request) return null;

  const requestRow = request as TravelerRequestRow;

  const { data: members, error: membersError } = await supabase
    .from("open_request_members")
    .select("request_id, traveler_id, status, joined_at, left_at")
    .eq("request_id", openRequestId);

  if (membersError) {
    throw membersError;
  }

  const memberRows = (members ?? []) as OpenRequestMemberRow[];
  const travelerIds = Array.from(
    new Set([
      requestRow.traveler_id as Uuid,
      ...memberRows.map((row) => row.traveler_id as Uuid),
    ]),
  );

  const profileNames = new Map<Uuid, string>();

  if (travelerIds.length > 0) {
    const supabaseProfiles = getSupabaseClient();
    const { data: profiles, error: profilesError } = await supabaseProfiles
      .from("profiles")
      .select("id, full_name, email")
      .in("id", travelerIds);

    if (profilesError) {
      throw profilesError;
    }

    for (const profile of profiles ?? []) {
      const id = profile.id as Uuid;
      const fullName = (profile as { full_name?: string | null }).full_name;
      const email = (profile as { email?: string | null }).email;
      profileNames.set(id, fullName || email || "Traveler");
    }
  }

  const activeMembers = memberRows.filter(
    (member) => member.status === "joined" && !member.left_at,
  );
  const currentSize =
    requestRow.participants_count +
    (requestRow.open_to_join ? activeMembers.length : 0);

  const record = mapTravelerRequestRowToOpenRequestRecord(
    requestRow,
    currentSize,
  );
  const roster = buildRosterEntries(requestRow, memberRows, profileNames);

  const sizeTarget = record.group.sizeTarget;
  const sizeCurrent = record.group.sizeCurrent;
  const remainingSpots = Math.max(0, sizeTarget - sizeCurrent);
  const budgetPerPersonRub = record.budgetPerPersonRub;

  const economics = {
    budgetPerPersonRub,
    estimatedTotalCurrentRub:
      typeof budgetPerPersonRub === "number"
        ? budgetPerPersonRub * sizeCurrent
        : undefined,
    estimatedTotalAtTargetRub:
      typeof budgetPerPersonRub === "number"
        ? budgetPerPersonRub * sizeTarget
        : undefined,
  };

  const { data: membershipRow } = user
    ? await supabase
        .from("open_request_members")
        .select("status, left_at")
        .eq("request_id", openRequestId)
        .eq("traveler_id", user.id)
        .maybeSingle()
    : { data: null };

  const isJoined =
    !!membershipRow &&
    (membershipRow as OpenRequestMemberRow).status === "joined" &&
    !(membershipRow as OpenRequestMemberRow).left_at;

  return {
    record,
    roster,
    isJoined,
    remainingSpots,
    economics,
  };
}

export async function joinOpenRequestInSupabase(openRequestId: Uuid) {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User must be authenticated to join an open request.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profile?.role === "guide") {
    throw new Error("Гиды не могут присоединяться к группам");
  }

  const { error } = await supabase.from("open_request_members").upsert(
    {
      request_id: openRequestId,
      traveler_id: user.id as Uuid,
      status: "joined",
      left_at: null,
    },
    {
      onConflict: "request_id,traveler_id",
    },
  );

  if (error) {
    throw error;
  }
}

export async function leaveOpenRequestInSupabase(openRequestId: Uuid) {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User must be authenticated to leave an open request.");
  }

  const { error } = await supabase
    .from("open_request_members")
    .update({
      status: "left",
      left_at: new Date().toISOString(),
    })
    .eq("request_id", openRequestId)
    .eq("traveler_id", user.id as Uuid);

  if (error) {
    throw error;
  }
}

