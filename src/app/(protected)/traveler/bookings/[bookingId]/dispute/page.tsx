import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getBooking } from "@/lib/supabase/bookings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { submitDispute } from "./actions";

function formatDateRange(startsOn: string | null, endsOn: string | null) {
  if (!startsOn) return "";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (!endsOn || endsOn === startsOn) return fmt(startsOn);
  return `${fmt(startsOn)} — ${fmt(endsOn)}`;
}

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TravelerBookingDisputePage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const { bookingId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolveSearchValue(resolvedSearchParams.error);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const booking = await getBooking(bookingId);
  if (!booking) notFound();
  if (booking.traveler_id !== user.id) {
    redirect("/traveler/bookings");
  }
  if (booking.status !== "confirmed") {
    redirect(`/traveler/bookings/${bookingId}`);
  }

  const guideName =
    booking.guide_profile?.profile?.full_name ??
    booking.guide_profile?.display_name ??
    "Гид";
  const dateLabel = formatDateRange(
    booking.traveler_request?.starts_on ?? booking.starts_at ?? null,
    booking.traveler_request?.ends_on ?? booking.ends_at ?? null,
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3 px-3">
        <Link href={`/traveler/bookings/${bookingId}`}>
          Вернуться к поездке
        </Link>
      </Button>

      <div className="space-y-2">
        <p className="editorial-kicker">Кабинет путешественника</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Открыть спор
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Опишите, что произошло, и какой исход вы считаете правильным. Это
          поможет быстрее передать спор на рассмотрение.
        </p>
      </div>

      {error === "invalid" ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Проверьте поля формы</CardTitle>
            <p className="text-sm text-muted-foreground">
              Причина спора обязательна, а желаемый исход можно оставить
              пустым.
            </p>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Детали поездки</CardTitle>
          <p className="text-sm text-muted-foreground">
            {booking.traveler_request?.destination ?? "Маршрут"} · {dateLabel}
          </p>
          <p className="text-sm text-muted-foreground">Гид: {guideName}</p>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Форма спора</CardTitle>
          <p className="text-sm text-muted-foreground">
            Опишите ситуацию без лишних деталей, но с понятным результатом,
            которого вы ожидаете.
          </p>
        </CardHeader>
        <CardContent>
          <form action={submitDispute.bind(null, bookingId)} className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium text-foreground">
                Причина спора
              </label>
              <Textarea
                id="reason"
                name="reason"
                required
                maxLength={2000}
                placeholder="Что пошло не так?"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="requestedOutcome"
                className="text-sm font-medium text-foreground"
              >
                Желаемый исход
              </label>
              <Textarea
                id="requestedOutcome"
                name="requestedOutcome"
                maxLength={2000}
                placeholder="Например: частичный возврат, перенос даты, дополнительная компенсация"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Спор будет отправлен на рассмотрение и привязан к этой поездке.
              </p>
              <Button type="submit">Отправить спор</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

