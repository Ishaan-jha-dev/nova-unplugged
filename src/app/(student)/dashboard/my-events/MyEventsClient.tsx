'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatIST } from '@/lib/utils/dateUtils'
import { MapPin, Clock, Users, Crown, Copy, Check, ExternalLink, UserMinus, Lock, Unlock, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryBadge, ParticipationBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { respondToJoinRequest } from '@/actions/teamRequests'

interface MyEventsClientProps {
  registrations: any[]
  userId: string
}

export function MyEventsClient({ registrations, userId }: MyEventsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showLeaderPanel, setShowLeaderPanel] = useState<string | null>(null)
  const [leaderRequests, setLeaderRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [requestConfirm, setRequestConfirm] = useState<{ id: string; action: 'accepted' | 'rejected'; name: string } | null>(null)

  const loadLeaderRequests = async (teamId: string) => {
    setLoadingRequests(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('team_join_requests').select('*, users(full_name, email)').eq('team_id', teamId).eq('status', 'pending')
    setLeaderRequests(data || [])
    setLoadingRequests(false)
  }

  const handleRespondRequest = (requestId: string, action: 'accepted' | 'rejected') => {
    startTransition(async () => {
      try {
        await respondToJoinRequest(requestId, action)
        setLeaderRequests(prev => prev.filter(r => r.id !== requestId))
        setRequestConfirm(null)
        router.refresh()
      } catch (err: any) { alert(err.message) }
    })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleTeamOpen = (teamId: string, current: boolean) => {
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      await supabase.from('teams').update({ is_open: !current }).eq('id', teamId)
      router.refresh()
    })
  }

  const removeMember = (teamId: string, memberId: string, eventId: string) => {
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', memberId)
      await supabase.from('registrations').delete().eq('user_id', memberId).eq('event_id', eventId)
      router.refresh()
    })
  }

  if (registrations.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-display font-bold text-3xl text-nova-text mb-8">My Events</h1>
        <div className="text-center py-20 glass rounded-2xl border border-nova-primary/20">
          <p className="text-5xl mb-4">🎭</p>
          <p className="text-nova-text-dim text-lg mb-3">You haven&apos;t registered for any events yet</p>
          <a href="/dashboard/events" className="text-nova-primary hover:underline">Browse events →</a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-nova-text mb-1">My Events</h1>
        <p className="text-nova-text-dim text-sm">{registrations.length} event{registrations.length !== 1 ? 's' : ''} registered</p>
      </div>

      <div className="flex flex-col gap-6">
        {registrations.map(reg => {
          const event = reg.events
          const team = reg.teams
          const isLeader = team?.leader_id === userId

          return (
            <div key={reg.id} className="glass rounded-2xl border border-nova-primary/20 overflow-hidden hover:border-nova-primary/40 transition-all">
              {/* Event banner strip */}
              <div className="h-2 bg-gradient-to-r from-nova-primary to-nova-accent" />

              <div className="p-6">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <h2 className="font-display font-semibold text-xl text-nova-text mb-2">{event?.title}</h2>
                    <div className="flex gap-2 flex-wrap">
                      {event?.categories?.title && <CategoryBadge category={event.categories.title} />}
                      <ParticipationBadge type={event?.participation_type} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-nova-muted">
                    {event?.venue && <span className="flex items-center gap-1"><MapPin size={11} />{event.venue}</span>}
                    {event?.event_date && <span className="flex items-center gap-1"><Clock size={11} />{event.event_date}{event.start_time ? ` · ${event.start_time}` : ''}</span>}
                  </div>
                </div>

                {/* Group join link */}
                {event?.group_join_link && (
                  <a
                    href={event.group_join_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-nova-accent hover:text-nova-accent-light transition-colors mb-4"
                  >
                    <ExternalLink size={12} /> Join WhatsApp / Telegram Group
                  </a>
                )}

                {/* Team info */}
                {team && (
                  <div className="mt-2 p-4 rounded-xl bg-white/3 border border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-nova-primary/20 border border-nova-primary/30 flex items-center justify-center">
                          <Users size={18} className="text-nova-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-nova-text">{team.name}</p>
                          <p className="text-nova-muted text-xs">
                            {isLeader ? '👑 You are the team leader' : `Led by ${team.users?.full_name}`}
                          </p>
                        </div>
                      </div>

                      {/* Join code */}
                      <div className="flex items-center gap-2">
                        <div className="glass rounded-lg px-3 py-1.5 border border-nova-primary/30 flex items-center gap-2">
                          <span className="text-nova-muted text-xs">Code:</span>
                          <span className="font-display font-bold text-nova-primary tracking-widest">{team.join_code}</span>
                          <button onClick={() => copyCode(team.join_code)} className="text-nova-muted hover:text-nova-primary transition-colors ml-1">
                            {copiedCode === team.join_code ? <Check size={13} className="text-nova-success" /> : <Copy size={13} />}
                          </button>
                        </div>
                        {isLeader && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={team.is_open ? <Lock size={14} /> : <Unlock size={14} />}
                            loading={isPending}
                            onClick={() => toggleTeamOpen(team.id, team.is_open)}
                            title={team.is_open ? 'Close team' : 'Open team'}
                          >
                            {team.is_open ? 'Close' : 'Open'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Members */}
                    <div className="flex flex-wrap gap-2">
                      {team.team_members?.map((member: any) => (
                        <div key={member.user_id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                          <div className="w-6 h-6 rounded-full bg-nova-primary/30 flex items-center justify-center text-xs font-bold text-nova-primary font-display">
                            {member.users?.full_name?.[0]}
                          </div>
                          <span className="text-nova-text text-xs">{member.users?.full_name}</span>
                          {member.user_id === team.leader_id && <Crown size={11} className="text-nova-warning" />}
                          {isLeader && member.user_id !== userId && (
                            <button
                              onClick={() => removeMember(team.id, member.user_id, event.id)}
                              className="text-nova-muted hover:text-red-400 transition-colors ml-1"
                              title="Remove member"
                            >
                              <UserMinus size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {!team.is_open && (
                      <p className="text-xs text-nova-muted mt-3 flex items-center gap-1"><Lock size={11} /> Team is closed — not accepting new members</p>
                    )}

                    {isLeader && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <Button variant="ghost" size="sm" fullWidth icon={showLeaderPanel === team.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          onClick={() => {
                            if (showLeaderPanel === team.id) { setShowLeaderPanel(null) }
                            else { setShowLeaderPanel(team.id); loadLeaderRequests(team.id) }
                          }}>
                          Manage Join Requests
                        </Button>
                        {showLeaderPanel === team.id && (
                          <div className="mt-3 bg-black/20 rounded-xl p-4 border border-white/5">
                            <p className="text-xs text-nova-muted font-medium uppercase tracking-widest mb-3">Pending Join Requests</p>
                            {loadingRequests ? <p className="text-nova-muted text-sm">Loading...</p> :
                              leaderRequests.length === 0 ? <p className="text-nova-muted text-sm">No pending requests</p> :
                              leaderRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 mb-2 border border-white/10">
                                  <div>
                                    <p className="text-nova-text text-sm font-medium">{(req.users as any)?.full_name}</p>
                                    <p className="text-nova-muted text-xs">{(req.users as any)?.email}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="success" size="sm" onClick={() => setRequestConfirm({ id: req.id, action: 'accepted', name: (req.users as any)?.full_name || 'this user' })}>Accept</Button>
                                    <Button variant="danger" size="sm" onClick={() => setRequestConfirm({ id: req.id, action: 'rejected', name: (req.users as any)?.full_name || 'this user' })}>Reject</Button>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Join Request Confirm Modal */}
      <Modal open={!!requestConfirm} onClose={() => setRequestConfirm(null)} size="sm" title={`${requestConfirm?.action === 'accepted' ? 'Accept' : 'Reject'} Request`}>
        {requestConfirm && (
          <div className="flex flex-col gap-4">
            <p className="text-nova-text-dim text-sm">
              Are you sure you want to {requestConfirm.action} the request from <strong className="text-nova-text">{requestConfirm.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setRequestConfirm(null)}>Cancel</Button>
              <Button variant={requestConfirm.action === 'accepted' ? 'success' : 'danger'} fullWidth loading={isPending} onClick={() => handleRespondRequest(requestConfirm.id, requestConfirm.action)}>
                Yes, {requestConfirm.action === 'accepted' ? 'Accept' : 'Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
