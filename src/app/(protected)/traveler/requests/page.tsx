import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getActiveRequests, getConfirmedBookings } from '@/lib/supabase/traveler-requests'
import { TravelerRequestsScreen } from '@/features/traveler/components/requests/traveler-requests-screen'

export const metadata = { title: 'Мои запросы' }

export default async function TravelerRequestsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [activeRequests, confirmedBookings] = await Promise.all([
    getActiveRequests(user.id),
    getConfirmedBookings(user.id),
  ])

  return (
    <TravelerRequestsScreen
      activeRequests={activeRequests}
      confirmedBookings={confirmedBookings}
    />
  )
}
