import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <section className="grid gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-12 w-48 rounded-3xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div className="grid gap-3.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-card bg-surface-high shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-[3px] hover:shadow-glass max-md:items-start"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="min-w-0 flex-1 grid gap-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}
