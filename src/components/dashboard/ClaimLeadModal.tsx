'use client'

import { useState } from 'react'
import type { Lead, Contractor } from '@/types'
import { PRO_MONTHLY_LEAD_CAP } from '@/lib/config'

interface Props {
  lead: Lead
  contractor: Contractor
  onClose: () => void
  onClaimed: () => void
}

interface ClaimedLeadDetails {
  name: string
  phone: string
  zip: string
  niche: string
  description: string | null
  callback_time: string | null
}

export default function ClaimLeadModal({ lead, contractor, onClose, onClaimed }: Props) {
  const [step, setStep] = useState<'confirm' | 'payment' | 'success'>('confirm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [claimedDetails, setClaimedDetails] = useState<ClaimedLeadDetails | null>(null)
  const [paymentIntentSecret, setPaymentIntentSecret] = useState('')

  const isOverCap = contractor.plan_type === 'pro' && contractor.leads_used_this_month >= PRO_MONTHLY_LEAD_CAP
  const isPPL = contractor.plan_type === 'pay_per_lead'
  const requiresPayment = isOverCap || isPPL
  const amount = isOverCap ? 25 : isPPL ? 45 : 0

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
        // Free claim — fetch full lead details
        await fetchClaimedLead()
      } else if (data.requires_payment) {
        // Need to create payment intent
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

  async function fetchClaimedLead() {
    // After successful claim, reload page to show full details
    onClaimed()
    setStep('success')
  }

  async function handlePaymentConfirm() {
    setLoading(true)
    setError('')

    // In a real implementation, this would use Stripe.js to confirm the payment intent
    // For now, redirect to a Stripe-hosted page or handle via Payment Element
    // The webhook handles the actual lead claiming after payment_intent.succeeded
    
    try {
      // This is where you'd integrate @stripe/stripe-js Payment Element
      // For simplicity, we show a success state (webhook will process the claim)
      setStep('success')
      onClaimed()
    } catch {
      setError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'success' ? '✅ Lead Claimed!' : 'Claim This Lead'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === 'confirm' && (
            <div>
              {/* Lead preview */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">First Name</span>
                  <span className="font-medium text-gray-900">{lead.name.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ZIP Code</span>
                  <span className="font-medium text-gray-900">{lead.zip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Service</span>
                  <span className="font-medium text-gray-900">{lead.niche}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Best Time</span>
                  <span className="font-medium text-gray-900">{lead.callback_time ?? 'Anytime'}</span>
                </div>
              </div>

              {requiresPayment ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-orange-800 font-medium">
                    {isOverCap
                      ? `You've used all ${PRO_MONTHLY_LEAD_CAP} included leads this month. This lead will be charged at $25.`
                      : `You'll be charged $45 for this lead. Full contact info is revealed after payment.`
                    }
                  </p>
                  <p className="text-2xl font-black text-orange-600 mt-1">${amount}</p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-green-800">
                    This lead is included in your {contractor.plan_type} subscription. Full contact info revealed after claiming.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitialClaim}
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' :
                   requiresPayment ? `Confirm & Pay $${amount}` :
                   'Claim Lead'}
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div>
              <p className="text-gray-600 text-sm mb-4">
                Enter your card details to claim this lead for ${amount}.
              </p>
              
              {/* Stripe Payment Element would be mounted here */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border-2 border-dashed border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Stripe Payment Element mounts here.<br/>
                  Install @stripe/stripe-js and @stripe/react-stripe-js.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('confirm')} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium">
                  Back
                </button>
                <button
                  onClick={handlePaymentConfirm}
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay $${amount}`}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Lead Claimed!</h3>
              <p className="text-gray-500 text-sm mb-6">
                Full contact details are now visible in your Claimed Leads tab. Call them within 2 hours for best results.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/dashboard/claimed'}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
                >
                  View Contact Info
                </button>
                <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
