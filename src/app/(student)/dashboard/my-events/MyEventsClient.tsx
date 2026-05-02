'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatIST } from '@/lib/utils/dateUtils'
import { MapPin, Clock, Users, Crown, Copy, Check, ExternalLink, UserMinus, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryBadge, ParticipationBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'

interface MyEventsClientProps {
  registrations: any[]
  userId: string
}

export function MyEventsClient({ registrations, userId }: MyEventsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
