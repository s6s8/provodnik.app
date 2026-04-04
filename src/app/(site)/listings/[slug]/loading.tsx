import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main>
      <section className="container py-8 lg:py-12">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
          <div className="space-y-6">
            <Skeleton className="aspect-[16/9] w-full rounded-[2rem]" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-4/5 max-w-[32rem]" />
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-40 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass-card rounded-[1.75rem] p-5 space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="glass-card rounded-[1.75rem] p-5 space-y-3">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
          </div>

          <aside className="glass-card rounded-[1.75rem] p-6 lg:sticky lg:top-24">
            <div className="space-y-4">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-11 w-full rounded-full" />
              <Skeleton className="h-11 w-full rounded-full" />
              <div className="h-px bg-[color:var(--outline-variant)]/40" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
