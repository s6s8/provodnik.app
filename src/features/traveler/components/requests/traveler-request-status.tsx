import { cn } from '@/lib/utils'

type RequestStatus =
  | 'open' | 'submitted' | 'offers_received' | 'shortlisted'
  | 'booked' | 'expired' | 'cancelled' | 'closed' | 'draft'

const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  open:            { label: 'Ожидает',          className: 'bg-blue-100 text-blue-700 border-blue-200' },
  submitted:       { label: 'Ожидает',          className: 'bg-blue-100 text-blue-700 border-blue-200' },
  offers_received: { label: 'Есть предложения', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  shortlisted:     { label: 'Рассматривается',  className: 'bg-amber-100 text-amber-700 border-amber-200' },
  booked:          { label: 'Забронировано',    className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  expired:         { label: 'Истёк',            className: 'bg-red-100 text-red-700 border-red-200' },
  cancelled:       { label: 'Отменён',          className: 'bg-red-100 text-red-700 border-red-200' },
  closed:          { label: 'Закрыт',           className: 'bg-red-100 text-red-700 border-red-200' },
  draft:           { label: 'Черновик',         className: 'border border-dashed text-muted-foreground' },
}

interface Props {
  status: string
}

export function TravelerRequestStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status as RequestStatus] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
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
