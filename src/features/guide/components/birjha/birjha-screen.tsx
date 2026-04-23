import Link from "next/link";

import { cn } from "@/lib/utils";
import { GuideBookingsScreen } from "@/features/guide/components/bookings/guide-bookings-screen";
import { GuideRequestsInboxScreen } from "@/features/guide/components/requests/guide-requests-inbox-screen";

type BirjhaTab = "inbox" | "bookings";

interface Props {
  initialTab: BirjhaTab;
}

export function BirjhaScreen({ initialTab }: Props) {
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Биржа" className="flex flex-wrap gap-2">
        <Link
          href="/guide"
          role="tab"
          aria-selected={initialTab === "inbox"}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            initialTab === "inbox"
              ? "border-transparent bg-foreground text-background"
              : "border-border bg-background/60 text-foreground hover:bg-background",
          )}
        >
          Входящие
        </Link>
        <Link
          href="/guide?tab=bookings"
          role="tab"
          aria-selected={initialTab === "bookings"}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            initialTab === "bookings"
              ? "border-transparent bg-foreground text-background"
              : "border-border bg-background/60 text-foreground hover:bg-background",
          )}
        >
          Бронирования
        </Link>
      </div>

      {initialTab === "inbox" ? <GuideRequestsInboxScreen /> : <GuideBookingsScreen />}
    </div>
  );
}
