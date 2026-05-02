import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatIST } from '@/lib/utils/dateUtils'
import { CategoryBadge, ParticipationBadge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Registrations | Admin' }

export default async function RegistrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      *, 
      users(full_name, email),
      events(title, category, participation_type),
      teams(name, join_code)
    `)
    .order('created_at', { ascending: false })

  const byEvent: Record<string, any[]> = {}
  for (const reg of registrations || []) {
    const key = (reg.events as any)?.title || 'Unknown'
    if (!byEvent[key]) byEvent[key] = []
    byEvent[key].push(reg)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Registrations</h1>
        <p className="text-nova-text-dim text-sm">{registrations?.length || 0} total registrations</p>
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(byEvent).map(([eventTitle, regs]) => {
          const ev = regs[0]?.events
          return (
            <div key={eventTitle} className="glass rounded-2xl border border-nova-primary/20 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                  <h2 className="font-display font-semibold text-nova-text">{eventTitle}</h2>
                  <div className="flex gap-2 mt-1.5">
                    {ev?.category && <CategoryBadge category={ev.category} />}
                    {ev?.participation_type && <ParticipationBadge type={ev.participation_type} />}
                    <span className="text-xs text-nova-muted">{regs.length} registered</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/5">
                    <tr className="text-nova-muted text-xs font-display tracking-wider uppercase">
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Email</th>
                      <th className="text-left px-5 py-3">Team</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {regs.map(reg => (
                      <tr key={reg.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3 text-nova-text font-medium">{(reg.users as any)?.full_name}</td>
                        <td className="px-5 py-3 text-nova-muted text-xs hidden sm:table-cell">{(reg.users as any)?.email}</td>
                        <td className="px-5 py-3">
                          {reg.teams ? (
                            <span className="glass px-2 py-1 rounded text-xs text-nova-primary border border-nova-primary/30">
                              {(reg.teams as any).name} · {(reg.teams as any).join_code}
                            </span>
                          ) : (
                            <span className="text-nova-muted text-xs">Individual</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-nova-muted text-xs hidden md:table-cell">
                          {formatIST(reg.created_at, 'MMM d, h:mm a')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        {!registrations?.length && (
          <div className="text-center py-16 glass rounded-2xl border border-nova-primary/20">
            <p className="text-nova-muted">No registrations yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
