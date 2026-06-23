"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SearchInputProps = {
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Куда вы хотите поехать?",
  debounceMs,
  className,
}: SearchInputProps) {
  const [internal, setInternal] = React.useState(value)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const delay = debounceMs ?? 300

  React.useEffect(() => {
    setInternal(value)
  }, [value])

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    setInternal(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(next), delay)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (timer.current) clearTimeout(timer.current)
    onChange(internal)
    onSubmit(internal)
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("relative w-full", className)}
    >
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 pl-12"
      />
      <button
        type="submit"
        aria-label="Искать"
        className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <Search className="size-5" aria-hidden="true" />
      </button>
    </form>
  )
}

export { SearchInput }
