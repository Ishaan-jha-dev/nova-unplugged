import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cookies } from 'next/headers'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const signOut = async () => {
    'use server'
    const supabase2 = await createClient()
    await supabase2.auth.signOut()
    cookies().delete('demo_bypass')
    redirect('/login')
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-nova-bg relative">
      {/* Sign out floating button */}
      <form action={signOut} className="absolute top-6 right-6 z-50">
        <button type="submit" className="w-12 h-12 rounded-full glass flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-glass">
          <LogOut size={20} />
        </button>
      </form>
      
      {/* Main content - strictly 100vh */}
      <main className="w-full h-full">
        {children}
      </main>
    </div>
  )
}
