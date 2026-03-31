import { Skeleton } from "@/components/ui/skeleton";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

const protectedLoadingNotes = [
  "Проверяем вход и роль кабинета.",
  "Подтягиваем навигацию для вашей рабочей области.",
  "Собираем последние карточки и состояние разделов.",
];

export default function Loading() {
  return (
    <RouteFeedbackShell
      eyebrow="Кабинет"
      title="Загружаем рабочую область"
      description="Подтягиваем защищённый маршрут, роль и контент кабинета. Это обычно занимает несколько секунд."
      asideTitle="Что происходит"
      asideItems={protectedLoadingNotes}
    >
      <div className="space-y-4">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-12 w-3/4 rounded-2xl" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />

        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-[1.5rem]" />
          <Skeleton className="h-24 rounded-[1.5rem]" />
          <Skeleton className="h-24 rounded-[1.5rem]" />
        </div>
      </div>
    </RouteFeedbackShell>
  );
}
