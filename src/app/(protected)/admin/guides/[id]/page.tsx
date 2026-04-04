import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getGuideReviewDetail } from "@/lib/supabase/moderation";

import { approveGuide, rejectGuide, requestChanges } from "./actions";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function verificationBadgeClass(status: string) {
  switch (status) {
    case "approved":
      return "booking-badge booking-badge--completed";
    case "rejected":
      return "booking-badge booking-badge--cancelled";
    case "submitted":
      return "booking-badge booking-badge--pending";
    default:
      return "booking-badge booking-badge--pending";
  }
}

function verificationLabel(status: string) {
  switch (status) {
    case "approved":
      return "Одобрен";
    case "rejected":
      return "Отклонен";
    case "submitted":
      return "На проверке";
    default:
      return "Черновик";
  }
}

export default async function AdminGuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getGuideReviewDetail(id);

  if (!detail) {
    notFound();
  }

  const displayName =
    detail.profile.display_name ||
    detail.account?.full_name ||
    detail.account?.email ||
    "Без имени";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link href="/admin/guides" className="text-sm font-medium text-[var(--primary)]">
            Назад к очереди гидов
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {displayName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{detail.account?.email ?? "Email не указан"}</span>
            <span>{detail.profile.regions.join(", ") || "Регионы не указаны"}</span>
            <span>{detail.profile.languages.join(", ") || "Языки не указаны"}</span>
            <span className={verificationBadgeClass(detail.profile.verification_status)}>
              {verificationLabel(detail.profile.verification_status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <section className="space-y-6">
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-[var(--card-shadow)]">
            <h2 className="text-lg font-semibold text-foreground">Профиль</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Имя в профиле
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {detail.profile.display_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Стаж
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {detail.profile.years_experience ?? 0} лет
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Специализация
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {detail.profile.specialization ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Обновлено
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {formatDateTime(detail.profile.updated_at)}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Описание
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {detail.profile.bio ?? "Гид пока не добавил описание."}
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-[var(--card-shadow)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">Документы</h2>
              <span className="text-sm text-muted-foreground">
                {detail.documents.length} шт.
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {detail.documents.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Документы еще не загружены.
                </div>
              ) : null}

              {detail.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-[var(--surface-low)] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {document.document_type}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Статус: {verificationLabel(document.status)} · Загружен{" "}
                      {formatDateTime(document.created_at)}
                    </div>
                    {document.storage_asset ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {document.storage_asset.bucket_id}/{document.storage_asset.object_path}
                      </div>
                    ) : null}
                  </div>

                  {document.signed_url ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={document.signed_url} target="_blank" rel="noreferrer">
                        Скачать
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Ссылка недоступна
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-[var(--card-shadow)]">
            <h2 className="text-lg font-semibold text-foreground">Решение</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Зафиксируйте решение по анкете. Для отклонения и запроса
              документов можно добавить комментарий.
            </p>

            <form className="mt-4 space-y-4">
              <textarea
                name="note"
                rows={6}
                className="w-full rounded-[1.25rem] border border-input bg-[var(--surface-lowest)] px-4 py-3 text-sm text-foreground outline-none focus:border-[var(--primary)]"
                placeholder="Комментарий для гида или внутренней истории модерации"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  formAction={approveGuide.bind(null, id)}
                  type="submit"
                  variant="secondary"
                  className="border-[color-mix(in_srgb,var(--success)_35%,var(--border))] bg-[color-mix(in_srgb,var(--success)_14%,white_86%)] text-[var(--success)] hover:bg-[color-mix(in_srgb,var(--success)_20%,white_80%)]"
                >
                  Одобрить гида
                </Button>
                <Button
                  formAction={requestChanges.bind(null, id)}
                  type="submit"
                  variant="secondary"
                >
                  Запросить доп. документы
                </Button>
                <Button
                  formAction={rejectGuide.bind(null, id)}
                  type="submit"
                  variant="destructive"
                >
                  Отклонить
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-[var(--card-shadow)]">
            <h2 className="text-lg font-semibold text-foreground">
              История модерации
            </h2>

            {detail.moderation_case ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-[1.25rem] border border-border/70 bg-[var(--surface-low)] p-4">
                  <div className="text-sm font-medium text-foreground">
                    Причина очереди
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {detail.moderation_case.queue_reason}
                  </div>
                </div>

                {detail.moderation_case.actions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Действий по кейсу еще не было.
                  </div>
                ) : (
                  detail.moderation_case.actions.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-[1.25rem] border border-border/70 bg-[var(--surface-low)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium capitalize text-foreground">
                          {action.decision.replace("_", " ")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(action.created_at)}
                        </div>
                      </div>
                      {action.note ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {action.note}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">
                Кейс модерации еще не создан.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
