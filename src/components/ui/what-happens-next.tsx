import { CheckCircle, Eye, MessageCircle, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type WhatHappensNextProps = {
  variant?: "inline" | "confirmation"
  className?: string
}

const steps: { icon: LucideIcon; text: string }[] = [
  { icon: Eye, text: "Проверенные местные гиды видят ваш запрос" },
  { icon: MessageCircle, text: "Персональные предложения приходят вам" },
  { icon: CheckCircle, text: "Вы выбираете гида и детали поездки" },
]

function WhatHappensNext({
  variant = "inline",
  className,
}: WhatHappensNextProps) {
  const isConfirmation = variant === "confirmation"

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        isConfirmation && "rounded-card border border-success/30 bg-green-tint p-5",
        className
      )}
    >
      {isConfirmation ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="size-5 text-success" />
          <h3 className="text-lg font-semibold text-on-surface">
            Запрос отправлен
          </h3>
        </div>
      ) : null}
      <ul className="flex flex-col gap-3">
        {steps.map(({ icon: Icon, text }, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-tint text-primary">
              <Icon className="size-5" />
            </span>
            <p className="pt-1.5 text-sm text-on-surface">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { WhatHappensNext }
