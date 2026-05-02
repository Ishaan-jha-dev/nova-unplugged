'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, AlertCircle, Clock, Trash2, RotateCcw } from 'lucide-react'
import { formatIST } from '@/lib/utils/dateUtils'
import { clearScanLogs } from '@/actions/scannerLogs'

interface LogsClientProps {
  logs: any[]
  page: number
  totalPages: number
  metrics: {
    valid: number
    invalid: number
    alreadyScanned: number
  }
}

export function LogsClient({ logs, page, totalPages, metrics }: LogsClientProps) {
  const [isPending, startTransition] = useTransition()

  const handleBulkReset = () => {
    if (!confirm('Are you sure you want to reset ALL scanned entries? This changes every user\'s status back to approved so they can be scanned again.')) return
    
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/reset-scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bulk: true })
        })
        const data = await res.json()
        if (res.ok) {
          alert(data.message)
          window.location.reload()
        } else {
          alert(data.error || 'API Error')
        }
      } catch (e: any) {
        alert(e.message || 'Network error')
      }
    })
  }

  const handleClearLogs = () => {
    if (!confirm('WARNING: This will permanently delete ALL scanner log history from the database. Are you absolutely sure?')) return
    
    startTransition(async () => {
      try {
        await clearScanLogs()
        alert('All logs cleared successfully.')
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-nova-text mb-1">Scan Logs</h1>
          <p className="text-nova-text-dim text-sm">Monitor gate entry activity and manage scan history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBulkReset}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium transition-colors border border-yellow-500/20 disabled:opacity-50"
          >
            <RotateCcw size={16} /> Bulk Reset Users
          </button>
          <button 
            onClick={handleClearLogs}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20 disabled:opacity-50"
          >
            <Trash2 size={16} /> Clear Logs
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5 border border-nova-success/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-nova-success/10 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} className="text-nova-success" />
          </div>
          <div>
            <p className="font-display font-bold text-3xl text-nova-success leading-none mb-1">{metrics.valid}</p>
            <p className="text-nova-muted text-xs font-display tracking-wider uppercase">Successful Scans</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-red-500/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <XCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="font-display font-bold text-3xl text-red-400 leading-none mb-1">{metrics.invalid}</p>
            <p className="text-nova-muted text-xs font-display tracking-wider uppercase">Invalid Scans</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-nova-warning/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-nova-warning/10 flex items-center justify-center shrink-0">
            <AlertCircle size={24} className="text-nova-warning" />
          </div>
          <div>
            <p className="font-display font-bold text-3xl text-nova-warning leading-none mb-1">{metrics.alreadyScanned}</p>
            <p className="text-nova-muted text-xs font-display tracking-wider uppercase">Already Scanned</p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass rounded-2xl border border-nova-primary/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-white/10">
              <tr className="text-nova-muted text-xs font-display tracking-wider uppercase">
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Scanned By (Volunteer)</th>
                <th className="px-5 py-4 hidden sm:table-cell">Target User</th>
                <th className="px-5 py-4 hidden md:table-cell">Entry Code (UUID)</th>
                <th className="px-5 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4 font-medium">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border
                      ${log.scan_result === 'valid' ? 'bg-nova-success/10 text-nova-success border-nova-success/20' : 
                        log.scan_result === 'already_scanned' ? 'bg-nova-warning/10 text-nova-warning border-nova-warning/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'}`}
                    >
                      {log.scan_result === 'valid' ? <CheckCircle2 size={12} /> : 
                       log.scan_result === 'already_scanned' ? <AlertCircle size={12} /> : 
                       <XCircle size={12} />}
                      {log.scan_result.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-nova-text">
                    {log.users?.full_name || 'Unknown'}
                  </td>
                  <td className="px-5 py-4 text-nova-text hidden sm:table-cell">
                    {log.target?.full_name ? (
                      <div>
                        <p>{log.target.full_name}</p>
                        <p className="text-xs text-nova-muted">{log.target.email}</p>
                      </div>
                    ) : (
                      <span className="text-nova-muted italic">N/A</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-nova-text-dim text-[10px] hidden md:table-cell">
                    {log.entry_code}
                  </td>
                  <td className="px-5 py-4 text-right text-nova-muted whitespace-nowrap">
                    {formatIST(log.scanned_at, 'MMM d, h:mm:ss a')}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-nova-muted">No scan logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 bg-white/5">
            <p className="text-xs text-nova-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={page > 1 ? `/admin/scanner/logs?page=${page - 1}` : '#'}
                className={`px-3 py-1.5 rounded-md text-xs font-medium glass transition-all ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-white/10'}`}
              >
                Previous
              </Link>
              <Link
                href={page < totalPages ? `/admin/scanner/logs?page=${page + 1}` : '#'}
                className={`px-3 py-1.5 rounded-md text-xs font-medium glass transition-all ${page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-white/10'}`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
