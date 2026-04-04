import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <section className="chat-page-shell">
      <div className="chat-page-header">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-12 w-56 rounded-3xl" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>

      <div className="chat-page-frame glass-panel">
        <div className="chat-window-shell">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={
                index % 2 === 0 ? "message-bubble-row" : "message-bubble-row message-bubble-row-own"
              }
            >
              <div className="message-bubble-shell">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input-shell">
          <Skeleton className="h-28 w-full rounded-[1.5rem]" />
        </div>
      </div>
    </section>
  );
}
