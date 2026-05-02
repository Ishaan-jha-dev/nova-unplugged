'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatIST } from '@/lib/utils/dateUtils'
import { Search, MapPin, Clock, Users, Phone, ExternalLink, BookOpen, Check, Plus, LogIn, X, Bell, AlertCircle, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ParticipationBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { createJoinRequest, respondToJoinRequest, withdrawFromEvent, checkWithdrawalWouldDissolve } from '@/actions/teamRequests'
import type { EventRow, CategoryRow } from '@/lib/supabase/types'

interface EventsClientProps {
  events: (EventRow & { categories?: { id: string; title: string; status: string } | null })[]
  categories: CategoryRow[]
  registeredEventIds: string[]
  registeredTeamIds: Record<string, string>
  requestStatusByTeam: Record<string, string>
  requestStatusByEvent: Record<string, { status: string; teamId: string }>
  userId: string
}

function isDeadlinePassed(deadline: string | null): boolean {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

export function EventsClient({
  events, categories, registeredEventIds, registeredTeamIds,
  requestStatusByTeam, requestStatusByEvent, userId
}: EventsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<(typeof events)[0] | null>(null)
  const [teamModal, setTeamModal] = useState<'create' | 'browse' | null>(null)
  const [teamName, setTeamName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [browseTeams, setBrowseTeams] = useState<any[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [registeredIds, setRegisteredIds] = useState(new Set(registeredEventIds))
  const [withdrawConfirm, setWithdrawConfirm] = useState<{ eventId: string; wouldDissolve: boolean } | null>(null)
  const [showLeaderPanel, setShowLeaderPanel] = useState<string | null>(null)
  const [leaderRequests, setLeaderRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const filtered = useMemo(() => events.filter(e => {
    const matchesTab = tab === 'all' ? true : e.category_id === tab
    const matchesSearch = search === '' ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  }), [events, tab, search])

  const handleRegisterIndividual = (eventId: string) => {
    setActionError(null)
    startTransition(async () => {
      const supabase = createClient() as any
      const { error } = await supabase.from('registrations').insert({ user_id: userId, event_id: eventId })
      if (error) { setActionError(error.message); return }
      setRegisteredIds(prev => new Set(Array.from(prev).concat(eventId)))
      setSelectedEvent(null)
      router.refresh()
    })
  }

  const handleCreateTeam = (eventId: string) => {
    if (!teamName.trim()) { setActionError('Team name is required'); return }
    setActionError(null)
    startTransition(async () => {
      const supabase = createClient() as any
      const { data: team, error: teamErr } = await supabase
        .from('teams').insert({ event_id: eventId, name: teamName.trim(), leader_id: userId }).select().single()
      if (teamErr || !team) { setActionError(teamErr?.message || 'Team creation failed'); return }
      await supabase.from('team_members').insert({ team_id: team.id, user_id: userId })
      const { error: regErr } = await supabase.from('registrations').insert({ user_id: userId, event_id: eventId, team_id: team.id })
      if (regErr) { setActionError(regErr.message); return }
      setRegisteredIds(prev => new Set(Array.from(prev).concat(eventId)))
      setTeamModal(null); setSelectedEvent(null); setTeamName('')
      router.refresh()
    })
  }

  const handleJoinByCode = (eventId: string) => {
    if (!joinCode.trim()) { setActionError('Enter a join code'); return }
    setActionError(null)
    startTransition(async () => {
      const supabase = createClient() as any
      const { data: team, error: teamErr } = await supabase
        .from('teams').select('*').eq('event_id', eventId).eq('join_code', joinCode.toUpperCase().trim()).eq('is_open', true).single()
      if (teamErr || !team) { setActionError('Invalid or closed team code'); return }
      await supabase.from('team_members').insert({ team_id: team.id, user_id: userId })
      const { error: regErr } = await supabase.from('registrations').insert({ user_id: userId, event_id: eventId, team_id: team.id })
      if (regErr) { setActionError(regErr.message); return }
      setRegisteredIds(prev => new Set(Array.from(prev).concat(eventId)))
      setTeamModal(null); setSelectedEvent(null); setJoinCode('')
      router.refresh()
    })
  }

  const handleRequestJoin = (teamId: string) => {
    setActionError(null)
    startTransition(async () => {
      try {
        await createJoinRequest(teamId)
        router.refresh()
      } catch (err: any) { setActionError(err.message) }
    })
  }

  const loadBrowseTeams = async (eventId: string) => {
    setLoadingTeams(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('teams').select('*, team_members(count), users!leader_id(full_name)')
      .eq('event_id', eventId).eq('is_open', true).eq('status', 'active')
    setBrowseTeams(data || [])
    setLoadingTeams(false)
  }

  const handleWithdrawClick = async (eventId: string) => {
    startTransition(async () => {
      const wouldDissolve = await checkWithdrawalWouldDissolve(eventId, userId)
      setWithdrawConfirm({ eventId, wouldDissolve })
    })
  }

  const confirmWithdraw = () => {
    if (!withdrawConfirm) return
    startTransition(async () => {
      try {
        await withdrawFromEvent(withdrawConfirm.eventId)
        setRegisteredIds(prev => { const s = new Set(Array.from(prev)); s.delete(withdrawConfirm.eventId); return s })
        setWithdrawConfirm(null)
        setSelectedEvent(null)
        router.refresh()
      } catch (err: any) { setActionError(err.message) }
    })
  }

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
        router.refresh()
      } catch (err: any) { alert(err.message) }
    })
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Events</h1>
        <p className="text-nova-text-dim text-sm">Browse and register for Nova Unplugged 2025 events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nova-muted" />
          <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="nova-input pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTab('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'all' ? 'bg-nova-primary text-white shadow-glow-sm' : 'glass text-nova-text-dim hover:text-nova-text hover:bg-white/8'}`}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setTab(cat.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === cat.id ? 'bg-nova-primary text-white shadow-glow-sm' : 'glass text-nova-text-dim hover:text-nova-text hover:bg-white/8'}`}>{cat.title}</button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20"><p className="text-nova-muted text-lg">No events found</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(event => {
            const isRegistered = registeredIds.has(event.id)
            const deadlinePassed = isDeadlinePassed(event.deadline)
            const pendingRequest = requestStatusByEvent[event.id]
            return (
              <div key={event.id} className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-nova-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-nova-primary/10 cursor-pointer group flex flex-col" onClick={() => { setSelectedEvent(event); setActionError(null) }}>
                <div className="h-44 bg-gradient-to-br from-nova-primary/20 to-nova-accent/10 relative overflow-hidden border-b border-white/5">
                  {event.banner_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.banner_url}`} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl opacity-20">{((Array.isArray(event.categories) ? event.categories[0] : event.categories) as any)?.title === 'Cultural' ? '🎭' : ((Array.isArray(event.categories) ? event.categories[0] : event.categories) as any)?.title === 'Technical' ? '💻' : ((Array.isArray(event.categories) ? event.categories[0] : event.categories) as any)?.title === 'Sports' ? '🏆' : ((Array.isArray(event.categories) ? event.categories[0] : event.categories) as any)?.title === 'Fun' ? '🎉' : '⚡'}</span></div>
                  }
                  {deadlinePassed && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded tracking-widest">REGISTRATION CLOSED</span></div>}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-2">
                      {((Array.isArray(event.categories) ? event.categories[0] : event.categories) as any)?.title && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-nova-primary/10 text-nova-primary border border-nova-primary/20">
                          {((Array.isArray(event.categories) ? event.categories[0] : event.categories) as any).title}
                        </span>
                      )}
                      <ParticipationBadge type={event.participation_type} />
                    </div>
                    {isRegistered && <span className="flex items-center gap-1 text-[10px] font-bold text-nova-success uppercase tracking-widest"><Check size={12} /> Joined</span>}
                    {!isRegistered && pendingRequest && pendingRequest.status === 'pending' && <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Requested</span>}
                  </div>
                  <h3 className="font-display font-bold text-lg text-nova-text group-hover:text-nova-primary transition-colors mb-2 line-clamp-1">{event.title}</h3>
                  {event.description && <p className="text-nova-text-dim text-sm line-clamp-2 mb-4 leading-relaxed">{event.description}</p>}
                  <div className="flex flex-col gap-2 text-xs text-nova-muted mb-5 mt-auto">
                    {event.venue && <span className="flex items-center gap-2"><div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center shrink-0"><MapPin size={12} className="text-nova-primary" /></div>{event.venue}</span>}
                    {event.event_date && <span className="flex items-center gap-2"><div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center shrink-0"><Clock size={12} className="text-nova-primary" /></div>{event.event_date}{event.start_time ? ` · ${event.start_time}` : ''}</span>}
                    {event.deadline && <span className={`flex items-center gap-2 ${deadlinePassed ? 'text-red-400' : 'text-nova-warning'}`}><AlertCircle size={12} />{deadlinePassed ? 'Closed' : `Closes: ${formatIST(event.deadline, 'MMM d, h:mm a')}`}</span>}
                  </div>
                  <Button variant={isRegistered ? 'success' : deadlinePassed ? 'ghost' : 'primary'} size="sm" fullWidth
                    className={isRegistered ? 'bg-nova-success/10 text-nova-success border-nova-success/20' : deadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}
                    icon={isRegistered ? <Check size={14} /> : deadlinePassed ? <X size={14} /> : <Plus size={14} />}
                    onClick={e => { e.stopPropagation(); if (!isRegistered && !deadlinePassed) setSelectedEvent(event) }}>
                    {isRegistered ? 'Registered' : deadlinePassed ? 'Closed' : 'View & Register'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Event Detail Modal */}
      <Modal open={!!selectedEvent} onClose={() => { setSelectedEvent(null); setTeamModal(null) }} size="lg" title={selectedEvent?.title}>
        {selectedEvent && (() => {
          const isRegistered = registeredIds.has(selectedEvent.id)
          const deadlinePassed = isDeadlinePassed(selectedEvent.deadline)
          const myTeamId = registeredTeamIds[selectedEvent.id]
          const isLeader = myTeamId && browseTeams.find(t => t.id === myTeamId && t.leader_id === userId)
          const pendingRequest = requestStatusByEvent[selectedEvent.id]

          return (
            <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
              {selectedEvent.banner_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${selectedEvent.banner_url}`} alt={selectedEvent.title} className="w-full h-48 object-cover rounded-xl" />
              )}
              <div className="flex gap-2 flex-wrap">
                {((Array.isArray(selectedEvent.categories) ? selectedEvent.categories[0] : selectedEvent.categories) as any)?.title && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-nova-primary/10 text-nova-primary border border-nova-primary/20">
                    {((Array.isArray(selectedEvent.categories) ? selectedEvent.categories[0] : selectedEvent.categories) as any).title}
                  </span>
                )}
                <ParticipationBadge type={selectedEvent.participation_type} />
                {selectedEvent.participation_type === 'team' && selectedEvent.team_size_max && (
                  <span className="badge-individual"><Users size={11} />{selectedEvent.team_size_min}–{selectedEvent.team_size_max} members</span>
                )}
              </div>
              {selectedEvent.description && <p className="text-nova-text-dim text-sm leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>}
              <div className="grid sm:grid-cols-2 gap-3">
                {selectedEvent.venue && <div className="flex items-center gap-2 text-sm text-nova-text-dim"><MapPin size={14} className="text-nova-primary shrink-0" />{selectedEvent.venue}</div>}
                {selectedEvent.event_date && <div className="flex items-center gap-2 text-sm text-nova-text-dim"><Clock size={14} className="text-nova-primary shrink-0" />{selectedEvent.event_date}{selectedEvent.start_time ? ` · ${selectedEvent.start_time}` : ''}</div>}
                {selectedEvent.organizer_name && <div className="flex items-center gap-2 text-sm text-nova-text-dim"><Phone size={14} className="text-nova-primary shrink-0" />{selectedEvent.organizer_name}</div>}
                {selectedEvent.deadline && <div className={`flex items-center gap-2 text-sm ${deadlinePassed ? 'text-red-400' : 'text-nova-warning'}`}><AlertCircle size={14} />{deadlinePassed ? 'Registration Closed' : `Closes: ${formatIST(selectedEvent.deadline, 'PPp')}`}</div>}
              </div>
              <div className="flex gap-3 flex-wrap">
                {selectedEvent.rulebook_url && <a href={selectedEvent.rulebook_url} target="_blank" rel="noreferrer" className="nova-btn-outline text-sm px-4 py-2 rounded-lg flex items-center gap-2"><BookOpen size={14} /> Rulebook</a>}
                {selectedEvent.group_join_link && <a href={selectedEvent.group_join_link} target="_blank" rel="noreferrer" className="nova-btn-accent text-sm px-4 py-2 rounded-lg flex items-center gap-2 text-white"><ExternalLink size={14} /> Join WhatsApp Group</a>}
              </div>
              {actionError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠ {actionError}</div>}

              {/* CTA Section */}
              {isRegistered ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-nova-success/10 border border-nova-success/30 text-nova-success font-semibold">
                    <Check size={18} /> Already Registered
                  </div>
                  {myTeamId && (
                    <Button variant="ghost" size="sm" fullWidth icon={showLeaderPanel === myTeamId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      onClick={() => {
                        if (showLeaderPanel === myTeamId) { setShowLeaderPanel(null) }
                        else { setShowLeaderPanel(myTeamId); loadLeaderRequests(myTeamId) }
                      }}>
                      Manage Join Requests
                    </Button>
                  )}
                  {showLeaderPanel === myTeamId && (
                    <div className="glass rounded-xl p-4 border border-nova-primary/20">
                      <p className="text-xs text-nova-muted font-medium uppercase tracking-widest mb-3">Pending Join Requests</p>
                      {loadingRequests ? <p className="text-nova-muted text-sm">Loading...</p> :
                        leaderRequests.length === 0 ? <p className="text-nova-muted text-sm">No pending requests</p> :
                        leaderRequests.map(req => (
                          <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 mb-2">
                            <div>
                              <p className="text-nova-text text-sm">{(req.users as any)?.full_name}</p>
                              <p className="text-nova-muted text-xs">{(req.users as any)?.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="success" size="sm" loading={isPending} onClick={() => handleRespondRequest(req.id, 'accepted')}>Accept</Button>
                              <Button variant="danger" size="sm" loading={isPending} onClick={() => handleRespondRequest(req.id, 'rejected')}>Reject</Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                  <Button variant="ghost" size="sm" fullWidth className="text-red-400 hover:bg-red-500/10" icon={<LogOut size={14} />} loading={isPending} onClick={() => handleWithdrawClick(selectedEvent.id)}>
                    Withdraw from Event
                  </Button>
                </div>
              ) : deadlinePassed ? (
                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold">
                  <AlertCircle size={18} /> Registration Closed
                </div>
              ) : pendingRequest && pendingRequest.status === 'pending' ? (
                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold">
                  <Bell size={18} /> Join Request Pending — awaiting leader approval
                </div>
              ) : selectedEvent.participation_type === 'individual' ? (
                <Button variant="primary" size="lg" fullWidth loading={isPending} onClick={() => handleRegisterIndividual(selectedEvent.id)}>Register for this Event</Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-nova-text-dim text-sm text-center">This is a team event. Choose an option:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="primary" icon={<Plus size={16} />} onClick={() => setTeamModal('create')}>Create Team</Button>
                    <Button variant="outline" icon={<LogIn size={16} />} onClick={() => { setTeamModal('browse'); loadBrowseTeams(selectedEvent.id) }}>Join a Team</Button>
                  </div>
                  {teamModal === 'create' && (
                    <div className="glass rounded-xl p-4 border border-nova-primary/30 flex flex-col gap-3 animate-slide-up">
                      <Input label="Team Name" placeholder="Enter team name" value={teamName} onChange={e => setTeamName(e.target.value)} />
                      <Button variant="accent" loading={isPending} onClick={() => handleCreateTeam(selectedEvent.id)}>Create & Register</Button>
                    </div>
                  )}
                  {teamModal === 'browse' && (
                    <div className="glass rounded-xl p-4 border border-nova-primary/30 flex flex-col gap-3 animate-slide-up">
                      <Input label="Have a join code?" placeholder="6-char code e.g. A1B2C3" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
                      <Button variant="outline" loading={isPending} onClick={() => handleJoinByCode(selectedEvent.id)}>Join by Code (Instant)</Button>
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-nova-muted text-xs mb-3">Or request to join an open team:</p>
                        {loadingTeams ? <p className="text-nova-muted text-sm text-center">Loading teams...</p> :
                          browseTeams.length === 0 ? <p className="text-nova-muted text-sm text-center">No open teams yet.</p> :
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                            {browseTeams.map(team => {
                              const reqStatus = requestStatusByTeam[team.id]
                              const count = (team.team_members as any)?.[0]?.count || 0
                              const isFull = selectedEvent.team_size_max && count >= selectedEvent.team_size_max
                              return (
                                <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                  <div>
                                    <p className="text-nova-text text-sm font-medium">{team.name}</p>
                                    <p className="text-nova-muted text-xs">Led by {(team.users as any)?.full_name} · {count} members{isFull ? ' · Full' : ''}</p>
                                  </div>
                                  {isFull ? <span className="text-xs text-nova-muted">Full</span> :
                                    reqStatus === 'pending' ? <span className="text-xs text-yellow-400 font-medium">Pending</span> :
                                    reqStatus === 'rejected' ? <span className="text-xs text-red-400 font-medium">Rejected</span> :
                                    <Button variant="outline" size="sm" loading={isPending} onClick={() => handleRequestJoin(team.id)}>Request</Button>
                                  }
                                </div>
                              )
                            })}
                          </div>
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* Withdraw Confirm Modal */}
      <Modal open={!!withdrawConfirm} onClose={() => setWithdrawConfirm(null)} size="sm" title="Withdraw from Event">
        {withdrawConfirm && (
          <div className="flex flex-col gap-4">
            {withdrawConfirm.wouldDissolve ? (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                ⚠ Leaving will dissolve your team as it will fall below the minimum size. All members will be unregistered. Are you sure?
              </div>
            ) : (
              <p className="text-nova-text-dim text-sm">Are you sure you want to withdraw? Your registration will be permanently deleted.</p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setWithdrawConfirm(null)}>Cancel</Button>
              <Button variant="danger" fullWidth loading={isPending} onClick={confirmWithdraw}>
                {withdrawConfirm.wouldDissolve ? 'Withdraw & Dissolve Team' : 'Withdraw'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
