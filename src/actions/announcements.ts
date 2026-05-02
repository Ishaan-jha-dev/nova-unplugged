'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase.from('users').select('*, user_roles(permissions_level)').eq('id', user.id).single()
  const roleLevel = (userData?.user_roles as any)?.permissions_level || 0
  if (roleLevel < 3) throw new Error('Forbidden')

  const title = formData.get('title') as string
  const body = formData.get('body') as string
  const target_audience = formData.get('target_audience') as string || null
  const image = formData.get('image') as File | null

  let image_url = null
  if (image && image.size > 0) {
    const ext = image.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const { error: uploadError } = await supabase.storage.from('announcements').upload(filename, image)
    if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)
    const { data } = supabase.storage.from('announcements').getPublicUrl(filename)
    image_url = data.publicUrl
  }

  const { error } = await supabase.from('announcements').insert({
    title,
    body,
    target_audience,
    image_url,
    posted_by: user.id
  })

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/announcements')
  revalidatePath('/dashboard')
  revalidatePath('/admin/announcements')
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase.from('users').select('*, user_roles(permissions_level)').eq('id', user.id).single()
  const roleLevel = (userData?.user_roles as any)?.permissions_level || 0
  if (roleLevel < 3) throw new Error('Forbidden')

  const title = formData.get('title') as string
  const body = formData.get('body') as string
  const target_audience = formData.get('target_audience') as string || null
  const image = formData.get('image') as File | null
  const existingImageUrl = formData.get('existing_image_url') as string || null
  
  let image_url = existingImageUrl

  if (image && image.size > 0) {
    const ext = image.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const { error: uploadError } = await supabase.storage.from('announcements').upload(filename, image)
    if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)
    const { data } = supabase.storage.from('announcements').getPublicUrl(filename)
    image_url = data.publicUrl
  }

  const { error } = await supabase.from('announcements').update({
    title,
    body,
    target_audience,
    image_url
  }).eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  revalidatePath('/dashboard')
  revalidatePath('/admin/announcements')
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase.from('users').select('*, user_roles(permissions_level)').eq('id', user.id).single()
  const roleLevel = (userData?.user_roles as any)?.permissions_level || 0
  if (roleLevel < 3) throw new Error('Forbidden')

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  revalidatePath('/dashboard')
  revalidatePath('/admin/announcements')
}
