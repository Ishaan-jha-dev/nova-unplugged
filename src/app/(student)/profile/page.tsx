import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QRDisplay } from '@/components/ui/QRDisplay'
import { PaymentBadge, EntryBadge } from '@/components/ui/Badge'
import { User, Mail, Phone, MapPin, Zap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile | Nova Unplugged 2025' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('*, user_types(name), user_roles(name, permissions_level)')
    .eq('id', user.id)
    .single()

  const fields = [
    { label: 'Full Name',   value: userData?.full_name,  icon: User },
    { label: 'Email',       value: userData?.email,       icon: Mail },
    { label: 'Phone',       value: userData?.phone,       icon: Phone },
    { label: 'Pincode',     value: userData?.pincode,     icon: MapPin },
    { label: 'City',        value: userData?.city,        icon: MapPin },
    { label: 'State',       value: userData?.state,       icon: MapPin },
    { label: 'Batch',       value: userData?.batch,       icon: Zap },
    { label: 'Zone',        value: userData?.zone,        icon: Zap },
  ].filter(f => f.value)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl gradient-text mb-1">Your Profile</h1>
        <p className="text-nova-text-dim text-sm">Your registration details and gate pass QR code</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Profile info */}
        <div className="glass rounded-2xl p-6 border border-nova-primary/20">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-nova-primary/20 border border-nova-primary/30 flex items-center justify-center text-2xl font-bold font-display text-nova-primary">
              {userData?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-nova-text">{userData?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <PaymentBadge status={userData?.payment_status || 'pending'} />
                <EntryBadge status={userData?.entry_status || 'not_approved'} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {fields.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-nova-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-nova-primary" />
                </div>
                <div>
                  <p className="text-nova-muted text-xs">{label}</p>
                  <p className="text-nova-text text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex gap-2">
              {(userData?.user_types as any)?.name && (
                <span className="badge-individual capitalize">{(userData?.user_types as any).name.replace('_', ' ')}</span>
              )}
              {(userData?.user_roles as any)?.name && (
                <span className="badge-team capitalize">{(userData?.user_roles as any).name.replace('_', ' ')}</span>
              )}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="glass rounded-2xl p-6 border border-nova-primary/20 flex flex-col items-center justify-center">
          {userData?.payment_status === 'approved' && userData?.entry_code ? (
            <>
              <h3 className="font-display font-semibold text-nova-text mb-2">Your Gate Pass QR</h3>
              <p className="text-nova-text-dim text-xs mb-6 text-center">
                Show this at the gate for entry. Your code is unique and single-use.
              </p>
              <QRDisplay
                value={userData.entry_code}
                size={200}
                label={`Nova Unplugged 2025 · ${userData.full_name}`}
                downloadName={`nova-qr-${userData.full_name?.toLowerCase().replace(/\s/g, '-')}`}
              />
              <div className="mt-4 p-3 rounded-lg bg-nova-success/10 border border-nova-success/30 text-center">
                <p className="text-nova-success text-xs font-medium">✓ Entry Approved — Keep this QR safe</p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border-2 border-dashed border-nova-primary/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="font-display font-semibold text-nova-text mb-2">QR Not Available Yet</h3>
              <p className="text-nova-text-dim text-sm">
                {userData?.payment_status === 'pending'
                  ? 'Your payment is under review. QR will be generated once approved.'
                  : userData?.payment_status === 'rejected'
                  ? 'Your payment was rejected. Please resubmit on the payment page.'
                  : 'Complete payment to get your gate pass QR code.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
