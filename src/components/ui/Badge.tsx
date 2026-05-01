import { cn } from './Button'
import type { PaymentStatus, EntryStatus, ParticipationType, EventCategory } from '@/lib/supabase/types'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', className)}>
      {children}
    </span>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map = {
    pending:  { cls: 'badge-pending',  dot: '●', label: 'Pending' },
    approved: { cls: 'badge-approved', dot: '●', label: 'Approved' },
    rejected: { cls: 'badge-rejected', dot: '●', label: 'Rejected' },
  }
  const { cls, dot, label } = map[status]
  return <span className={cls}><span>{dot}</span>{label}</span>
}

export function EntryBadge({ status }: { status: EntryStatus }) {
  const map = {
    not_approved: { cls: 'badge-pending',  label: 'Not Approved' },
    approved:     { cls: 'badge-approved', label: 'Approved' },
    scanned:      { cls: 'badge-scanned',  label: '✓ Scanned' },
  }
  const { cls, label } = map[status]
  return <span className={cls}>{label}</span>
}

export function ParticipationBadge({ type }: { type: ParticipationType }) {
  return type === 'individual'
    ? <span className="badge-individual">👤 Individual</span>
    : <span className="badge-team">👥 Team</span>
}

export function CategoryBadge({ category }: { category: EventCategory }) {
  const map: Record<EventCategory, string> = {
    cultural:  'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    technical: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    sports:    'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    fun:       'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
    other:     'bg-gray-500/15 text-gray-300 border border-gray-500/30',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', map[category])}>
      {category}
    </span>
  )
}

export function RoleBadge({ level }: { level: number }) {
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: 'Student',     cls: 'bg-gray-500/15 text-gray-300 border border-gray-500/30' },
    2: { label: 'Volunteer',   cls: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' },
    3: { label: 'OC Team',     cls: 'bg-blue-500/15 text-blue-300 border border-blue-500/30' },
    4: { label: 'Admin',       cls: 'bg-purple-500/15 text-purple-300 border border-purple-500/30' },
    5: { label: 'Super Admin', cls: 'bg-pink-500/15 text-pink-300 border border-pink-500/30' },
  }
  const { label, cls } = map[level] ?? map[1]
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', cls)}>{label}</span>
}
