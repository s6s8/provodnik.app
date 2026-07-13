import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pb-28 pt-6 md:pb-12">
      <Skeleton className="aspect-[16/9] w-full rounded-card" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-4/5 max-w-[36rem]" />
            <Skeleton className="h-5 w-40" />
          </header>

          <section className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </section>
        </div>

        <GlassCard asChild>
          <aside className="p-5">
            <div className="space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="mt-5 space-y-3">
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </aside>
        </GlassCard>
      </div>
    </div>
  );
}
