import { Lock, LockOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  unlocked: boolean;
  averageRating?: number | null;
  responseRate?: number | null;
  className?: string;
}

export function ContactVisibilityChip({
  unlocked,
  averageRating,
  responseRate,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Badge
        variant={unlocked ? "outline" : "secondary"}
        className={cn(
          unlocked &&
            "border-success/30 bg-success/10 text-success hover:bg-success/15",
        )}
      >
        {unlocked ? (
          <LockOpen aria-hidden className="size-3.5 shrink-0" />
        ) : (
          <Lock aria-hidden className="size-3.5 shrink-0" />
        )}
        {unlocked
          ? "Контакты видны путешественникам"
          : "Контакты скрыты"}
      </Badge>
      {!unlocked ? (
        <p className="text-ink-3 text-xs font-normal normal-case tracking-normal">
          Рейтинг: {averageRating != null ? averageRating.toFixed(1) : "–"} / 4.0 ·
          Ответы: {Math.round((responseRate ?? 0) * 100)}% / 60%
        </p>
      ) : null}
    </div>
  );
}
