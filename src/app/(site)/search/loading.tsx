import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="pb-20 pt-10">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mb-8 space-y-4">
          <Skeleton className="h-10 w-3/4 max-w-[28rem]" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-glass border bg-card shadow-sm"
            >
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 px-4 pb-4 pt-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
