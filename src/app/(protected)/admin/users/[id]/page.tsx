import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { cn } from "@/lib/utils";
import { formatRussianDateTime } from "@/lib/dates";
import { getAdminUserDetail } from "@/lib/supabase/admin-users";
import {
  ACCOUNT_STATUS_LABELS,
  GUIDE_TYPE_LABELS,
  ROLE_LABELS,
} from "@/data/admin-users";

import { AccountStatusBadge, GuideStatusBadge, RoleBadge } from "../_components/user-badges";
import {
  GuideVerificationControls,
  HardDeleteControl,
  RoleControls,
  StatusControls,
} from "./_components/account-actions";

export const metadata: Metadata = {
  title: "Карточка пользователя",
};

const AUDIT_LABELS: Record<string, string> = {
  "account_status.active": "Аккаунт активирован",
  "account_status.suspended": "Аккаунт заблокирован",
  "account_status.archived": "Аккаунт перемещён в архив",
  "role.change": "Смена роли",
  "user.hard_delete": "Аккаунт удалён",
  "guide.approve": "Гид одобрен",
  "guide.reject": "Гид отклонён",
};

function auditLabel(action: string) {
  return AUDIT_LABELS[action] ?? action;
}

function Section({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-surface-high rounded-card shadow-card flex flex-col gap-4 p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, auth] = await Promise.all([
    getAdminUserDetail(id),
    readAuthContextFromServer(),
  ]);

  if (!detail) notFound();

  const isSelf = auth.userId === detail.id;
  const canDelete = detail.isDemo && detail.role !== "admin" && !isSelf;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> К списку пользователей
      </Link>

      <PageHeader
        eyebrow="Администрирование"
        title={detail.fullName?.trim() || "Без имени"}
        subtitle={detail.email ?? detail.maskedEmail}
        actions={
          <>
            <RoleBadge role={detail.role} />
            <AccountStatusBadge status={detail.accountStatus} />
            {detail.isDemo ? (
              <span className="text-xs text-muted-foreground">демо-аккаунт</span>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-6">
          <Section title="Аккаунт">
            <div className="divide-y divide-border/60">
              <InfoRow label="Роль" value={ROLE_LABELS[detail.role]} />
              <InfoRow
                label="Статус"
                value={ACCOUNT_STATUS_LABELS[detail.accountStatus]}
              />
              <InfoRow label="Email" value={detail.email ?? detail.maskedEmail} />
              <InfoRow label="Телефон" value={detail.phone ?? detail.maskedPhone} />
              <InfoRow label="Создан" value={formatRussianDateTime(detail.createdAt)} />
              {detail.statusReason ? (
                <InfoRow label="Причина статуса" value={detail.statusReason} />
              ) : null}
              {detail.statusChangedAt ? (
                <InfoRow
                  label="Статус изменён"
                  value={formatRussianDateTime(detail.statusChangedAt)}
                />
              ) : null}
            </div>
          </Section>

          {detail.guide ? (
            <Section title="Профиль гида">
              <div className="divide-y divide-border/60">
                <InfoRow
                  label="Проверка"
                  value={
                    <GuideStatusBadge
                      status={detail.guide.verificationStatus}
                      guideType={detail.guide.guideType}
                    />
                  }
                />
                {detail.guide.guideType ? (
                  <InfoRow
                    label="Тип гида"
                    value={GUIDE_TYPE_LABELS[detail.guide.guideType]}
                  />
                ) : null}
                <InfoRow
                  label="Регионы"
                  value={detail.guide.regions.length ? detail.guide.regions.join(", ") : "—"}
                />
                <InfoRow
                  label="Языки"
                  value={detail.guide.languages.length ? detail.guide.languages.join(", ") : "—"}
                />
                <InfoRow
                  label="Доступен"
                  value={detail.guide.isAvailable ? "Да" : "Нет"}
                />
              </div>
              <div className="pt-2">
                <Link
                  href={`/admin/guides/${detail.id}`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Открыть полную анкету для проверки →
                </Link>
              </div>
            </Section>
          ) : null}

          <Section title="Журнал аудита" description="Последние действия администраторов по этому аккаунту.">
            {detail.audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Действий пока нет.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {detail.audit.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {auditLabel(entry.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.actorName ? `${entry.actorName} · ` : ""}
                        {formatRussianDateTime(entry.createdAt)}
                      </p>
                      {typeof entry.metadata.reason === "string" && entry.metadata.reason ? (
                        <p className="text-xs text-muted-foreground">
                          Причина: {entry.metadata.reason}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section
            title="Статус аккаунта"
            description="Блокировка и архивация не удаляют данные — пользователь просто теряет доступ к действиям."
          >
            {isSelf ? (
              <p className="text-sm text-muted-foreground">
                Нельзя менять статус собственного аккаунта.
              </p>
            ) : (
              <StatusControls userId={detail.id} status={detail.accountStatus} />
            )}
          </Section>

          {detail.guide && detail.guide.verificationStatus !== "approved" ? (
            <Section
              title="Проверка гида"
              description="Одобрение или отклонение обновляет статус анкеты и уведомляет гида."
            >
              <GuideVerificationControls guideId={detail.id} />
            </Section>
          ) : null}

          <Section
            title="Роль"
            description="Смена роли синхронно обновляет права в системе авторизации и профиле."
          >
            {isSelf ? (
              <p className="text-sm text-muted-foreground">Нельзя менять собственную роль.</p>
            ) : (
              <RoleControls userId={detail.id} currentRole={detail.role} />
            )}
          </Section>

          {canDelete ? (
            <Section
              title="Опасная зона"
              description="Безвозвратное удаление доступно только для демо-аккаунтов."
              className="border border-destructive/30"
            >
              <HardDeleteControl userId={detail.id} />
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
