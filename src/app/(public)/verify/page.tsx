import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Suspense } from 'react'

function VerifyContent() {
  // We read email from query param (passed from register/login)
  // This is a server component friendly approach using the URL
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 animated-bg" />
      <div className="absolute inset-0 dots-bg opacity-20" />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Animated mail icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-nova-primary/20 border border-nova-primary/40 flex items-center justify-center shadow-glow-purple animate-float">
              <Mail size={44} className="text-nova-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-nova-success rounded-full flex items-center justify-center text-xs font-bold text-nova-navy animate-bounce">
              ✓
            </div>
          </div>
        </div>

        <h1 className="font-display font-bold text-3xl text-nova-text mb-3">Check Your Inbox</h1>
        <p className="text-nova-text-dim mb-2">
          We&apos;ve sent a verification link to your email.
        </p>
        <p className="text-nova-primary font-medium mb-8">
          Click the link in the email to verify and continue.
        </p>

        <div className="glass-dark rounded-2xl p-6 border border-nova-primary/20 mb-8">
          <div className="flex flex-col gap-3 text-left text-sm text-nova-text-dim">
            <div className="flex items-start gap-3">
              <span className="text-nova-primary mt-0.5">1.</span>
              <span>Open your inbox</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-nova-primary mt-0.5">2.</span>
              <span>Look for an email from <strong className="text-nova-text">Nova Unplugged</strong></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-nova-primary mt-0.5">3.</span>
              <span>Click the <strong className="text-nova-text">&quot;Verify Email&quot;</strong> button</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-nova-primary mt-0.5">4.</span>
              <span>You&apos;ll be redirected automatically to the platform</span>
            </div>
          </div>
        </div>

        <p className="text-nova-muted text-xs mb-4">
          Didn&apos;t receive it? Check spam, or{' '}
          <Link href="/login" className="text-nova-primary hover:underline">try again</Link>.
        </p>
        <p className="text-nova-muted text-xs">
          The link expires in <strong className="text-nova-text">60 minutes</strong>.
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-nova-muted">Loading...</div></div>}>
      <VerifyContent />
    </Suspense>
  )
}
