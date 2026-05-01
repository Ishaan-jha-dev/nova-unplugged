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

  // Use Service Role Key to guarantee data fetch without RLS blocking, since admin status is verified above
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
  )

  const { data: submissions, error: fetchError } = await adminClient
    .from('payment_submissions')
    .select('*, users:users!payment_submissions_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Payment fetch error:', fetchError)
    return (
      <div className="p-8 text-red-500">
        <h2 className="text-xl font-bold mb-4">Error fetching payments:</h2>
        <pre className="bg-black/50 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(fetchError, null, 2)}
        </pre>
      </div>
    )
  }

  return <PaymentsClient submissions={submissions || []} adminId={user.id} />
}
