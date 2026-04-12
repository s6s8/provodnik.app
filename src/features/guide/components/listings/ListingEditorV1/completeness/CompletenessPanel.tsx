import type { ListingRow } from "@/lib/supabase/types";

import {
  ALL_SECTIONS,
  SECTIONS_BY_TYPE,
  type ListingExpType,
  type SectionKey,
} from "../types";

interface Props {
  listing: ListingRow;
  draft: Partial<ListingRow>;
}

function isSectionComplete(key: SectionKey, merged: ListingRow): boolean {
  switch (key) {
    case "basics":
      return Boolean(
        merged.title &&
          merged.title.length >= 3 &&
          merged.region &&
          merged.price_from_minor > 0,
      );
    case "photos":
      return Boolean((merged as ListingRow & { image_url?: string | null }).image_url?.trim());
    case "schedule":
      return true;
    case "tariffs":
      return merged.price_from_minor > 0;
    case "idea_route_theme":
      return Boolean(merged.idea || merged.route || merged.theme);
    case "audience_facts":
    case "org_details":
    case "included_excluded":
    case "accommodation":
    case "itinerary":
    case "meals_grid":
    case "departures":
      return true;
    case "meeting_point":
      return Boolean(merged.pickup_point_text);
    case "difficulty":
      return Boolean(merged.difficulty_level);
    case "pickup_dropoff":
      return Boolean(merged.pickup_point_text && merged.dropoff_point_text);
    case "vehicle_baggage":
      return Boolean(merged.vehicle_type);
    default:
      return true;
  }
}

function isRequiredForPublish(
  key: SectionKey,
  expType: ListingExpType | null,
): boolean {
  if (
    key === "basics" ||
    key === "photos" ||
    key === "meeting_point" ||
    key === "tariffs"
  ) {
    return true;
  }
  if (
    key === "idea_route_theme" &&
    (expType === "excursion" || expType === "waterwalk")
  ) {
    return true;
  }
  return false;
}

export function CompletenessPanel({ listing, draft }: Props) {
  const merged: ListingRow = { ...listing, ...draft };
  const expType = listing.exp_type;
  const sectionKeys =
    SECTIONS_BY_TYPE[expType ?? "excursion"] ?? SECTIONS_BY_TYPE.excursion;

  const incompleteRequiredLabels: string[] = [];
  for (const key of sectionKeys) {
    if (isRequiredForPublish(key, expType) && !isSectionComplete(key, merged)) {
      incompleteRequiredLabels.push(ALL_SECTIONS[key].label);
    }
  }

  const ready = incompleteRequiredLabels.length === 0;

  return (
    <div className="px-4 pb-4 pt-2">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Готовность
      </p>
      <ul className="mb-3 flex flex-col gap-1.5">
        {sectionKeys.map((key) => {
          const complete = isSectionComplete(key, merged);
          const meta = ALL_SECTIONS[key];
          return (
            <li
              key={key}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <span
                className={complete ? "text-green-600" : "text-muted-foreground"}
                aria-hidden
              >
                {complete ? "✓" : "✗"}
              </span>
              <span className="min-w-0 flex-1 leading-tight">{meta.label}</span>
            </li>
          );
        })}
      </ul>
      {ready ? (
        <div
          className="rounded-lg border border-green-600/40 bg-green-600/10 px-2.5 py-2 text-sm text-green-800 dark:text-green-200"
          role="status"
        >
          Готово к отправке
        </div>
      ) : (
        <div
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-2 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          Нужно заполнить: {incompleteRequiredLabels.join(", ")}
        </div>
      )}
    </div>
  );
}
