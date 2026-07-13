import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <section className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-8 lg:gap-14 items-start">
          <Skeleton className="aspect-[3/4] w-full rounded-card" />

          <div className="flex flex-col gap-6 pt-1">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-4/5 max-w-[28rem]" />
              <Skeleton className="h-5 w-full max-w-[38rem]" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <GlassCard key={index} className="p-4">
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="mt-3 h-4 w-20" />
                </GlassCard>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-low">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] flex flex-col gap-6 py-8 lg:py-12">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-56" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <GlassCard key={index} className="p-4">
                <Skeleton className="aspect-[4/3] w-full rounded-card" />
                <Skeleton className="mt-4 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
