import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData.user) {
      const userId = sessionData.user.id

      // PERMAFIX: Query DB with service role key to get the REAL role, not the JWT
      const cookieStore = await cookies()
      const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
      )

      const { data: dbUser } = await adminClient
        .from('users')
        .select('payment_status, user_roles(permissions_level)')
        .eq('id', userId)
        .single()

      const roleLevel: number = (dbUser?.user_roles as any)?.permissions_level ?? 1
      const paymentStatus: string = dbUser?.payment_status ?? 'pending'

      // Smart redirect based on actual DB role
      if (roleLevel >= 4) return NextResponse.redirect(`${origin}/dashboard`)
      if (roleLevel === 3) return NextResponse.redirect(`${origin}/admin`)
      if (roleLevel === 2) return NextResponse.redirect(`${origin}/admin/scanner`)
      if (paymentStatus === 'approved') return NextResponse.redirect(`${origin}/dashboard`)
      return NextResponse.redirect(`${origin}/payment`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
