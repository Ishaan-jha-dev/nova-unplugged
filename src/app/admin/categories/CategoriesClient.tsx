'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye, EyeOff, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { CategoryRow } from '@/lib/supabase/types'
import { createCategory, updateCategory, toggleCategoryStatus, deleteCategory } from '@/actions/categories'

interface CategoriesClientProps {
  categories: CategoryRow[]
  eventCountMap: Record<string, number>
}

export function CategoriesClient({ categories, eventCountMap }: CategoriesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CategoryRow | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setTitle('')
    setStatus('active')
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (cat: CategoryRow) => {
    setEditingId(cat.id)
    setTitle(cat.title)
    setStatus(cat.status)
    setError(null)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!title.trim()) { setError('Title is required'); return }
    setError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('title', title.trim())
        fd.set('status', status)
        if (editingId) {
          await updateCategory(editingId, fd)
        } else {
          await createCategory(fd)
        }
        setModalOpen(false)
        router.refresh()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const handleToggle = (cat: CategoryRow) => {
    startTransition(async () => {
      try {
        await toggleCategoryStatus(cat.id, cat.status)
        router.refresh()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const handleDelete = (cat: CategoryRow) => {
    startTransition(async () => {
      try {
        await deleteCategory(cat.id)
        setDeleteConfirm(null)
        router.refresh()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Categories</h1>
          <p className="text-nova-text-dim text-sm">{categories.length} categories total</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openCreate}>New Category</Button>
      </div>

      <div className="glass rounded-2xl border border-nova-primary/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr className="text-nova-muted text-xs font-display tracking-wider uppercase">
              <th className="text-left px-6 py-4">Category</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="text-left px-6 py-4">Events</th>
              <th className="text-right px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-white/3 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-nova-primary/10 border border-nova-primary/20 flex items-center justify-center">
                      <Tag size={14} className="text-nova-primary" />
                    </div>
                    <span className="font-medium text-nova-text">{cat.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                    cat.status === 'active'
                      ? 'bg-nova-success/10 text-nova-success border-nova-success/20'
                      : 'bg-white/5 text-nova-muted border-white/10'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.status === 'active' ? 'bg-nova-success' : 'bg-nova-muted'}`} />
                    {cat.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-nova-muted">
                  {eventCountMap[cat.id] || 0} event{(eventCountMap[cat.id] || 0) !== 1 ? 's' : ''}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(cat)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={cat.status === 'active' ? <EyeOff size={13} /> : <Eye size={13} />}
                      loading={isPending}
                      onClick={() => handleToggle(cat)}
                    >
                      {cat.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleteConfirm(cat)} />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-nova-muted">
                  No categories yet. Create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="sm" title={editingId ? 'Edit Category' : 'New Category'}>
        <div className="flex flex-col gap-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠ {error}</div>}
          <Input label="Category Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder="e.g. Cultural" />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="cat_active" checked={status === 'active'} onChange={e => setStatus(e.target.checked ? 'active' : 'inactive')} className="w-4 h-4 accent-nova-primary" />
            <label htmlFor="cat_active" className="text-sm text-nova-text-dim cursor-pointer">Active (visible to students)</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" fullWidth loading={isPending} onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} size="sm" title="Delete Category">
        {deleteConfirm && (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
              ⚠ <strong>{eventCountMap[deleteConfirm.id] || 0} event(s)</strong> are under this category. 
              Deleting will unassign them (they will remain in the database without a category).
            </div>
            <p className="text-nova-text-dim text-sm">
              Are you sure you want to delete <strong className="text-nova-text">&quot;{deleteConfirm.title}&quot;</strong>?
            </p>
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
