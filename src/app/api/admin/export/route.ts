import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Helper to check caller's role level
async function getCallerRoleLevel(request: NextRequest): Promise<{ userId: string | null; roleLevel: number }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userId: null, roleLevel: 0 }

  const { data } = await supabase
    .from('users')
    .select('user_roles(permissions_level)')
    .eq('id', user.id)
    .single()

  const level = (data?.user_roles as any)?.permissions_level ?? 1
  return { userId: user.id, roleLevel: level }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Verify caller has admin permissions (Level 4+)
    const { userId: adminId, roleLevel } = await getCallerRoleLevel(request)
    if (!adminId || roleLevel < 4) {
      return NextResponse.json({ error: 'Unauthorized. Requires Admin access.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type || !['users', 'registrations', 'payments', 'scanner'].includes(type)) {
      return NextResponse.json({ error: 'Invalid export type.' }, { status: 400 })
    }

    // 2. Use service role to bypass all RLS for exporting
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() {} } }
    )

    let exportData: any[] = []

    if (type === 'users') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('full_name, email, phone, college, student_id, course, year, payment_status, entry_status, created_at')
        .order('created_at')
      if (error) throw error
      exportData = data || []
    } 
    else if (type === 'registrations') {
      const { data, error } = await supabaseAdmin
        .from('registrations')
        .select('created_at, users(full_name, email), events(title, participation_type), teams(name, join_code)')
        .order('created_at')
      if (error) throw error
      
      exportData = (data || []).map((r: any) => ({
        user_name: r.users?.full_name || '',
        user_email: r.users?.email || '',
        event_title: r.events?.title || '',
        participation_type: r.events?.participation_type || '',
        team_name: r.teams?.name || '',
        team_code: r.teams?.join_code || '',
        registered_at: r.created_at,
      }))
    } 
    else if (type === 'payments') {
      const { data, error } = await supabaseAdmin
        .from('payment_submissions')
        .select('utr_number, status, admin_note, created_at, users(full_name, email)')
        .order('created_at')
      if (error) throw error

      exportData = (data || []).map((p: any) => ({
        user_name: p.users?.full_name || '',
        user_email: p.users?.email || '',
        utr_number: p.utr_number || '',
        status: p.status || '',
        admin_note: p.admin_note || '',
        created_at: p.created_at,
      }))
    } 
    else if (type === 'scanner') {
      // First fetch all logs
      const { data: logs, error: logsError } = await supabaseAdmin
        .from('scanner_log')
        .select('entry_code, scan_result, scanned_at, scanned_by, target_user_id')
        .order('scanned_at')
      if (logsError) throw logsError

      // Get unique user IDs to fetch their names
      const userIds = new Set<string>()
      logs?.forEach(log => {
        if (log.scanned_by) userIds.add(log.scanned_by)
        if (log.target_user_id) userIds.add(log.target_user_id)
      })

      // Fetch the names
      const userNames: Record<string, string> = {}
      if (userIds.size > 0) {
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, full_name')
          .in('id', Array.from(userIds))
        if (!usersError && usersData) {
          usersData.forEach(u => {
            userNames[u.id] = u.full_name || 'Unknown'
          })
        }
      }

      // Map everything properly
      exportData = (logs || []).map((s: any) => ({
        entry_code: s.entry_code,
        scan_result: s.scan_result,
        scanned_by: s.scanned_by ? userNames[s.scanned_by] || s.scanned_by : '',
        target_user: s.target_user_id ? userNames[s.target_user_id] || s.target_user_id : '',
        scanned_at: s.scanned_at,
      }))
    }

    return NextResponse.json({ data: exportData })

  } catch (err: any) {
    console.error(`Export API Error (${request.url}):`, err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
