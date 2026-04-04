import { cn } from "@/lib/utils";

const statusMap = {
  open: "bg-[rgba(0,88,190,0.08)] text-brand",
  booked: "bg-[rgba(33,112,228,0.12)] text-primary-hover",
  cancelled: "bg-[rgba(185,28,28,0.1)] text-[#b91c1c]",
  expired: "bg-surface-low text-ink-3",
  pending: "bg-[rgba(33,112,228,0.12)] text-primary-hover",
  confirmed: "bg-[rgba(0,88,190,0.08)] text-brand",
  completed: "bg-[rgba(15,114,82,0.12)] text-[#0f7252]",
  awaiting_guide_confirmation: "bg-[rgba(33,112,228,0.12)] text-primary-hover",
  deposit_ready: "bg-[rgba(33,112,228,0.12)] text-primary-hover",
  awaiting_confirmation: "bg-[rgba(33,112,228,0.12)] text-primary-hover",
  in_progress: "bg-[rgba(0,88,190,0.08)] text-brand",
  accepted: "bg-[rgba(0,88,190,0.08)] text-brand",
  declined: "bg-[rgba(185,28,28,0.1)] text-[#b91c1c]",
  withdrawn: "bg-surface-low text-ink-3",
} as const;

type StatusBadgeProps = {
  status: keyof typeof statusMap | string;
  children?: string;
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const label = children ?? status.replaceAll("_", " ");

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
        statusMap[status as keyof typeof statusMap] ?? "bg-surface-low text-ink-3",
      )}
    >
      {label}
    </span>
  );
}
