import type { ReactNode } from "react";
import { CalendarDays, Clock } from "lucide-react";

import { AvatarStack, type AvatarStackMember } from "@/components/shared/avatar-stack";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

type TripPanelProps = {
  dateLabel: string;
  timeLabel?: string;
  /** e.g. "≈ 8 часов" — shown muted next to the time. */
  durationLabel?: string;
  /** Enrollment pill near the panel top, e.g. "Набор открыт". */
  enrollmentLabel?: string;
  /** Tints the enrollment pill green when open, navy otherwise. */
  enrollmentOpen?: boolean;
  /** Group availability. Omit `seatsTotal` to hide the availability section (private trips). */
  status?: { open: boolean; label: string };
  seatsTaken?: number;
  seatsTotal?: number | null;
  /** e.g. "Осталось 2 места". */
  remainingLabel?: string;
  /** Real joined members (open_request_members). No fabricated avatars. */
  members?: readonly AvatarStackMember[];
  joinedLabel?: string;
  /** Headline price (e.g. "~4 500 ₽ с человека"), rendered at 25px/800. */
  price?: ReactNode;
  /** Optional footer slot (e.g. price caption + Join CTA). */
  footer?: ReactNode;
  className?: string;
};

/**
 * Floating white-glass trip info panel: trip facts + (assembly) availability.
 * Information-only — booking is initiated elsewhere. Canonical detail-page primitive.
 */
export function TripPanel({
  dateLabel,
  timeLabel,
  durationLabel,
  enrollmentLabel,
  enrollmentOpen,
  status,
  seatsTaken,
  seatsTotal,
  remainingLabel,
  members = [],
  joinedLabel,
  price,
  footer,
  className,
}: TripPanelProps) {
  const showAvailability = seatsTotal != null;
  const pct =
    showAvailability && seatsTotal > 0
      ? Math.min(100, Math.round((100 * (seatsTaken ?? 0)) / seatsTotal))
      : 0;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[16px] border border-border bg-glass shadow-glass backdrop-blur-[12px] md:w-[334px]",
        className,
      )}
    >
      {/* Trip facts */}
      <div className="px-[22px] py-5">
        {enrollmentLabel ? (
          <div className="mb-3">
            <Tag color={enrollmentOpen ? "green" : "primary"}>{enrollmentLabel}</Tag>
          </div>
        ) : null}
        <div className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-primary">
          Детали поездки
        </div>
        <div className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[11px]">
            <CalendarDays className="size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
            <span className="text-[14.5px] font-medium text-on-surface">{dateLabel}</span>
          </div>
          {timeLabel ? (
            <div className="flex items-center gap-[11px]">
              <Clock className="size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
              <span className="text-[14.5px] font-medium text-on-surface">{timeLabel}</span>
              {durationLabel ? (
                <span className="text-[13px] text-on-surface-muted">· {durationLabel}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {showAvailability ? (
        <>
          <div className="h-px bg-border" />
          <div className="px-[22px] py-[18px]">
            <div className="mb-[9px] flex items-center justify-between">
              <span className="flex items-center gap-[7px] text-[13.5px] font-semibold text-on-surface">
                <span
                  className={cn(
                    "size-[7px] rounded-full",
                    status?.open ? "bg-success" : "bg-on-surface-muted",
                  )}
                  style={
                    status?.open
                      ? { boxShadow: "0 0 0 3px rgba(47,143,102,.16)" }
                      : undefined
                  }
                />
                {status?.label ?? (status?.open ? "Группа открыта" : "Группа закрыта")}
              </span>
              {remainingLabel ? (
                <span className="text-[12.5px] text-on-surface-muted">{remainingLabel}</span>
              ) : null}
            </div>
            <div className="mb-2 text-[13.5px] font-semibold text-ink-2">
              {seatsTaken ?? 0} / {seatsTotal} мест
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(20,28,40,.07)]">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            {members.length > 0 ? (
              <div className="mt-[13px] flex items-center gap-[10px]">
                <AvatarStack members={members} size={26} overlap={9} totalCount={seatsTaken} />
                {joinedLabel ? (
                  <p className="text-[12.5px] text-on-surface-muted">{joinedLabel}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {price || footer ? (
        <div className="border-t border-border px-[22px] py-[18px]">
          {price ? (
            <div className="mb-2 font-display font-extrabold leading-none tracking-[-0.02em] text-[25px] text-on-surface">
              {price}
            </div>
          ) : null}
          {footer}
        </div>
      ) : null}
    </div>
  );
}
