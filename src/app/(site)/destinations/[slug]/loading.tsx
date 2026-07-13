import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] flex flex-col gap-8 py-8 lg:py-12">
      <GlassCard asChild>
        <section className="overflow-hidden p-5 sm:p-7">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-3/4 max-w-[22rem]" />
            <Skeleton className="h-5 w-full max-w-[36rem]" />
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-9 w-40 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-36 rounded-full" />
            </div>
          </div>
        </section>
      </GlassCard>

      <section className="grid gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <GlassCard key={index} className="p-5">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="mt-3 h-4 w-24" />
          </GlassCard>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-56" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <GlassCard key={index} className="p-4">
              <Skeleton className="aspect-[16/10] w-full rounded-card" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
