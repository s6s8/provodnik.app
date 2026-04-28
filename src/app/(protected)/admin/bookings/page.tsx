import { kopecksToRub } from "@/data/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { confirmPaymentAction } from "./actions";

export const metadata = { title: "Бронирования" };

const STATUS_LABELS: Record<string, string> = {
  pending: "В ожидании",
  awaiting_guide_confirmation: "Ожидает подтверждения",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
  completed: "Завершено",
  disputed: "Спор",
  no_show: "Не явился",
};

export default async function BookingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, subtotal_minor, currency, starts_at, created_at, traveler_id, guide_id",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Бронирования</h1>

      {!bookings || bookings.length === 0 ? (
        <p className="text-sm text-ink-2">Бронирований пока нет.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => {
            const amount =
              booking.subtotal_minor
                ? `${kopecksToRub(booking.subtotal_minor).toLocaleString("ru-RU")} ₽`
                : "—";
            const date = new Date(booking.created_at).toLocaleDateString(
              "ru-RU",
            );
            const statusLabel =
              STATUS_LABELS[booking.status] ?? booking.status;
            const travelerId = booking.traveler_id?.slice(0, 8) ?? "—";
            const guideId = booking.guide_id?.slice(0, 8) ?? "—";

            return (
              <li
                key={booking.id}
                className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-surface-high p-4 shadow-glass sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand">
                    {statusLabel}
                  </span>
                  <span className="text-ink-2">
                    Турист:{" "}
                    <span className="font-mono text-ink">{travelerId}</span>
                  </span>
                  <span className="text-ink-2">
                    Гид:{" "}
                    <span className="font-mono text-ink">{guideId}</span>
                  </span>
                  <span className="font-medium text-ink">{amount}</span>
                  <span className="text-ink-2">{date}</span>
                </div>

                {booking.status === "awaiting_guide_confirmation" && (
                  <form
                    action={confirmPaymentAction.bind(null, booking.id)}
                  >
                    <button
                      type="submit"
                      className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
                    >
                      Подтвердить оплату
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
