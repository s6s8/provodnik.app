"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TravelerWorkspaceNav({
  joinedOpenRequestsCount,
  includeListings,
}: {
  joinedOpenRequestsCount?: number;
  includeListings?: boolean;
}) {
  const showJoinedBadge =
    typeof joinedOpenRequestsCount === "number" && joinedOpenRequestsCount > 0;

  return (
    <div className="flex w-full shrink-0 items-center gap-2 overflow-x-auto whitespace-nowrap pr-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {includeListings ? (
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/listings">
            Смотреть программы
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="secondary" className="shrink-0">
        <Link href="/traveler/bookings">Бронирования</Link>
      </Button>
      <Button asChild variant="outline" className="shrink-0">
        <Link href="/traveler/favorites">Избранное</Link>
      </Button>
      <Button asChild variant="outline" className="shrink-0">
        <Link href="/traveler/open-requests">
          Открытые группы
          {showJoinedBadge ? (
            <Badge
              variant="secondary"
              className="ml-2 bg-background text-foreground"
            >
              {joinedOpenRequestsCount}
            </Badge>
          ) : null}
        </Link>
      </Button>
      <Button asChild className="shrink-0">
        <Link href="/traveler/requests/new">
          Новый запрос
          <Plus className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

