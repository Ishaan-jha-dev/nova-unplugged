import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Schedule | Nova Unplugged 2025',
  description: 'Full event schedule and timeline for Nova Unplugged 2025 at IIM Bangalore.',
}

const timeline = [
  {
    phase: 'Registration Phase',
    color: 'nova-primary',
    glow: 'shadow-glow-purple',
    dates: [
      { date: 'May 1, 2025',   label: 'Registrations Open',         done: true  },
      { date: 'June 10, 2025', label: 'Registration Deadline',       done: false },
      { date: 'June 12, 2025', label: 'Payment Verification Closes', done: false },
    ],
  },
  {
    phase: 'Pre-Fest Events',
    color: 'nova-accent',
    glow: 'shadow-glow-pink',
    dates: [
      { date: 'June 15, 2025', label: 'Online Prelims (Tech Events)', done: false },
      { date: 'June 17, 2025', label: 'Team Formation Deadline',      done: false },
    ],
  },
  {
    phase: 'Fest Day 1 — June 20',
    color: 'nova-success',
    glow: 'shadow-glow-green',
    dates: [
      { date: '9:00 AM',  label: 'Gates Open — QR Check-in',      done: false },
      { date: '10:00 AM', label: 'Inauguration Ceremony',          done: false },
      { date: '12:00 PM', label: 'Cultural Events Begin',          done: false },
      { date: '3:00 PM',  label: 'Sports Events — Ground Arena',   done: false },
      { date: '7:00 PM',  label: 'Evening Cultural Show',          done: false },
    ],
  },
  {
    phase: 'Fest Day 2 — June 21',
    color: 'nova-warning',
    glow: 'shadow-[0_0_20px_rgba(255,184,0,0.4)]',
    dates: [
      { date: '9:00 AM',  label: 'Tech Events & Hackathon Starts', done: false },
      { date: '11:00 AM', label: 'Case Study Competition',         done: false },
      { date: '2:00 PM',  label: 'Quiz Finals',                    done: false },
      { date: '6:00 PM',  label: 'Fashion Show',                   done: false },
      { date: '9:00 PM',  label: 'Night Concert',                  done: false },
    ],
  },
  {
    phase: 'Fest Day 3 — June 22',
    color: 'nova-accent',
    glow: 'shadow-glow-pink',
    dates: [
      { date: '10:00 AM', label: 'Finals — All Categories',        done: false },
      { date: '2:00 PM',  label: 'Prize Distribution',             done: false },
      { date: '4:00 PM',  label: 'Closing Ceremony',               done: false },
      { date: '5:30 PM',  label: 'Nova Unplugged 2025 Ends 🎉',    done: false },
    ],
  },
]

const colorMap: Record<string, string> = {
  'nova-primary': '#6C3DE8',
  'nova-accent':  '#E83D8A',
  'nova-success': '#00FF88',
  'nova-warning': '#FFB800',
}

export default function TimelinePage() {
  return (
    <div className="min-h-screen py-16 px-4 relative">
      <div className="absolute inset-0 mesh-bg opacity-20" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display font-bold text-4xl sm:text-5xl gradient-text mb-4">
            Event Timeline
          </h1>
          <p className="text-nova-text-dim max-w-xl mx-auto">
            From registrations to the final night — every moment mapped out for you.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-nova-text-dim">
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-nova-primary" /> IIM Bangalore Campus</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-nova-primary" /> June 20–22, 2025</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Central line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-nova-primary via-nova-accent to-nova-primary/20" />

          <div className="flex flex-col gap-12">
            {timeline.map((phase) => {
              const color = colorMap[phase.color]
              return (
                <div key={phase.phase} className="relative pl-16">
                  {/* Phase dot */}
                  <div
                    className={`absolute left-3 top-1 w-6 h-6 rounded-full flex items-center justify-center ${phase.glow}`}
                    style={{ background: color, boxShadow: `0 0 12px ${color}80` }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>

                  {/* Phase header */}
                  <div className="glass rounded-xl p-5 border" style={{ borderColor: `${color}40` }}>
                    <h2 className="font-display font-bold text-lg mb-4" style={{ color }}>
                      {phase.phase}
                    </h2>

                    <div className="flex flex-col gap-3">
                      {phase.dates.map(item => (
                        <div key={item.label} className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-nova-muted min-w-[110px]">
                            <Clock size={12} />
                            {item.date}
                          </div>
                          <div className={`flex items-center gap-2 ${item.done ? 'text-nova-success' : 'text-nova-text'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.done ? 'bg-nova-success' : 'bg-nova-muted'}`} />
                            <span className="text-sm">{item.label}</span>
                            {item.done && <span className="text-xs badge-approved">Done</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-nova-text-dim mb-4">Don&apos;t miss out — register now before June 10!</p>
          <Link href="/register" className="nova-btn-accent inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white">
            Register for Nova Unplugged <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
