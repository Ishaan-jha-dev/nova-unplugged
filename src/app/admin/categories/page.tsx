import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CategoriesClient } from './CategoriesClient'

export const metadata: Metadata = { title: 'Categories | Admin' }

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('user_roles(permissions_level)').eq('id', user.id).single()
  const roleLevel = (userData?.user_roles as any)?.permissions_level ?? 1
  if (roleLevel < 4) redirect('/admin')

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all categories with event count per category
  const { data: categories } = await admin.from('categories').select('*').order('title')
  
  // Get event count per category
  const { data: eventCounts } = await admin.from('events').select('category_id')
  
  const countMap: Record<string, number> = {}
  for (const ev of eventCounts || []) {
    if (ev.category_id) {
      countMap[ev.category_id] = (countMap[ev.category_id] || 0) + 1
    }
  }

  return (
    <CategoriesClient 
      categories={categories || []} 
      eventCountMap={countMap} 
    />
  )
}
