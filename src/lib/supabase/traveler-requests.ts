/**
 * traveler-requests.ts — Aggregated read layer for the traveler requests page (server-only)
 *
 * Uses React.cache for per-request deduplication. Functions are intended for
 * Server Components only — never import from client components.
 */

import { cache } from 'react'

import { createSupabaseServerClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TravelerRequestSummary {
  id: string
  destination: string
  region: string | null
  interests: string[]
  starts_on: string
  start_time: string | null
  end_time: string | null
  ends_on: string | null
  budget_minor: number | null
  participants_count: number
  status: 'open' | 'booked' | 'cancelled' | 'expired'
  created_at: string
  offer_count: number
  unread_offer_count: number
  guide_avatars: Array<{ guide_id: string; avatar_url: string | null; full_name: string | null }>
  mode: 'assembly' | 'private'
  group_max: number | null
  open_to_join?: boolean
  date_locked?: boolean
  date_flexibility?: string
}

export interface ConfirmedBookingSummary {
  booking_id: string
  request_id: string
  destination: string
  starts_on: string
  price_minor: number
  currency: string
  guide_id: string
  guide_name: string | null
  guide_avatar_url: string | null
  booking_thread_id: string | null
}

export interface JoinedGroupSummary {
  id: string
  destination: string
  region: string | null
  starts_on: string
  start_time: string | null
  ends_on: string | null
  budget_minor: number | null
  participants_count: number
  group_max: number | null
  status: 'open' | 'booked' | 'cancelled' | 'expired'
  joined_at: string
  owner_id: string
  owner_name: string | null
  owner_avatar_url: string | null
}

type DisplayProfileRpcRow = {
  booking_id?: string | null
  request_id?: string | null
  guide_id?: string | null
  owner_id?: string | null
  full_name: string | null
  avatar_url: string | null
}

type RpcClient = {
  rpc: (fn: string) => Promise<{ data: DisplayProfileRpcRow[] | null; error: unknown }>
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch active (open) requests for a traveler with offer counts and up to 3
 * guide avatars — no N+1 (one batch query for all offers). Expired requests are
 * terminal and must not appear in — or be counted by — the "Активные" tab.
 */
export const getActiveRequests = cache(async (travelerId: string): Promise<TravelerRequestSummary[]> => {
  const supabase = await createSupabaseServerClient()

  const { data: requests, error } = await supabase
    .from('traveler_requests')
    .select('id, destination, region, interests, starts_on, ends_on, start_time, end_time, budget_minor, participants_count, status, created_at, format_preference, group_capacity, open_to_join, date_locked, date_flexibility')
    .eq('traveler_id', travelerId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!requests || requests.length === 0) return []

  const ids = requests.map((r) => r.id)
  const { data: offers, error: offersError } = await supabase
    .from('guide_offers')
    .select('request_id, guide_id, traveler_read_at')
    .in('request_id', ids)
    .in('status', ['pending', 'accepted'])
  if (offersError) throw offersError

  const guideIds = [...new Set((offers ?? []).map((o) => o.guide_id))]

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
  if (guideIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', guideIds)
    if (profilesError) throw profilesError

    for (const p of profiles ?? []) {
      profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url })
    }
  }

  const byRequest = new Map<string, Array<{ guide_id: string; traveler_read_at: string | null }>>()
  for (const o of offers ?? []) {
    const list = byRequest.get(o.request_id) ?? []
    list.push(o)
    byRequest.set(o.request_id, list)
  }

  type RequestRow = (typeof requests)[number] & {
    start_time: string | null
    end_time: string | null
    format_preference: string | null
    group_capacity: number | null
    open_to_join: boolean
    date_locked: boolean
    date_flexibility: string | null
  }

  return (requests as RequestRow[]).map((r) => {
    const offerList = byRequest.get(r.id) ?? []
    const interests = (r.interests as string[] | null) ?? []
    return {
      id: r.id,
      destination: r.destination,
      region: r.region,
      interests,
      starts_on: r.starts_on,
      start_time: r.start_time,
      end_time: r.end_time,
      ends_on: r.ends_on,
      budget_minor: r.budget_minor,
      participants_count: r.participants_count,
      status: r.status as TravelerRequestSummary['status'],
      created_at: r.created_at,
      open_to_join: r.open_to_join,
      date_locked: r.date_locked,
      date_flexibility: r.date_flexibility ?? 'exact',
      offer_count: offerList.length,
      unread_offer_count: offerList.filter((o) => !o.traveler_read_at).length,
      guide_avatars: offerList.slice(0, 3).map((o) => ({
        guide_id: o.guide_id,
        ...(profileMap.get(o.guide_id) ?? { full_name: null, avatar_url: null }),
      })),
      mode: (r.format_preference === 'group' ? 'assembly' : 'private') as 'assembly' | 'private',
      group_max: r.group_capacity,
    }
  })
})

/**
 * Fetch confirmed bookings for a traveler with guide profile info and an
 * optional chat thread ID. Uses sequential queries because bookings.guide_id
 * points to profiles.id with no PostgREST-resolvable FK alias.
 */
