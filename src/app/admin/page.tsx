import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { Users, CreditCard, QrCode, Calendar, Clock } from 'lucide-react'
import { formatIST } from '@/lib/utils/dateUtils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard | Nova Unplugged' }

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  const [
    { count: totalUsers },
    { count: pendingPayments },
    { count: scannedToday },
    { count: totalEvents },
    { data: rawRecentPayments },
    { data: rawRecentScans },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('payment_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('scanner_log').select('*', { count: 'exact', head: true }).gte('scanned_at', today.toISOString()).eq('scan_result', 'valid'),
    supabaseAdmin.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('payment_submissions').select('*').order('created_at', { ascending: false }).limit(8),
    supabaseAdmin.from('scanner_log').select('*').order('scanned_at', { ascending: false }).limit(5),
  ])

  // Manually map user names to avoid "multiple relationship" embedding errors
  const userIds = new Set<string>()
  rawRecentPayments?.forEach(p => { if (p.user_id) userIds.add(p.user_id) })
  rawRecentScans?.forEach(s => { if (s.scanned_by) userIds.add(s.scanned_by) })

  const userNames: Record<string, { full_name: string; email: string }> = {}
  if (userIds.size > 0) {
    const { data: usersData } = await supabaseAdmin.from('users').select('id, full_name, email').in('id', Array.from(userIds))
    usersData?.forEach(u => { userNames[u.id] = { full_name: u.full_name, email: u.email } })
  }

  const recentPayments = (rawRecentPayments || []).map(p => ({
    ...p,
    users: userNames[p.user_id] || { full_name: 'Unknown', email: '' }
  }))

  const recentScans = (rawRecentScans || []).map(s => ({
    ...s,
    users: userNames[s.scanned_by] || { full_name: 'Unknown', email: '' }
  }))

  const stats = [
    { label: 'Total Users',       value: totalUsers || 0,    icon: Users,     color: 'text-nova-primary', bg: 'bg-nova-primary/10', border: 'border-nova-primary/20' },
    { label: 'Pending Payments',  value: pendingPayments || 0, icon: CreditCard, color: 'text-nova-warning', bg: 'bg-nova-warning/10', border: 'border-nova-warning/20' },
    { label: 'Entries Today',     value: scannedToday || 0,  icon: QrCode,    color: 'text-nova-success', bg: 'bg-nova-success/10', border: 'border-nova-success/20' },
    { label: 'Active Events',     value: totalEvents || 0,   icon: Calendar,  color: 'text-nova-accent',  bg: 'bg-nova-accent/10',  border: 'border-nova-accent/20'  },
  ]

  const statusColors: Record<string, string> = {
    pending:  'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Admin Dashboard</h1>
        <p className="text-nova-text-dim text-sm">Nova Unplugged 2025 · {formatIST(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`glass rounded-2xl p-5 border ${stat.border} hover:shadow-glow-sm transition-all`}>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
                <Icon size={20} className={stat.color} />
              </div>
              <p className={`font-display font-bold text-4xl ${stat.color}`}>{stat.value}</p>
              <p className="text-nova-muted text-xs mt-1 font-display tracking-wider uppercase">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="glass rounded-2xl border border-nova-primary/20 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="font-display font-semibold text-nova-text flex items-center gap-2">
              <CreditCard size={16} className="text-nova-warning" /> Recent Submissions
            </h2>
            <a href="/admin/payments" className="text-xs text-nova-primary hover:text-nova-primary-light transition-colors">View all →</a>
          </div>
          <div className="divide-y divide-white/5">
            {(recentPayments || []).map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                <div className="min-w-0">
                  <p className="text-nova-text text-sm font-medium truncate">{(p.users as any)?.full_name}</p>
                  <p className="text-nova-muted text-xs truncate">UTR: {p.utr_number}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={statusColors[p.status]}>{p.status}</span>
                  <span className="text-nova-muted text-xs">{formatIST(p.created_at, 'MMM d')}</span>
                </div>
              </div>
            ))}
            {!recentPayments?.length && (
              <p className="text-nova-muted text-sm text-center py-8">No payment submissions yet</p>
            )}
          </div>
        </div>

        {/* Recent scans */}
        <div className="glass rounded-2xl border border-nova-primary/20 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="font-display font-semibold text-nova-text flex items-center gap-2">
              <QrCode size={16} className="text-nova-success" /> Recent Scans
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {(recentScans || []).map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${s.scan_result === 'valid' ? 'bg-nova-success' : s.scan_result === 'already_scanned' ? 'bg-nova-warning' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-nova-text text-sm">{s.scan_result.replace('_', ' ')}</p>
                    <p className="text-nova-muted text-xs">by {(s.users as any)?.full_name}</p>
                  </div>
                </div>
                <span className="text-nova-muted text-xs flex items-center gap-1"><Clock size={11} />{formatIST(s.scanned_at, 'h:mm a')}</span>
              </div>
            ))}
            {!recentScans?.length && (
              <p className="text-nova-muted text-sm text-center py-8">No scans recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
