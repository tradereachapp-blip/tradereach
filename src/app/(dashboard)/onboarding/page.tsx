'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NICHES, NICHE_DESCRIPTIONS, NICHE_ICONS } from '@/lib/config'
import type { Niche } from '@/types'

type Step = 1 | 2 | 3 | 4 | 5

interface PromoState {
  input: string
  loading: boolean
  error: string
  success: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')

  // Step 2
  const [niche, setNiche] = useState<Niche | null>(null)

  // Step 3
  const [zipInput, setZipInput] = useState('')
  const [zipCodes, setZipCodes] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState<'pay_per_lead' | 'pro' | 'elite' | null>(null)

  // Step 4 — plan selection
  const maxZips = selectedPlan === 'elite' ? Infinity : selectedPlan === 'pro' ? 10 : 5

  // Promo code
  const [showPromo, setShowPromo] = useState(false)
  const [promo, setPromo] = useState<PromoState>({ input: '', loading: false, error: '', success: '' })

  async function handlePromoRedeem() {
    if (!promo.input.trim()) return
    setPromo(p => ({ ...p, loading: true, error: '', success: '' }))

    // Save contractor record first (need it in DB before redeeming)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const upsertData = {
      user_id: user.id,
      business_name: businessName,
      contact_name: contactName,
      phone,
      license_number: licenseNumber || null,
      niche: niche!,
      zip_codes: zipCodes,
      plan_type: 'none' as const,
    }
    await supabase.from('contractors').upsert(upsertData, { onConflict: 'user_id' })