export const getConfirmedBookings = cache(async (travelerId: string): Promise<ConfirmedBookingSummary[]> => {
  const supabase = await createSupabaseServerClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, offer_id, request_id, subtotal_minor, currency, guide_id, created_at')
    .eq('traveler_id', travelerId)
    .in('status', ['pending', 'awaiting_guide_confirmation', 'confirmed'])
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!bookings || bookings.length === 0) return []

  const requestIds = [...new Set(bookings.map((b) => b.request_id).filter(Boolean) as string[])]
  const guideIds = [...new Set(bookings.map((b) => b.guide_id))]
  const bookingIds = bookings.map((b) => b.id)

  const [requestsRes, profilesRes, threadsRes] = await Promise.all([
    requestIds.length > 0
      ? supabase
          .from('traveler_requests')
          .select('id, destination, starts_on')
          .in('id', requestIds)
      : Promise.resolve({ data: [], error: null }),
    guideIds.length > 0
      ? (supabase as unknown as RpcClient).rpc('get_traveler_booking_guide_display_profiles')
      : Promise.resolve({ data: [], error: null }),
    bookingIds.length > 0
      ? supabase
          .from('conversation_threads')
          .select('id, booking_id')
          .in('booking_id', bookingIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (requestsRes.error) throw requestsRes.error
  if (profilesRes.error) throw profilesRes.error
  if (threadsRes.error) throw threadsRes.error

  const requestMap = new Map<string, { destination: string; starts_on: string }>()
  for (const r of requestsRes.data ?? []) {
    requestMap.set(r.id, { destination: r.destination, starts_on: r.starts_on })
  }

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
  for (const p of profilesRes.data ?? []) {
    if (p.guide_id) profileMap.set(p.guide_id, { full_name: p.full_name, avatar_url: p.avatar_url })
  }

  const threadMap = new Map<string, string>()
  for (const t of threadsRes.data ?? []) {
    if (t.booking_id) threadMap.set(t.booking_id, t.id)
  }

  return bookings.map((b) => {
    const req = b.request_id ? requestMap.get(b.request_id) : null
    const profile = profileMap.get(b.guide_id) ?? { full_name: null, avatar_url: null }
    return {
      booking_id: b.id,
      request_id: b.request_id ?? b.id,
      // Never a lone em-dash: the card now shows guide/date/price, so a
      // title-only fallback stays a readable card even when the request row
      // is gone/unreadable (request_id is always set on offer-created bookings).
      destination: req?.destination ?? 'Поездка',
      starts_on: req?.starts_on ?? '',
      price_minor: b.subtotal_minor ?? 0,
      currency: b.currency ?? 'RUB',
      guide_id: b.guide_id ?? '',
      guide_name: profile.full_name,
      guide_avatar_url: profile.avatar_url,
      booking_thread_id: threadMap.get(b.id) ?? null,
    }
  })
})

/**
 * Fetch open-group requests the traveler joined (excluding requests they own).
 * Returns groups sorted by joined_at descending.
 */
export const getJoinedRequests = cache(async (travelerId: string): Promise<JoinedGroupSummary[]> => {
  const supabase = await createSupabaseServerClient()

  const { data: memberships, error: memberError } = await supabase
    .from('open_request_members')
    .select('request_id, joined_at, left_at, status')
    .eq('traveler_id', travelerId)
    .eq('status', 'joined')
    .is('left_at', null)
    .order('joined_at', { ascending: false })

  if (memberError) throw memberError
  if (!memberships || memberships.length === 0) return []

  const requestIds = memberships.map((m) => m.request_id)
  const { data: requests, error: reqError } = await supabase
    .from('traveler_requests')
    .select('id, traveler_id, destination, region, starts_on, start_time, ends_on, budget_minor, participants_count, group_capacity, status')
    .in('id', requestIds)
    .neq('traveler_id', travelerId)

  if (reqError) throw reqError
  if (!requests || requests.length === 0) return []

  const { data: profiles, error: profileError } = await (supabase as unknown as RpcClient)
    .rpc('get_joined_request_owner_display_profiles')
  if (profileError) throw profileError

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
  for (const p of profiles ?? []) {
    if (p.owner_id) profileMap.set(p.owner_id, { full_name: p.full_name, avatar_url: p.avatar_url })
  }

  const joinedAtMap = new Map<string, string>()
  for (const m of memberships) {
    joinedAtMap.set(m.request_id, m.joined_at)
  }

  return requests
    .map((r) => {
      const owner = profileMap.get(r.traveler_id) ?? { full_name: null, avatar_url: null }
      return {
        id: r.id,
        destination: r.destination,
        region: r.region,
        starts_on: r.starts_on,
        start_time: r.start_time,
        ends_on: r.ends_on,
        budget_minor: r.budget_minor,
        participants_count: r.participants_count,
        group_max: r.group_capacity,
        status: r.status as JoinedGroupSummary['status'],
        joined_at: joinedAtMap.get(r.id) ?? '',
        owner_id: r.traveler_id,
        owner_name: owner.full_name,
        owner_avatar_url: owner.avatar_url,
      }
    })
    .sort((a, b) => b.joined_at.localeCompare(a.joined_at))
})
