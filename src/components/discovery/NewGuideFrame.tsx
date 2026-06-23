import { Sparkles } from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

type NewGuideFrameProps = {
  guideName: string
  className?: string
}

function NewGuideFrame({ guideName, className }: NewGuideFrameProps) {
  return (
    <div
      data-slot="new-guide-frame"
      className={cn(
        "flex flex-col gap-2 rounded-card border border-line bg-amber-tint/40 p-4",
        className
      )}
    >
      <Tag color="amber" className="gap-1.5">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Первые туры
      </Tag>
      <p className="text-sm text-on-surface">
        {guideName} — новый гид на платформе. Будьте одним из первых, кто откроет
        его маршруты.
      </p>
    </div>
  )
}

export { NewGuideFrame }
