'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, AlertCircle, QrCode, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type ScanState = 'idle' | 'valid' | 'already_scanned' | 'invalid'

interface ScanResult {
  state: ScanState
  name?: string
  timestamp?: string
  message?: string
}

export function ScannerClient({ scannerId, roleLevel }: { scannerId: string; roleLevel: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ScanResult>({ state: 'idle' })
  const [manualCode, setManualCode] = useState('')
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    )

    scanner.render(
      (decodedText) => {
        scanner.pause()
        processCode(decodedText)
      },
      () => {}
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const processCode = (code: string) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        })

        const data = await res.json()

        if (!res.ok) {
          setResult({ state: 'invalid', message: data.error || 'API Error' })
          return
        }

        setResult({
          state: data.state as ScanState,
          name: data.name,
          timestamp: data.timestamp,
          message: data.message
        })
      } catch (err: any) {
        setResult({ state: 'invalid', message: err.message || 'Network error' })
      }
    })
  }

  const handleReset = () => {
    setResult({ state: 'idle' })
    setManualCode('')
    // Re-render scanner by refreshing
    router.refresh()
    setTimeout(() => window.location.reload(), 100)
  }

  const overlayConfig = {
    valid: {
      bg: 'bg-nova-success/95',
      border: 'border-nova-success',
      icon: CheckCircle2,
      iconColor: 'text-nova-navy',
      title: 'ENTRY GRANTED',
      textColor: 'text-nova-navy',
    },
    already_scanned: {
      bg: 'bg-nova-warning/95',
      border: 'border-nova-warning',
      icon: AlertCircle,
      iconColor: 'text-nova-navy',
      title: 'ALREADY SCANNED',
      textColor: 'text-nova-navy',
    },
    invalid: {
      bg: 'bg-red-600/95',
      border: 'border-red-500',
      icon: XCircle,
      iconColor: 'text-white',
      title: 'INVALID QR',
      textColor: 'text-white',
    },
    idle: null,
  }

  const ov = result.state !== 'idle' ? overlayConfig[result.state] : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-nova-navy p-4 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between glass-dark border-b border-nova-primary/20">
        <div className="flex items-center gap-2">
          <QrCode size={18} className="text-nova-primary" />
          <span className="font-display font-bold text-nova-text tracking-wider">GATE SCANNER</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-nova-success rounded-full animate-pulse" />
            <span className="text-nova-success text-xs font-display">LIVE</span>
          </div>
        </div>
      </div>

      {/* Scanner view */}
      <div className="w-full max-w-sm mt-16">
        <div id="qr-reader" className="rounded-2xl overflow-hidden border border-nova-primary/30" />

        {/* Manual entry */}
        <div className="mt-6">
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full text-nova-muted text-sm text-center hover:text-nova-text transition-colors py-2"
          >
            {showManual ? 'Hide' : 'Enter code manually'}
          </button>
          {showManual && (
            <div className="flex gap-2 mt-2 animate-slide-up">
              <input
                type="text"
                placeholder="Paste entry code UUID..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="nova-input flex-1 text-sm"
              />
              <Button
                variant="primary"
                size="sm"
                loading={isPending}
                onClick={() => manualCode.trim() && processCode(manualCode.trim())}
              >
                Scan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Result overlay */}
      {ov && result.state !== 'idle' && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 ${ov.bg} backdrop-blur-sm animate-fade-in border-4 ${ov.border}`}>
          <ov.icon size={80} className={ov.iconColor} />
          <div className="text-center">
            <p className={`font-display font-black text-4xl ${ov.textColor} mb-2`}>{ov.title}</p>
            {result.name && <p className={`font-bold text-2xl ${ov.textColor}`}>{result.name}</p>}
            <p className={`text-lg mt-2 opacity-80 ${ov.textColor}`}>
              {result.timestamp ? `Checked in at ${result.timestamp}` : result.message}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white px-6 py-3 rounded-xl font-semibold transition-all mt-4"
          >
            <RotateCcw size={18} /> Scan Next
          </button>
        </div>
      )}
    </div>
  )
}
