import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { MyEventsClient } from './MyEventsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Events | Nova Unplugged 2025' }

export default async function MyEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      *,
      events(*, categories(title)),
      teams(
        *,
        users!leader_id(id, full_name),
        team_members(*, users(id, full_name))
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <MyEventsClient registrations={registrations || []} userId={user.id} />
}
