"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type ListRowProps = {
  href?: string;
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

const baseClasses =
  "flex min-h-[44px] flex-wrap items-center gap-3 rounded-[12px] border border-border bg-card p-4 text-left text-sm";
const interactiveClasses =
  "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

/** Presentational cabinet row: leading | title/subtitle | badge | actions. */
export function ListRow({
  href,
  leading,
  title,
  subtitle,
  badge,
  actions,
  onClick,
  className,
}: ListRowProps) {
  const inner = (
    <>
      {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
      <div className="min-w-0 flex-1 basis-full sm:basis-0">
        <div className="truncate font-medium text-foreground">{title}</div>
        {subtitle ? (
          <div className="truncate text-sm text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
      {actions ? (
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {actions}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseClasses, interactiveClasses, className)}
        onClick={onClick}
      >
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(baseClasses, interactiveClasses, "w-full cursor-pointer", className)}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }}
      >
        {inner}
      </div>
    );
  }

  return <div className={cn(baseClasses, className)}>{inner}</div>;
}
