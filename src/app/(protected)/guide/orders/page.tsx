import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GuideOrdersBookingTabs } from "@/features/guide/components/orders/BookingCard";
import { RequestCard } from "@/features/guide/components/orders/RequestCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow, TravelerRequestRow } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Заказы",
};

export default async function GuideOrdersPage() {
  let openRequests: TravelerRequestRow[] = [];
  let bookings: BookingRow[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth?next=/guide/orders");
    }

    const userId = user.id;

    const { data: guidesOffers } = await supabase
      .from("guide_offers")
      .select("request_id, status, id")
      .eq("guide_id", userId);

    const offerRequestIds = [
      ...new Set(
        (guidesOffers ?? [])
          .map((o) => o.request_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (offerRequestIds.length > 0) {
      const { data: requests } = await supabase
        .from("traveler_requests")
        .select("*")
        .in("id", offerRequestIds)
        .eq("status", "open");

      openRequests = (requests ?? []) as TravelerRequestRow[];
      openRequests.sort((a, b) =>
        a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0,
      );
    }

    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .eq("guide_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    bookings = (bookingsData ?? []) as BookingRow[];
  } catch {
    return (
      <div className="space-y-4">
        <Badge variant="outline">Кабинет гида</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Заказы
        </h1>
        <p className="text-sm text-muted-foreground">
          Данные недоступны без настроенного Supabase. Проверьте переменные
          окружения.
        </p>
      </div>
    );
  }

  const novye = bookings.filter(
    (b) => b.status === "awaiting_guide_confirmation",
  );
  const aktivnye = bookings.filter((b) => b.status === "confirmed");
  const zavershennye = bookings.filter((b) => b.status === "completed");
  const arhiv = bookings.filter(
    (b) =>
      b.status === "cancelled" ||
      b.status === "no_show" ||
      b.status === "disputed",
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Badge variant="outline">Кабинет гида</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Заказы
        </h1>
      </div>

      <section className="space-y-3">
        {openRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Нет открытых запросов по вашим предложениям.
          </p>
        ) : (
          <div className="space-y-3">
            {openRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <GuideOrdersBookingTabs
          novye={novye}
          aktivnye={aktivnye}
          zavershennye={zavershennye}
          arhiv={arhiv}
        />
      </section>
    </div>
  );
}
