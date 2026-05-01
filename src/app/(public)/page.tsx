import Link from 'next/link'
import { Countdown } from '@/components/ui/Countdown'
import { ArrowRight, Music, Code2, Trophy, QrCode, Users, Star } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nova Unplugged 2025 | IIM Bangalore Annual Fest',
  description: 'The most electric college fest of IIM Bangalore is here. Cultural events, tech battles, sports, and more — June 2025.',
}

const FEST_DATE = process.env.NEXT_PUBLIC_FEST_DATE || '2025-06-20T09:00:00+05:30'

const features = [
  {
    icon: Music,
    title: 'Cultural Events',
    desc: 'Dance, music, drama, fashion — express yourself on the biggest stage.',
    color: 'from-purple-600 to-pink-600',
    glow: 'hover:shadow-glow-purple',
  },
  {
    icon: Code2,
    title: 'Tech Battles',
    desc: 'Hackathons, quizzes, case studies — prove your intellect.',
    color: 'from-blue-600 to-cyan-600',
    glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]',
  },
  {
    icon: Trophy,
    title: 'Sports Arena',
    desc: 'Cricket, football, basketball — compete, sweat, win.',
    color: 'from-orange-600 to-amber-600',
    glow: 'hover:shadow-[0_0_30px_rgba(234,88,12,0.4)]',
  },
  {
    icon: QrCode,
    title: 'Smart Entry',
    desc: 'Your unique QR code is your ticket. Verified, secure, instant.',
    color: 'from-green-600 to-emerald-600',
    glow: 'hover:shadow-[0_0_30px_rgba(22,163,74,0.4)]',
  },
  {
    icon: Users,
    title: 'Team Play',
    desc: 'Create or join teams. Build squads, compete together, win together.',
    color: 'from-nova-primary to-nova-accent',
    glow: 'hover:shadow-glow-pink',
  },
  {
    icon: Star,
    title: '1000+ Students',
    desc: 'Connect with the brightest minds from across India.',
    color: 'from-yellow-600 to-orange-600',
    glow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]',
  },
]

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 animated-bg">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 mesh-bg opacity-40" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nova-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-nova-accent/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col items-center gap-8 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass px-5 py-2 rounded-full text-sm font-medium border border-nova-primary/40 text-nova-primary animate-fade-in">
            <span className="w-2 h-2 bg-nova-success rounded-full animate-pulse" />
            IIM Bangalore · June 2025 · Registration Open
          </div>

          {/* Main title */}
          <div className="animate-slide-up">
            <h1 className="font-display font-black leading-tight tracking-tight">
              <span className="text-6xl sm:text-8xl lg:text-9xl block gradient-text drop-shadow-2xl">
                NOVA
              </span>
              <span className="text-3xl sm:text-5xl lg:text-6xl block text-nova-text mt-2">
                UNPLUGGED
              </span>
            </h1>
            <p className="mt-6 text-nova-text-dim text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              The annual college fest of IIM Bangalore. Three days. Unlimited energy.
              Cultural battles, tech showdowns, sports wars — and memories that last a lifetime.
            </p>
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-nova-muted text-xs font-display tracking-widest uppercase">Fest begins in</p>
            <Countdown targetDate={FEST_DATE} size="md" />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Link
              href="/register"
              className="group flex items-center gap-2 nova-btn-accent text-base px-8 py-4 rounded-xl font-bold"
            >
              Register Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 nova-btn-outline text-base px-8 py-4 rounded-xl font-semibold"
            >
              Learn More
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-8 mt-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            {[
              { value: '1000+', label: 'Participants' },
              { value: '30+',   label: 'Events' },
              { value: '3',     label: 'Days' },
              { value: '₹50K+', label: 'Prize Pool' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="font-display font-bold text-2xl gradient-text">{stat.value}</p>
                <p className="text-nova-muted text-xs font-display tracking-wider uppercase mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-nova-muted text-xs font-display tracking-widest">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-nova-primary to-transparent" />
        </div>
      </section>

      {/* ─── Features Grid ────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-nova-text mb-4">
              What&apos;s in store for you?
            </h2>
            <p className="text-nova-text-dim max-w-xl mx-auto">
              Nova Unplugged is more than a fest. It&apos;s an experience. Something to remember.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className={`nova-card group cursor-default ${f.glow} transition-all duration-300`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-nova-text mb-2">{f.title}</h3>
                  <p className="text-nova-text-dim text-sm leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-10 text-center relative overflow-hidden glow-border-purple">
            <div className="absolute inset-0 bg-purple-glow opacity-30" />
            <div className="relative z-10">
              <h2 className="font-display font-bold text-3xl sm:text-4xl gradient-text mb-4">
                Ready to plug in?
              </h2>
              <p className="text-nova-text-dim mb-8 text-lg">
                Register with your IIMB email, submit payment, and unlock the full Nova experience.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 nova-btn-primary text-lg px-10 py-4 rounded-xl font-bold"
              >
                Get Started <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
