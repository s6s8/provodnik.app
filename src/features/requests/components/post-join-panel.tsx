import Link from "next/link";

import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

interface PostJoinPanelProps {
  className?: string;
}

export function PostJoinPanel({ className }: PostJoinPanelProps) {
  return (
    <div
      className={`rounded-card border border-success/20 bg-success/[0.06] p-4 ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
        <span aria-hidden="true">✓</span>
        {COPY.postJoin.title}
      </p>

      <p className="mt-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
        {COPY.postJoin.nextStepsHeading}
      </p>
      <ol className="mt-2 grid gap-2 text-[0.875rem] leading-[1.55] text-on-surface">
        <li className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-[2px] inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-[0.6875rem] font-semibold text-success"
          >
            1
          </span>
          <span>{COPY.postJoin.step1}</span>
        </li>
        <li className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-[2px] inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-[0.6875rem] font-semibold text-success"
          >
            2
          </span>
          <span>{COPY.postJoin.step2}</span>
        </li>
        <li className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-[2px] inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-[0.6875rem] font-semibold text-success"
          >
            3
          </span>
          <span className="font-medium">{COPY.postJoin.step3}</span>
        </li>
      </ol>

      <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-center">
        <Link href="/traveler/requests">{COPY.postJoin.ctaToMyRequests}</Link>
      </Button>
    </div>
  );
}
