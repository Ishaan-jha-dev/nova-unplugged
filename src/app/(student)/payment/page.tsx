import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentForm } from './PaymentForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payment | Nova Unplugged 2025',
  description: 'Submit your payment to confirm your registration for Nova Unplugged 2025.',
}

export default async function PaymentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch current user row and latest submission
  const { data: userData } = await supabase
    .from('users')
    .select('*, user_roles(name, permissions_level)')
    .eq('id', user.id)
    .single()

  const { data: submission } = await supabase
    .from('payment_submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return <PaymentForm userData={userData} submission={submission} userId={user.id} />
}
