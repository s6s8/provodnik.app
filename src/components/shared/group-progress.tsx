import { cn } from "@/lib/utils";

export function GroupProgress({
  current,
  target,
  className,
}: {
  current: number;
  target: number;
  className?: string;
}) {
  const safeTarget = Math.max(1, target);
  const safeCurrent = Math.max(0, Math.min(current, safeTarget));
  const progress = Math.round((safeCurrent / safeTarget) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">
          {safeCurrent}/{safeTarget} участников
        </span>
        <span className="text-muted-foreground">{progress}% собрано</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
