const fieldSlots = Array.from({ length: 6 });

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка панели гида</span>

      <div className="space-y-3">
        <div className="h-3 w-28 rounded-full bg-muted/70 animate-pulse" />
        <div className="h-9 w-full max-w-xl rounded-2xl bg-muted/70 animate-pulse" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-muted/60 animate-pulse" />
      </div>

      <div className="glass-card space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-24 rounded-full bg-muted/70 animate-pulse" />
          <div className="h-8 w-32 rounded-full bg-muted/70 animate-pulse" />
          <div className="h-8 w-28 rounded-full bg-muted/70 animate-pulse" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {fieldSlots.map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-border/70 bg-background/60 p-4"
            >
              <div className="h-3 w-20 rounded-full bg-muted/70 animate-pulse" />
              <div className="mt-3 h-5 w-3/4 rounded-full bg-muted/70 animate-pulse" />
              <div className="mt-2 h-4 w-1/2 rounded-full bg-muted/60 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border/70 bg-background/60 p-4">
          <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
          <div className="mt-3 h-24 rounded-2xl bg-muted/60 animate-pulse" />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="h-10 w-full rounded-full bg-muted/70 animate-pulse sm:max-w-40" />
            <div className="h-10 w-full rounded-full bg-muted/60 animate-pulse sm:max-w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
