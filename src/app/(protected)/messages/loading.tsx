import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <section className="messages-page-shell">
      <div className="messages-page-header">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-12 w-48 rounded-3xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div className="messages-list-shell">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="messages-thread-row">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="messages-thread-copy">
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
