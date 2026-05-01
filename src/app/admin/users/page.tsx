import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsersClient } from './AdminUsersClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Users | Admin' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('user_roles(permissions_level)')
    .eq('id', user.id)
    .single()
  const myLevel = (currentUser?.user_roles as any)?.permissions_level ?? 1
  if (myLevel < 4) redirect('/admin')

  const [{ data: users }, { data: roles }, { data: types }] = await Promise.all([
    supabase.from('users')
      .select('*, user_roles(name, permissions_level), user_types(name)')
      .order('created_at', { ascending: false }),
    supabase.from('user_roles').select('*').order('permissions_level'),
    supabase.from('user_types').select('*'),
  ])

  return <AdminUsersClient users={users || []} roles={roles || []} types={types || []} myLevel={myLevel} />
}
