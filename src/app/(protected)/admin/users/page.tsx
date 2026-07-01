import type { Metadata } from "next";

import { adminUsersFilterSchema } from "@/data/admin-users";
import { listAdminUsers } from "@/lib/supabase/admin-users";

import { UsersConsole } from "./_components/users-console";

export const metadata: Metadata = {
  title: "Пользователи",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) ?? {};
  const parsed = adminUsersFilterSchema.safeParse({
    q: first(resolved.q),
    role: first(resolved.role),
    status: first(resolved.status),
    guideStatus: first(resolved.guideStatus),
    guideType: first(resolved.guideType),
    demo: first(resolved.demo),
    page: first(resolved.page),
  });

  const filter = parsed.success
    ? parsed.data
    : adminUsersFilterSchema.parse({});

  let page = null as Awaited<ReturnType<typeof listAdminUsers>> | null;
  let loadFailed = false;
  try {
    page = await listAdminUsers(filter);
  } catch (error) {
    console.error("[AdminUsersPage] user list load failed:", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Пользователи</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Поиск, фильтрация и безопасное управление аккаунтами: статусы, роли, проверка
          гидов и массовые действия. Контактные данные скрыты — открывайте карточку для
          деталей.
        </p>
      </div>

      {loadFailed || !page ? (
        <div
          role="alert"
          className="rounded-card border border-destructive/30 bg-destructive/10 p-6 shadow-card"
        >
          <p className="text-sm font-semibold text-destructive">
            Список пользователей не загрузился
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Не удалось получить список аккаунтов. Обновите страницу; если проблема
            повторяется, проверьте доступ к базе данных.
          </p>
        </div>
      ) : (
        <UsersConsole
          items={page.items}
          total={page.total}
          page={page.page}
          pageCount={page.pageCount}
          filters={{
            q: filter.q,
            role: filter.role,
            status: filter.status,
            guideStatus: filter.guideStatus,
            guideType: filter.guideType,
            demo: filter.demo,
          }}
        />
      )}
    </div>
  );
}
