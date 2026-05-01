import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentsClient } from './PaymentsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payment Verification | Admin' }

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('user_roles(permissions_level)')
    .eq('id', user.id)
    .single()

  const roleLevel = (userData?.user_roles as any)?.permissions_level ?? 1
  if (roleLevel < 4) redirect('/admin')

  const { data: submissions } = await supabase
    .from('payment_submissions')
    .select('*, users(full_name, email)')
    .order('created_at', { ascending: false })

  return <PaymentsClient submissions={submissions || []} adminId={user.id} />
}
