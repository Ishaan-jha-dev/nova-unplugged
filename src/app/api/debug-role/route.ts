import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ status: 'not_logged_in', userError })
    }

    // Test anon key query (what middleware used to use)
    const { data: anonData, error: anonError } = await supabase
      .from('users')
      .select('payment_status, role_id, user_roles(name, permissions_level)')
      .eq('id', user.id)
      .single()

    // Test service role key query (what middleware now uses)
    const cookieStore = await cookies()
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const isPlaceholder = !serviceKey || serviceKey === 'your_service_role_key'

    let serviceData = null
    let serviceError = null

    if (!isPlaceholder) {
      const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey!,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
      )
      const result = await adminClient
        .from('users')
        .select('payment_status, role_id, user_roles(name, permissions_level)')
        .eq('id', user.id)
        .single()
      serviceData = result.data
      serviceError = result.error
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      serviceKeyConfigured: !isPlaceholder,
      anonQuery: { data: anonData, error: anonError?.message },
      serviceRoleQuery: { data: serviceData, error: serviceError?.message },
    })
  } catch (e: any) {
    return NextResponse.json({ criticalError: e.message })
  }
}
