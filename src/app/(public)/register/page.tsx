'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, User, Phone, MapPin, Hash, ShieldCheck, ArrowRight, ArrowLeft, Check, Users, School } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type UserType = 'iimb_student' | 'iimb_faculty'

const zoneOptions = [
  { value: '', label: 'Select Zone' },
  { value: 'NORTH ZONE 01', label: 'NORTH ZONE 01' },
  { value: 'NORTH ZONE 02', label: 'NORTH ZONE 02' },
  { value: 'SOUTH ZONE 01', label: 'SOUTH ZONE 01' },
  { value: 'SOUTH ZONE 02', label: 'SOUTH ZONE 02' },
  { value: 'WEST ZONE 01', label: 'WEST ZONE 01' },
  { value: 'WEST ZONE 02', label: 'WEST ZONE 02' },
  { value: 'EAST ZONE', label: 'EAST ZONE' },
  { value: 'CENTRAL ZONE', label: 'CENTRAL ZONE' },
]

const batchOptions = [
  { value: '', label: 'Select Batch' },
  { value: 'Batch 1', label: 'Batch 1' },
  { value: 'Batch 2', label: 'Batch 2' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [userType, setUserType] = useState<UserType>('iimb_student')
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otp, setOtp] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pincode: '',
    state: '',
    city: '',
    batch: '',
    zone: '',
    studentId: '', // Used for Roll No / Employee ID
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  // Pincode Auto-fetch
  useEffect(() => {
    if (form.pincode.length === 6 && userType === 'iimb_student') {
      const fetchLocation = async () => {
        setPincodeLoading(true)
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`)
          const data = await res.json()
          if (data[0].Status === 'Success') {
            const { District, State } = data[0].PostOffice[0]
            setForm(f => ({ ...f, city: District, state: State }))
            setError(null)
          } else {
            setError('Invalid Pincode')
          }
        } catch (err) {
          console.error('Pincode fetch failed', err)
        } finally {
          setPincodeLoading(false)
        }
      }
      fetchLocation()
    }
  }, [form.pincode, userType])

  const validate = () => {
    if (!form.fullName.trim()) return 'Full name is required'
    if (!form.email.includes('@')) return 'Enter a valid email address'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    
    if (userType === 'iimb_student') {
      if (!form.phone.match(/^[6-9]\d{9}$/)) return 'Enter a valid 10-digit mobile number'
      if (!form.pincode.match(/^\d{6}$/)) return 'Enter a valid 6-digit pincode'
      if (!form.batch) return 'Select your batch'
      if (!form.zone) return 'Select your zone'
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError(null)

    startTransition(async () => {
      try {
        console.log('Starting signup for:', form.email)
        const supabase = createClient()
        const { data, error: supaErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name:  form.fullName,
              phone:      form.phone,
              pincode:    form.pincode,
              state:      form.state,
              city:       form.city,
              batch:      form.batch,
              zone:       form.zone,
              user_type:  userType,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (supaErr) {
          console.error('Supabase Auth Error:', supaErr)
          setError(supaErr.message)
        } else if (data.user) {
          console.log('Signup successful:', data.user)
          setStep('otp')
        } else {
          console.warn('Signup returned no error but no user data.')
          setError('An unexpected error occurred. Please try again.')
        }
      } catch (err: any) {
        console.error('Critical Signup Error:', err)
        setError(err.message || 'A network error occurred.')
      }
    })
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      setError('Please enter the 6-digit code')
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error: supaErr } = await supabase.auth.verifyOtp({
          email: form.email,
          token: otp,
          type: 'signup',
        })

        if (supaErr) {
          setError(supaErr.message)
        } else {
          // Verification successful, redirect to dashboard or payment
          router.push('/dashboard')
          router.refresh()
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during verification.')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 animated-bg" />
      <div className="absolute inset-0 dots-bg opacity-30" />
      
      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-6">
          <h1 className="font-display font-bold text-3xl gradient-text mb-2">Create Account</h1>
          <p className="text-nova-text-dim text-sm">Join Nova Unplugged 2025</p>
        </div>

        {step === 'form' ? (
          <>
            {/* User Type Toggle */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/10 max-w-xs mx-auto">
              <button
                onClick={() => setUserType('iimb_student')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  userType === 'iimb_student' ? 'bg-nova-primary text-white shadow-glow-sm' : 'text-nova-text-dim hover:text-nova-text'
                }`}
              >
                <Users size={16} /> Student
              </button>
              <button
                onClick={() => setUserType('iimb_faculty')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  userType === 'iimb_faculty' ? 'bg-nova-primary text-white shadow-glow-sm' : 'text-nova-text-dim hover:text-nova-text'
                }`}
              >
                <School size={16} /> Staff/Faculty
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-dark rounded-2xl p-8 border border-nova-primary/30 shadow-2xl">
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  ⚠ {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  placeholder="Your Name"
                  icon={<User size={16} />}
                  value={form.fullName}
                  onChange={set('fullName')}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="email@example.com"
                  icon={<Mail size={16} />}
                  value={form.email}
                  onChange={set('email')}
                  required
                />
                
                <Input
                  label={userType === 'iimb_student' ? 'Mobile Number' : 'Contact (Optional)'}
                  type="tel"
                  placeholder="9876543210"
                  icon={<Phone size={16} />}
                  value={form.phone}
                  onChange={set('phone')}
                  maxLength={10}
                  required={userType === 'iimb_student'}
                />

                {userType === 'iimb_student' && (
                  <>
                    <Input
                      label="Pincode"
                      placeholder="6-digit PIN"
                      icon={<MapPin size={16} />}
                      value={form.pincode}
                      onChange={set('pincode')}
                      maxLength={6}
                      required
                    />
                    <div className="flex gap-2">
                      <Input
                        label="City"
                        placeholder="City"
                        value={form.city}
                        onChange={set('city')}
                        className="flex-1"
                      />
                      <Input
                        label="State"
                        placeholder="State"
                        value={form.state}
                        onChange={set('state')}
                        className="flex-1"
                      />
                    </div>
                    <Select
                      label="Batch"
                      options={batchOptions}
                      value={form.batch}
                      onChange={set('batch') as any}
                      required
                    />
                    <Select
                      label="Zone"
                      options={zoneOptions}
                      value={form.zone}
                      onChange={set('zone') as any}
                      required
                    />
                  </>
                )}

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<ShieldCheck size={16} />}
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<ShieldCheck size={16} />}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isPending}
                className="mt-8"
              >
                {isPending ? 'Creating Account...' : 'Register Now'}
              </Button>
            </form>
          </>
        ) : (
          <div className="glass-dark rounded-2xl p-8 border border-nova-primary/30 shadow-2xl animate-slide-up">
            <h2 className="text-nova-text font-semibold text-center mb-2 text-xl">
              Verify Your Email
            </h2>
            <p className="text-nova-muted text-sm text-center mb-6">
              We&apos;ve sent a 6-digit code to <strong>{form.email}</strong>
            </p>
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                ⚠ {error}
              </div>
            )}
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <Input
                label="6-Digit OTP"
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                icon={<ShieldCheck size={16} />}
                maxLength={6}
                required
              />
              <Button type="submit" variant="primary" fullWidth loading={isPending}>
                Verify Account
              </Button>
            </form>
            <button
              onClick={() => setStep('form')}
              className="text-nova-muted text-xs hover:text-nova-text text-center w-full mt-4"
            >
              Back to Registration
            </button>
          </div>
        )}

        <p className="text-center text-nova-muted text-sm mt-6">
          Already registered?{' '}
          <Link href="/login" className="text-nova-primary hover:text-nova-primary-light transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
