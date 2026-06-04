import { cn } from "@/lib/utils";

const statusMap = {
  open: "bg-primary/10 text-primary",
  booked: "bg-primary/10 text-primary-hover",
  cancelled: "bg-destructive/10 text-destructive",
  expired: "bg-surface-low text-ink-3",
  pending: "bg-primary/10 text-primary-hover",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  awaiting_guide_confirmation: "bg-primary/10 text-primary-hover",
  deposit_ready: "bg-primary/10 text-primary-hover",
  awaiting_confirmation: "bg-primary/10 text-primary-hover",
  in_progress: "bg-primary/10 text-primary",
  accepted: "bg-primary/10 text-primary",
  declined: "bg-destructive/10 text-destructive",
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
