import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="glass-card space-y-6 p-6 md:p-8">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="section-frame h-44 rounded-[24px]" />
          <Skeleton className="section-frame h-44 rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}