    const res = await fetch('/api/promo/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promo.input.trim() }),
    })
    const data = await res.json()

    if (data.success) {
      setPromo(p => ({ ...p, loading: false, success: data.message }))
      setTimeout(() => setStep(5), 1200)
    } else {
      setPromo(p => ({ ...p, loading: false, error: data.error || 'Invalid promo code.' }))
    }
  }

  function addZip() {
    const z = zipInput.trim()
    if (!/^\d{5}$/.test(z)) {
      setError('Please enter a valid 5-digit ZIP code.')
      return
    }
    if (zipCodes.includes(z)) {
      setError('ZIP code already added.')
      return
    }
    if (zipCodes.length >= maxZips) {
      setError(`Your plan allows up to ${maxZips} ZIP codes.`)
      return
    }
    setZipCodes([...zipCodes, z])
    setZipInput('')
    setError('')
  }

  function removeZip(z: string) {
    setZipCodes(zipCodes.filter((x) => x !== z))
  }

  async function handlePlanSelect(plan: 'pay_per_lead' | 'pro' | 'elite') {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Save contractor record first
    const upsertData = {
      user_id: user.id,
      business_name: businessName,
      contact_name: contactName,
      phone,
      license_number: licenseNumber || null,
      niche: niche!,
      zip_codes: zipCodes,
      plan_type: plan,
    }

    const { error: upsertError } = await supabase
      .from('contractors')
      .upsert(upsertData, { onConflict: 'user_id' })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    if (plan === 'pay_per_lead') {
      // Mark onboarding complete
      await supabase
        .from('contractors')
        .update({ onboarding_complete: true })
        .eq('user_id', user.id)
      setStep(5)
      setLoading(false)
    } else {
      // Start Stripe checkout
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: plan }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout.')
        setLoading(false)
      }
    }
  }

  function validateStep(currentStep: Step): boolean {
    setError('')
    if (currentStep === 1) {
      if (!businessName.trim()) { setError('Business name is required.'); return false }
      if (!contactName.trim()) { setError('Contact name is required.'); return false }
      if (!phone.trim()) { setError('Phone number is required.'); return false }
    }
    if (currentStep === 2) {
      if (!niche) { setError('Please select your service niche.'); return false }
    }
    if (currentStep === 3) {
      if (zipCodes.length === 0) { setError('Add at least one ZIP code.'); return false }
    }
    return true
  }

  function next() {
    if (!validateStep(step)) return
    setStep((s) => (s + 1) as Step)
  }

  const stepLabels = ['Business Info', 'Your Niche', 'Service Area', 'Choose Plan', 'Confirmation']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">T</span>
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-xl">TradeReach</div>
              <div className="text-blue-300 text-xs">Home Service Leads</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                step > i + 1 ? 'bg-green-500 text-white'
                : step === i + 1 ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-blue-300'
              }`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Business Information</h2>
              <p className="text-blue-200 text-sm mb-6">Tell us about your company</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Smith Roofing LLC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">Your Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="(555) 555-5555"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">License Number <span className="text-blue-400">(Optional)</span></label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="State contractor license #"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Niche */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Select Your Niche</h2>
              <p className="text-blue-200 text-sm mb-6">Choose the type of work you do</p>

              <div className="space-y-3">
                {NICHES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNiche(n)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      niche === n
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{NICHE_ICONS[n]}</span>
                      <div>
                        <div className="font-semibold text-white">{n}</div>
                        <div className="text-sm text-blue-300">{NICHE_DESCRIPTIONS[n]}</div>
                      </div>
                      {niche === n && (
                        <span className="ml-auto text-orange-400">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: ZIP Codes */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Service ZIP Codes</h2>
              <p className="text-blue-200 text-sm mb-2">
                Add the ZIP codes you serve. You can add up to{' '}
                {selectedPlan === 'elite' ? 'unlimited' : selectedPlan === 'pro' ? '10' : '5'} ZIPs
                {!selectedPlan && ' (select your plan in step 4 to adjust limits)'}.
              </p>
              <p className="text-blue-400 text-xs mb-6">You can update these anytime in Settings.</p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addZip())}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. 90210"
                  maxLength={5}
                />
                <button
                  onClick={addZip}
                  className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all"
                >
                  Add
                </button>
              </div>

              {zipCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {zipCodes.map((z) => (
                    <span
                      key={z}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-full text-sm"
                    >
                      {z}
                      <button
                        onClick={() => removeZip(z)}
                        className="ml-1 text-blue-400 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {zipCodes.length === 0 && (
                <p className="text-blue-400 text-sm italic">No ZIP codes added yet.</p>
              )}
            </div>
          )}

          {/* Step 4: Plan Selection */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Choose Your Plan</h2>
              <p className="text-blue-200 text-sm mb-6">
                Pro and Elite include a 7-day free trial.
              </p>

              <div className="space-y-4">
                {/* Pay Per Lead */}
                <div className="border-2 border-white/20 rounded-xl p-5 bg-white/5 hover:border-white/40 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">Pay Per Lead</h3>
                      <p className="text-blue-300 text-sm">No commitment</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">$45</span>
                      <span className="text-blue-300 text-sm">/lead</span>
                    </div>
                  </div>
                  <ul className="text-sm text-blue-200 space-y-1 mb-4">
                    <li>✓ Pay only when you claim a lead</li>
                    <li>✓ Up to 5 ZIP codes</li>
                    <li>✓ No monthly commitment</li>
                    <li>✗ No priority delivery</li>
                  </ul>
                  <button
                    onClick={() => handlePlanSelect('pay_per_lead')}
                    disabled={loading}
                    className="w-full py-2.5 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-all font-medium disabled:opacity-50"
                  >
                    Select Pay Per Lead
                  </button>
                </div>

                {/* Pro */}
                <div className="border-2 border-blue-500/50 rounded-xl p-5 bg-blue-500/10 hover:border-blue-400 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">Pro</h3>
                      <p className="text-blue-300 text-sm">7-day free trial</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">$297</span>
                      <span className="text-blue-300 text-sm">/mo</span>
                    </div>
                  </div>
                  <ul className="text-sm text-blue-200 space-y-1 mb-4">
                    <li>✓ 30 leads/month included</li>
                    <li>✓ $25/lead after cap</li>
                    <li>✓ Up to 10 ZIP codes</li>
                    <li>✓ Shared territory</li>
                  </ul>
                  <button
                    onClick={() => handlePlanSelect('pro')}
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium disabled:opacity-50"
                  >
                    {loading ? 'Starting checkout...' : 'Start Free Trial'}
                  </button>
                </div>

                {/* Elite */}
                <div className="border-2 border-orange-500 rounded-xl p-5 bg-orange-500/10 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="flex justify-between items-start mb-3 mt-1">
                    <div>
                      <h3 className="font-bold text-white text-lg">Elite</h3>
                      <p className="text-orange-300 text-sm">7-day free trial</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">$597</span>
                      <span className="text-orange-300 text-sm">/mo</span>
                    </div>
                  </div>
                  <ul className="text-sm text-orange-100 space-y-1 mb-4">
                    <li>✓ <strong>Unlimited</strong> leads</li>
                    <li>✓ Exclusive zip code territory</li>
                    <li>✓ Priority lead delivery (15-min head start)</li>
                    <li>✓ Unlimited ZIP codes</li>
                    <li>✓ No overage charges ever</li>
                  </ul>
                  <button
                    onClick={() => handlePlanSelect('elite')}
                    disabled={loading}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all font-bold disabled:opacity-50"
                  >
                    {loading ? 'Starting checkout...' : 'Start Free Trial'}
                  </button>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mt-6 border-t border-white/10 pt-5">
                {!showPromo ? (
                  <button
                    onClick={() => setShowPromo(true)}
                    className="w-full text-center text-blue-400 hover:text-blue-300 text-sm transition-colors underline underline-offset-2"
                  >
                    Have a promo code?
                  </button>
                ) : (
                  <div>
                    <p className="text-blue-200 text-sm font-medium mb-3 text-center">Enter your promo code</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promo.input}
                        onChange={(e) => setPromo(p => ({ ...p, input: e.target.value, error: '', success: '' }))}
                        onKeyDown={(e) => e.key === 'Enter' && handlePromoRedeem()}
                        placeholder="Your promo code"
                        className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono tracking-wide"
                        disabled={promo.loading}
                        autoFocus
                      />
                      <button
                        onClick={handlePromoRedeem}
                        disabled={promo.loading || !promo.input.trim()}
                        className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                      >
                        {promo.loading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promo.error && (
                      <p className="mt-2 text-red-300 text-sm text-center">{promo.error}</p>
                    )}
                    {promo.success && (
                      <div className="mt-3 bg-green-500/20 border border-green-400/30 rounded-lg p-3 text-center">
                        <p className="text-green-300 font-semibold text-sm">🎉 {promo.success}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">You're all set!</h2>
              <p className="text-blue-200 mb-6">
                Welcome to TradeReach, {contactName.split(' ')[0]}! Your account is active and you're ready to receive leads.
              </p>
              <div className="bg-white/10 rounded-xl p-4 text-left mb-6">
                <p className="text-blue-200 text-sm font-medium mb-2">What happens next:</p>
                <ul className="text-blue-200 text-sm space-y-2">
                  <li className="flex gap-2"><span className="text-orange-400">📱</span> You'll receive an SMS and email the moment a matching lead comes in</li>
                  <li className="flex gap-2"><span className="text-orange-400">⚡</span> Log in fast — leads are first-come, first-served</li>
                  <li className="flex gap-2"><span className="text-orange-400">📞</span> Call the homeowner and close the job</li>
                </ul>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="flex-1 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-all font-medium"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Continue
              </button>
            </div>
          )}
          {step === 4 && (
            <button
              onClick={() => setStep(3)}
              className="mt-4 w-full py-2 border border-white/20 text-blue-300 rounded-lg hover:bg-white/5 transition-all text-sm"
            >
              ← Back to ZIP codes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
