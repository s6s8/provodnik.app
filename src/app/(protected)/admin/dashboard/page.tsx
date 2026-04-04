import Link from "next/link";

import { getAdminDashboardStats } from "@/lib/supabase/moderation";

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
    href: "/admin/disputes",
  },
] as const;

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Обзор модерации
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Следите за очередью проверки, открытыми спорами и общей нагрузкой на
          админ-панель.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <div className="text-sm text-muted-foreground">{card.label}</div>
            <div className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              {stats[card.key]}
            </div>
            <div className="mt-4 text-sm font-medium text-primary">
              Открыть раздел
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/admin/guides"
          className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-card"
        >
          <div className="text-sm font-medium text-foreground">
            Гиды ждут проверки
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Сейчас в очереди {stats.pendingGuideApplications} анкет. Проверьте
            документы и статус верификации.
          </p>
        </Link>

        <Link
          href="/admin/listings"
          className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-card"
        >
          <div className="text-sm font-medium text-foreground">
            Листинги на модерации
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            В проверке {stats.pendingListingReviews} предложений. Подтвердите
            публикацию или отклоните проблемные карточки.
          </p>
        </Link>

        <Link
          href="/admin/disputes"
          className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-card"
        >
          <div className="text-sm font-medium text-foreground">
            Очередь споров
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Открытых кейсов: {stats.openDisputes}. Раздел споров остается
            отдельным рабочим потоком.
          </p>
        </Link>
      </div>
    </div>
  );
}
