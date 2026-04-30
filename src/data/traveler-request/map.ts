import { kopecksToRub } from "@/data/money";
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
    request: {
      mode,
      interests: Array.isArray(row.interests) ? row.interests : [],
      destination: row.destination,
      startDate: row.starts_on,
      startTime: row.start_time ? row.start_time.slice(0, 5) : undefined,
      endTime: row.end_time ? row.end_time.slice(0, 5) : undefined,
      ...(mode === "assembly"
        ? { groupSizeCurrent: row.participants_count, groupMax: row.group_capacity ?? undefined }
        : { groupSize: row.participants_count }),
      allowGuideSuggestionsOutsideConstraints: row.allow_guide_suggestions,
      budgetPerPersonRub: kopecksToRub(row.budget_minor ?? 0),
      notes: row.notes ?? undefined,
    },
  };
}
