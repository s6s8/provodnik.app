import Link from "next/link";
import { CheckCircle2, Circle, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type GuideVerificationStatus = "draft" | "submitted" | "approved" | "rejected";

interface Props {
  listingCount: number;
  requestCount: number;
  bookingCount: number;
  guideName: string;
  hasData: boolean;
  isVerified: boolean;
  verificationStatus: GuideVerificationStatus;
  verificationNotes?: string | null;
}

type VerificationStep = {
  label: string;
  done: boolean;
  active?: boolean;
};

function getVerificationSteps(status: GuideVerificationStatus): VerificationStep[] {
  switch (status) {
    case "approved":
      return [
        { label: "Заявка подана", done: true },
        { label: "На проверке", done: true },
        { label: "Одобрено", done: true },
      ];
    case "rejected":
      return [
        { label: "Заявка подана", done: true },
        { label: "Отклонено", done: true },
        { label: "Одобрено", done: false },
      ];
    case "submitted":
      return [
        { label: "Заявка подана", done: true },
        { label: "На проверке", done: true, active: true },
        { label: "Одобрено", done: false },
      ];
    case "draft":
    default:
      return [
        { label: "Заявка подана", done: false, active: true },
        { label: "На проверке", done: false },
        { label: "Одобрено", done: false },
      ];
  }
}

type StatCardProps = {
  count: number | string;
  label: string;
  hint?: string;
};

function StatCard({ count, label, hint }: StatCardProps) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardContent className="pt-6">
        <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
          {count}
        </strong>
        <span className="text-sm text-muted-foreground">{label}</span>
        {hint ? (
          <span className="mt-1 block text-xs text-muted-foreground/70">{hint}</span>
        ) : null}
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
  verificationStatus,
  verificationNotes,
}: Props) {
  if (!isVerified) {
    const verificationSteps = getVerificationSteps(verificationStatus);
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
                        step.active ? (
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
                      className={`h-0.5 flex-1 ${isLast ? "invisible" : step.done && !step.active ? "bg-brand" : "bg-border"}`}
                    />
                  </div>
                  <p
                    className={`mt-2 text-center text-xs font-medium leading-tight ${
                      step.active
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
          {verificationStatus === "rejected" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Заявка отклонена. Проверьте комментарий администратора{verificationNotes ? `: ${verificationNotes}` : "."}
            </p>
          ) : null}
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
          hint="Только активные публикации"
        />
        <StatCard
          count={hasData ? requestCount : "—"}
          label="Новых запросов"
          hint="Открытые запросы путешественников"
        />
        <StatCard
          count={hasData ? bookingCount : "—"}
          label="Бронирований"
          hint="Все статусы, без архивных"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/guide/listings/new">Новый тур</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/guide/listings">Мои туры</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/guide/bookings">Бронирования</Link>
        </Button>
      </div>
    </div>
  );
}
