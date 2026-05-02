'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAdminSupabase() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data } = await supabase.from('users').select('user_roles(permissions_level)').eq('id', user.id).single()
  const level = (data?.user_roles as any)?.permissions_level ?? 0
  if (level < 4) throw new Error('Forbidden: Admin access required')

  return supabase
}

export async function createCategory(formData: FormData) {
  const supabase = await getAdminSupabase()
  const title = (formData.get('title') as string)?.trim()
  const status = (formData.get('status') as string) || 'active'

  if (!title) throw new Error('Title is required')

  const { error } = await supabase.from('categories').insert({ title, status })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/categories')
  revalidatePath('/admin/events')
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await getAdminSupabase()
  const title = (formData.get('title') as string)?.trim()
  if (!title) throw new Error('Title is required')

  const { error } = await supabase.from('categories').update({ title }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/categories')
  revalidatePath('/admin/events')
}

export async function toggleCategoryStatus(id: string, currentStatus: string) {
  const supabase = await getAdminSupabase()
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

  const { error } = await supabase.from('categories').update({ status: newStatus }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/categories')
  revalidatePath('/admin/events')
  revalidatePath('/dashboard/events')
}

export async function deleteCategory(id: string) {
  const supabase = await getAdminSupabase()
  // Events with this category_id will have it set to NULL via ON DELETE SET NULL
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/categories')
  revalidatePath('/admin/events')
  revalidatePath('/dashboard/events')
}
