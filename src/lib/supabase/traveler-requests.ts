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
  /** Derived from the first entry of `interests[]`; empty string if none. */
  category: string
  starts_on: string
  ends_on: string | null
  budget_minor: number | null
  participants_count: number
  status: 'open' | 'booked' | 'cancelled' | 'expired'
  created_at: string
  offer_count: number
  guide_avatars: Array<{ guide_id: string; avatar_url: string | null; full_name: string | null }>
}

export interface ConfirmedBookingSummary {
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

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch active (open/expired/cancelled) requests for a traveler with offer
 * counts and up to 3 guide avatars — no N+1 (one batch query for all offers).
 */
export const getActiveRequests = cache(async (travelerId: string): Promise<TravelerRequestSummary[]> => {
  const supabase = await createSupabaseServerClient()

  const { data: requests, error } = await supabase
    .from('traveler_requests')
    .select('id, destination, region, interests, starts_on, ends_on, budget_minor, participants_count, status, created_at')
    .eq('traveler_id', travelerId)
    .in('status', ['open', 'expired', 'cancelled'])
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!requests || requests.length === 0) return []

  const ids = requests.map((r) => r.id)
  const { data: offers, error: offersError } = await supabase
    .from('guide_offers')
    .select('request_id, guide_id')
    .in('request_id', ids)
    .in('status', ['pending', 'accepted'])
  if (offersError) throw offersError

  const guideIds = [...new Set((offers ?? []).map((o) => o.guide_id))]

  let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
  if (guideIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', guideIds)
    for (const p of profiles ?? []) {
      profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url })
    }
  }

  const byRequest = new Map<string, Array<{ guide_id: string }>>()
  for (const o of offers ?? []) {
    const list = byRequest.get(o.request_id) ?? []
    list.push(o)
    byRequest.set(o.request_id, list)
  }

  return requests.map((r) => {
    const offerList = byRequest.get(r.id) ?? []
    const interests = (r.interests as string[] | null) ?? []
    return {
      id: r.id,
      destination: r.destination,
      region: r.region,
      category: interests[0] ?? '',
      starts_on: r.starts_on,
      ends_on: r.ends_on,
      budget_minor: r.budget_minor,
      participants_count: r.participants_count,
      status: r.status as TravelerRequestSummary['status'],
      created_at: r.created_at,
      offer_count: offerList.length,
      guide_avatars: offerList.slice(0, 3).map((o) => ({
        guide_id: o.guide_id,
        ...(profileMap.get(o.guide_id) ?? { full_name: null, avatar_url: null }),
      })),
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
    .in('status', ['awaiting_guide_confirmation', 'confirmed'])
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
      ? supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', guideIds)
      : Promise.resolve({ data: [], error: null }),
    bookingIds.length > 0
      ? supabase
          .from('conversation_threads')
          .select('id, booking_id')
          .in('booking_id', bookingIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const requestMap = new Map<string, { destination: string; starts_on: string }>()
  for (const r of requestsRes.data ?? []) {
    requestMap.set(r.id, { destination: r.destination, starts_on: r.starts_on })
  }

  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
  for (const p of profilesRes.data ?? []) {
    profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url })
  }

  const threadMap = new Map<string, string>()
  for (const t of threadsRes.data ?? []) {
    if (t.booking_id) threadMap.set(t.booking_id, t.id)
  }

  return bookings.map((b) => {
    const req = b.request_id ? requestMap.get(b.request_id) : null
    const profile = profileMap.get(b.guide_id) ?? { full_name: null, avatar_url: null }
    return {
      request_id: b.request_id ?? b.id,
      destination: req?.destination ?? '—',
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
