import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2 overflow-x-auto pr-1">
        <Skeleton className="h-9 w-32 shrink-0" />
        <Skeleton className="h-9 w-28 shrink-0" />
        <Skeleton className="h-9 w-28 shrink-0" />
        <Skeleton className="h-9 w-36 shrink-0" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

