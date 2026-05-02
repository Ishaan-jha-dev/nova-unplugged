'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ParticipationBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { formatIST } from '@/lib/utils/dateUtils'
import type { EventRow, CategoryRow } from '@/lib/supabase/types'

type EventFormData = {
  title: string
  description: string
  category_id: string
  participation_type: 'individual' | 'team'
  team_size_min: string
  team_size_max: string
  rulebook_url: string
  organizer_name: string
  organizer_contact: string
  group_join_link: string
  venue: string
  event_date: string
  start_time: string
  end_time: string
  deadline: string
  is_active: boolean
}

const emptyForm: EventFormData = {
  title: '', description: '', category_id: '', participation_type: 'individual',
  team_size_min: '2', team_size_max: '5', rulebook_url: '', organizer_name: '',
  organizer_contact: '', group_join_link: '', venue: '',
  event_date: '', start_time: '', end_time: '', deadline: '', is_active: true,
}

interface AdminEventsClientProps {
  events: (EventRow & { categories?: { id: string; title: string; status: string } | null })[]
  categories: CategoryRow[]
  creatorId: string
}

export function AdminEventsClient({ events, categories, creatorId }: AdminEventsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null)
  const [form, setForm] = useState<EventFormData>(emptyForm)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<EventRow | null>(null)

  const set = (key: keyof EventFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  const openCreate = () => {
    setEditingEvent(null)
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' })
    setBannerFile(null)
    setBannerPreview(null)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (event: EventRow & { categories?: any }) => {
    setEditingEvent(event)
    setForm({
      title: event.title,
      description: event.description || '',
      category_id: event.category_id || '',
      participation_type: event.participation_type,
      team_size_min: event.team_size_min?.toString() || '2',
      team_size_max: event.team_size_max?.toString() || '5',
      rulebook_url: event.rulebook_url || '',
      organizer_name: event.organizer_name || '',
      organizer_contact: event.organizer_contact || '',
      group_join_link: event.group_join_link || '',
      venue: event.venue || '',
      event_date: event.event_date || '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      deadline: event.deadline ? new Date(event.deadline).toISOString().slice(0, 16) : '',
      is_active: event.is_active,
    })
    setBannerFile(null)
    setBannerPreview(event.banner_url ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.banner_url}` : null)
    setError(null)
    setModalOpen(true)
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      let bannerUrl = editingEvent?.banner_url || null

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('event-banners').upload(path, bannerFile, { upsert: true })
        if (uploadErr) { setError(`Banner upload failed: ${uploadErr.message}`); return }
        bannerUrl = path
      }

      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        banner_url: bannerUrl,
        category_id: form.category_id || null,
        participation_type: form.participation_type,
        team_size_min: form.participation_type === 'team' ? parseInt(form.team_size_min) : null,
        team_size_max: form.participation_type === 'team' ? parseInt(form.team_size_max) : null,
        rulebook_url: form.rulebook_url || null,
        organizer_name: form.organizer_name || null,
        organizer_contact: form.organizer_contact || null,
        group_join_link: form.group_join_link || null,
        venue: form.venue || null,
        event_date: form.event_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        is_active: form.is_active,
        created_by: creatorId,
      }

      if (editingEvent) {
        const { error: saveErr } = await supabase.from('events').update(payload).eq('id', editingEvent.id)
        if (saveErr) { setError(`Failed to update: ${saveErr.message}`); return }
      } else {
        const { error: saveErr } = await supabase.from('events').insert(payload)
        if (saveErr) { setError(`Failed to create: ${saveErr.message}`); return }
      }

      setModalOpen(false)
      router.refresh()
    })
  }

  const handleDelete = (event: EventRow) => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('events').delete().eq('id', event.id)
      if (error) { alert(`Delete failed: ${error.message}`); return }
      setDeleteConfirm(null)
      router.refresh()
    })
  }

  const handleToggleActive = (event: EventRow) => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('events').update({ is_active: !event.is_active }).eq('id', event.id)
      if (error) { alert(`Update failed: ${error.message}`); return }
      router.refresh()
    })
  }

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.title }))

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Manage Events</h1>
          <p className="text-nova-text-dim text-sm">{events.length} events total</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openCreate}>New Event</Button>
      </div>

      {/* Events grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {events.map(event => (
          <div key={event.id} className={`glass rounded-2xl border overflow-hidden transition-all group ${event.is_active ? 'border-white/5 hover:border-nova-primary/30' : 'border-white/5 opacity-50'}`}>
            {/* Banner Area */}
            <div className="h-44 bg-gradient-to-br from-nova-primary/20 to-nova-accent/10 relative overflow-hidden border-b border-white/5">
              {event.banner_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${event.banner_url}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
              {!event.is_active && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <span className="text-white text-[10px] font-bold bg-red-500 px-2 py-1 rounded tracking-widest uppercase">Hidden from Students</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-nova-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {(event as any).categories?.title && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-nova-primary/10 text-nova-primary border border-nova-primary/20">
                      {(event as any).categories.title}
                    </span>
                  )}
                  <ParticipationBadge type={event.participation_type} />
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-nova-text group-hover:text-nova-primary transition-colors mb-1 truncate">{event.title}</h3>
                <div className="flex flex-col gap-1.5 text-[11px] text-nova-muted">
                  {event.venue && <span className="flex items-center gap-2"><MapPin size={12} className="text-nova-primary" />{event.venue}</span>}
                  {event.event_date && <span className="flex items-center gap-2"><Calendar size={12} className="text-nova-primary" />{event.event_date}{event.start_time ? ` · ${event.start_time}` : ''}</span>}
                  {event.deadline && (
                    <span className="flex items-center gap-2 text-nova-warning">
                      <Clock size={12} />Closes: {formatIST(event.deadline, 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" fullWidth icon={<Pencil size={13} />} onClick={() => openEdit(event)}>Edit</Button>
                <Button variant="ghost" size="sm" icon={event.is_active ? <EyeOff size={13} /> : <Eye size={13} />} loading={isPending} onClick={() => handleToggleActive(event)}>
                  {event.is_active ? 'Hide' : 'Show'}
                </Button>
                <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleteConfirm(event)} />
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center py-16 glass rounded-2xl border border-nova-primary/20">
            <p className="text-nova-muted mb-4">No events created yet</p>
            <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>Create First Event</Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="xl" title={editingEvent ? 'Edit Event' : 'Create New Event'}>
        <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto pr-1">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠ {error}</div>}

          {/* Banner */}
          <div>
            <label className="text-sm font-medium text-nova-text-dim block mb-2">Event Banner</label>
            <label className={`flex items-center justify-center h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all ${bannerPreview ? 'border-nova-success/50 p-0 overflow-hidden' : 'border-nova-primary/30 hover:border-nova-primary'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
              {bannerPreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                : <div className="text-center text-nova-muted text-sm"><p className="text-2xl mb-1">🖼</p><p>Click to upload banner</p></div>
              }
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Event Title *" value={form.title} onChange={set('title')} required autoFocus className="sm:col-span-2" />
            <Select label="Category" value={form.category_id} onChange={set('category_id')} options={categoryOptions} />
            <Select label="Participation Type" value={form.participation_type} onChange={set('participation_type')}
              options={[{ value: 'individual', label: '👤 Individual' }, { value: 'team', label: '👥 Team' }]} />

            {form.participation_type === 'team' && (
              <>
                <Input label="Min Team Size" type="number" value={form.team_size_min} onChange={set('team_size_min')} min="2" max="15" />
                <Input label="Max Team Size" type="number" value={form.team_size_max} onChange={set('team_size_max')} min="2" max="15" />
              </>
            )}

            <Input label="Venue" value={form.venue} onChange={set('venue')} className="sm:col-span-2" />

            <Input label="Event Date" type="date" value={form.event_date} onChange={set('event_date')} />
            <div /> {/* spacer */}
            <Input label="Start Time" type="time" value={form.start_time} onChange={set('start_time')} />
            <Input label="End Time" type="time" value={form.end_time} onChange={set('end_time')} />
            <Input label="Registration Deadline" type="datetime-local" value={form.deadline} onChange={set('deadline')} className="sm:col-span-2" />

            <Input label="Organizer Name" value={form.organizer_name} onChange={set('organizer_name')} />
            <Input label="Organizer Contact" placeholder="phone or email" value={form.organizer_contact} onChange={set('organizer_contact')} />
            <Input label="WhatsApp / Telegram Group Link" value={form.group_join_link} onChange={set('group_join_link')} className="sm:col-span-2" />
            <Input label="Rulebook URL" placeholder="https://..." value={form.rulebook_url} onChange={set('rulebook_url')} className="sm:col-span-2" />
          </div>

          <Textarea label="Description" value={form.description} onChange={set('description')} className="min-h-[120px]" />

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-nova-primary" />
            <label htmlFor="is_active" className="text-sm text-nova-text-dim cursor-pointer">Active (visible to students)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" fullWidth loading={isPending} onClick={handleSave}>
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} size="sm" title="Delete Event">
        {deleteConfirm && (
          <div className="flex flex-col gap-4">
            <p className="text-nova-text-dim text-sm">Are you sure you want to delete <strong className="text-nova-text">{deleteConfirm.title}</strong>? This will also remove all registrations.</p>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" fullWidth loading={isPending} onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
