import { kopecksToRub } from "@/data/money";
import type { PublicGuideTemplateDetail } from "@/lib/supabase/guide-template-listings";

export type TemplateRequestPrefill = {
  destination?: string;
  notes?: string;
  budgetPerPersonRub?: number;
};

export function buildTemplateRequestPrefill(
  detail: PublicGuideTemplateDetail,
): TemplateRequestPrefill {
  const destination = detail.region?.trim() || detail.meetingPoint?.trim() || "";
  const notes = detail.description?.trim() || detail.title?.trim() || "";

  let budgetPerPersonRub: number | undefined;
  if (detail.priceFromKopecks != null) {
    const rub = kopecksToRub(detail.priceFromKopecks);
    if (detail.priceScope === "per_group" && detail.maxParticipants && detail.maxParticipants > 0) {
      budgetPerPersonRub = Math.max(1_000, Math.round(rub / detail.maxParticipants));
    } else {
      budgetPerPersonRub = Math.max(1_000, rub);
    }
  }

  return {
    destination: destination || undefined,
    notes: notes || undefined,
    budgetPerPersonRub,
  };
}
