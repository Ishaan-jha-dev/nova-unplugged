'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Search, MapPin, Clock, User, Users, Phone, Mail,
  ExternalLink, BookOpen, Check, Plus, LogIn, X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CategoryBadge, ParticipationBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { EventRow } from '@/lib/supabase/types'

type Tab = 'all' | 'individual' | 'team' | 'cultural' | 'technical' | 'sports' | 'fun'

interface EventsClientProps {
  events: EventRow[]
  registeredEventIds: string[]
  userId: string
}

export function EventsClient({ events, registeredEventIds, userId }: EventsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null)
  const [teamModal, setTeamModal] = useState<'create' | 'browse' | null>(null)
  const [teamName, setTeamName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [browseTeams, setBrowseTeams] = useState<any[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [registeredIds, setRegisteredIds] = useState(new Set(registeredEventIds))

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'individual', label: '👤 Individual' },
    { key: 'team',       label: '👥 Team' },
    { key: 'cultural',   label: '🎭 Cultural' },
    { key: 'technical',  label: '💻 Technical' },
    { key: 'sports',     label: '🏆 Sports' },
    { key: 'fun',        label: '🎉 Fun' },
  ]

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchesTab =
        tab === 'all'        ? true :
        tab === 'individual' ? e.participation_type === 'individual' :
        tab === 'team'       ? e.participation_type === 'team' :
        e.category === tab
      const matchesSearch = search === '' ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(search.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [events, tab, search])

  const handleRegisterIndividual = (eventId: string) => {
    setActionError(null)
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { error } = await supabase
        .from('registrations')
        .insert({ user_id: userId, event_id: eventId })
      if (error) {
        setActionError(error.message)
      } else {
        setRegisteredIds(prev => { const s = new Set(Array.from(prev)); s.add(eventId); return s })
        setSelectedEvent(null)
        router.refresh()
      }
    })
  }

  const handleCreateTeam = (eventId: string) => {
    if (!teamName.trim()) { setActionError('Team name is required'); return }
    setActionError(null)
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .insert({ event_id: eventId, name: teamName.trim(), leader_id: userId })
        .select()
        .single()
      if (teamErr || !team) { setActionError(teamErr?.message || 'Team creation failed'); return }

      await supabase.from('team_members').insert({ team_id: team.id, user_id: userId })

      const { error: regErr } = await supabase
        .from('registrations')
        .insert({ user_id: userId, event_id: eventId, team_id: team.id })
      if (regErr) { setActionError(regErr.message); return }

      setRegisteredIds(prev => { const s = new Set(Array.from(prev)); s.add(eventId); return s })
      setTeamModal(null)
      setSelectedEvent(null)
      setTeamName('')
      router.refresh()
    })
  }

  const loadBrowseTeams = async (eventId: string) => {
    setLoadingTeams(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('teams')
      .select('*, team_members(count), users!leader_id(full_name)')
      .eq('event_id', eventId)
      .eq('is_open', true)
    setBrowseTeams(data || [])
    setLoadingTeams(false)
  }

  const handleJoinTeamByCode = (eventId: string) => {
    if (!joinCode.trim()) { setActionError('Enter a join code'); return }
    setActionError(null)
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', eventId)
        .eq('join_code', joinCode.toUpperCase().trim())
        .eq('is_open', true)
        .single()
      if (teamErr || !team) { setActionError('Invalid or closed team code'); return }

      await supabase.from('team_members').insert({ team_id: team.id, user_id: userId })
      const { error: regErr } = await supabase
        .from('registrations')
        .insert({ user_id: userId, event_id: eventId, team_id: team.id })
      if (regErr) { setActionError(regErr.message); return }

      setRegisteredIds(prev => { const s = new Set(Array.from(prev)); s.add(eventId); return s })
      setTeamModal(null)
      setSelectedEvent(null)
      setJoinCode('')
      router.refresh()
    })
  }

  const handleJoinTeamById = (teamId: string, eventId: string) => {
    setActionError(null)
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      await supabase.from('team_members').insert({ team_id: teamId, user_id: userId })
      const { error: regErr } = await supabase
        .from('registrations')
        .insert({ user_id: userId, event_id: eventId, team_id: teamId })
      if (regErr) { setActionError(regErr.message); return }

      setRegisteredIds(prev => { const s = new Set(Array.from(prev)); s.add(eventId); return s })
      setTeamModal(null)
      setSelectedEvent(null)
      router.refresh()
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
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="nova-input pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-nova-primary text-white shadow-glow-sm'
                  : 'glass text-nova-text-dim hover:text-nova-text hover:bg-white/8'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-nova-muted text-lg">No events found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(event => {
            const isRegistered = registeredIds.has(event.id)
            return (
              <div
                key={event.id}
                className="glass rounded-2xl overflow-hidden border border-nova-primary/15 hover:border-nova-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-sm cursor-pointer group flex flex-col"
                onClick={() => { setSelectedEvent(event); setActionError(null) }}
              >
                {/* Banner */}
                <div className="h-36 bg-gradient-to-br from-nova-primary/30 to-nova-accent/20 relative overflow-hidden">
                  {event.banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.banner_url}`} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl opacity-40">
                        {event.category === 'cultural' ? '🎭' : event.category === 'technical' ? '💻' : event.category === 'sports' ? '🏆' : event.category === 'fun' ? '🎉' : '⚡'}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <CategoryBadge category={event.category} />
                    <ParticipationBadge type={event.participation_type} />
                  </div>
                  {isRegistered && (
                    <div className="absolute top-3 right-3 bg-nova-success/90 text-nova-navy text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Check size={10} /> Registered
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h3 className="font-display font-semibold text-nova-text group-hover:text-nova-primary transition-colors">{event.title}</h3>
                  {event.description && (
                    <p className="text-nova-text-dim text-sm line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-col gap-1.5 text-xs text-nova-muted mt-auto">
                    {event.venue && (
                      <span className="flex items-center gap-1.5"><MapPin size={11} />{event.venue}</span>
                    )}
                    {event.start_time && (
                      <span className="flex items-center gap-1.5"><Clock size={11} />{format(new Date(event.start_time), 'MMM d, h:mm a')}</span>
                    )}
                    {event.organizer_name && (
                      <span className="flex items-center gap-1.5"><User size={11} />{event.organizer_name}</span>
                    )}
                  </div>
                  <Button
                    variant={isRegistered ? 'success' : 'primary'}
                    size="sm"
                    fullWidth
                    icon={isRegistered ? <Check size={14} /> : <Plus size={14} />}
                    onClick={e => { e.stopPropagation(); if (!isRegistered) setSelectedEvent(event) }}
                  >
                    {isRegistered ? 'Registered' : 'Register'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Event detail modal */}
      <Modal open={!!selectedEvent} onClose={() => { setSelectedEvent(null); setTeamModal(null) }} size="lg" title={selectedEvent?.title}>
        {selectedEvent && (
          <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
            {/* Banner */}
            {selectedEvent.banner_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${selectedEvent.banner_url}`}
                alt={selectedEvent.title}
                className="w-full h-48 object-cover rounded-xl"
              />
            )}

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <CategoryBadge category={selectedEvent.category} />
              <ParticipationBadge type={selectedEvent.participation_type} />
              {selectedEvent.participation_type === 'team' && selectedEvent.team_size_max && (
                <span className="badge-individual"><Users size={11} />{selectedEvent.team_size_min}–{selectedEvent.team_size_max} members</span>
              )}
            </div>

            {/* Description */}
            {selectedEvent.description && (
              <p className="text-nova-text-dim text-sm leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
            )}

            {/* Details */}
            <div className="grid sm:grid-cols-2 gap-3">
              {selectedEvent.venue && (
                <div className="flex items-center gap-2 text-sm text-nova-text-dim">
                  <MapPin size={14} className="text-nova-primary shrink-0" />
                  {selectedEvent.venue}
                </div>
              )}
              {selectedEvent.start_time && (
                <div className="flex items-center gap-2 text-sm text-nova-text-dim">
                  <Clock size={14} className="text-nova-primary shrink-0" />
                  {format(new Date(selectedEvent.start_time), 'PPp')}
                </div>
              )}
              {selectedEvent.organizer_name && (
                <div className="flex items-center gap-2 text-sm text-nova-text-dim">
                  <User size={14} className="text-nova-primary shrink-0" />
                  {selectedEvent.organizer_name}
                </div>
              )}
              {selectedEvent.organizer_contact && (
                <div className="flex items-center gap-2 text-sm text-nova-text-dim">
                  <Phone size={14} className="text-nova-primary shrink-0" />
                  {selectedEvent.organizer_contact}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-3 flex-wrap">
              {selectedEvent.rulebook_url && (
                <a href={selectedEvent.rulebook_url} target="_blank" rel="noreferrer" className="nova-btn-outline text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                  <BookOpen size={14} /> Rulebook
                </a>
              )}
              {selectedEvent.group_join_link && (
                <a href={selectedEvent.group_join_link} target="_blank" rel="noreferrer" className="nova-btn-accent text-sm px-4 py-2 rounded-lg flex items-center gap-2 text-white">
                  <ExternalLink size={14} /> Join WhatsApp Group
                </a>
              )}
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠ {actionError}</div>
            )}

            {/* Registration CTA */}
            {!registeredIds.has(selectedEvent.id) ? (
              selectedEvent.participation_type === 'individual' ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isPending}
                  onClick={() => handleRegisterIndividual(selectedEvent.id)}
                >
                  Register for this Event
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-nova-text-dim text-sm text-center">This is a team event. Choose an option:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="primary"
                      icon={<Plus size={16} />}
                      onClick={() => setTeamModal('create')}
                    >
                      Create Team
                    </Button>
                    <Button
                      variant="outline"
                      icon={<LogIn size={16} />}
                      onClick={() => { setTeamModal('browse'); loadBrowseTeams(selectedEvent.id) }}
                    >
                      Join a Team
                    </Button>
                  </div>

                  {/* Team modal content */}
                  {teamModal === 'create' && (
                    <div className="glass rounded-xl p-4 border border-nova-primary/30 flex flex-col gap-3 animate-slide-up">
                      <Input label="Team Name" placeholder="Enter team name" value={teamName} onChange={e => setTeamName(e.target.value)} />
                      <Button variant="accent" loading={isPending} onClick={() => handleCreateTeam(selectedEvent.id)}>Create & Register</Button>
                    </div>
                  )}

                  {teamModal === 'browse' && (
                    <div className="glass rounded-xl p-4 border border-nova-primary/30 flex flex-col gap-3 animate-slide-up">
                      <Input
                        label="Have a join code?"
                        placeholder="6-char code e.g. A1B2C3"
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                      />
                      <Button variant="outline" loading={isPending} onClick={() => handleJoinTeamByCode(selectedEvent.id)}>Join by Code</Button>
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-nova-muted text-xs mb-3">Or browse open teams:</p>
                        {loadingTeams ? (
                          <p className="text-nova-muted text-sm text-center">Loading teams...</p>
                        ) : browseTeams.length === 0 ? (
                          <p className="text-nova-muted text-sm text-center">No open teams yet. Be the first to create one!</p>
                        ) : (
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                            {browseTeams.map(team => (
                              <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                <div>
                                  <p className="text-nova-text text-sm font-medium">{team.name}</p>
                                  <p className="text-nova-muted text-xs">Led by {(team.users as any)?.full_name} · {(team.team_members as any)?.[0]?.count || 0} members</p>
                                </div>
                                <Button variant="primary" size="sm" loading={isPending} onClick={() => handleJoinTeamById(team.id, selectedEvent.id)}>Join</Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-nova-success/10 border border-nova-success/30 text-nova-success font-semibold">
                <Check size={18} /> Already Registered
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
