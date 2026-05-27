import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { JoinedGroupSummary } from '@/lib/supabase/traveler-requests'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function JoinedGroupCard({ group }: { group: JoinedGroupSummary }) {
  const ownerName = group.owner_name ?? 'Организатор'
  return (
    <Link
      href={`/requests/${group.id}`}
      className="block rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{group.destination}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(group.starts_on)}
            {group.start_time ? ` · ${group.start_time.slice(0, 5)}` : ''}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          Вы в группе
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <Avatar className="h-6 w-6">
          <AvatarImage src={group.owner_avatar_url ?? undefined} alt={ownerName} />
          <AvatarFallback className="text-[8px]">{ownerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="truncate">Организатор: {ownerName}</span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          {group.participants_count}
          {group.group_max ? ` из ${group.group_max}` : ''} · сборная группа
        </span>
      </div>
    </Link>
  )
}
