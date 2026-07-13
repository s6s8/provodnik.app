import { ListRowSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-2">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      <div className="grid gap-3.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <ListRowSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
