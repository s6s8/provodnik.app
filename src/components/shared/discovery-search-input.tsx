import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DiscoverySearchInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  /** Visually-hidden label text. Rendered as an `sr-only` <label> bound to `id`. */
  label?: string;
  /** Class applied to the positioning wrapper (width constraints, etc.). */
  wrapperClassName?: string;
};

/**
 * Shared discovery search field. One visual style for the hero search slot on
 * every discovery page (`/requests`, `/listings`, `/guides`, `/destinations`):
 * a 48px rounded shadcn Input with a fixed-size search icon. Works as a
 * controlled input or inside a `<form>`. Tailwind/shadcn tokens only.
 */
export function DiscoverySearchInput({
  id,
  label,
  className,
  wrapperClassName,
  ...props
}: DiscoverySearchInputProps) {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      {label ? (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      ) : null}
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-on-surface-muted"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        className={cn(
          "h-12 rounded-[12px] border-transparent bg-surface pl-11 text-on-surface shadow-lg",
          className,
        )}
        {...props}
      />
    </div>
  );
}
