import { COMMISSION_PCT } from "@/config/commission";
import { cn } from "@/lib/utils";

/**
 * Pill badge showing the platform commission breakdown.
 *
 * Renders inline near pricing fields. Reads COMMISSION_PCT from product canon
 * (src/config/commission.ts). No 'use client' — pure server-renderable.
 */
export default function CommissionBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary",
        className,
      )}
    >
      {100 - COMMISSION_PCT}% идёт гиду · {COMMISSION_PCT}% наша комиссия
    </span>
  );
}
