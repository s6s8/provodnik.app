import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { adminUsersFilterSchema } from "@/data/admin-users";
import { listAdminUsers, listGuideRegionOptions } from "@/lib/supabase/admin-users";

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
    region: first(resolved.region),
    baseCity: first(resolved.baseCity),
    demo: first(resolved.demo),
    page: first(resolved.page),
  });

  const filter = parsed.success
    ? parsed.data
    : adminUsersFilterSchema.parse({});

  let page = null as Awaited<ReturnType<typeof listAdminUsers>> | null;
  let regionOptions: string[] = [];
  let loadFailed = false;
  try {
    [page, regionOptions] = await Promise.all([listAdminUsers(filter), listGuideRegionOptions()]);
  } catch (error) {
    console.error("[AdminUsersPage] user list load failed:", error);
    loadFailed = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Администрирование"
        title="Пользователи"
        subtitle="Поиск, фильтрация и безопасное управление аккаунтами: статусы, роли, проверка гидов и массовые действия. Контактные данные видны — открывайте карточку для полной информации."
      />

      {loadFailed || !page ? (
        <Alert
          role="alert"
          variant="destructive"
          className="border-destructive/30 p-6"
        >
          <AlertTitle className="text-sm font-semibold">
            Список пользователей не загрузился
          </AlertTitle>
          <AlertDescription className="mt-2 max-w-2xl text-sm leading-6">
            Не удалось получить список аккаунтов. Обновите страницу; если проблема
            повторяется, проверьте доступ к базе данных.
          </AlertDescription>
        </Alert>
      ) : (
        <UsersConsole
          items={page.items}
          total={page.total}
          page={page.page}
          pageCount={page.pageCount}
          regionOptions={regionOptions}
          filters={{
            q: filter.q,
            role: filter.role,
            status: filter.status,
            guideStatus: filter.guideStatus,
            guideType: filter.guideType,
            region: filter.region,
            baseCity: filter.baseCity,
            demo: filter.demo,
          }}
        />
      )}
    </div>
  );
}
