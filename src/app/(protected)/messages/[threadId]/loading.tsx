import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <section className="grid gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-12 w-56 rounded-3xl" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>

      <div className="grid min-h-[min(72vh,48rem)] max-md:min-h-auto overflow-hidden bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
        <div className="grid gap-3.5 p-4 max-h-[min(60vh,42rem)] max-md:max-h-none max-md:min-h-[50vh] overflow-y-auto">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={
                index % 2 === 0 ? "flex justify-start" : "flex justify-end"
              }
            >
              <div className="grid gap-2.5 max-w-[min(100%,38rem)] max-md:max-w-full px-4 py-3.5 rounded-[1.5rem] bg-glass border border-glass-border shadow-glass">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 p-4 border-t border-glass-border">
          <Skeleton className="h-28 w-full rounded-[1.5rem]" />
        </div>
      </div>
    </section>
  );
}
