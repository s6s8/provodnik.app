import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SectionProps = {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

function Section({ title, subtitle, action, children, className }: SectionProps) {
  const hasHeader = Boolean(title || subtitle || action)

  return (
    <section className={cn("py-12 md:py-16", className)}>
      <div className="container mx-auto max-w-5xl px-5">
        {hasHeader ? (
          <header className="mb-6 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              {title ? (
                <h2 className="text-2xl font-bold text-on-surface">{title}</h2>
              ) : null}
              {subtitle ? (
                <p className="text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  )
}

export { Section }
