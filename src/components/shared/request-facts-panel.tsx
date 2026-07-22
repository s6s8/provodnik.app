import { CalendarDays, Clock, Eye, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

type RequestFactsPanelProps = {
  dateLabel: string;
  flexible: boolean;
  timeLabel?: string;
  /** When true, show «Гибкое время» instead of a fixed clock range. */
  timeFlexible?: boolean;
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
  timeFlexible = false,
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
        "w-full overflow-hidden rounded-card border border-border bg-glass shadow-glass backdrop-blur-md md:w-84",
        className,
      )}
    >
      <div className="px-6 py-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-on-surface-muted">
          Запрос
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
            <span className="text-sm font-medium text-on-surface">{dateLabel}</span>
            <span className="text-sm text-on-surface-muted">
              {flexible ? "· гибкие даты" : "· точная дата"}
            </span>
          </div>
          {timeFlexible ? (
            <div className="flex items-center gap-3">
              <Clock className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
              <span className="text-sm font-medium text-on-surface">Гибкое время</span>
            </div>
          ) : timeLabel ? (
            <div className="flex items-center gap-3">
              <Clock className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
              <span className="text-sm font-medium text-on-surface">{timeLabel}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <Users className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
            <span className="text-sm font-medium text-on-surface">{groupLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <Wallet className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
            <span className="text-sm font-medium text-on-surface">{budgetLabel}</span>
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
              <Tag key={interest} color="primary">
                {interest}
              </Tag>
            ))}
          </div>
        ) : null}
      </div>

      <div className="h-px bg-border" />

      <div className="px-6 py-4">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2 text-sm text-on-surface-muted">
            <Eye className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
            {viewsLabel}
          </span>
          <span className="flex items-center gap-2 text-sm text-on-surface-muted">
            <Users className="size-4 shrink-0 text-primary" strokeWidth={1.7} />
            {competingLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
