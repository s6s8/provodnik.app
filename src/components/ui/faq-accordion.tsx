"use client"

import { ChevronDown } from "lucide-react"
import { useId, useState } from "react"

import { cn } from "@/lib/utils"

type FaqItem = { question: string; answer: string }

type FaqAccordionProps = {
  items: FaqItem[]
  className?: string
}

function FaqAccordion({ items, className }: FaqAccordionProps) {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const triggerId = `${baseId}-trigger-${index}`
        const panelId = `${baseId}-panel-${index}`

        return (
          <div key={item.question}>
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex min-h-[44px] w-full items-center justify-between gap-4 py-3 text-left font-semibold text-on-surface"
            >
              {item.question}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="pb-4 text-muted-foreground"
              >
                {item.answer}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export { FaqAccordion }
