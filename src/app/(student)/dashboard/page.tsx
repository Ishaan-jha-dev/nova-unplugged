import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Users, QrCode, Bell, ArrowRight, Zap, Star } from 'lucide-react'
import { PaymentBadge } from '@/components/ui/Badge'
import { CategoryBadge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Nova Unplugged 2025' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: _userData }, { data: _registrations }, { data: _announcements }] = await Promise.all([
    supabase.from('users').select('*, user_roles(name, permissions_level)').eq('id', user.id).single(),
    supabase.from('registrations').select('*, events(title, category, start_time, participation_type)').eq('user_id', user.id).limit(5),
    supabase.from('announcements').select('*, users(full_name)').order('created_at', { ascending: false }).limit(5),
  ])
  // Cast to bypass Supabase v2 join type inference limitations
  const userData = _userData as { full_name: string; payment_status: string; [key: string]: unknown } | null
  const registrations = _registrations as any[] | null
  const announcements = _announcements as any[] | null

  const firstName = userData?.full_name?.split(' ')[0] || 'there'
  const xpLevel = Math.min(registrations?.length || 0, 10)
  const xpPct = (xpLevel / 10) * 100
  const FEST_DATE = process.env.NEXT_PUBLIC_FEST_DATE || '2025-06-20T09:00:00+05:30'
  const daysToFest = Math.max(0, Math.ceil((new Date(FEST_DATE).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-nova-muted text-sm font-display tracking-wider uppercase mb-1">Welcome back</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-nova-text">
              Hey, <span className="gradient-text">{firstName}</span> ⚡
            </h1>
          </div>
          <PaymentBadge status={(userData?.payment_status || 'pending') as 'pending' | 'approved' | 'rejected'} />
        </div>

        {/* XP Bar */}
        <div className="mt-6 glass rounded-xl p-4 border border-nova-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-nova-warning" />
              <span className="text-sm font-medium text-nova-text">Event XP Level {xpLevel}</span>
            </div>
            <span className="text-xs text-nova-muted">{registrations?.length || 0}/10 events joined</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${xpPct}%`,
                background: 'linear-gradient(90deg, #6C3DE8, #E83D8A)',
                boxShadow: '0 0 8px rgba(108,61,232,0.6)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Events Joined',    value: registrations?.length || 0,  icon: Calendar, color: 'text-nova-primary', bg: 'bg-nova-primary/10' },
          { label: 'Days to Fest',     value: daysToFest,                   icon: Zap,      color: 'text-nova-accent',  bg: 'bg-nova-accent/10'  },
          { label: 'Teams Active',     value: registrations?.filter(r => r.events && (r.events as any).participation_type === 'team').length || 0, icon: Users, color: 'text-nova-success', bg: 'bg-nova-success/10' },
          { label: 'Announcements',    value: announcements?.length || 0,   icon: Bell,     color: 'text-nova-warning', bg: 'bg-nova-warning/10' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="glass rounded-xl p-5 border border-nova-primary/15 hover:border-nova-primary/40 transition-all">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={stat.color} />
              </div>
              <p className={`font-display font-bold text-3xl ${stat.color}`}>{stat.value}</p>
              <p className="text-nova-muted text-xs mt-1 font-display tracking-wider uppercase">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Registered Events */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-nova-primary/20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-nova-text flex items-center gap-2">
              <Calendar size={18} className="text-nova-primary" /> My Events
            </h2>
            <Link href="/dashboard/my-events" className="text-xs text-nova-primary hover:text-nova-primary-light flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {registrations && registrations.length > 0 ? (
            <div className="flex flex-col gap-3">
              {registrations.map(reg => {
                const ev = reg.events as any
                return (
                  <div key={reg.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5 hover:border-nova-primary/30 transition-all">
                    <div className="w-2 h-10 rounded-full bg-gradient-to-b from-nova-primary to-nova-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-nova-text font-medium text-sm truncate">{ev?.title}</p>
                      <p className="text-nova-muted text-xs mt-0.5">
                        {ev?.start_time ? format(new Date(ev.start_time), 'MMM d, h:mm a') : 'Date TBD'}
                      </p>
                    </div>
                    {ev?.category && <CategoryBadge category={ev.category} />}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar size={36} className="text-nova-muted mx-auto mb-3" />
              <p className="text-nova-text-dim text-sm">No events registered yet</p>
              <Link href="/dashboard/events" className="text-nova-primary text-sm hover:underline mt-2 inline-block">
                Browse events →
              </Link>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* QR Card */}
          <div className={`glass rounded-2xl p-6 border relative overflow-hidden ${userData?.payment_status === 'approved' ? 'border-nova-success/40' : 'border-nova-primary/20'}`}>
            {userData?.payment_status !== 'approved' && (
              <div className="absolute inset-0 backdrop-blur-[2px] bg-nova-bg/50 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-nova-primary/20 border border-nova-primary/30 flex items-center justify-center">
                  🔒
                </div>
                <p className="text-nova-text-dim text-xs text-center px-4">QR unlocks after payment approval</p>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <QrCode size={18} className={userData?.payment_status === 'approved' ? 'text-nova-success' : 'text-nova-muted'} />
              <h3 className="font-display font-semibold text-sm text-nova-text">Your Gate Pass</h3>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-xl bg-nova-primary/10 border border-nova-primary/30 flex items-center justify-center">
                <QrCode size={40} className="text-nova-primary/50" />
              </div>
            </div>
            {userData?.payment_status === 'approved' && (
              <Link href="/profile" className="mt-4 w-full text-center block text-xs text-nova-primary hover:text-nova-primary-light transition-colors">
                View & download QR →
              </Link>
            )}
          </div>

          {/* Announcements */}
          <div className="glass rounded-2xl p-6 border border-nova-primary/20 flex-1">
            <h3 className="font-display font-semibold text-nova-text flex items-center gap-2 mb-4">
              <Bell size={16} className="text-nova-warning" /> Announcements
            </h3>
            {announcements && announcements.length > 0 ? (
              <div className="flex flex-col gap-3">
                {announcements.map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-nova-text text-sm font-medium">{a.title}</p>
                    <p className="text-nova-muted text-xs mt-1 line-clamp-2">{a.body}</p>
                    <p className="text-nova-muted text-xs mt-1.5">{format(new Date(a.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-nova-muted text-sm text-center py-4">No announcements yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
