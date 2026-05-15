import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { INTEREST_CHIPS } from '@/data/interests'
import { TravelerRequestStatusBadge } from './traveler-request-status'
import type { TravelerRequestSummary } from '@/lib/supabase/traveler-requests'

const KNOWN_INTEREST_IDS = new Set<string>(INTEREST_CHIPS.map((c) => c.id))
const INTEREST_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
)

function formatBudget(minor: number | null): string {
  if (!minor) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
  }).format(minor / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function ActiveRequestCard({ request }: { request: TravelerRequestSummary }) {
  const knownInterests = request.interests
    .filter((i) => KNOWN_INTEREST_IDS.has(i))
    .slice(0, 2);

  return (
    <Link
      href={`/traveler/requests/${request.id}`}
      className="block rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{request.destination}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(request.starts_on)}{request.start_time ? ` · ${request.start_time.slice(0, 5)}` : ''}</p>
        </div>
        <TravelerRequestStatusBadge status={request.status} />
      </div>

      {knownInterests.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {knownInterests.map((interest) => (
            <span key={interest} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {INTEREST_LABEL_BY_ID[interest]}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        {request.mode === 'assembly' ? (
          <span>{request.participants_count}{request.group_max ? ` из ${request.group_max}` : ''} · сборная группа</span>
        ) : (
          <span>{request.participants_count} чел.</span>
        )}
        {request.budget_minor ? <span>{formatBudget(request.budget_minor)}/чел.</span> : null}
        {request.offer_count > 0 && (
          <span className="text-amber-600 font-medium">{request.offer_count} предл.</span>
        )}
      </div>

      {request.guide_avatars.length > 0 && (
        <div className="mt-3 flex items-center gap-1">
          {request.guide_avatars.map((g) => (
            <Avatar key={g.guide_id} className="h-6 w-6 border-2 border-background -ml-1 first:ml-0">
              <AvatarImage src={g.avatar_url ?? undefined} alt={g.full_name ?? 'Гид'} />
              <AvatarFallback className="text-[8px]">{(g.full_name ?? 'Г').charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
          {request.offer_count > 3 && (
            <span className="text-xs text-muted-foreground ml-1">+{request.offer_count - 3}</span>
          )}
        </div>
      )}
    </Link>
  )
}
