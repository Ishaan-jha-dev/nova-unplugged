import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExportClient } from './ExportClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Export Data | Admin' }

export default async function ExportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('user_roles(permissions_level)').eq('id', user.id).single()
  const level = (userData?.user_roles as any)?.permissions_level ?? 1
  if (level < 4) redirect('/admin')

  return <ExportClient />
}
