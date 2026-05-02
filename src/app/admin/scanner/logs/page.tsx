import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { LogsClient } from './LogsClient'

export const metadata: Metadata = { title: 'Scan Logs | Admin' }

export default async function ScanLogsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams
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

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 15
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 1. Fetch Paginated Logs
  const { data: logs, count: totalLogs } = await supabaseAdmin
    .from('scanner_log')
    .select('*, users:users!scanner_log_scanned_by_fkey(full_name, email), target:users!scanner_log_target_user_id_fkey(full_name, email)', { count: 'exact' })
    .order('scanned_at', { ascending: false })
    .range(from, to)

  // 2. Fetch Metrics
  const [
    { count: validCount },
    { count: invalidCount },
    { count: alreadyScannedCount }
  ] = await Promise.all([
    supabaseAdmin.from('scanner_log').select('*', { count: 'exact', head: true }).eq('scan_result', 'valid'),
    supabaseAdmin.from('scanner_log').select('*', { count: 'exact', head: true }).eq('scan_result', 'invalid'),
    supabaseAdmin.from('scanner_log').select('*', { count: 'exact', head: true }).eq('scan_result', 'already_scanned'),
  ])

  return (
    <LogsClient 
      logs={logs || []} 
      page={page} 
      totalPages={Math.ceil((totalLogs || 0) / pageSize)} 
      metrics={{
        valid: validCount || 0,
        invalid: invalidCount || 0,
        alreadyScanned: alreadyScannedCount || 0
      }}
    />
  )
}
