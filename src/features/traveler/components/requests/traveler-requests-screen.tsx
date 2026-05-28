import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { TripCard } from '../trip-card/trip-card'
import {
  mapBookingToTrip,
  mapRequestToPhase,
  mapRequestToTrip,
} from '../trip-card/trip-card-mappers'
import { JoinedGroupCard } from './joined-group-card'
import type {
  TravelerRequestSummary,
  ConfirmedBookingSummary,
  JoinedGroupSummary,
} from '@/lib/supabase/traveler-requests'

interface Props {
  activeRequests: TravelerRequestSummary[]
  confirmedBookings: ConfirmedBookingSummary[]
  joinedGroups?: JoinedGroupSummary[]
}

export function TravelerRequestsScreen({
  activeRequests,
  confirmedBookings,
  joinedGroups = [],
}: Props) {
  const defaultTab =
    activeRequests.length === 0 && joinedGroups.length > 0 ? 'joined' : 'active'

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-4 w-full grid grid-cols-3 bg-muted/60 backdrop-blur-none shadow-none border-border">
          <TabsTrigger value="active">
            Активные{activeRequests.length > 0 ? ` (${activeRequests.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="joined">
            Мои группы{joinedGroups.length > 0 ? ` (${joinedGroups.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Подтверждённые{confirmedBookings.length > 0 ? ` (${confirmedBookings.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">У вас ещё нет запросов</p>
              <Button asChild>
                <Link href="/traveler/requests/new">Создать первый запрос</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeRequests.map((req) => (
                <TripCard
                  key={req.id}
                  phase={mapRequestToPhase(req)}
                  trip={mapRequestToTrip(req)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="joined">
          {joinedGroups.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">Вы пока не присоединились ни к одной группе</p>
              <Button asChild variant="outline">
                <Link href="/requests">Найти группу</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {joinedGroups.map((g) => (
                <JoinedGroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmed">
          {confirmedBookings.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">Подтверждённых поездок пока нет</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {confirmedBookings.map((b) => (
                <TripCard
                  key={b.request_id}
                  phase="upcoming"
                  trip={mapBookingToTrip(b)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
