import Link from "next/link";
import { CheckCircle2, Circle, Clock } from "lucide-react";

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

const verificationSteps = [
  { label: "Заявка подана", done: true },
  { label: "На проверке", done: true, active: true },
  { label: "Одобрено", done: false },
] as const;

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
          <p className="max-w-2xl text-base text-muted-foreground">
            Ваша заявка принята. После проверки документов откроется полный
            кабинет гида.
          </p>
        </div>

        {/* Step indicator */}
        <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 max-w-lg">
          <p className="text-sm font-medium text-muted-foreground mb-5">
            Статус верификации
          </p>
          <div className="flex items-start gap-0">
            {verificationSteps.map((step, i) => {
              const isLast = i === verificationSteps.length - 1;
              return (
                <div key={step.label} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {/* Left connector */}
                    <div
                      className={`h-0.5 flex-1 ${i === 0 ? "invisible" : step.done ? "bg-brand" : "bg-border"}`}
                    />
                    {/* Icon */}
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                        step.done
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {step.done ? (
                        "active" in step ? (
                          <Clock className="size-4" strokeWidth={2} />
                        ) : (
                          <CheckCircle2 className="size-4" strokeWidth={2} />
                        )
                      ) : (
                        <Circle className="size-4" strokeWidth={1.5} />
                      )}
                    </span>
                    {/* Right connector */}
                    <div
                      className={`h-0.5 flex-1 ${isLast ? "invisible" : step.done && !("active" in step) ? "bg-brand" : "bg-border"}`}
                    />
                  </div>
                  <p
                    className={`mt-2 text-center text-xs font-medium leading-tight ${
                      "active" in step
                        ? "text-brand"
                        : step.done
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Проверка обычно занимает 1–2 рабочих дня. Мы уведомим вас по email.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/guide/verification">Статус заявки</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/listings">Мои туры</Link>
          </Button>
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
