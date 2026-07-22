import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string; icon?: LucideIcon };
  className?: string;
}

/**
 * Section heading used across the homepage (Open Groups, Popular Destinations,
 * How it works). Title + optional subtitle on the left, optional "see all" link
 * on the right. Mockup: h2 30px/800/-.03em, navy "see" link with chevron.
 */
export function SectionHeading({ title, subtitle, action, secondaryAction, className }: Props) {
  return (
    <div
      className={`mb-6 flex items-end justify-between gap-4${className ? ` ${className}` : ""}`}
    >
      <div>
        <h2 className="text-[clamp(24px,3vw,30px)] font-extrabold leading-tight tracking-[-0.03em] text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 text-sm font-medium text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {secondaryAction.icon ? (
              <secondaryAction.icon className="size-4" aria-hidden="true" />
            ) : null}
            {secondaryAction.label}
          </Link>
        ) : null}
        {action ? (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {action.label}
            <ChevronRight className="h-[15px] w-[15px]" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
