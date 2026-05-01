import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, email, user_roles(permissions_level)')
    .eq('id', user.id)
    .single()

  const roleLevel = (userData?.user_roles as any)?.permissions_level ?? 1
  if (roleLevel < 2) redirect('/')

  return (
    <div className="min-h-screen flex bg-nova-bg">
      <AdminSidebar
        roleLevel={roleLevel}
        userName={userData?.full_name || 'Admin'}
        userEmail={userData?.email || ''}
      />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
