import { Skeleton } from "@/components/ui/skeleton";

const lifecycleGroups = Array.from({ length: 3 });
const cardSlots = Array.from({ length: 2 });

export default function TravelerRequestsLoading() {
  return (
    <section className="space-y-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка запросов путешественника</span>

      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-10 w-full max-w-2xl rounded-2xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div className="grid gap-6">
        {lifecycleGroups.map((_, groupIndex) => (
          <div
            key={groupIndex}
            className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass space-y-4 p-5 md:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-6 w-48 rounded-full" />
              </div>
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {cardSlots.map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="rounded-2xl border border-border/70 bg-background/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20 rounded-full" />
                      <Skeleton className="h-5 w-44 rounded-full" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                  <Skeleton className="mt-4 h-4 w-full rounded-full" />
                  <Skeleton className="mt-2 h-4 w-3/4 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
