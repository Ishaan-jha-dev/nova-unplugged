'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Check, X, Eye, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PaymentBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export function PaymentsClient({ submissions, adminId }: { submissions: any[]; adminId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<Filter>('pending')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = submissions.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter
    const matchSearch = search === '' ||
      (s.users?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.users?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.utr_number || '').includes(search)
    return matchFilter && matchSearch
  })

  const counts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  const handleAction = (type: 'approve' | 'reject') => {
    if (type === 'reject' && !rejectNote.trim()) { setError('Please add a rejection reason'); return }
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      // Update submission
      await supabase
        .from('payment_submissions')
        .update({ status: type === 'approve' ? 'approved' : 'rejected', admin_note: type === 'reject' ? rejectNote : null, reviewed_by: adminId })
        .eq('id', selected.id)
      // Update user payment status
      await supabase
        .from('users')
        .update({ payment_status: type === 'approve' ? 'approved' : 'rejected' })
        .eq('id', selected.user_id)

      setSelected(null)
      setRejectNote('')
      setActionType(null)
      router.refresh()
    })
  }

  const handleViewScreenshot = async (path: string) => {
    try {
      const supabase = createClient()
      const { data, error: supaErr } = await supabase.storage.from('payment-screenshots').createSignedUrl(path, 60 * 60) // 1 hour valid
      if (supaErr) {
        setError('Could not load screenshot: ' + supaErr.message)
        return
      }
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err: any) {
      setError('Failed to open screenshot')
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',      label: `All (${counts.all})` },
    { key: 'pending',  label: `Pending (${counts.pending})` },
    { key: 'approved', label: `Approved (${counts.approved})` },
    { key: 'rejected', label: `Rejected (${counts.rejected})` },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Payment Verification</h1>
        <p className="text-nova-text-dim text-sm">Review and approve/reject payment submissions</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-nova-muted" />
          <input type="text" placeholder="Search by name, email or UTR..." value={search} onChange={e => setSearch(e.target.value)} className="nova-input pl-9 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.key ? 'bg-nova-primary text-white shadow-glow-sm' : 'glass text-nova-text-dim hover:text-nova-text'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-nova-primary/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-nova-muted text-xs font-display tracking-wider uppercase">
                <th className="text-left px-5 py-4">Name</th>
                <th className="text-left px-5 py-4 hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-4">UTR</th>
                <th className="text-left px-5 py-4 hidden md:table-cell">Submitted</th>
                <th className="text-left px-5 py-4">Status</th>
                <th className="text-right px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4 font-medium text-nova-text">{p.users?.full_name}</td>
                  <td className="px-5 py-4 text-nova-muted hidden sm:table-cell">{p.users?.email}</td>
                  <td className="px-5 py-4 font-mono text-nova-text-dim text-xs">{p.utr_number}</td>
                  <td className="px-5 py-4 text-nova-muted hidden md:table-cell">{format(new Date(p.created_at), 'MMM d, h:mm a')}</td>
                  <td className="px-5 py-4"><PaymentBadge status={p.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {p.screenshot_url && (
                        <button
                          onClick={() => handleViewScreenshot(p.screenshot_url)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-nova-muted hover:text-nova-text transition-all"
                          title="View screenshot"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      {p.status === 'pending' && (
                        <>
                          <button
                            onClick={() => { setSelected(p); setActionType('approve') }}
                            className="p-1.5 rounded-lg bg-nova-success/10 hover:bg-nova-success/20 text-nova-success transition-all"
                            title="Approve"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => { setSelected(p); setActionType('reject') }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                            title="Reject"
                          >
                            <X size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-nova-muted">No submissions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm action modal */}
      <Modal
        open={!!selected && !!actionType}
        onClose={() => { setSelected(null); setActionType(null); setRejectNote(''); setError(null) }}
        size="sm"
        title={actionType === 'approve' ? '✓ Approve Payment' : '✗ Reject Payment'}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-nova-text font-medium">{selected.users?.full_name}</p>
              <p className="text-nova-muted text-xs mt-1">UTR: {selected.utr_number}</p>
            </div>

            {actionType === 'approve' ? (
              <p className="text-nova-text-dim text-sm">This will approve their payment, generate a QR entry code, and send them a confirmation email.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-nova-text-dim text-sm">Provide a reason (sent to the student via email):</p>
                <textarea
                  className="nova-input resize-none h-24"
                  placeholder="e.g. UTR number doesn't match, screenshot unclear..."
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">⚠ {error}</p>}

            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => { setSelected(null); setActionType(null) }}>Cancel</Button>
              <Button
                variant={actionType === 'approve' ? 'success' : 'danger'}
                fullWidth
                loading={isPending}
                onClick={() => handleAction(actionType!)}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
