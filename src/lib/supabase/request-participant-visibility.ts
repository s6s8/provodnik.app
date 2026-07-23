import type { RequestRecord } from "@/lib/supabase/queries-core";

export type RequestParticipantViewer =
  | { kind: "owner" }
  | { kind: "admin" }
  | {
      kind: "guide";
      hasSubmittedOffer: boolean;
      isAddressedGuide: boolean;
    }
  | { kind: "public" };

/** Whether the viewer may see participants_count on a closed (Своя группа) request. */
export function canSeeRequestParticipantCount(
  request: Pick<RequestRecord, "mode">,
  viewer: RequestParticipantViewer,
): boolean {
  if (viewer.kind === "owner" || viewer.kind === "admin") return true;
  if (request.mode === "assembly") return true;
  if (viewer.kind !== "guide") return false;
  return viewer.hasSubmittedOffer || viewer.isAddressedGuide;
}

export function formatGuideInboxBudgetLine(
  item: Pick<RequestRecord, "budgetLabel" | "groupSize">,
  canSeeParticipants: boolean,
): string {
  if (!canSeeParticipants) return item.budgetLabel;
  return `${item.budgetLabel} · ${item.groupSize} чел.`;
}

export function formatGuideRequestGroupLabel(
  request: Pick<RequestRecord, "mode" | "groupSize">,
  canSeeParticipants: boolean,
): string {
  if (request.mode === "assembly") {
    return `Сборная группа · ${request.groupSize} чел.`;
  }
  if (canSeeParticipants) {
    return `Своя группа · ${request.groupSize} чел.`;
  }
  return "Своя группа";
}
