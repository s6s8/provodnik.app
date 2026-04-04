"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  TravelerRequestRow,
  RequestStatus,
  Uuid,
} from "@/lib/supabase/types";
import type {
  TravelerRequestRecord,
  TravelerRequestStatus,
} from "@/data/traveler-request/types";
import type { TravelerRequest } from "@/data/traveler-request/schema";

function getSupabaseClient() {
  return createSupabaseBrowserClient();
}

function mapRequestStatus(status: RequestStatus): TravelerRequestStatus {
  switch (status) {
    case "open":
      return "submitted";
    case "booked":
      return "booked";
    case "cancelled":
    case "expired":
      return "closed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function mapCategoryToExperienceType(
  category: string,
): TravelerRequest["experienceType"] {
  if (
    category === "city" ||
    category === "nature" ||
    category === "culture" ||
    category === "food" ||
    category === "adventure" ||
    category === "relax"
  ) {
    return category;
  }

  return "city";
}

function mapRowToRecord(row: TravelerRequestRow): TravelerRequestRecord {
  const startsOn = row.starts_on;
  const endsOn = row.ends_on ?? row.starts_on;

  return {
    id: row.id,
    status: mapRequestStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    request: {
      experienceType: mapCategoryToExperienceType(row.category),
      destination: row.destination,
      startDate: startsOn,
      endDate: endsOn,
      groupSize: row.participants_count,
      groupPreference: row.format_preference === "group" ? "group" : "private",
      openToJoiningOthers: row.open_to_join,
      allowGuideSuggestionsOutsideConstraints: row.allow_guide_suggestions,
      budgetPerPersonRub: row.budget_minor ?? 0,
      notes: row.notes ?? undefined,
    },
  };
}

export async function listTravelerRequestsFromSupabase(): Promise<
  TravelerRequestRecord[]
> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("traveler_requests")
    .select(
      "id, traveler_id, destination, region, category, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as TravelerRequestRow[]).map(mapRowToRecord);
}

export async function getTravelerRequestByIdFromSupabase(
  id: Uuid,
): Promise<TravelerRequestRecord | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("traveler_requests")
    .select(
      "id, traveler_id, destination, region, category, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  if (!data) return null;
  return mapRowToRecord(data as TravelerRequestRow);
}

export async function createTravelerRequestInSupabase(
  input: TravelerRequest,
): Promise<TravelerRequestRecord> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User must be authenticated to create a traveler request.");
  }

  const payload = {
    traveler_id: user.id,
    destination: input.destination.trim(),
    region: null as string | null,
    category: input.experienceType,
    starts_on: input.startDate,
    ends_on: input.endDate,
    budget_minor: input.budgetPerPersonRub,
    currency: "RUB",
    participants_count: input.groupSize,
    format_preference: input.groupPreference,
    notes: input.notes?.trim() || null,
    open_to_join: input.openToJoiningOthers,
    allow_guide_suggestions: input.allowGuideSuggestionsOutsideConstraints,
    group_capacity: input.groupPreference === "group" ? input.groupSize : null,
  };

  const { data, error } = await supabase
    .from("traveler_requests")
    .insert(payload)
    .select(
      "id, traveler_id, destination, region, category, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapRowToRecord(data as TravelerRequestRow);
}

