import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Grid of card skeletons for catalog/list loading. */
export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[16px] border border-border">
          <Skeleton className="h-44 w-full" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Detail-page skeleton (hero + body rows). */
export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <Skeleton className="h-64 w-full rounded-[16px]" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

/** Single list-row skeleton. */
export function ListRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-[12px] border border-border p-4", className)}>
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
