import { Bus, Car, Footprints, Sailboat, TrainFront } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PublicListingTransportOption } from "@/data/public-listings/types";

const iconByMode = {
  walking: Footprints,
  car: Car,
  train: TrainFront,
  bus: Bus,
  boat: Sailboat,
} as const;

export function TransportOptionPill({
  option,
}: {
  option: PublicListingTransportOption;
}) {
  const Icon = iconByMode[option.mode];

  return (
    <Badge variant="outline" className="rounded-full px-3">
      <span className="inline-flex items-center gap-1.5">
        <Icon className="size-3.5" />
        {option.label}
      </span>
    </Badge>
  );
}
