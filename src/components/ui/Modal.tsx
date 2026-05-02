'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md', className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full glass-dark rounded-2xl shadow-glass animate-slide-up flex flex-col',
          'border border-nova-primary/30 max-h-[90vh]',
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
            <h2 className="text-lg font-semibold font-display text-nova-text">{title}</h2>
            <button
              onClick={onClose}
              className="text-nova-muted hover:text-nova-text transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Close button (if no title) */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-nova-muted hover:text-nova-text transition-colors p-1 rounded-lg hover:bg-white/5 z-10"
          >
            <X size={20} />
          </button>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  )
}
