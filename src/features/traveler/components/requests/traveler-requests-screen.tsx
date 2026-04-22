import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ActiveRequestCard } from './active-request-card'
import { ConfirmedBookingCard } from './confirmed-booking-card'
import type { TravelerRequestSummary, ConfirmedBookingSummary } from '@/lib/supabase/traveler-requests'

interface Props {
  activeRequests: TravelerRequestSummary[]
  confirmedBookings: ConfirmedBookingSummary[]
  userName: string
}

export function TravelerRequestsScreen({ activeRequests, confirmedBookings, userName }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Кабинет путешественника</h1>
        {userName && <p className="text-muted-foreground mt-1">{userName}</p>}
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4 w-full grid grid-cols-2 bg-muted/60 border-border backdrop-blur-none shadow-none">
          <TabsTrigger value="active" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Активные{activeRequests.length > 0 ? ` (${activeRequests.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm">
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
                <ActiveRequestCard key={req.id} request={req} />
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
                <ConfirmedBookingCard key={b.request_id} booking={b} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
