import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { ConfirmedBookingSummary } from '@/lib/supabase/traveler-requests'

function formatPrice(minor: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(minor / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function ConfirmedBookingCard({ booking }: { booking: ConfirmedBookingSummary }) {
  return (
    <Link
      href={`/traveler/bookings/${booking.booking_id}`}
      className="block rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={booking.guide_avatar_url ?? undefined} alt={booking.guide_name ?? 'Гид'} />
          <AvatarFallback>{(booking.guide_name ?? 'Г').charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{booking.guide_name ?? 'Гид'}</p>
          <p className="text-xs text-muted-foreground">{booking.destination} · {formatDate(booking.starts_on)}</p>
        </div>
        <p className="text-sm font-medium text-emerald-600 shrink-0">
          {formatPrice(booking.price_minor, booking.currency)}
        </p>
      </div>

      {booking.booking_thread_id && (
        <Button asChild variant="outline" size="sm" className="mt-3 w-full" onClick={(e) => e.stopPropagation()}>
          <Link href={`/traveler/chat/${booking.booking_thread_id}`}>Написать гиду</Link>
        </Button>
      )}
    </Link>
  )
}
