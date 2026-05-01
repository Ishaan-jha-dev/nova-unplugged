import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventsClient } from './EventsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Events | Nova Unplugged 2025' }

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: events }, { data: registrations }] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('registrations')
      .select('event_id, team_id')
      .eq('user_id', user.id),
  ])

  const registeredEventIds = ((registrations || []) as { event_id: string; team_id: string | null }[]).map(r => r.event_id)

  return (
    <EventsClient
      events={events || []}
      registeredEventIds={[...registeredEventIds]}
      userId={user.id}
    />
  )
}
