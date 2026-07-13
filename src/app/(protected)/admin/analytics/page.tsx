import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { formatRubFromMinor } from "@/data/money";
import {
  ANALYTICS_PERIODS,
  getAdminAnalytics,
  parseAnalyticsPeriod,
} from "@/lib/supabase/admin-analytics";

export const metadata: Metadata = {
  title: "Аналитика",
};

const MONTH_LABELS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

function Section({
  title,
  hint,
  isEmpty,
  children,
}: {
  title: string;
  hint: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {isEmpty ? (
        <EmptyState
          title="Нет данных"
          description="За выбранный период подходящих записей нет — цифры не выдумываем."
        />
      ) : (
        children
      )}
    </section>
  );
}

/** Horizontal magnitude bar. Inline width is the only way to express a data value. */
function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-2 rounded-full bg-primary"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const periodParam = Array.isArray(resolved.period)
    ? resolved.period[0]
    : resolved.period;
  const period = parseAnalyticsPeriod(periodParam);

  const analytics = await getAdminAnalytics(period);
  const { demand, conversion, supply, seasonality, gap, bookingTrend, totals } =
    analytics;

  const maxDemand = Math.max(1, ...demand.map((row) => row.requests));
  const maxSeason = Math.max(1, ...seasonality.map((row) => row.requests));
  const maxTrend = Math.max(1, ...bookingTrend.map((row) => row.bookings));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Администрирование"
        title="Аналитика"
        subtitle="Шесть вопросов о спросе и предложении. Считается по реальным записям в базе; демо-аккаунты исключены."
      />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1.5 sm:w-64">
          <Label htmlFor="analytics-period">Период</Label>
          <Select name="period" defaultValue={String(period)}>
            <SelectTrigger id="analytics-period" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ANALYTICS_PERIODS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="outline" size="default">
          Применить
        </Button>
      </form>

      <Section
        title="2. Воронка: запрос → предложение → бронирование"
        hint="Доля запросов периода, которые получили хотя бы одно предложение и дошли до брони. Брони напрямую из готовой экскурсии (без запроса) в воронку не входят."
        isEmpty={conversion.requests === 0}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Запросы" value={conversion.requests} />
          <StatTile
            label="Есть предложение"
            value={`${conversion.offerRate}%`}
            hint={`${conversion.withOffer} из ${conversion.requests}`}
          />
          <StatTile
            label="Дошли до брони"
            value={`${conversion.bookingRate}%`}
            hint={`${conversion.withBooking} из ${conversion.requests}`}
          />
          <StatTile
            label="Предложений всего"
            value={totals.offers}
            hint={`бронирований: ${totals.bookings}`}
          />
        </div>
      </Section>

      <Section
        title="1. Спрос по направлениям"
        hint="Запросы путешественников за выбранный период, топ-10."
        isEmpty={demand.length === 0}
      >
        <Card>
          <CardContent className="flex flex-col gap-3">
            {demand.map((row) => (
              <div key={row.destination} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium text-foreground">
                    {row.destination}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.requests}
                  </span>
                </div>
                <Bar value={row.requests} max={maxDemand} />
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>

      <Section
        title="4. Сезонность"
        hint="Запросы по месяцу начала поездки (не по дате создания запроса)."
        isEmpty={seasonality.length === 0}
      >
        <Card>
          <CardContent className="grid grid-cols-6 gap-3 sm:grid-cols-12">
            {seasonality.map((bucket) => (
              <div
                key={bucket.month}
                className="flex flex-col items-center justify-end gap-2"
              >
                <span className="text-xs tabular-nums text-muted-foreground">
                  {bucket.requests}
                </span>
                <div className="flex h-24 w-full items-end">
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{
                      height: `${Math.max((bucket.requests / maxSeason) * 100, bucket.requests > 0 ? 4 : 1)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {MONTH_LABELS[bucket.month - 1]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>

      <Section
        title="3. Предложение по регионам"
        hint="Одобренные гиды и опубликованные экскурсии. Регионы гидов — свободный текст, который гиды вводят сами: считаем по совпадению строк, канонического справочника регионов в базе нет."
        isEmpty={supply.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Регион</TableHead>
              <TableHead className="text-right">Гиды</TableHead>
              <TableHead className="text-right">Экскурсии</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supply.map((row) => (
              <TableRow key={row.region}>
                <TableCell className="font-medium">{row.region}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.guides}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.listings}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="5. Разрыв спроса и предложения"
        hint="Топ направлений по спросу и то, чем мы можем на него ответить. Совпадение направления с регионом/городом — по тексту, поэтому опечатки гидов занижают предложение."
        isEmpty={gap.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Направление</TableHead>
              <TableHead className="text-right">Запросы</TableHead>
              <TableHead className="text-right">Гиды</TableHead>
              <TableHead className="text-right">Экскурсии</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gap.map((row) => (
              <TableRow key={row.destination}>
                <TableCell className="font-medium">
                  {row.destination}
                  {row.listings === 0 && row.guides === 0 ? (
                    <span className="ml-2 text-xs text-destructive">
                      нет предложения
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.requests}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.guides}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.listings}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="6. Бронирования по месяцам"
        hint="Количество броней и их сумма (subtotal, ₽ — валюта бронирований по умолчанию)."
        isEmpty={bookingTrend.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Месяц</TableHead>
              <TableHead className="text-right">Брони</TableHead>
              <TableHead className="w-1/3">Динамика</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingTrend.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium tabular-nums">
                  {row.month}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.bookings}
                </TableCell>
                <TableCell>
                  <Bar value={row.bookings} max={maxTrend} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRubFromMinor(row.revenueMinor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}
