"use client";

type Point = { date: string; value: number };

export function StatsChart({ data, label }: { data: Point[]; label: string }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex h-40 items-end gap-0.5">
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm bg-primary/70"
              style={{ height: `${(d.value / maxVal) * 100}%` }}
              title={`${d.date}: ${d.value}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
