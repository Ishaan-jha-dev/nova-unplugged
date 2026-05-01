'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'
import { Button } from './Button'

interface QRDisplayProps {
  value: string
  size?: number
  label?: string
  downloadName?: string
}

export function QRDisplay({ value, size = 200, label, downloadName = 'nova-qr' }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: '#6C3DE8',
        light: '#0D0D2B',
      },
      errorCorrectionLevel: 'H',
    })
  }, [value, size])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${downloadName}.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 rounded-2xl" style={{ background: '#0D0D2B', border: '2px solid rgba(108,61,232,0.5)', boxShadow: '0 0 30px rgba(108,61,232,0.3)' }}>
        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '8px' }} />
      </div>
      {label && <p className="text-nova-text-dim text-sm text-center">{label}</p>}
      <Button
        variant="outline"
        size="md"
        icon={<Download size={16} />}
        onClick={handleDownload}
      >
        Download QR as PNG
      </Button>
    </div>
  )
}
