import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { RegistrationsClient } from './RegistrationsClient'

export const metadata: Metadata = { title: 'Registrations | Admin' }

const PAGE_SIZE = 15

export default async function RegistrationsPage(props: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('user_roles(permissions_level)').eq('id', user.id).single()
  const roleLevel = (userData?.user_roles as any)?.permissions_level ?? 1
  if (roleLevel < 3) redirect('/admin')

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const selectedCategory = searchParams.category || 'all'
  const page = parseInt(searchParams.page || '1', 10)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // 1. Fetch all active categories for the filter tabs
  const { data: categories } = await admin.from('categories').select('*').order('title')

  // 2. Stats — total unique students (deduped, avoids double count)
  const { count: totalUnique } = await admin
    .from('registrations')
    .select('user_id', { count: 'exact', head: true })
  // Note: Supabase doesn't natively support COUNT(DISTINCT) in the client SDK's select().
  // We fetch unique user_ids via a workaround query below.
  const { data: uniqueUserRows } = await admin
    .from('registrations')
    .select('user_id')
  const uniqueStudentCount = new Set((uniqueUserRows || []).map((r: any) => r.user_id)).size

  // 3. Per-event registration counts
  const { data: allRegCounts } = await admin.from('registrations').select('event_id')
  const perEventCount: Record<string, number> = {}
  for (const r of allRegCounts || []) {
    perEventCount[r.event_id] = (perEventCount[r.event_id] || 0) + 1
  }

  // 4. Paginated registrations, filtered by category
  let regQuery = admin
    .from('registrations')
    .select(`
      *,
      users(full_name, email),
      events!inner(id, title, category_id, participation_type, categories(id, title)),
      teams(name, join_code)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (selectedCategory !== 'all') {
    // Filter via the joined events → category_id
    regQuery = regQuery.eq('events.category_id', selectedCategory)
  }

  const { data: registrations, count: totalCount } = await regQuery

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE)

  return (
    <RegistrationsClient
      registrations={registrations || []}
      categories={categories || []}
      selectedCategory={selectedCategory}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount || 0}
      uniqueStudentCount={uniqueStudentCount}
      perEventCount={perEventCount}
      adminRoleLevel={roleLevel}
    />
  )
}
