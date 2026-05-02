'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Zap, LayoutDashboard, CreditCard, Users, Calendar,
  List, QrCode, Download, LogOut, Menu, X, ChevronLeft, Bell, History
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/components/ui/Button'

interface SidebarItem {
  href: string
  label: string
  icon: React.ElementType
  minLevel: number
}

const navItems: SidebarItem[] = [
  { href: '/admin',               label: 'Dashboard',     icon: LayoutDashboard, minLevel: 2 },
  { href: '/admin/scanner',       label: 'QR Scanner',    icon: QrCode,          minLevel: 2 },
  { href: '/admin/scanner/logs',  label: 'Scan Logs',     icon: History,         minLevel: 4 },
  { href: '/admin/events',        label: 'Events',        icon: Calendar,        minLevel: 3 },
  { href: '/admin/registrations', label: 'Registrations', icon: List,            minLevel: 3 },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell,            minLevel: 3 },
  { href: '/admin/payments',      label: 'Payments',      icon: CreditCard,      minLevel: 4 },
  { href: '/admin/users',         label: 'Users',         icon: Users,           minLevel: 4 },
  { href: '/admin/export',        label: 'Export',        icon: Download,        minLevel: 4 },
]

interface AdminSidebarProps {
  roleLevel: number
  userName: string
  userEmail: string
}

export function AdminSidebar({ roleLevel, userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const visibleItems = navItems.filter(item => roleLevel >= item.minLevel)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleLabel = ['', 'Student', 'Volunteer', 'OC Team', 'Admin', 'Super Admin'][roleLevel] || 'Admin'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-nova-primary/20 border border-nova-primary/40 flex items-center justify-center">
            <Zap size={18} className="text-nova-primary" />
          </div>
          <div>
            <span className="font-display font-bold gradient-text tracking-wider block leading-none">NOVA</span>
            <span className="text-nova-muted text-[10px] font-display tracking-widest uppercase">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${roleLevel >= 5 ? 'bg-nova-accent' : roleLevel >= 4 ? 'bg-nova-primary' : 'bg-nova-success'} animate-pulse`} />
          <span className="text-xs font-display text-nova-muted tracking-wider">{roleLabel}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-nova-primary/15 text-nova-primary border border-nova-primary/30 shadow-glow-sm'
                  : 'text-nova-text-dim hover:text-nova-text hover:bg-white/5'
              )}
            >
              <Icon size={17} className={active ? 'text-nova-primary' : 'group-hover:text-nova-primary transition-colors'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Back to site + sign out */}
      <div className="p-4 border-t border-white/10 flex flex-col gap-2">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-nova-muted hover:text-nova-text hover:bg-white/5 transition-all">
          <ChevronLeft size={14} /> Back to Student View
        </Link>
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-7 h-7 rounded-full bg-nova-primary/30 flex items-center justify-center text-xs font-bold text-nova-primary font-display shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-nova-text truncate">{userName}</p>
            <p className="text-xs text-nova-muted truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-nova-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 glass-dark border-r border-nova-primary/20 fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-dark border-b border-nova-primary/20 flex items-center justify-between px-4 h-14">
        <Link href="/admin" className="flex items-center gap-2">
          <Zap size={16} className="text-nova-primary" />
          <span className="font-display font-bold gradient-text text-sm">NOVA ADMIN</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="text-nova-text-dim hover:text-nova-text p-2 rounded-lg">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute top-14 left-0 bottom-0 w-64 glass-dark border-r border-nova-primary/20 animate-slide-up">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
