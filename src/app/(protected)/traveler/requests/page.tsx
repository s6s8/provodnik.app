import { redirect } from 'next/navigation'
import { getDestinations } from '@/data/supabase/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  getActiveRequests,
  getConfirmedBookings,
  getJoinedRequests,
} from '@/lib/supabase/traveler-requests'
import { TravelerRequestsScreen } from '@/features/traveler/components/requests/traveler-requests-screen'

export const metadata = { title: 'Мои запросы' }

export default async function TravelerRequestsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [activeRequests, confirmedBookings, joinedGroups, destinations] = await Promise.all([
    getActiveRequests(user.id),
    getConfirmedBookings(user.id),
    getJoinedRequests(user.id),
    getDestinations(supabase),
  ])
  const inspirations = (destinations.data ?? []).slice(0, 3).map((d) => ({
    slug: d.slug,
    label: d.name,
    imageUrl: d.heroImageUrl,
  }))

  return (
    <TravelerRequestsScreen
      activeRequests={activeRequests}
      confirmedBookings={confirmedBookings}
      joinedGroups={joinedGroups}
      inspirations={inspirations}
    />
  )
}
