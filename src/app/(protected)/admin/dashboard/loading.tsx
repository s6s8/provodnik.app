import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-10" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка панели администратора</span>

      <div className="space-y-3">
        <Skeleton className="h-3 w-40 rounded-full" />
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-5 w-full max-w-md rounded-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-3 w-36 rounded-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-glass" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-28 rounded-glass sm:max-w-xs" />
      </div>
    </div>
  );
}
