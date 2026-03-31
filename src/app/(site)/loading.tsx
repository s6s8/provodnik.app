import { Skeleton } from "@/components/ui/skeleton";
import { RouteFeedbackShell } from "@/components/shared/route-feedback-shell";

const siteLoadingNotes = [
  "Собираем публичную страницу из общих токенов и блоков.",
  "Подтягиваем фотографии, карточки и медиа без рывков.",
  "Сохраняем ту же стеклянную подачу, что и на остальных экранах.",
];

export default function Loading() {
  return (
    <RouteFeedbackShell
      eyebrow="Публичная витрина"
      title="Загружаем страницу"
      description="Подтягиваем контент, навигацию и карточки витрины. Публичный экран уже собирается в привычной стеклянной подаче."
      asideTitle="Витрина готовится"
      asideItems={siteLoadingNotes}
    >
      <div className="space-y-4">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-12 w-4/5 rounded-2xl" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />

        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-[1.5rem]" />
          <Skeleton className="h-28 rounded-[1.5rem]" />
        </div>
      </div>
    </RouteFeedbackShell>
  );
}
