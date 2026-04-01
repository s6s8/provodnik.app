import type { BookingStatus } from "@/lib/bookings/state-machine";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждено",
  completed: "Завершено",
  cancelled: "Отменено",
  disputed: "Спор",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: "booking-badge booking-badge--pending",
  confirmed: "booking-badge booking-badge--confirmed",
  completed: "booking-badge booking-badge--completed",
  cancelled: "booking-badge booking-badge--cancelled",
  disputed: "booking-badge booking-badge--disputed",
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  return (
    <span className={STATUS_CLASS[status]}>
      {STATUS_LABELS[status]}
    </span>
  );
}
