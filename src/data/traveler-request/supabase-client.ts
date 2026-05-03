"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  TravelerRequestRow,
  RequestStatus,
  Uuid,
} from "@/lib/supabase/types";
import type { TravelerRequest } from "@/data/traveler-request/schema";
import type {
  TravelerRequestRecord,
  TravelerRequestStatus,
} from "@/data/traveler-request/types";

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

function mapRowToRecord(row: TravelerRequestRow): TravelerRequestRecord {
  const mode = row.format_preference === "group" ? "assembly" : "private";

  return {
    id: row.id,
    status: mapRequestStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    request: {
      mode,
      interests: Array.isArray(row.interests) ? row.interests : [],
      destination: row.destination,
      startDate: row.starts_on,
      dateFlexibility: row.date_flexibility,
      ...(mode === "assembly"
        ? { groupSizeCurrent: row.participants_count, groupMax: row.group_capacity ?? undefined }
        : { groupSize: row.participants_count }),
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
      "id, traveler_id, destination, region, interests, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at, date_flexibility",
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
      "id, traveler_id, destination, region, interests, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at, date_flexibility",
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

  const isAssembly = input.mode === "assembly";
  const payload = {
    traveler_id: user.id,
    destination: input.destination.trim(),
    region: null as string | null,
    interests: input.interests,
    starts_on: input.startDate,
    ends_on: input.startDate,
    budget_minor: input.budgetPerPersonRub,
    currency: "RUB",
    participants_count: isAssembly ? (input.groupSizeCurrent ?? 1) : (input.groupSize ?? 1),
    format_preference: isAssembly ? "group" : "private",
    notes: input.notes?.trim() || null,
    open_to_join: isAssembly,
    allow_guide_suggestions: input.allowGuideSuggestionsOutsideConstraints,
    group_capacity: isAssembly ? (input.groupMax ?? null) : null,
    date_flexibility: input.dateFlexibility,
  };

  const { data, error } = await supabase
    .from("traveler_requests")
    .insert(payload)
    .select(
      "id, traveler_id, destination, region, interests, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at, date_flexibility",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapRowToRecord(data as TravelerRequestRow);
}

