import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { listAllListings, type AdminCatalogueRow } from "@/lib/supabase/admin-listings";
import { requireAdminSession } from "@/lib/supabase/moderation";

export const metadata: Metadata = { title: "Каталог экскурсий" };

const STATUS_LABEL: Record<AdminCatalogueRow["status"], string> = {
  draft: "Черновик",
  pending_review: "На проверке",
  published: "Опубликовано",
  rejected: "Отклонено",
  paused: "На паузе",
  active: "Active (legacy)",
  archived: "В архиве",
  template_published: "Опубликовано гидом",
  template_draft: "Черновик гида",
};

const STATUS_VARIANT: Partial<
  Record<AdminCatalogueRow["status"], "default" | "secondary" | "destructive" | "outline">
> = {
  published: "default",
  template_published: "default",
  pending_review: "secondary",
  rejected: "destructive",
};

const FILTERS = [
  { value: "", label: "Все" },
  { value: "pending_review", label: "На проверке" },
  { value: "published", label: "Опубликованные" },
  { value: "template_published", label: "Опубликованные гидом" },
  { value: "draft", label: "Черновики" },
  { value: "rejected", label: "Отклонённые" },
] as const;

/**
 * The catalogue: every excursion, every status, both content shapes.
 *
 * This route used to redirect to /admin/moderation — but that queue answers a
 * different question («что ждёт проверки», not «где моя экскурсия»), so with no
 * catalogue an admin asked why an excursion was invisible had nothing to look at.
 * The #43/#47 redirect removed a duplicate QUEUE; this is not one. The queue stays
 * exactly where it is, and keeps its pending-only semantics.
 *
 * It is also the only surface where the split between the two content shapes is
 * visible instead of merely confusing: `listings` (moderated, no production writer)
 * and `guide_templates` (what guides actually publish, no review step).
 */
export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { adminClient } = await requireAdminSession();
  const { status } = await searchParams;
  const rows = await listAllListings(adminClient, { status: status || undefined });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Администрирование"
        title="Каталог экскурсий"
        subtitle="Все экскурсии во всех статусах. Очередь модерации живёт на отдельной странице."
        actions={
          <Link
            href="/admin/moderation"
            className="text-sm font-medium text-primary underline underline-offset-4"
          >
            Очередь модерации
          </Link>
        }
      />

      <nav aria-label="Фильтр по статусу" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = (status ?? "") === filter.value;
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/admin/listings?status=${filter.value}` : "/admin/listings"}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm transition-colors md:min-h-0 md:py-1 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title="Экскурсий нет"
          description="Под фильтр ничего не подходит. Пустой каталог — это факт, а не ошибка."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">Все экскурсии во всех статусах</caption>
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Название
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Статус
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Регион
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Гид
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.moderatable ? "l" : "t"}-${row.id}`} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium text-foreground">{row.title}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.region ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/guides/${row.guideId}`}
                      className="text-primary underline underline-offset-4"
                    >
                      {row.guideName}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
