'use client'

import { useState, useTransition } from 'react'
import { Download, FileText, Users, CreditCard, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

function toCSV(rows: any[], headers: string[]): string {
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = headers.join(',')
  const body = rows.map(row => headers.map(h => escape(row[h])).join(',')).join('\n')
  return `${header}\n${body}`
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const exportTypes = [
  {
    id: 'users',
    label: 'Users',
    desc: 'All registered participants with payment and entry status',
    icon: Users,
    color: 'text-nova-primary',
    bg: 'bg-nova-primary/10',
    border: 'border-nova-primary/30',
    headers: ['full_name', 'email', 'phone', 'college', 'student_id', 'course', 'year', 'payment_status', 'entry_status', 'created_at'],
    query: async (supabase: any) => supabase.from('users').select('full_name, email, phone, college, student_id, course, year, payment_status, entry_status, created_at').order('created_at'),
  },
  {
    id: 'registrations',
    label: 'Registrations',
    desc: 'Event registrations with participant and team info',
    icon: FileText,
    color: 'text-nova-accent',
    bg: 'bg-nova-accent/10',
    border: 'border-nova-accent/30',
    headers: ['user_name', 'user_email', 'event_title', 'participation_type', 'team_name', 'team_code', 'registered_at'],
    query: async (supabase: any) => {
      const { data } = await supabase
        .from('registrations')
        .select('created_at, users(full_name, email), events(title, participation_type), teams(name, join_code)')
        .order('created_at')
      return {
        data: (data || []).map((r: any) => ({
          user_name: r.users?.full_name,
          user_email: r.users?.email,
          event_title: r.events?.title,
          participation_type: r.events?.participation_type,
          team_name: r.teams?.name || '',
          team_code: r.teams?.join_code || '',
          registered_at: r.created_at,
        }))
      }
    },
  },
  {
    id: 'payments',
    label: 'Payments',
    desc: 'Payment submissions with UTR numbers and status',
    icon: CreditCard,
    color: 'text-nova-warning',
    bg: 'bg-nova-warning/10',
    border: 'border-nova-warning/30',
    headers: ['user_name', 'user_email', 'utr_number', 'status', 'admin_note', 'created_at'],
    query: async (supabase: any) => {
      const { data } = await supabase
        .from('payment_submissions')
        .select('utr_number, status, admin_note, created_at, users(full_name, email)')
        .order('created_at')
      return {
        data: (data || []).map((p: any) => ({
          user_name: p.users?.full_name,
          user_email: p.users?.email,
          utr_number: p.utr_number,
          status: p.status,
          admin_note: p.admin_note || '',
          created_at: p.created_at,
        }))
      }
    },
  },
  {
    id: 'scanner',
    label: 'Scanner Log',
    desc: 'All QR code scan attempts with timestamps',
    icon: QrCode,
    color: 'text-nova-success',
    bg: 'bg-nova-success/10',
    border: 'border-nova-success/30',
    headers: ['entry_code', 'scan_result', 'scanned_by', 'target_user', 'scanned_at'],
    query: async (supabase: any) => {
      const { data } = await supabase
        .from('scanner_log')
        .select('entry_code, scan_result, scanned_at, users!scanned_by(full_name), users!target_user_id(full_name)')
        .order('scanned_at')
      return {
        data: (data || []).map((s: any) => ({
          entry_code: s.entry_code,
          scan_result: s.scan_result,
          scanned_by: (s as any)['users!scanned_by']?.full_name || '',
          target_user: (s as any)['users!target_user_id']?.full_name || '',
          scanned_at: s.scanned_at,
        }))
      }
    },
  },
]

export function ExportClient() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleExport = async (exportType: typeof exportTypes[0]) => {
    setLoadingId(exportType.id)
    const supabase = createClient()
    const result = await exportType.query(supabase)
    const rows = Array.isArray(result) ? result : result.data || []
    const csv = toCSV(rows, exportType.headers)
    downloadCSV(csv, `nova-unplugged-${exportType.id}-${new Date().toISOString().slice(0, 10)}.csv`)
    setLoadingId(null)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Export Data</h1>
        <p className="text-nova-text-dim text-sm">Download data as CSV files for reporting</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
        {exportTypes.map(exp => {
          const Icon = exp.icon
          return (
            <div key={exp.id} className={`glass rounded-2xl p-6 border ${exp.border} hover:shadow-glow-sm transition-all`}>
              <div className={`w-12 h-12 rounded-xl ${exp.bg} border ${exp.border} flex items-center justify-center mb-4`}>
                <Icon size={22} className={exp.color} />
              </div>
              <h3 className="font-display font-semibold text-nova-text mb-1">{exp.label}</h3>
              <p className="text-nova-text-dim text-sm mb-5">{exp.desc}</p>
              <Button
                variant="outline"
                size="md"
                icon={<Download size={15} />}
                loading={loadingId === exp.id}
                onClick={() => handleExport(exp)}
              >
                Download CSV
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
