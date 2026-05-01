'use client'

import { useEffect, useState } from 'react'
import { cn } from './Button'

interface CountdownProps {
  targetDate: string | Date
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function Countdown({ targetDate, className, size = 'md' }: CountdownProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const [time, setTime] = useState<TimeLeft>(getTimeLeft(target))

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft(target)), 1000)
    return () => clearInterval(interval)
  }, [target])

  const sizeClasses = {
    sm: { box: 'w-14 h-14', num: 'text-2xl', label: 'text-[10px]' },
    md: { box: 'w-20 h-20', num: 'text-4xl', label: 'text-xs' },
    lg: { box: 'w-28 h-28', num: 'text-5xl', label: 'text-sm' },
  }[size]

  const units = [
    { label: 'DAYS',    value: time.days },
    { label: 'HOURS',   value: time.hours },
    { label: 'MINUTES', value: time.minutes },
    { label: 'SECONDS', value: time.seconds },
  ]

  return (
    <div className={cn('flex items-center gap-3 md:gap-4', className)}>
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-3 md:gap-4">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'glass rounded-xl flex items-center justify-center',
                'border border-nova-primary/40 shadow-glow-sm',
                sizeClasses.box
              )}
            >
              <span
                className={cn(
                  'font-display font-bold tabular-nums gradient-text',
                  sizeClasses.num
                )}
              >
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className={cn('font-display tracking-widest text-nova-muted', sizeClasses.label)}>
              {unit.label}
            </span>
          </div>
          {i < 3 && (
            <span className={cn('font-display font-bold text-nova-primary/60 -mt-4', sizeClasses.num)}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
