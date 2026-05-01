import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminEventsClient } from './AdminEventsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Events | Admin' }

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminEventsClient events={events || []} creatorId={user.id} />
}
