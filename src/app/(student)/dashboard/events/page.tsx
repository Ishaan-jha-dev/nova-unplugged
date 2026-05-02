import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventsClient } from './EventsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Events | Nova Unplugged 2025' }

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: categories },
    { data: events },
    { data: registrations },
    { data: joinRequests },
  ] = await Promise.all([
    // Only active categories
    supabase.from('categories').select('*').eq('status', 'active').order('title'),
    // Events where the category is active (or has no category)
    supabase
      .from('events')
      .select('*, categories(id, title, status)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    // User's existing registrations
    supabase
      .from('registrations')
      .select('event_id, team_id')
      .eq('user_id', user.id),
    // User's pending/rejected join requests (so they know status)
    supabase
      .from('team_join_requests')
      .select('team_id, status, teams(event_id)')
      .eq('user_id', user.id),
  ])

  // Filter events — hide events whose category is inactive
  const visibleEvents = (events || []).filter(e => {
    if (!e.category_id) return true // uncategorized events are shown
    return (e as any).categories?.status === 'active'
  })

  const registeredEventIds = (registrations || []).map((r: any) => r.event_id)
  const registeredTeamIds = (registrations || []).reduce((acc: Record<string, string>, r: any) => {
    if (r.team_id) acc[r.event_id] = r.team_id
    return acc
  }, {})

  // Map: teamId → request status (so we can show Pending/Rejected on teams)
  const requestStatusByTeam = (joinRequests || []).reduce((acc: Record<string, string>, r: any) => {
    acc[r.team_id] = r.status
    return acc
  }, {})
  // Map: eventId → request status (for events where user sent a request)
  const requestStatusByEvent = (joinRequests || []).reduce((acc: Record<string, { status: string; teamId: string }>, r: any) => {
    const eventId = (r.teams as any)?.event_id
    if (eventId) acc[eventId] = { status: r.status, teamId: r.team_id }
    return acc
  }, {})

  return (
    <EventsClient
      events={visibleEvents}
      categories={categories || []}
      registeredEventIds={registeredEventIds}
      registeredTeamIds={registeredTeamIds}
      requestStatusByTeam={requestStatusByTeam}
      requestStatusByEvent={requestStatusByEvent}
      userId={user.id}
    />
  )
}
