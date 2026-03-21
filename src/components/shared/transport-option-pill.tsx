import { Bus, Car, Footprints, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export type TransportOption =
  | "walking"
  | "city_bus"
  | "taxi"
  | "own_car"
  | "guide_transport";

const CONFIG: Record<
  TransportOption,
  { Icon: typeof Footprints; label: string }
> = {
  walking: { Icon: Footprints, label: "пешком" },
  city_bus: { Icon: Bus, label: "автобус" },
  taxi: { Icon: Car, label: "такси" },
  own_car: { Icon: Car, label: "свой транспорт" },
  guide_transport: { Icon: Users, label: "транспорт гида" },
};

export function TransportOptionPill({
  transport,
  className,
}: {
  transport: TransportOption;
  className?: string;
}) {
  const { Icon, label } = CONFIG[transport];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-white/70",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden />
      {label}
    </span>
  );
}
