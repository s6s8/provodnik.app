const navSlots = Array.from({ length: 5 });
const cardSlots = Array.from({ length: 4 });

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка панели путешественника</span>

      <div className="space-y-3">
        <div className="h-3 w-32 rounded-full bg-muted/70 animate-pulse" />
        <div className="h-9 w-full max-w-2xl rounded-2xl bg-muted/70 animate-pulse" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-muted/60 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 mt-8">
        <aside className="bg-surface-high rounded-card shadow-card p-5 lg:sticky lg:top-24 self-start max-lg:static space-y-4">
          <div className="h-4 w-24 rounded-full bg-muted/70 animate-pulse" />
          <div className="space-y-3">
            {navSlots.map((_, index) => (
              <div key={index} className="h-10 rounded-xl bg-muted/60 animate-pulse" />
            ))}
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-4">
            <div className="h-3 w-20 rounded-full bg-muted/70 animate-pulse" />
            <div className="mt-3 h-16 rounded-2xl bg-muted/60 animate-pulse" />
          </div>
        </aside>

        <section className="space-y-6">
          <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass space-y-4 p-6 md:p-8">
            <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
            <div className="h-8 w-full max-w-lg rounded-2xl bg-muted/70 animate-pulse" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-24 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-24 rounded-2xl bg-muted/60 animate-pulse" />
            </div>
          </div>

          <div className="dashboard-req-grid">
            {cardSlots.map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-soft"
              >
                <div className="h-3 w-20 rounded-full bg-muted/70 animate-pulse" />
                <div className="mt-3 h-5 w-3/4 rounded-full bg-muted/70 animate-pulse" />
                <div className="mt-2 h-4 w-1/2 rounded-full bg-muted/60 animate-pulse" />
                <div className="mt-4 h-20 rounded-2xl bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
