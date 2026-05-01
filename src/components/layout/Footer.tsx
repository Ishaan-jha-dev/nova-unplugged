import Link from 'next/link'
import { Zap, Share2, MessageCircle, Link2, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-nova-primary/20 bg-nova-navy/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-nova-primary/20 border border-nova-primary/40 flex items-center justify-center">
                <Zap size={18} className="text-nova-primary" />
              </div>
              <span className="font-display font-bold text-lg gradient-text">NOVA UNPLUGGED</span>
            </div>
            <p className="text-nova-text-dim text-sm leading-relaxed">
              The annual college fest of IIM Bangalore. Cultural, technical, sports — all under one electric roof.
            </p>
            <div className="flex items-center gap-3">
              {[Share2, MessageCircle, Link2, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 glass rounded-lg flex items-center justify-center text-nova-muted hover:text-nova-primary hover:border-nova-primary/50 transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-nova-text-dim tracking-wider uppercase">Quick Links</h4>
            {[
              { href: '/', label: 'Home' },
              { href: '/about', label: 'About' },
              { href: '/timeline', label: 'Schedule' },
              { href: '/register', label: 'Register' },
              { href: '/login', label: 'Login' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="text-nova-text-dim hover:text-nova-primary text-sm transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-nova-text-dim tracking-wider uppercase">Contact</h4>
            <p className="text-nova-text-dim text-sm">IIM Bangalore Campus<br />Bannerghatta Road, Bengaluru<br />Karnataka – 560076</p>
            <a href="mailto:novaunplugged@iimb.ac.in" className="text-nova-primary hover:text-nova-primary-light text-sm transition-colors">
              novaunplugged@iimb.ac.in
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-nova-muted text-xs">© 2025 Nova Unplugged · IIM Bangalore. All rights reserved.</p>
          <p className="text-nova-muted text-xs">Built with ⚡ by the OC Tech Team</p>
        </div>
      </div>
    </footer>
  )
}
