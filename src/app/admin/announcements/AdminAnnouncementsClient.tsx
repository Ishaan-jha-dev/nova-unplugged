'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Calendar, Bell } from 'lucide-react'
import { formatIST } from '@/lib/utils/dateUtils'
import { Modal } from '@/components/ui/Modal'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/actions/announcements'
import { Input } from '@/components/ui/Input'

interface Announcement {
  id: string
  title: string
  body: string
  target_audience: string | null
  image_url: string | null
  created_at: string
  users: { full_name: string } | null
}

export function AdminAnnouncementsClient({ announcements, creatorId }: { announcements: any[], creatorId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOpenNew = () => {
    setEditingAnn(null)
    setError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (a: Announcement) => {
    setEditingAnn(a)
    setError('')
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await deleteAnnouncement(id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    try {
      if (editingAnn) {
        formData.append('existing_image_url', editingAnn.image_url || '')
        await updateAnnouncement(editingAnn.id, formData)
      } else {
        await createAnnouncement(formData)
      }
      setIsModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-nova-text flex items-center gap-2">
            <Bell size={24} className="text-nova-warning" /> Manage Announcements
          </h1>
          <p className="text-nova-text-dim text-sm mt-1">Create, edit, and target announcements.</p>
        </div>
        <button onClick={handleOpenNew} className="nova-btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      <div className="glass rounded-2xl border border-nova-primary/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-nova-bg/50 border-b border-white/10 text-nova-muted font-display tracking-wider text-xs uppercase">
              <tr>
                <th className="p-4 font-medium">Title & Target</th>
                <th className="p-4 font-medium">Date & Author</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-nova-text">
              {announcements.map((a: Announcement) => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {a.image_url && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                          <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-nova-text truncate max-w-sm">{a.title}</p>
                        {a.target_audience ? (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-nova-primary/10 text-nova-primary border border-nova-primary/20 font-medium">
                            Target: {a.target_audience}
                          </span>
                        ) : (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-white/5 text-nova-muted border border-white/10 font-medium">
                            Target: All
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-nova-text flex items-center gap-1.5"><Calendar size={13} className="text-nova-muted" />{formatIST(a.created_at, 'MMM d, h:mm a')}</p>
                    <p className="text-nova-muted text-xs mt-1">by {a.users?.full_name}</p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(a)} className="p-2 text-nova-muted hover:text-nova-primary bg-white/5 hover:bg-nova-primary/10 rounded-lg transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 text-nova-muted hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {announcements.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-nova-muted">No announcements found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={isModalOpen} onClose={() => !isLoading && setIsModalOpen(false)} title={editingAnn ? 'Edit Announcement' : 'New Announcement'} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-nova-muted font-display tracking-wider uppercase">Title *</label>
              <Input name="title" required defaultValue={editingAnn?.title} placeholder="Important Update..." />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-nova-muted font-display tracking-wider uppercase">Description *</label>
              <textarea 
                name="body" 
                required 
                defaultValue={editingAnn?.body} 
                className="w-full bg-nova-bg/50 border border-nova-primary/20 rounded-xl px-4 py-3 text-sm text-nova-text placeholder:text-nova-text-dim focus:outline-none focus:border-nova-primary focus:ring-1 focus:ring-nova-primary/50 transition-all min-h-[120px]"
                placeholder="What do you want to tell everyone?"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-nova-muted font-display tracking-wider uppercase">Target Audience</label>
              <Input name="target_audience" defaultValue={editingAnn?.target_audience || ''} placeholder="e.g. Students, Faculty, Batch 1 (Leave blank for All)" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-nova-muted font-display tracking-wider uppercase">Image (Optional)</label>
              <Input type="file" name="image" accept="image/*" />
              {editingAnn?.image_url && <p className="text-xs text-nova-muted mt-1">Leave empty to keep current image</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={isLoading} className="px-4 py-2 text-sm text-nova-muted hover:text-nova-text">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="nova-btn-primary px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
