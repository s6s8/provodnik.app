const summarySlots = Array.from({ length: 3 });
const timelineSlots = Array.from({ length: 4 });

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка карточки спора</span>

      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
        <div className="h-9 w-full max-w-2xl rounded-2xl bg-muted/70 animate-pulse" />
        <div className="flex flex-wrap gap-2">
          <div className="h-7 w-24 rounded-full bg-muted/60 animate-pulse" />
          <div className="h-7 w-28 rounded-full bg-muted/60 animate-pulse" />
          <div className="h-7 w-28 rounded-full bg-muted/60 animate-pulse" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass space-y-4 p-6 md:p-8">
          <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
          <div className="h-24 rounded-2xl bg-muted/60 animate-pulse" />
          <div className="grid gap-3 md:grid-cols-3">
            {summarySlots.map((_, index) => (
              <div key={index} className="rounded-lg border border-border/70 bg-background/60 p-4">
                <div className="h-3 w-20 rounded-full bg-muted/70 animate-pulse" />
                <div className="mt-3 h-5 w-3/4 rounded-full bg-muted/70 animate-pulse" />
                <div className="mt-2 h-4 w-1/2 rounded-full bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass space-y-4 p-6 md:p-8">
              <div className="h-3 w-28 rounded-full bg-muted/70 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded-full bg-muted/60 animate-pulse" />
                <div className="h-4 w-5/6 rounded-full bg-muted/60 animate-pulse" />
                <div className="h-4 w-2/3 rounded-full bg-muted/60 animate-pulse" />
              </div>
            </div>

            <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass space-y-4 p-6 md:p-8">
              <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
              <div className="space-y-3">
                {timelineSlots.map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-2">
                        <div className="h-3 w-20 rounded-full bg-muted/70 animate-pulse" />
                        <div className="h-5 w-56 rounded-full bg-muted/70 animate-pulse" />
                      </div>
                      <div className="h-4 w-24 rounded-full bg-muted/60 animate-pulse" />
                    </div>
                    <div className="mt-4 h-4 w-full rounded-full bg-muted/60 animate-pulse" />
                    <div className="mt-2 h-4 w-3/4 rounded-full bg-muted/60 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass space-y-4 p-6 md:p-8">
              <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
              <div className="space-y-3">
                <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
                <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
                <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
              </div>
            </div>

            <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass space-y-4 p-6 md:p-8">
              <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
              <div className="space-y-3">
                <div className="h-12 rounded-2xl bg-muted/60 animate-pulse" />
                <div className="h-12 rounded-2xl bg-muted/60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
