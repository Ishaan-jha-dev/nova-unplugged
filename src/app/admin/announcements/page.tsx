import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminAnnouncementsClient } from './AdminAnnouncementsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Announcements | Admin' }

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, users(full_name)')
    .order('created_at', { ascending: false })

  return <AdminAnnouncementsClient announcements={announcements || []} creatorId={user.id} />
}
