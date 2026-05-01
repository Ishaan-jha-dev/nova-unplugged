import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, CreditCard, QrCode, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard | Nova Unplugged' }

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { count: pendingPayments },
    { count: scannedToday },
    { count: totalEvents },
    { data: recentPayments },
    { data: recentScans },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('payment_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('scanner_log').select('*', { count: 'exact', head: true }).gte('scanned_at', today.toISOString()).eq('scan_result', 'valid'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('payment_submissions').select('*, users(full_name, email)').order('created_at', { ascending: false }).limit(8),
    supabase.from('scanner_log').select('*, users!scanned_by(full_name)').order('scanned_at', { ascending: false }).limit(5),
  ])

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
        <p className="text-nova-text-dim text-sm">Nova Unplugged 2025 · {format(new Date(), 'EEEE, MMMM d')}</p>
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
                  <span className="text-nova-muted text-xs">{format(new Date(p.created_at), 'MMM d')}</span>
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
                <span className="text-nova-muted text-xs flex items-center gap-1"><Clock size={11} />{format(new Date(s.scanned_at), 'h:mm a')}</span>
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
