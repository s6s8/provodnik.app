import { CalendarDays, Clock, Eye, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RequestFactsPanelProps = {
  dateLabel: string;
  flexible: boolean;
  timeLabel?: string;
  groupLabel: string;
  budgetLabel: string;
  formatLabel?: string;
  interests?: string[];
  viewsLabel: string;
  competingLabel: string;
  className?: string;
};

/**
 * Guide-side constraints panel: the request facts a guide weighs before bidding.
 * Mirrors the white-glass styling of the visitor-facing TripPanel.
 */
export function RequestFactsPanel({
  dateLabel,
  flexible,
  timeLabel,
  groupLabel,
  budgetLabel,
  formatLabel,
  interests,
  viewsLabel,
  competingLabel,
  className,
}: RequestFactsPanelProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[16px] border border-border bg-glass shadow-glass backdrop-blur-[12px] md:w-[334px]",
        className,
      )}
    >
      <div className="px-[22px] py-5">
        <div className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-on-surface-muted">
          Запрос
        </div>
        <div className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[11px]">
            <CalendarDays className="size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
            <span className="text-[14.5px] font-medium text-on-surface">{dateLabel}</span>
            <span className="text-[13px] text-on-surface-muted">
              {flexible ? "· гибкие даты" : "· точная дата"}
            </span>
          </div>
          {timeLabel ? (
            <div className="flex items-center gap-[11px]">
              <Clock className="size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
              <span className="text-[14.5px] font-medium text-on-surface">{timeLabel}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-[11px]">
            <Users className="size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
            <span className="text-[14.5px] font-medium text-on-surface">{groupLabel}</span>
          </div>
          <div className="flex items-center gap-[11px]">
            <Wallet className="size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
            <span className="text-[14.5px] font-medium text-on-surface">{budgetLabel}</span>
          </div>
        </div>
        {formatLabel ? (
          <div className="mt-3">
            <Badge variant="secondary">{formatLabel}</Badge>
          </div>
        ) : null}
        {interests?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-surface-low px-3 py-1 text-[12.5px] text-ink-2"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="h-px bg-border" />

      <div className="px-[22px] py-[18px]">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-[7px] text-[13px] text-on-surface-muted">
            <Eye className="size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
            {viewsLabel}
          </span>
          <span className="flex items-center gap-[7px] text-[13px] text-on-surface-muted">
            <Users className="size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
            {competingLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
