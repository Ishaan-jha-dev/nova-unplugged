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

export async function POST(request: NextRequest) {
  try {
    // 1. Verify caller has admin permissions (Level 4+)
    const { userId: adminId, roleLevel } = await getCallerRoleLevel(request)
    if (!adminId || roleLevel < 4) {
      return NextResponse.json({ error: 'Unauthorized. Requires Admin access.' }, { status: 403 })
    }

    const body = await request.json()
    const { bulk, userId } = body

    if (!bulk && !userId) {
      return NextResponse.json({ error: 'Must provide either bulk=true or a specific userId' }, { status: 400 })
    }

    // 2. Use service role to bypass RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() {} } }
    )

    let updateQuery = supabaseAdmin
      .from('users')
      .update({ entry_status: 'approved' })
      .eq('entry_status', 'scanned') // Only reset those that are actually scanned

    if (!bulk && userId) {
      // Per-user reset
      updateQuery = updateQuery.eq('id', userId)
    }

    const { error: updateErr } = await updateQuery

    if (updateErr) {
      console.error('Failed to reset scan status:', updateErr)
      throw new Error(`Database error: ${updateErr.message}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: bulk ? 'Successfully reset all scanned entries.' : 'Successfully reset user scan.' 
    })

  } catch (err: any) {
    console.error('Reset Scans API Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
