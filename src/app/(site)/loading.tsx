import { CardGridSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-page space-y-8 px-[clamp(20px,4vw,48px)] py-16">
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );
}
