'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { PaymentBadge, EntryBadge, RoleBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'

export function AdminUsersClient({ users, roles, types, myLevel }: { users: any[]; roles: any[]; types: any[]; myLevel: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterPayment, setFilterPayment] = useState('all')
  const [filterRole, setFilterRole] = useState('all')

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = search === '' ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      const matchPayment = filterPayment === 'all' || u.payment_status === filterPayment
      const matchRole = filterRole === 'all' || u.user_roles?.name === filterRole
      return matchSearch && matchPayment && matchRole
    })
  }, [users, search, filterPayment, filterRole])

  const updateUserRole = (userId: string, roleId: string) => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('users').update({ role_id: roleId }).eq('id', userId)
      router.refresh()
    })
  }

  const updateUserType = (userId: string, typeId: string) => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('users').update({ type_id: typeId }).eq('id', userId)
      router.refresh()
    })
  }

  const handleResetScan = (userId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/reset-scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        if (!res.ok) {
          const data = await res.json()
          alert(data.error || 'Failed to reset scan')
        } else {
          router.refresh()
        }
      } catch (err) {
        alert('Network error while resetting scan')
      }
    })
  }

  const paymentFilters = ['all', 'pending', 'approved', 'rejected']
  const roleFilters = ['all', ...roles.map(r => r.name)]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Users</h1>
        <p className="text-nova-text-dim text-sm">{users.length} total · {filtered.length} shown</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-nova-muted" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="nova-input pl-9 text-sm" />
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {paymentFilters.map(f => (
              <button key={f} onClick={() => setFilterPayment(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterPayment === f ? 'bg-nova-primary text-white' : 'glass text-nova-text-dim hover:text-nova-text'}`}>{f}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {roleFilters.map(f => (
              <button key={f} onClick={() => setFilterRole(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterRole === f ? 'bg-nova-accent text-white' : 'glass text-nova-text-dim hover:text-nova-text'}`}>{f.replace('_', ' ')}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-nova-primary/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-nova-muted text-xs font-display tracking-wider uppercase">
                <th className="text-left px-5 py-4">Name</th>
                <th className="text-left px-5 py-4 hidden lg:table-cell">Email</th>
                <th className="text-left px-5 py-4">Batch</th>
                <th className="text-left px-5 py-4">Zone</th>
                <th className="text-left px-5 py-4">Payment</th>
                <th className="text-left px-5 py-4 hidden sm:table-cell">Entry</th>
                <th className="text-left px-5 py-4">Role</th>
                {myLevel >= 5 && <th className="text-left px-5 py-4">Type</th>}
                <th className="text-left px-5 py-4 hidden xl:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-nova-primary/30 flex items-center justify-center text-xs font-bold text-nova-primary font-display shrink-0">
                        {u.full_name?.[0]}
                      </div>
                      <span className="font-medium text-nova-text truncate max-w-[120px]">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-nova-muted text-xs hidden lg:table-cell truncate max-w-[180px]">{u.email}</td>
                  <td className="px-5 py-3 text-nova-text text-xs">{u.batch || '—'}</td>
                  <td className="px-5 py-3 text-nova-text text-xs truncate max-w-[100px]">{u.zone || '—'}</td>
                  <td className="px-5 py-3"><PaymentBadge status={u.payment_status} /></td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <EntryBadge status={u.entry_status} />
                      {u.entry_status === 'scanned' && myLevel >= 4 && (
                        <button
                          onClick={() => handleResetScan(u.id)}
                          disabled={isPending}
                          className="text-[10px] bg-nova-warning/10 hover:bg-nova-warning/20 text-nova-warning px-2 py-1 rounded border border-nova-warning/30 transition-colors"
                          title="Reset Scan"
                        >
                          Reset QR
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {myLevel >= 5 ? (
                      <select
                        value={u.role_id || ''}
                        onChange={e => updateUserRole(u.id, e.target.value)}
                        disabled={isPending}
                        className="bg-nova-navy border border-nova-primary/30 text-nova-text text-xs rounded-lg px-2 py-1.5 outline-none focus:border-nova-primary cursor-pointer"
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name} (L{r.permissions_level})</option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge level={u.user_roles?.permissions_level ?? 1} />
                    )}
                  </td>
                  {myLevel >= 5 && (
                    <td className="px-5 py-3">
                      <select
                        value={u.type_id || ''}
                        onChange={e => updateUserType(u.id, e.target.value)}
                        disabled={isPending}
                        className="bg-nova-navy border border-nova-primary/30 text-nova-text text-xs rounded-lg px-2 py-1.5 outline-none focus:border-nova-primary cursor-pointer"
                      >
                        {types.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="px-5 py-3 text-nova-muted text-xs hidden xl:table-cell">{format(new Date(u.created_at), 'MMM d')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-nova-muted">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
