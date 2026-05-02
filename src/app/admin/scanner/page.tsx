import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScannerClient } from './ScannerClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QR Scanner | Nova Unplugged Gate',
  description: 'Gate entry scanner for Nova Unplugged 2025.',
}

export default async function ScannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('user_roles(permissions_level)')
    .eq('id', user.id)
    .single()

  const roleLevel = (data?.user_roles as any)?.permissions_level ?? 1

  return <ScannerClient scannerId={user.id} roleLevel={roleLevel} />
}
