'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PaymentBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle2, XCircle, Clock, AlertTriangle, CreditCard, Copy } from 'lucide-react'
import type { UserRow, PaymentSubmissionRow } from '@/lib/supabase/types'

interface PaymentFormProps {
  userData: UserRow | null
  submission: PaymentSubmissionRow | null
  userId: string
}

const UPI_ID   = process.env.NEXT_PUBLIC_UPI_ID   || 'novaunplugged@iimb'
const AMOUNT   = process.env.NEXT_PUBLIC_PAYMENT_AMOUNT || '999'

export function PaymentForm({ userData, submission, userId }: PaymentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [utr, setUtr] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const paymentStatus = userData?.payment_status ?? 'pending'
  const hasSubmission = !!submission

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('File size must be under 5MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  const handleSubmit = () => {
    if (!utr.trim() || utr.trim().length < 12) { setError('Enter a valid UTR number (12+ digits)'); return }
    if (!file) { setError('Please upload your payment screenshot'); return }
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      // Upload screenshot
      const ext = file.name.split('.').pop()
      const path = `${userId}/screenshot_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('payment-screenshots')
        .upload(path, file, { upsert: true })
      if (uploadErr) { setError(`Upload failed: ${uploadErr.message}`); return }

      // Insert submission
      const { error: dbErr } = await supabase
        .from('payment_submissions')
        .insert({ user_id: userId, utr_number: utr.trim(), screenshot_url: path })
      if (dbErr) { setError(`Submission failed: ${dbErr.message}`); return }

      // Also reset the user's master status to 'pending' (if it was rejected)
      await supabase
        .from('users')
        .update({ payment_status: 'pending' })
        .eq('id', userId)

      router.refresh()
    })
  }

  // ─── Approved ─────────────────────────────────────────────
  if (paymentStatus === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-nova-success/20 border border-nova-success/40 flex items-center justify-center mx-auto mb-6 shadow-glow-green animate-float">
            <CheckCircle2 size={40} className="text-nova-success" />
          </div>
          <h1 className="font-display font-bold text-3xl text-nova-success mb-3">Payment Approved!</h1>
          <p className="text-nova-text-dim mb-8">Your registration is confirmed. Head to the dashboard to explore events.</p>
          <Button variant="primary" size="lg" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 relative">
      <div className="absolute inset-0 mesh-bg opacity-20" />
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-3xl gradient-text mb-2">Complete Your Payment</h1>
          <p className="text-nova-text-dim">Pay via UPI and submit your UTR to confirm registration</p>
        </div>

        {/* Status banner if already submitted */}
        {hasSubmission && submission.status === 'rejected' && (
          <div className="mb-6 p-4 rounded-xl border flex items-start gap-4 bg-red-500/10 border-red-500/30">
            <XCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PaymentBadge status="rejected" />
                <span className="text-sm text-nova-text-dim">Your submission was rejected. Please resubmit.</span>
              </div>
              {submission.admin_note && (
                <p className="text-red-400 text-sm mt-1">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Reason: {submission.admin_note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Pending / Under Review State ─────────────────────── */}
        {hasSubmission && submission.status === 'pending' ? (
          <div className="glass rounded-3xl p-10 border border-nova-primary/30 text-center flex flex-col items-center gap-6 shadow-glow-purple/10">
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center animate-pulse">
              <Clock size={40} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-nova-text mb-2">Verification in Progress</h2>
              <p className="text-nova-text-dim max-w-sm mx-auto">
                We've received your payment proof! Our admin team is currently verifying your transaction. 
                This usually takes a few hours.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-nova-muted text-xs font-mono">
              UTR: {submission.utr_number}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.refresh()}>
              Refresh Status
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment instructions */}
            <div className="glass rounded-2xl p-6 border border-nova-primary/30">
            <h2 className="font-display font-semibold text-nova-text flex items-center gap-2 mb-5">
              <CreditCard size={18} className="text-nova-primary" /> Payment Details
            </h2>
            <div className="flex flex-col gap-4">
              <div className="text-center p-4 rounded-xl bg-nova-primary/10 border border-nova-primary/20">
                <p className="text-nova-muted text-xs mb-1 font-display tracking-wider">AMOUNT TO PAY</p>
                <p className="font-display font-black text-5xl gradient-text">₹{AMOUNT}</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-nova-muted text-xs">UPI ID</p>
                  <p className="text-nova-text font-mono font-semibold">{UPI_ID}</p>
                </div>
                <Button variant="outline" size="sm" icon={<Copy size={14} />} onClick={copyUPI}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-nova-muted text-xs text-center">
                Pay via GPay, PhonePe, Paytm, or any UPI app. Save the screenshot.
              </p>
            </div>
          </div>

          {/* Submission form */}
          <div className="glass rounded-2xl p-6 border border-nova-primary/30">
            <h2 className="font-display font-semibold text-nova-text mb-5">Submit Proof</h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}
            <div className="flex flex-col gap-4">
              <Input
                label="UTR Number"
                placeholder="1234567890123456"
                value={utr}
                onChange={e => setUtr(e.target.value)}
                hint="12–16 digit transaction reference number"
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-nova-text-dim">
                  Payment Screenshot <span className="text-nova-accent">*</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  preview ? 'border-nova-success/50 bg-nova-success/5' : 'border-nova-primary/30 hover:border-nova-primary hover:bg-nova-primary/5'
                }`}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-contain" />
                  ) : (
                    <>
                      <Upload size={24} className="text-nova-primary" />
                      <p className="text-nova-text-dim text-sm text-center">
                        Click to upload screenshot<br />
                        <span className="text-nova-muted text-xs">JPG, PNG, WebP — max 5MB</span>
                      </p>
                    </>
                  )}
                </label>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isPending}
                onClick={handleSubmit}
                disabled={hasSubmission && submission?.status === 'pending'}
              >
                {hasSubmission && submission?.status === 'pending'
                  ? 'Submission Under Review'
                  : isPending ? 'Submitting...'
                  : 'Submit Payment'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
