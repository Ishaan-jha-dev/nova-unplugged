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
    // 1. Verify caller has scanner permissions (e.g., Level 2 Volunteer or higher)
    const { userId: scannerId, roleLevel } = await getCallerRoleLevel(request)
    if (!scannerId || roleLevel < 2) {
      return NextResponse.json({ error: 'Unauthorized. You must be at least a volunteer.' }, { status: 403 })
    }

    const { code } = await request.json()
    if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

    // 2. Use service role to bypass all RLS for the actual scanning and logging
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() {} } }
    )

    // 3. Find target user
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, full_name, entry_status, payment_status')
      .eq('entry_code', code)
      .maybeSingle()

    let scanResult: 'valid' | 'already_scanned' | 'invalid'
    let message: string
    let name: string | undefined = targetUser?.full_name

    // 4. Determine result
    if (!targetUser || targetUser.payment_status !== 'approved') {
      scanResult = 'invalid'
      message = 'QR code not found or payment not approved'
      name = undefined
    } else if (targetUser.entry_status === 'scanned') {
      scanResult = 'already_scanned'
      message = 'This entry was already scanned'
    } else {
      scanResult = 'valid'
      message = 'Entry Granted'
      
      // Update entry status
      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({ entry_status: 'scanned' })
        .eq('id', targetUser.id)
        
      if (updateErr) throw new Error(`Failed to update entry status: ${updateErr.message}`)
    }

    // 5. Log the scan securely using the admin client
    const { error: logErr } = await supabaseAdmin.from('scanner_log').insert({
      entry_code: code,
      scanned_by: scannerId,
      scan_result: scanResult,
      target_user_id: targetUser?.id || null,
    })

    if (logErr) {
      console.error('Failed to log scan:', logErr)
      throw new Error(`Logging failed: ${logErr.message}`)
    }

    return NextResponse.json({ 
      state: scanResult, 
      name, 
      message, 
      timestamp: new Date().toLocaleTimeString() 
    })

  } catch (err: any) {
    console.error('Scanner API Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
