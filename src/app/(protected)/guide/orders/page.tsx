import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OrdersInbox } from "@/features/guide/components/orders/orders-inbox";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Заказы",
};

export default async function GuideOrdersPage() {
  let bookings: BookingRow[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth?next=/guide/orders");
    }

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("guide_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    bookings = (data ?? []) as BookingRow[];
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Заказы
        </h1>
        <p className="text-sm text-muted-foreground">
          Данные недоступны. Проверьте переменные окружения.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Заказы
        </h1>
        <p className="text-sm text-muted-foreground">
          Управляйте бронированиями, подтверждайте встречи.
        </p>
      </div>
      <OrdersInbox initialBookings={bookings} />
    </div>
  );
}
