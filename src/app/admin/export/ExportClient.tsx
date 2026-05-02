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
  },
]

export function ExportClient() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleExport = async (exportType: typeof exportTypes[0]) => {
    setLoadingId(exportType.id)
    try {
      const res = await fetch(`/api/admin/export?type=${exportType.id}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to export data')
      }
      
      const { data } = await res.json()
      
      if (!data || data.length === 0) {
        alert('No data available to export.')
        setLoadingId(null)
        return
      }

      const csv = toCSV(data, exportType.headers)
      downloadCSV(csv, `nova-unplugged-${exportType.id}-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (err: any) {
      alert(`Export Error: ${err.message}`)
    } finally {
      setLoadingId(null)
    }
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
