import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/bookings/state-machine";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждено",
  completed: "Завершено",
  cancelled: "Отменено",
  disputed: "Спор",
};

const STATUS_PROPS: Record<
  BookingStatus,
  {
    className?: string;
    variant?: "secondary";
  }
> = {
  pending: { variant: "secondary" },
  confirmed: { className: "border-primary/25 bg-primary/12 text-primary" },
  completed: { className: "border-success/25 bg-success/12 text-success" },
  cancelled: { variant: "secondary" },
  disputed: { className: "border-warning/25 bg-warning/14 text-warning" },
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const badgeProps = STATUS_PROPS[status];

  return (
    <Badge {...badgeProps}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
