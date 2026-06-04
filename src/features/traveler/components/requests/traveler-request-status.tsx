import { cn } from '@/lib/utils'

type RequestStatus =
  | 'open' | 'submitted' | 'offers_received' | 'shortlisted'
  | 'booked' | 'expired' | 'cancelled' | 'closed' | 'draft'

const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  open:            { label: 'Ожидает',          className: 'bg-primary/10 text-primary border-primary/30' },
  submitted:       { label: 'Ожидает',          className: 'bg-primary/10 text-primary border-primary/30' },
  offers_received: { label: 'Есть предложения', className: 'bg-warning/10 text-warning border-warning/30' },
  shortlisted:     { label: 'Рассматривается',  className: 'bg-warning/10 text-warning border-warning/30' },
  booked:          { label: 'Забронировано',    className: 'bg-success/10 text-success border-success/30' },
  expired:         { label: 'Истёк',            className: 'bg-destructive/10 text-destructive border-destructive/30' },
  cancelled:       { label: 'Отменён',          className: 'bg-destructive/10 text-destructive border-destructive/30' },
  closed:          { label: 'Закрыт',           className: 'bg-destructive/10 text-destructive border-destructive/30' },
  draft:           { label: 'Черновик',         className: 'border border-dashed text-muted-foreground' },
}

interface Props {
  status: string
}

export function TravelerRequestStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status as RequestStatus] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
