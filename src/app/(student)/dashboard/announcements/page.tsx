import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell, Filter } from 'lucide-react'
import type { Metadata } from 'next'
import { AnnouncementsClient } from './AnnouncementsClient'

export const metadata: Metadata = { title: 'Announcements | Nova Unplugged 2025' }

export default async function AnnouncementsPage(props: { searchParams: Promise<{ filter?: string, page?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filter = searchParams.filter || 'all'
  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('announcements')
    .select('*, users(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filter === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    query = query.gte('created_at', today.toISOString())
  } else if (filter === 'week') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    query = query.gte('created_at', weekAgo.toISOString())
  } else if (filter === 'month') {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    query = query.gte('created_at', monthAgo.toISOString())
  }

  const { data: rawAnnouncements, count } = await query.range(from, to)
  const announcements = rawAnnouncements as any[] || []
  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-nova-text flex items-center gap-3">
            <Bell size={28} className="text-nova-warning" /> Announcements
          </h1>
          <p className="text-nova-text-dim text-sm mt-1">Stay updated with the latest news and alerts.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-nova-bg glass rounded-lg p-1 border border-nova-primary/20 self-start md:self-auto">
          <Filter size={14} className="text-nova-muted ml-2 mr-1" />
          {[
            { value: 'all', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Last 7 Days' },
            { value: 'month', label: 'Last Month' },
          ].map(f => (
            <Link
              key={f.value}
              href={`/dashboard/announcements?filter=${f.value}&page=1`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f.value ? 'bg-nova-primary/20 text-nova-primary' : 'text-nova-text-dim hover:text-nova-text hover:bg-white/5'}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {announcements.length > 0 ? (
        <AnnouncementsClient 
          announcements={announcements} 
          filter={filter} 
          page={page} 
          totalPages={totalPages} 
        />
      ) : (
        <div className="text-center py-20 glass rounded-2xl border border-white/5">
          <Bell size={40} className="text-nova-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-nova-text">No announcements found</h3>
          <p className="text-nova-text-dim text-sm mt-1">Try changing your filters or check back later.</p>
        </div>
      )}
    </div>
  )
}
