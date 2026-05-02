import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AdminEventsClient } from './AdminEventsClient'

export const metadata: Metadata = { title: 'Events | Admin' }

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('user_roles(permissions_level)').eq('id', user.id).single()
  const roleLevel = (userData?.user_roles as any)?.permissions_level ?? 1
  if (roleLevel < 3) redirect('/admin')

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: events }, { data: categories }] = await Promise.all([
    admin.from('events').select('*, categories(id, title, status)').order('created_at', { ascending: false }),
    admin.from('categories').select('*').eq('status', 'active').order('title'),
  ])

  return (
    <AdminEventsClient
      events={events || []}
      categories={categories || []}
      creatorId={user.id}
    />
  )
}
