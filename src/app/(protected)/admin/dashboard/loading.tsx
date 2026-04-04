const queueSlots = Array.from({ length: 4 });

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка панели администратора</span>

      <div className="space-y-3">
        <div className="h-3 w-28 rounded-full bg-muted/70 animate-pulse" />
        <div className="h-9 w-full max-w-xl rounded-2xl bg-muted/70 animate-pulse" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-muted/60 animate-pulse" />
      </div>

      <div className="dashboard-grid">
        <aside className="dashboard-sidebar space-y-4">
          <div className="h-4 w-24 rounded-full bg-muted/70 animate-pulse" />
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-muted/60 animate-pulse" />
            <div className="h-10 rounded-xl bg-muted/60 animate-pulse" />
            <div className="h-10 rounded-xl bg-muted/60 animate-pulse" />
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-4">
            <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
            <div className="mt-3 h-14 rounded-2xl bg-muted/60 animate-pulse" />
          </div>
        </aside>

        <section className="space-y-6">
          <div className="glass-card space-y-4 p-6 md:p-8">
            <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
            <div className="h-8 w-full max-w-lg rounded-2xl bg-muted/70 animate-pulse" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            {queueSlots.map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-soft"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded-full bg-muted/70 animate-pulse" />
                    <div className="h-5 w-64 rounded-full bg-muted/70 animate-pulse" />
                  </div>
                  <div className="h-8 w-24 rounded-full bg-muted/60 animate-pulse" />
                </div>
                <div className="mt-4 h-4 w-full rounded-full bg-muted/60 animate-pulse" />
                <div className="mt-2 h-4 w-3/4 rounded-full bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
