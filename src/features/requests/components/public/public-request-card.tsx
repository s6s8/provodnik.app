import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { listSeededRosterForOpenRequest } from "@/data/open-requests/seed";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function getCityRegionLabel(request: OpenRequestRecord) {
  const destination = request.destinationLabel?.trim() ?? "";
  const city = destination.split(",")[0]?.trim() ?? destination;

  if (request.regionLabel?.trim()) {
    return `${city}, ${request.regionLabel.trim()}`;
  }

  return destination;
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "У";

  const parts = trimmed.split(/\s+/g).filter(Boolean);
  const letters = parts.map((p) => p[0]).slice(0, 2).join("");
  return letters.toUpperCase();
}

export function PublicRequestCard({ request }: { request: OpenRequestRecord }) {
  const destinationLabel = getCityRegionLabel(request);
  const roster = listSeededRosterForOpenRequest(request.id);
  const avatarMembers = roster.slice(
    0,
    Math.max(1, Math.min(5, request.group.sizeCurrent)),
  );

  const pct =
    request.group.sizeTarget > 0
      ? (request.group.sizeCurrent / request.group.sizeTarget) * 100
      : 0;

  const budgetLine =
    typeof request.budgetPerPersonRub === "number"
      ? `от ~${formatRub(request.budgetPerPersonRub)} ₽/чел`
      : null;

  const sharedContent = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="default" className="rounded-full">
          Открыт
        </Badge>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{destinationLabel}</h3>
        <p className="text-xs text-white/60">{request.dateRangeLabel}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {avatarMembers.map((m) => (
              <div
                key={m.id}
                className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/15 text-[0.7rem] font-bold text-white"
                aria-label={`Участник: ${m.displayName}`}
              >
                {getInitials(m.displayName)}
              </div>
            ))}
          </div>

          <p className="text-xs font-medium text-white/70">
            {request.group.sizeCurrent} из {request.group.sizeTarget} участников
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>
      </div>

      {budgetLine ? (
        <p className="text-lg font-semibold text-white">{budgetLine}</p>
      ) : null}

      <Button asChild variant="default" size="sm" className="w-full rounded-full">
        <Link href={`/requests/${encodeURIComponent(request.id)}`}>Присоединиться</Link>
      </Button>
    </div>
  );

  if (request.imageUrl) {
    return (
      <article className="group relative min-h-[220px] overflow-hidden rounded-[1.5rem] bg-black">
        <div className="relative min-h-[220px]">
          <Image
            src={request.imageUrl}
            alt={destinationLabel}
            fill
            sizes="(max-width: 768px) 92vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">{sharedContent}</div>
      </article>
    );
  }

  return (
    <article className="glass-panel min-h-[220px] rounded-[1.5rem] border border-white/10 p-5">
      {sharedContent}
    </article>
  );
}

