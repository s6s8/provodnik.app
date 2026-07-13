import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-10"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Загрузка панели администратора</span>

      {/* Real heading mid-load: stable h1 + no layout shift vs. the loaded page. */}
      <PageHeader
        eyebrow="Администрирование"
        title="Обзор"
        subtitle="Следите за очередью проверки, открытыми спорами и общей нагрузкой на админ-панель."
      />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-36 rounded-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-28 rounded-lg sm:max-w-xs" />
      </div>
    </div>
  );
}
