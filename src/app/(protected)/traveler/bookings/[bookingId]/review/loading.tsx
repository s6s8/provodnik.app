const ratingSlots = Array.from({ length: 5 });

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка формы отзыва о бронировании</span>

      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
        <div className="h-9 w-full max-w-2xl rounded-2xl bg-muted/70 animate-pulse" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-muted/60 animate-pulse" />
      </div>

      <div className="glass-card space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          <div className="h-7 w-28 rounded-full bg-muted/60 animate-pulse" />
          <div className="h-7 w-24 rounded-full bg-muted/60 animate-pulse" />
          <div className="h-7 w-24 rounded-full bg-muted/60 animate-pulse" />
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded-full bg-muted/70 animate-pulse" />
            <div className="flex flex-wrap gap-2">
              {ratingSlots.map((_, index) => (
                <div key={index} className="h-10 w-10 rounded-full bg-muted/60 animate-pulse" />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
            <div className="h-11 rounded-2xl bg-muted/60 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-muted/70 animate-pulse" />
            <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="h-5 w-56 rounded-full bg-muted/60 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-28 rounded-full bg-muted/70 animate-pulse" />
              <div className="h-10 w-28 rounded-full bg-muted/60 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
