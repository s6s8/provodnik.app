import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MarketingHeaderProps = {
  photo?: string;
  title: string;
  eyebrow?: string;
  cta?: { label: string; href: string };
  className?: string;
};

/** Slim marketing band with optional photo + scrim, Onest H1, eyebrow and CTA. Server-safe. */
export function MarketingHeader({ photo, title, eyebrow, cta, className }: MarketingHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-b-[18px] px-5 py-8 md:py-10",
        photo ? undefined : "bg-primary",
        className,
      )}
    >
      {photo ? (
        <>
          <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/20" />
        </>
      ) : null}
      <div className="relative z-10">
        {eyebrow ? (
          <Badge variant="eyebrow" className="text-white/90">
            {eyebrow}
          </Badge>
        ) : null}
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white md:text-3xl">{title}</h1>
        {cta ? (
          <Button asChild className="mt-3">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
