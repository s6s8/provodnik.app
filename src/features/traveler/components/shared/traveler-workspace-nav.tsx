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
    <div className="flex shrink-0 items-center gap-2">
      {includeListings ? (
        <Button asChild variant="outline">
          <Link href="/listings">
            Смотреть программы
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="secondary">
        <Link href="/traveler/bookings">Бронирования</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/traveler/favorites">Избранное</Link>
      </Button>
      <Button asChild variant="outline">
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
      <Button asChild>
        <Link href="/traveler/requests/new">
          Новый запрос
          <Plus className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

