import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Helper to get the current user's role level using anon key (checks auth)
async function getCallerRoleLevel(request: NextRequest): Promise<{ userId: string | null; roleLevel: number }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
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

export async function POST(request: NextRequest) {
  try {
    // 1. Verify caller is admin (level >= 4)
    const { userId: adminId, roleLevel } = await getCallerRoleLevel(request)
    if (!adminId || roleLevel < 4) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { submissionId, userId, action, adminNote } = body

    // action can be: 'approve' | 'reject' | 'reset' (reset → back to pending)
    if (!submissionId || !userId || !['approve', 'reject', 'reset'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // 2. Use service role key to bypass RLS for both updates
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { getAll() { return [] }, setAll() {} },
      }
    )

    // Map action → DB statuses
    const submissionStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending'
    const paymentStatus    = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending'

    // Update payment_submissions
    const { error: submissionErr } = await supabaseAdmin
      .from('payment_submissions')
      .update({
        status:      submissionStatus,
        admin_note:  action === 'reject' ? adminNote : null,
        reviewed_by: adminId,
      })
      .eq('id', submissionId)

    if (submissionErr) {
      return NextResponse.json({ error: `Submission update failed: ${submissionErr.message}` }, { status: 500 })
    }

    // Update users.payment_status
    // On approve  → DB trigger auto-sets entry_code + entry_status = 'approved'
    // On reject/reset → clear entry_code + revoke gate access
    const userUpdate: Record<string, any> = { payment_status: paymentStatus }
    if (action === 'reject' || action === 'reset') {
      userUpdate.entry_code   = null
      userUpdate.entry_status = 'not_approved'
    }

    const { error: userErr } = await supabaseAdmin
      .from('users')
      .update(userUpdate)
      .eq('id', userId)

    if (userErr) {
      return NextResponse.json({ error: `User update failed: ${userErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
