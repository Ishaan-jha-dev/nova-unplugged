'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, userId: user.id }
}

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Student sends a request to join a team (requires leader approval)
 */
export async function createJoinRequest(teamId: string) {
  const { userId } = await getAuthUser()
  const admin = getAdminClient()

  // Check team exists and is active
  const { data: team } = await admin.from('teams').select('id, event_id, status, is_open').eq('id', teamId).single()
  if (!team || team.status === 'dissolved') throw new Error('Team not found or dissolved')
  if (!team.is_open) throw new Error('This team is not accepting requests')

  // Check deadline
  const { data: event } = await admin.from('events').select('deadline').eq('id', team.event_id).single()
  if (event?.deadline && new Date(event.deadline) < new Date()) throw new Error('Registration deadline has passed')

  // Check not already in a team for this event
  const { data: existing } = await admin.from('registrations').select('id').eq('user_id', userId).eq('event_id', team.event_id).maybeSingle()
  if (existing) throw new Error('You are already registered for this event')

  // Check team max size
  const { count } = await admin.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId)
  const { data: ev } = await admin.from('events').select('team_size_max').eq('id', team.event_id).single()
  if (ev?.team_size_max && (count || 0) >= ev.team_size_max) throw new Error('Team is full')

  // Check not already sent request
  const { data: existingReq } = await admin.from('team_join_requests').select('id, status').eq('team_id', teamId).eq('user_id', userId).maybeSingle()
  if (existingReq) {
    if (existingReq.status === 'pending') throw new Error('You already have a pending request for this team')
    if (existingReq.status === 'accepted') throw new Error('Your request was already accepted')
    // If rejected, allow re-request by updating
    await admin.from('team_join_requests').update({ status: 'pending' }).eq('id', existingReq.id)
  } else {
    const { error } = await admin.from('team_join_requests').insert({ team_id: teamId, user_id: userId })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard/events')
}

/**
 * Team leader accepts or rejects a join request
 * On accept: adds user to team_members + creates registration
 */
export async function respondToJoinRequest(requestId: string, action: 'accepted' | 'rejected') {
  const { supabase, userId } = await getAuthUser()
  const admin = getAdminClient()

  // Get the request with team and event details
  const { data: req, error: fetchErr } = await admin
    .from('team_join_requests')
    .select('*, teams(id, leader_id, event_id, events(team_size_max))')
    .eq('id', requestId)
    .single()

  if (fetchErr || !req) throw new Error('Request not found or database error')

  // Verify caller is the team leader
  const team = req.teams as any
  if (team?.leader_id !== userId) throw new Error('Only the team leader can respond to requests')

  if (action === 'accepted') {
    const event_id = team?.event_id
    const team_size_max = team?.events?.team_size_max

    // Check team not full
    const { count, error: countErr } = await admin
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', req.team_id)
    
    if (countErr) throw new Error('Failed to verify team size')
    if (team_size_max && (count || 0) >= team_size_max) throw new Error('Team is already full')

    // Add to team_members
    const { error: memberErr } = await admin.from('team_members').insert({ team_id: req.team_id, user_id: req.user_id })
    if (memberErr && !memberErr.message.includes('duplicate')) throw new Error('Failed to add member to team')

    // Create registration
    const { error: regErr } = await admin.from('registrations').insert({ user_id: req.user_id, event_id, team_id: req.team_id })
    if (regErr && !regErr.message.includes('duplicate')) throw new Error('Failed to register member for event')
  }

  // Update request status
  await admin.from('team_join_requests').update({ status: action }).eq('id', requestId)

  revalidatePath('/dashboard/events')
}

/**
 * Student withdraws from an event (individual or team)
 * If team withdrawal drops below min size → dissolve the team
 */
export async function withdrawFromEvent(eventId: string) {
  const { userId } = await getAuthUser()
  const admin = getAdminClient()

  // Get registration
  const { data: reg } = await admin.from('registrations').select('*').eq('user_id', userId).eq('event_id', eventId).maybeSingle()
  if (!reg) throw new Error('You are not registered for this event')

  if (reg.team_id) {
    // Team event — check if withdrawal dissolves the team
    const { data: event } = await admin.from('events').select('team_size_min').eq('id', eventId).single()
    const { count: memberCount } = await admin.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', reg.team_id)

    const remainingAfterLeave = (memberCount || 1) - 1
    if (event?.team_size_min && remainingAfterLeave < event.team_size_min) {
      // Must dissolve — this is signalled back to client via error with special code
      // Client should have already confirmed with user before calling this
      await dissolveTeamInternal(reg.team_id, admin)
      return { dissolved: true }
    }

    // Just remove user from team
    await admin.from('team_members').delete().eq('team_id', reg.team_id).eq('user_id', userId)
    await admin.from('registrations').delete().eq('id', reg.id)
    await admin.from('team_join_requests').delete().eq('team_id', reg.team_id).eq('user_id', userId)
  } else {
    // Individual event
    await admin.from('registrations').delete().eq('id', reg.id)
  }

  revalidatePath('/dashboard/events')
  return { dissolved: false }
}

/**
 * Internal dissolve logic reused by multiple actions
 */
export async function dissolveTeamInternal(teamId: string, adminClient: any) {
  // Get all team members
  const { data: members } = await adminClient.from('team_members').select('user_id').eq('team_id', teamId)
  const userIds = (members || []).map((m: any) => m.user_id)

  // Delete all registrations for this team
  await adminClient.from('registrations').delete().eq('team_id', teamId)

  // Delete all team_members
  await adminClient.from('team_members').delete().eq('team_id', teamId)

  // Delete all pending join requests
  await adminClient.from('team_join_requests').delete().eq('team_id', teamId)

  // Delete the team itself
  await adminClient.from('teams').delete().eq('id', teamId)

  return userIds
}

/**
 * Check if withdrawal would dissolve the team (call this before withdrawFromEvent to show prompt)
 */
export async function checkWithdrawalWouldDissolve(eventId: string, userId: string): Promise<boolean> {
  const admin = getAdminClient()

  const { data: reg } = await admin.from('registrations').select('team_id').eq('user_id', userId).eq('event_id', eventId).maybeSingle()
  if (!reg?.team_id) return false

  const { data: event } = await admin.from('events').select('team_size_min').eq('id', eventId).single()
  const { count } = await admin.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', reg.team_id)

  const remaining = (count || 1) - 1
  return !!(event?.team_size_min && remaining < event.team_size_min)
}
