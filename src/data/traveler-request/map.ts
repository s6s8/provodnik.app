import { kopecksToRub } from "@/data/money";
import type { TravelerRequest } from "@/data/traveler-request/schema";
import type {
  TravelerRequestRecord,
  TravelerRequestStatus,
} from "@/data/traveler-request/types";
import type { RequestStatus, TravelerRequestRow } from "@/lib/supabase/types";

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

export function mapTravelerRequestRow(row: TravelerRequestRow): TravelerRequestRecord {
  const mode = row.format_preference === "group" ? "assembly" : "private";

  return {
    id: row.id,
    status: mapRequestStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dateLocked: row.date_locked,
    request: {
      mode,
      interests: (Array.isArray(row.interests) ? row.interests : []) as TravelerRequest["interests"],
      requestedLanguages: Array.isArray(row.requested_languages)
        ? row.requested_languages
        : [],
      destination: row.destination,
      startDate: row.starts_on,
      dateFlexibility: row.date_flexibility ?? "exact",
      startTime: row.start_time ? row.start_time.slice(0, 5) : undefined,
      endTime: row.end_time ? row.end_time.slice(0, 5) : undefined,
      ...(mode === "assembly"
        ? { groupSizeCurrent: row.participants_count, groupMax: row.group_capacity ?? undefined }
        : { groupSize: row.participants_count }),
      allowGuideSuggestionsOutsideConstraints: row.allow_guide_suggestions,
      openToJoin: row.open_to_join ?? false,
      budgetPerPersonRub:
        row.budget_minor == null
          ? (undefined as unknown as number)
          : kopecksToRub(row.budget_minor),
      notes: row.notes ?? undefined,
    },
  };
}
