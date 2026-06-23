import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type FormStepSectionProps = {
  step: number
  title: string
  children: ReactNode
  className?: string
}

function FormStepSection({
  step,
  title,
  children,
  className,
}: FormStepSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex min-h-[44px] items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {step}
        </span>
        <h3 className="text-base font-semibold text-on-surface">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  )
}

export { FormStepSection }
