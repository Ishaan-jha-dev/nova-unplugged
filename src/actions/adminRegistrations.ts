'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { dissolveTeamInternal } from './teamRequests'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data } = await supabase.from('users').select('user_roles(permissions_level)').eq('id', user.id).single()
  const level = (data?.user_roles as any)?.permissions_level ?? 0
  if (level < 4) throw new Error('Forbidden: Admin access required')

  return user
}

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Admin kicks a user from an event.
 * If the user is in a team and removal drops below min size, dissolves the team.
 * @param forceDissolve - if true, dissolves the team instead of just removing user
 */
export async function kickUserFromEvent(
  userId: string, 
  eventId: string, 
  forceDissolve: boolean = false
): Promise<{ dissolved: boolean }> {
  await getAdminUser()
  const admin = getAdminClient()

  const { data: reg } = await admin.from('registrations').select('*').eq('user_id', userId).eq('event_id', eventId).maybeSingle()
  if (!reg) throw new Error('User is not registered for this event')

  if (reg.team_id) {
    const { data: event } = await admin.from('events').select('team_size_min').eq('id', eventId).single()
    const { count } = await admin.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', reg.team_id)

    const remaining = (count || 1) - 1
    const wouldDissolve = remaining === 0

    if (forceDissolve || wouldDissolve) {
      await dissolveTeamInternal(reg.team_id, admin)
      revalidatePath('/admin/registrations')
      return { dissolved: true }
    }

    // Just remove user
    await admin.from('team_members').delete().eq('team_id', reg.team_id).eq('user_id', userId)
    await admin.from('registrations').delete().eq('id', reg.id)
    await admin.from('team_join_requests').delete().eq('team_id', reg.team_id).eq('user_id', userId)
  } else {
    await admin.from('registrations').delete().eq('id', reg.id)
  }

  revalidatePath('/admin/registrations')
  return { dissolved: false }
}

/**
 * Check if kicking a user would dissolve their team (call before showing UI prompt)
 */
export async function checkKickWouldDissolve(userId: string, eventId: string): Promise<{ wouldDissolve: boolean; teamId: string | null }> {
  await getAdminUser()
  const admin = getAdminClient()

  const { data: reg } = await admin.from('registrations').select('team_id').eq('user_id', userId).eq('event_id', eventId).maybeSingle()
  if (!reg?.team_id) return { wouldDissolve: false, teamId: null }

  const { data: event } = await admin.from('events').select('team_size_min').eq('id', eventId).single()
  const { count } = await admin.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', reg.team_id)

  const remaining = (count || 1) - 1
  const wouldDissolve = remaining === 0
  return { wouldDissolve, teamId: reg.team_id }
}

/**
 * Admin directly dissolves a team — all members unregistered, team and data deleted
 */
export async function adminDissolveTeam(teamId: string): Promise<void> {
  await getAdminUser()
  const admin = getAdminClient()

  const { data: team } = await admin.from('teams').select('id').eq('id', teamId).single()
  if (!team) throw new Error('Team not found')

  await dissolveTeamInternal(teamId, admin)
  revalidatePath('/admin/registrations')
}
