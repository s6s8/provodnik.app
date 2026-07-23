import { Skeleton } from "@/components/ui/skeleton";

/** Lightweight hero-form placeholder while the interactive bundle loads. */
export function HomepageRequestFormClassicSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-busy="true"
      aria-label="Загрузка формы запроса"
    >
      <span className="sr-only">Загрузка формы запроса</span>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full rounded-card" />
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-full rounded-card" />
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-40 sm:shrink-0">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 w-full rounded-card" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-12 w-full rounded-card" />
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-40 sm:shrink-0">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-12 w-full rounded-card" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-12 w-full rounded-card" />
        <Skeleton className="h-12 w-full rounded-card" />
      </div>
      <Skeleton className="h-12 w-full rounded-[var(--radius-btn)]" />
    </div>
  );
}
