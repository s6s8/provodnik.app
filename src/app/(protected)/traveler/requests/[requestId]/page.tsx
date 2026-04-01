import { notFound } from "next/navigation";

import type { TravelerRequest } from "@/data/traveler-request/schema";
import type {
  TravelerRequestRecord,
  TravelerRequestStatus,
} from "@/data/traveler-request/types";
import { TravelerRequestDetailScreen } from "@/features/traveler/components/requests/traveler-request-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  RequestStatus,
  TravelerRequestRow,
} from "@/lib/supabase/types";

const travelerRequestSelect =
  "id, traveler_id, destination, region, category, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at";

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

function mapTravelerRequestRow(row: TravelerRequestRow): TravelerRequestRecord {
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

export default async function TravelerRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) notFound();

    const { data, error } = await supabase
      .from("traveler_requests")
      .select(travelerRequestSelect)
      .eq("id", requestId)
      .eq("traveler_id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) notFound();

    return (
      <TravelerRequestDetailScreen
        record={mapTravelerRequestRow(data as TravelerRequestRow)}
      />
    );
  } catch {
    notFound();
  }
}
