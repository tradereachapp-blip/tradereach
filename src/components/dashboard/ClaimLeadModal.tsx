'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lead, Contractor } from '@/types'
import { PRO_MONTHLY_LEAD_CAP } from '@/lib/config'
import { PRICING } from '@/lib/pricing'

interface Props {
  lead: Lead
  contractor: Contractor
  onClose: () => void
  onClaimed: () => void
}

export default function ClaimLeadModal({ lead, contractor, onClose, onClaimed }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'confirm' | 'payment' | 'claiming'>('confirm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentIntentSecret, setPaymentIntentSecret] = useState('')

  const isOverCap = contractor.plan_type === 'pro' && contractor.leads_used_this_month >= PRO_MONTHLY_LEAD_CAP
  const isPPL = contractor.plan_type === 'pay_per_lead'
  const requiresPayment = isOverCap || isPPL
  const amount = isOverCap ? PRICING.PRO_OVERAGE : isPPL ? PRICING.PPL_PRICE : 0

  async function handleInitialClaim() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/leads/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id }),
      })
      const data = await res.json()

      if (data.success) {
        // Free claim — instant redirect to claimed tab with highlight
        setStep('claiming')
        onClaimed()
        router.push(`/dashboard/claimed?highlight=${lead.id}`)
      } else if (data.requires_payment) {
        const piRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: lead.id }),
        })
        const piData = await piRes.json()
        if (piData.client_secret) {
          setPaymentIntentSecret(piData.client_secret)
          setStep('payment')
        } else {
          setError(piData.error || 'Failed to initialize payment.')
        }
      } else {
        setError(data.error || 'Failed to claim lead.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePaymentConfirm() {
    setLoading(true)
    setError('')
    try {
      setStep('claiming')
      onClaimed()
      router.push(`/dashboard/claimed?highlight=${lead.id}`)
    } catch {
      setError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'claiming') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center border border-white/10">
          <div className="w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Lead Claimed!</h3>
          <p className="text-gray-500 text-sm">Taking you to your leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-bold text-white">Claim This Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 p-1 rounded-lg transition-colors hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === 'confirm' && (
            <div>
              <div className="bg-gray-800/60 border border-white/8 rounded-xl p-4 mb-4 space-y-2.5">
                {[
                  ['First Name', lead.name.split(' ')[0]],
                  ['ZIP Code', lead.zip],
                  ['Service', lead.niche],
                  ['Best Time', lead.callback_time ?? 'Anytime'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="font-medium text-white text-sm">{val}</span>
                  </div>
                ))}
              </div>

              {requiresPayment ? (
                <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-orange-300">
                    {isOverCap
                      ? `You've used all ${PRO_MONTHLY_LEAD_CAP} included leads this month. This lead is charged at $${PRICING.PRO_OVERAGE}.`
                      : `You'll be charged $${PRICING.PPL_PRICE} for this lead.`}
                  </p>
                  <p className="text-2xl font-black text-orange-400 mt-1">${amount}</p>
                </div>
              ) : (
                <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-green-300">
                    Included in your {contractor.plan_type} plan. Full contact info revealed instantly after claiming.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition-all font-medium text-sm hover:scale-[1.02]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitialClaim}
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm hover:scale-[1.02]"
                >
                  {loading ? 'Claiming...' : requiresPayment ? `Pay $${amount}` : 'Claim Lead'}
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div>
              <p className="text-gray-400 text-sm mb-4">
                Enter your card details to claim this lead for ${amount}.
              </p>
              <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-white/8 text-center">
                <p className="text-sm text-gray-500">Stripe Payment Element mounts here.</p>
              </div>
              {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep('confirm')} className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl font-medium text-sm hover:scale-[1.02] transition-all">
                  Back
                </button>
                <button
                  onClick={handlePaymentConfirm}
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold disabled:opacity-50 text-sm hover:scale-[1.02] transition-all"
                >
                  {loading ? 'Processing...' : `Pay $${amount}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
