import type { Metadata } from "next";
import Link from "next/link";

import { getAdminDashboardStats } from "@/lib/supabase/moderation";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Панель администратора",
};

const statCards = [
  {
    key: "pendingGuideApplications",
    label: "Заявки гидов",
    href: "/admin/guides",
  },
  {
    key: "pendingListingReviews",
    label: "Проверка листингов",
    href: "/admin/listings",
  },
  {
    key: "openDisputes",
    label: "Открытые споры",
    href: "/admin/disputes",
  },
  {
    key: "totalBookings",
    label: "Всего бронирований",
    href: "/admin/bookings",
  },
] as const;

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8 rounded-[28px] bg-[var(--surface)] p-4 text-[var(--on-surface)] sm:p-6 lg:p-8">
      <div className="space-y-4">
        <Badge
          variant="outline"
          className="w-fit rounded-[30px] border-[var(--outline)] bg-[var(--brand-50)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]"
        >
          Панель администратора
        </Badge>
        <div className="space-y-3">
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--on-surface)] md:text-5xl">
            Обзор модерации
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--on-surface-muted)]">
            Следите за очередью проверки, открытыми спорами и общей нагрузкой на
            админ-панель.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const delta = stats.weeklyDelta[card.key];
          return (
            <Link
              key={card.key}
              href={card.href}
              className="group rounded-[20px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-6 text-[var(--on-surface)] [box-shadow:var(--card-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
                {card.label}
              </div>
              <div className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--on-surface)]">
                {stats[card.key]}
              </div>
              <div className="mt-3 text-sm font-medium text-[var(--on-surface-muted)]">
                {delta > 0 ? `+${delta}` : delta} за неделю
              </div>
              <div className="mt-5 text-sm font-semibold text-[var(--primary)] transition-colors group-hover:text-[var(--primary-hover)]">
                Открыть раздел
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/admin/guides"
          className="group rounded-[24px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-6 [box-shadow:var(--card-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
              Гиды ждут проверки
            </div>
            <span className="rounded-[30px] bg-[var(--gold)]/15 px-3 py-1 text-sm font-semibold text-[var(--on-surface)]">
              {stats.pendingGuideApplications}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--on-surface-muted)]">
            Сейчас в очереди {stats.pendingGuideApplications} анкет. Проверьте
            документы и статус верификации.
          </p>
          <div className="mt-5 text-sm font-semibold text-[var(--primary)] transition-colors group-hover:text-[var(--primary-hover)]">
            Перейти к проверке
          </div>
        </Link>

        <Link
          href="/admin/listings"
          className="group rounded-[24px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-6 [box-shadow:var(--card-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
              Листинги на модерации
            </div>
            <span className="rounded-[30px] bg-[var(--gold)]/15 px-3 py-1 text-sm font-semibold text-[var(--on-surface)]">
              {stats.pendingListingReviews}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--on-surface-muted)]">
            В проверке {stats.pendingListingReviews} предложений. Подтвердите
            публикацию или отклоните проблемные карточки.
          </p>
          <div className="mt-5 text-sm font-semibold text-[var(--primary)] transition-colors group-hover:text-[var(--primary-hover)]">
            Открыть очередь
          </div>
        </Link>

        <Link
          href="/admin/disputes"
          className="group rounded-[24px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-6 [box-shadow:var(--card-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
              Очередь споров
            </div>
            <span className="rounded-[30px] bg-[var(--gold)]/15 px-3 py-1 text-sm font-semibold text-[var(--on-surface)]">
              {stats.openDisputes}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--on-surface-muted)]">
            Открытых кейсов: {stats.openDisputes}. Раздел споров остается
            отдельным рабочим потоком.
          </p>
          <div className="mt-5 text-sm font-semibold text-[var(--primary)] transition-colors group-hover:text-[var(--primary-hover)]">
            Разобрать споры
          </div>
        </Link>
      </div>
    </div>
  );
}
