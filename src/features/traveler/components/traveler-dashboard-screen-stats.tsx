import Link from "next/link";
import { MapPin, CalendarCheck, Heart, ArrowRight } from "lucide-react";

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

const gettingStartedSteps = [
  {
    icon: MapPin,
    title: "Создайте запрос",
    desc: "Укажите направление и даты — гиды сами предложат маршруты.",
    href: "/traveler/requests/new",
    cta: "Создать запрос",
  },
  {
    icon: CalendarCheck,
    title: "Выберите тур",
    desc: "Просмотрите готовые маршруты с описанием и ценой.",
    href: "/listings",
    cta: "Смотреть туры",
  },
  {
    icon: Heart,
    title: "Сохраняйте в избранное",
    desc: "Добавляйте понравившиеся туры, чтобы не потерять.",
    href: "/listings",
    cta: "Найти туры",
  },
] as const;

export function TravelerDashboardScreenStats({
  requestCount,
  bookingCount,
  favoriteCount,
  userName,
  hasData,
}: Props) {
  const isEmpty =
    hasData &&
    requestCount === 0 &&
    bookingCount === 0 &&
    favoriteCount === 0;

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

      {isEmpty ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            С чего начать
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {gettingStartedSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex flex-col gap-3 rounded-[1.5rem] border border-border/70 bg-card/90 p-6"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                  <Link
                    href={step.href}
                    className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                  >
                    {step.cta}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
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
      )}

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
