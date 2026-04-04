import Link from "next/link";

import { GlassCard } from "@/components/shared/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { RequestRecord } from "@/data/supabase/queries";

type RequestCardProps = {
  request: RequestRecord;
  ctaLabel?: string;
  href?: string;
};

export function RequestCard({
  request,
  ctaLabel = "Предложить маршрут",
  href = `/requests/${request.id}`,
}: RequestCardProps) {
  const progress =
    request.capacity > 0 ? Math.min(100, Math.round((request.groupSize / request.capacity) * 100)) : 0;

  return (
    <GlassCard className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
            {request.destination}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-tight text-ink">{request.title}</h3>
        </div>
        <StatusBadge status={request.status}>{request.status === "open" ? "Открыт" : request.status}</StatusBadge>
      </div>

      <p className="text-sm text-ink-2">
        {request.dateLabel} · {request.groupSize} из {request.capacity} мест
      </p>
      <p className="text-sm leading-7 text-ink-2">{request.description}</p>

      <div className="mt-auto space-y-4">
        <div className="space-y-2">
          <div className="h-1 overflow-hidden rounded-full bg-surface-low">
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink-3">{request.requesterName}</span>
            <span className="font-semibold text-ink">{request.budgetLabel}</span>
          </div>
        </div>

        <Link
          href={href}
          className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      </div>
    </GlassCard>
  );
}
