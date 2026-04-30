import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <section className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] py-8 lg:py-12">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Skeleton className="aspect-[16/9] w-full rounded-[2rem]" />

            <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-6 w-36" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-14 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>

          <aside className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-6 lg:sticky lg:top-24">
            <div className="space-y-4">
              <Skeleton className="h-12 w-44" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-11 w-full rounded-full" />
              <div className="h-px bg-outline-variant/40" />
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
