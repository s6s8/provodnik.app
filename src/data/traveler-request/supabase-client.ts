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
      interests: (Array.isArray(row.interests) ? row.interests : []) as TravelerRequest["interests"],
      requestedLanguages: Array.isArray(row.requested_languages)
        ? row.requested_languages
        : [],
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
      "id, traveler_id, destination, region, interests, requested_languages, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at, date_flexibility",
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
      "id, traveler_id, destination, region, interests, requested_languages, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at, date_flexibility",
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

