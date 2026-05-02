import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/about', '/timeline', '/register', '/login', '/verify', '/auth/callback']
const ADMIN_SENIOR_ROUTES = ['/admin/payments', '/admin/users', '/admin/export']

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/auth/'))
}

// Helper: query DB using Service Role key to bypass RLS
async function getRoleFromDB(request: NextRequest, userId: string) {
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )

  // Step 1: Get the user's role_id and payment_status
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('payment_status, role_id')
    .eq('id', userId)
    .single()

  if (userError || !userData?.role_id) {
    console.log(`[DB] User query failed or no role_id: ${userError?.message}`)
    return { roleLevel: 1, paymentStatus: userData?.payment_status ?? 'pending' }
  }

  // Step 2: Get permissions_level from the role
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('permissions_level, name')
    .eq('id', userData.role_id)
    .limit(1)
    .maybeSingle()

  console.log(`[DB] role_id=${userData.role_id} name=${roleData?.name} permissions_level=${roleData?.permissions_level} roleError=${roleError?.message}`)

  return {
    roleLevel: roleData?.permissions_level ?? 1,
    paymentStatus: userData.payment_status ?? 'pending',
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js)$/)
  ) {
    return response
  }

  // Regular anon client for cookie management & auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verify session — getUser() is the secure way (validates with Supabase servers)
  const { data: { user } } = await supabase.auth.getUser()

  // No session → allow public, redirect others to login
  if (!user) {
    if (isPublicRoute(pathname)) return response
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ─── PERMAFIX: Always query DB for role using Service Role key ────────────
  const { roleLevel, paymentStatus } = await getRoleFromDB(request, user.id)

  // DIAGNOSTIC LOG — check your terminal to see these values
  console.log(`[MIDDLEWARE] user=${user.email} path=${pathname} roleLevel=${roleLevel} paymentStatus=${paymentStatus} serviceKey=${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20)}...`)

  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
  }

  // Login/Register Lockout for authenticated users
  if (pathname === '/login' || pathname === '/register') {
    return roleLevel >= 4 ? redirect('/admin') : redirect('/dashboard')
  }

  // ─── Level 4+: Admin / Super Admin — full access ─────────────────────────
  if (roleLevel >= 4) {
    // Total freedom. No forced redirects.
    return response
  }

  // ─── Level 3: OC Team — admin access except senior routes ────────────────
  if (roleLevel === 3) {
    if (pathname === '/') return redirect('/dashboard')
    const blocked = ADMIN_SENIOR_ROUTES.some(r => pathname.startsWith(r))
    if (blocked) return redirect('/admin')
    return response
  }

  // ─── Level 2: Volunteer — scanner only ───────────────────────────────────
  if (roleLevel === 2) {
    if (pathname === '/') return redirect('/dashboard')
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/scanner')) {
      return redirect('/admin/scanner')
    }
    return response
  }

  // ─── Level 1: Student — payment gate ─────────────────────────────────────
  // Redirect base URL to dashboard for regular users
  if (pathname === '/') {
    return redirect('/dashboard')
  }

  if (paymentStatus !== 'approved') {
    if (!pathname.startsWith('/payment')) return redirect('/payment')
    return response
  }
  
  if (pathname.startsWith('/admin')) return redirect('/dashboard')
  
  // Allow other public routes (like /about, /timeline) for authenticated users
  if (isPublicRoute(pathname)) return response
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
