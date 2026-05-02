import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap, LayoutDashboard, Calendar, BookMarked, User, LogOut, Info, Clock } from 'lucide-react'

const studentNav = [
  { href: '/dashboard',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dashboard/events',    label: 'Events',     icon: Calendar },
  { href: '/dashboard/my-events', label: 'My Events',  icon: BookMarked },
  { href: '/profile',             label: 'Profile',    icon: User },
  { href: '/timeline',            label: 'Timeline',   icon: Clock },
  { href: '/about',               label: 'About',      icon: Info },
]

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: _ud } = await supabase
    .from('users')
    .select('full_name, email, payment_status')
    .eq('id', user.id)
    .single()
  const userData = _ud as { full_name: string; email: string; payment_status: string } | null

  const initials = (userData?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const signOut = async () => {
    'use server'
    const supabase2 = await createClient()
    await supabase2.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex bg-nova-bg">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-dark border-r border-nova-primary/20 fixed top-0 left-0 h-full z-30">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-nova-primary/20 border border-nova-primary/40 flex items-center justify-center">
              <Zap size={18} className="text-nova-primary" />
            </div>
            <span className="font-display font-bold gradient-text tracking-wider">NOVA</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {studentNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-nova-text-dim hover:text-nova-text hover:bg-white/5 transition-all group"
            >
              <Icon size={18} className="group-hover:text-nova-primary transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-nova-primary/30 border border-nova-primary/40 flex items-center justify-center text-xs font-bold text-nova-primary font-display">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-nova-text truncate">{userData?.full_name}</p>
              <p className="text-xs text-nova-muted truncate">{userData?.email}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-nova-muted hover:text-red-400 hover:bg-red-500/10 transition-all mt-1">
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 glass-dark border-b border-nova-primary/20 flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Zap size={18} className="text-nova-primary" />
          <span className="font-display font-bold gradient-text text-sm">NOVA</span>
        </Link>
        <div className="flex items-center gap-3">
          {studentNav.map(({ href, icon: Icon }) => (
            <Link key={href} href={href} className="text-nova-muted hover:text-nova-primary transition-colors p-1">
              <Icon size={18} />
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
