'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, ArrowRight, Lock, KeyRound, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  // Forgot Password State
  const [isResetting, setIsResetting] = useState(false)
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'new-password'>('email')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: supaErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (supaErr) {
        setError(supaErr.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email first'); return }
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email)
      if (supaErr) setError(supaErr.message)
      else {
        setIsResetting(true)
        setResetStep('otp')
      }
    })
  }

  const handleVerifyOtp = async () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error: supaErr } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      })
      if (supaErr) setError(supaErr.message)
      else setResetStep('new-password')
    })
  }

  const handleUpdatePassword = async () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error: supaErr } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (supaErr) setError(supaErr.message)
      else {
        setIsResetting(false)
        setError('Password updated successfully! You can now login.')
        setResetStep('email')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 animated-bg" />
      <div className="absolute inset-0 mesh-bg opacity-30" />
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-nova-primary/15 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-nova-primary/20 border border-nova-primary/40 flex items-center justify-center mx-auto mb-4 shadow-glow-sm">
            <Lock size={28} className="text-nova-primary" />
          </div>
          <h1 className="font-display font-bold text-3xl gradient-text mb-2">Welcome Back</h1>
          <p className="text-nova-text-dim text-sm">Login to your Nova account</p>
        </div>

        <div className="glass-dark rounded-2xl p-8 border border-nova-primary/30 shadow-2xl">
          {error && (
            <div className={`mb-5 p-3 rounded-lg border text-sm flex items-center gap-2 ${
              error.includes('successfully') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              ⚠ {error}
            </div>
          )}

          {!isResetting ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="yourname@example.com"
                icon={<Mail size={16} />}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<KeyRound size={16} />}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-nova-primary hover:underline mt-2 float-right"
                >
                  Forgot Password?
                </button>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isPending}
                icon={<ArrowRight size={18} />}
                className="mt-2"
              >
                Login
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-5 animate-slide-up">
              <h2 className="text-nova-text font-semibold text-center mb-2">
                {resetStep === 'otp' ? 'Enter Reset Code' : 'Set New Password'}
              </h2>
              
              {resetStep === 'otp' ? (
                <>
                  <p className="text-nova-muted text-xs text-center -mt-2">
                    We sent a recovery code to {email}
                  </p>
                  <Input
                    label="Recovery OTP"
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    icon={<ShieldCheck size={16} />}
                  />
                  <Button variant="primary" fullWidth loading={isPending} onClick={handleVerifyOtp}>
                    Verify OTP
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    icon={<KeyRound size={16} />}
                  />
                  <Button variant="accent" fullWidth loading={isPending} onClick={handleUpdatePassword}>
                    Update Password
                  </Button>
                </>
              )}
              
              <button
                onClick={() => setIsResetting(false)}
                className="text-nova-muted text-xs hover:text-nova-text text-center"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-nova-muted text-sm mt-6">
          New here?{' '}
          <Link href="/register" className="text-nova-primary hover:text-nova-primary-light transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
