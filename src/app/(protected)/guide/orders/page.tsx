import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OrdersInbox } from "@/features/guide/components/orders/orders-inbox";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow, BookingWithListing, ListingSnippet } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Заказы",
};

export default async function GuideOrdersPage() {
  let bookings: BookingWithListing[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth?next=/guide/orders");
    }

    const { data: rawBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("guide_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const baseBookings = (rawBookings ?? []) as BookingRow[];

    // Sequential query for listing data on direct-booking rows (listing_id is set, request_id is null)
    const listingIds = [
      ...new Set(
        baseBookings
          .filter((b) => b.listing_id !== null && b.request_id === null)
          .map((b) => b.listing_id as string),
      ),
    ];

    const listingMap = new Map<string, ListingSnippet>();
    if (listingIds.length > 0) {
      const { data: listingsData } = await supabase
        .from("listings")
        .select("id, title, region, price_from_minor")
        .in("id", listingIds);

      if (listingsData) {
        for (const l of listingsData) {
          listingMap.set(l.id, {
            id: l.id,
            title: l.title,
            region: l.region,
            price_from_minor: l.price_from_minor,
          });
        }
      }
    }

    bookings = baseBookings.map((b) => ({
      ...b,
      listing: b.listing_id ? (listingMap.get(b.listing_id) ?? null) : null,
    }));
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
