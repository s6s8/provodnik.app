import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] space-y-8 py-8 lg:py-12">
      <section className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass overflow-hidden p-5 sm:p-7">
        <div className="space-y-4">
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

      <section className="grid gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-5">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="mt-3 h-4 w-24" />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-56" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-4">
              <Skeleton className="aspect-[16/10] w-full rounded-[1.25rem]" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
