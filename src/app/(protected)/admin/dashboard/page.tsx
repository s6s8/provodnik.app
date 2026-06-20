import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ClipboardList, UserCheck } from "lucide-react";

import { getAdminDashboardStats } from "@/lib/supabase/moderation";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Панель администратора",
};

const actionableCards = [
  {
    key: "openDisputes",
    label: "Открытые споры",
    href: "/admin/disputes",
    Icon: AlertTriangle,
  },
  {
    key: "pendingGuideApplications",
    label: "Заявки гидов",
    href: "/admin/guides",
    Icon: UserCheck,
  },
  {
    key: "pendingListingReviews",
    label: "Проверка листингов",
    href: "/admin/listings",
    Icon: ClipboardList,
  },
] as const;

function formatDelta(delta: number) {
  return `${delta > 0 ? `+${delta}` : delta} за неделю`;
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Администрирование"
        title="Обзор"
        subtitle="Следите за очередью проверки, открытыми спорами и общей нагрузкой на админ-панель."
      />

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
          Требует действий
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {actionableCards.map((card) => {
            const count = stats[card.key];
            const delta = stats.weeklyDelta[card.key];
            const { Icon } = card;
            return (
              <Link key={card.key} href={card.href} className="group block">
                <Card className="h-full py-6 transition-all duration-150 hover:-translate-y-px hover:border-primary/40 hover:shadow-md">
                  <CardContent className="px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        {card.label}
                      </div>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                    </div>
                    <div className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
                      {count}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDelta(delta)}</span>
                      {count > 0 ? <Badge variant="destructive">Ждёт</Badge> : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
          Статистика
        </h2>
        <Link href="/admin/bookings" className="group block sm:max-w-xs">
          <Card
            size="sm"
            className="h-full transition-all duration-150 hover:-translate-y-px hover:border-primary/40 hover:shadow-md"
          >
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Всего бронирований
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {stats.totalBookings}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDelta(stats.weeklyDelta.totalBookings)}
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
