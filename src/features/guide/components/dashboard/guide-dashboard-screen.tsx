import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  listingCount: number;
  requestCount: number;
  bookingCount: number;
  guideName: string;
  hasData: boolean;
  isVerified: boolean;
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

export function GuideDashboardScreen({
  listingCount,
  requestCount,
  bookingCount,
  guideName,
  hasData,
  isVerified,
}: Props) {
  if (!isVerified) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Badge variant="outline">Кабинет гида</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Аккаунт на проверке
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Ваша заявка принята. После проверки документов откроется полный
            кабинет гида.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href="/guide/verification">Статус заявки</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/guide/listings">Мои туры</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет гида</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Добро пожаловать, {guideName}
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Ваши туры, запросы и бронирования в одном месте.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        <StatCard
          count={hasData ? listingCount : "—"}
          label="Туров опубликовано"
        />
        <StatCard
          count={hasData ? requestCount : "—"}
          label="Новых запросов"
        />
        <StatCard
          count={hasData ? bookingCount : "—"}
          label="Бронирований"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/guide/listings">Мои туры</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/guide/requests">Запросы</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/guide/bookings">Бронирования</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/guide/listings/new">Новый тур</Link>
        </Button>
      </div>
    </div>
  );
}
