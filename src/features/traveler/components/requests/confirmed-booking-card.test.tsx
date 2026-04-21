import { render, screen } from '@testing-library/react'
import { ConfirmedBookingCard } from './confirmed-booking-card'
import type { ConfirmedBookingSummary } from '@/lib/supabase/traveler-requests'

const booking: ConfirmedBookingSummary = {
  booking_id: 'aabbccdd-0000-0000-0000-000000000001',
  request_id: '30000000-0000-4000-8000-000000000000',
  destination: 'Москва, Россия',
  starts_on: '2026-07-20',
  price_minor: 2450000,
  currency: 'RUB',
  guide_id: '00000000-0000-4000-8000-000000000002',
  guide_name: 'Демо Гид',
  guide_avatar_url: null,
  booking_thread_id: null,
}

describe('ConfirmedBookingCard', () => {
  it('wraps the card in a link to the booking detail page', () => {
    render(<ConfirmedBookingCard booking={booking} />)
    const link = screen.getByRole('link', { name: /москва/i })
    expect(link).toHaveAttribute('href', '/traveler/bookings/aabbccdd-0000-0000-0000-000000000001')
  })

  it('shows guide name and price', () => {
    render(<ConfirmedBookingCard booking={booking} />)
    expect(screen.getByText('Демо Гид')).toBeInTheDocument()
    expect(screen.getByText(/24 500/)).toBeInTheDocument()
  })
})
