import type { Metadata } from 'next'
import { Zap, Target, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About | Nova Unplugged 2025',
  description: 'Learn about Nova Unplugged — the annual college fest of IIM Bangalore, its story, and the organising committee.',
}

const teamMembers = [
  { name: 'Arjun Mehta',    role: 'Fest Director',       emoji: '🎯' },
  { name: 'Priya Sharma',   role: 'Cultural Head',        emoji: '🎭' },
  { name: 'Rahul Gupta',    role: 'Tech Events Head',     emoji: '💻' },
  { name: 'Sneha Patel',    role: 'Sports Head',          emoji: '🏆' },
  { name: 'Vikram Nair',    role: 'Marketing Head',       emoji: '📣' },
  { name: 'Aditi Roy',      role: 'Finance Head',         emoji: '💰' },
  { name: 'Karan Singh',    role: 'Logistics Head',       emoji: '🚛' },
  { name: 'Meera Joshi',    role: 'Design & Media Head',  emoji: '🎨' },
]

const values = [
  { icon: Zap,    title: 'Energy',     desc: 'We bring unmatched enthusiasm and drive to everything we do.' },
  { icon: Target, title: 'Excellence', desc: 'Raising the bar, year after year, in every event and experience.' },
  { icon: Heart,  title: 'Community',  desc: 'Building bonds across batches, campuses, and backgrounds.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 mesh-bg opacity-20" />

      {/* Hero */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute top-10 right-1/4 w-60 h-60 bg-nova-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="font-display font-black text-5xl sm:text-6xl gradient-text mb-6">About Nova</h1>
          <p className="text-nova-text-dim text-lg leading-relaxed">
            Nova Unplugged is the annual college fest of IIM Bangalore — a three-day explosion of culture,
            intellect, and sportsmanship. Born from the belief that the best business leaders are also
            the most well-rounded individuals, Nova celebrates every dimension of human potential.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-nova-text text-center mb-10">What We Stand For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map(v => {
              const Icon = v.icon
              return (
                <div key={v.title} className="nova-card text-center">
                  <div className="w-14 h-14 rounded-2xl bg-nova-primary/20 border border-nova-primary/30 flex items-center justify-center mx-auto mb-4">
                    <Icon size={26} className="text-nova-primary" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-nova-text mb-2">{v.title}</h3>
                  <p className="text-nova-text-dim text-sm">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* OC Team */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-nova-text text-center mb-3">The Organising Committee</h2>
          <p className="text-nova-text-dim text-center mb-12 max-w-xl mx-auto">
            The passionate team making Nova Unplugged 2025 happen.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {teamMembers.map(member => (
              <div key={member.name} className="nova-card text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nova-primary/30 to-nova-accent/20 border border-nova-primary/30 flex items-center justify-center mx-auto mb-4 text-3xl group-hover:scale-110 transition-transform duration-300">
                  {member.emoji}
                </div>
                <p className="font-semibold text-nova-text text-sm">{member.name}</p>
                <p className="text-nova-muted text-xs mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-2xl p-10 border border-nova-primary/30 glow-border-purple">
            <h2 className="font-display font-bold text-2xl gradient-text mb-4">Get in Touch</h2>
            <p className="text-nova-text-dim mb-6">Questions? Sponsorships? Partnerships? We&apos;d love to hear from you.</p>
            <a
              href="mailto:novaunplugged@iimb.ac.in"
              className="nova-btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white"
            >
              📧 novaunplugged@iimb.ac.in
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
