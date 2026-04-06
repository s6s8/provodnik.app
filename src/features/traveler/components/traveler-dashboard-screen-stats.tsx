import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  requestCount: number;
  bookingCount: number;
  favoriteCount: number;
  userName: string;
  hasData: boolean;
}

type StatCardProps = {
  count: number | string;
  label: string;
};

function StatCard({ count, label }: StatCardProps) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardContent className="pt-6">
        <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
          {count}
        </strong>
        <span className="text-sm text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

export function TravelerDashboardScreenStats({
  requestCount,
  bookingCount,
  favoriteCount,
  userName,
  hasData,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Добро пожаловать, {userName}
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Ваши запросы, бронирования и избранное в одном месте.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        <StatCard
          count={hasData ? requestCount : "—"}
          label="Активных запросов"
        />
        <StatCard
          count={hasData ? bookingCount : "—"}
          label="Бронирований"
        />
        <StatCard
          count={hasData ? favoriteCount : "—"}
          label="В избранном"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/traveler/requests">Мои запросы</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/traveler/requests/new">Новый запрос</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/traveler/bookings">Бронирования</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/traveler/favorites">Избранное</Link>
        </Button>
      </div>
    </div>
  );
}
