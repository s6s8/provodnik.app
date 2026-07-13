import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const summarySlots = Array.from({ length: 3 });
const timelineSlots = Array.from({ length: 4 });

export default function Loading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка карточки спора</span>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-9 w-full max-w-2xl rounded-2xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="p-6 md:p-8">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid gap-3 md:grid-cols-3">
            {summarySlots.map((_, index) => (
              <div key={index} className="rounded-lg border border-border/70 bg-background/60 p-4">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="mt-3 h-5 w-3/4 rounded-full" />
                <Skeleton className="mt-2 h-4 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col gap-6">
            <Card className="p-6 md:p-8">
              <Skeleton className="h-3 w-28 rounded-full" />
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-5/6 rounded-full" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <Skeleton className="h-3 w-24 rounded-full" />
              <div className="flex flex-col gap-3">
                {timelineSlots.map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-3 w-20 rounded-full" />
                        <Skeleton className="h-5 w-56 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                    <Skeleton className="mt-4 h-4 w-full rounded-full" />
                    <Skeleton className="mt-2 h-4 w-3/4 rounded-full" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="p-6 md:p-8">
              <Skeleton className="h-3 w-24 rounded-full" />
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <Skeleton className="h-3 w-24 rounded-full" />
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
