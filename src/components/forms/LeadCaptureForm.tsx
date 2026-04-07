'use client'

import { useState, useEffect } from 'react'

const NICHES = [
  { value: 'Roofing', icon: '🏠', label: 'Roofing' },
  { value: 'HVAC', icon: '❄️', label: 'HVAC' },
  { value: 'Plumbing', icon: '🔧', label: 'Plumbing' },
  { value: 'Electrical', icon: '⚡', label: 'Electrical' },
  { value: 'Windows & Doors', icon: '🪟', label: 'Windows & Doors' },
  { value: 'Painting', icon: '🖌️', label: 'Painting' },
]

const CALLBACK_OPTIONS = [
  { value: 'Morning', label: 'Morning', sub: '8am – 12pm' },
  { value: 'Afternoon', label: 'Afternoon', sub: '12pm – 5pm' },
  { value: 'Evening', label: 'Evening', sub: '5pm – 8pm' },
  { value: 'Anytime', label: 'Anytime', sub: 'No preference' },
]

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function LeadCaptureForm() {
  const [form, setForm] = useState({
    name: '', phone: '', zip: '', niche: '', description: '', callback_time: '', tcpa_consent: false,
  })
  const [loadTime] = useState(() => Date.now())
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [duplicate, setDuplicate] = useState(false)

  // Load TrustedForm script
  useEffect(() => {
    if (document.getElementById('tf-script')) return
    const field = document.createElement('input')
    field.id = 'xxTrustedFormCertUrl'
    field.name = 'xxTrustedFormCertUrl'
    field.type = 'hidden'
    field.value = ''
    document.body.appendChild(field)

    const script = document.createElement('script')
    script.id = 'tf-script'
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://api.trustedform.com/trustedform.js?provide_referrer=false&field=xxTrustedFormCertUrl&l=${Date.now()}${Math.random()}`
    document.body.appendChild(script)
  }, [])

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!form.niche) e.niche = 'Please select a service type'
    if (!form.zip.trim()) e.zip = 'ZIP code is required'
    else if (!/^\d{5}$/.test(form.zip.trim())) e.zip = 'Enter a valid 5-digit ZIP'
    return e
  }

  function validateStep2() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const digits = form.phone.replace(/\D/g, '')
    if (!digits) e.phone = 'Phone number is required'
    else if (digits.length < 10) e.phone = 'Enter a valid 10-digit number'
    if (!form.tcpa_consent) e.tcpa_consent = 'You must agree to be contacted'
    return e
  }

  function handleNext() {
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setStep(2)
  }

  function handleBack() {
    setStep(1)
    setErrors({})
    setSubmitError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    const errs = validateStep2()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    try {
      const tfField = document.getElementById('xxTrustedFormCertUrl') as HTMLInputElement | null
      const trustedform_cert_url = tfField?.value || null

      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone.replace(/\D/g, ''),
          zip: form.zip.trim(),
          trustedform_cert_url,
          _t: loadTime,
          _hp: '',
        }),
      })
      const data = await res.json()

      if (data.duplicate) {
        setDuplicate(true)
      } else if (data.success) {
        setSubmitted(true)
      } else {
        setSubmitError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? ''
  const selectedNiche = NICHES.find(n => n.value === form.niche)

  // ── Duplicate state ──────────────────────────────────────────────
  if (duplicate) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
        <div className="text-4xl mb-4">👋</div>
        <h3 className="text-xl font-bold text-white mb-2">You&apos;re already in the queue</h3>
        <p className="text-gray-400">
          It looks like you already submitted a request recently. A trusted local contractor will be in touch within 2 hours during business hours.
        </p>
        {supportPhone && (
          <p className="text-gray-500 text-sm mt-4">
            Questions? Call or text{' '}
            <a href={`tel:${supportPhone}`} className="text-orange-400 font-medium">{supportPhone}</a>
          </p>
        )}
      </div>
    )
  }

  // ── Submitted state ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Your request has been received.</h3>
        <p className="text-gray-300 mb-5 leading-relaxed">
          A trusted local <strong className="text-white">{form.niche}</strong> contractor in your area will call you within{' '}
          <strong className="text-white">2 hours</strong> during business hours. No obligation to hire.
        </p>
        {supportPhone && (
          <p className="text-gray-500 text-sm mb-5">
            Questions? Call or text{' '}
            <a href={`tel:${supportPhone}`} className="text-orange-400 font-medium">{supportPhone}</a>
          </p>
        )}
        <div className="bg-white/5 border border-white/8 rounded-xl p-4 text-left">
          <ul className="text-gray-300 text-sm space-y-2">
            <li className="flex gap-2"><span className="text-green-400">✓</span> A trusted local contractor reviews your request</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> They&apos;ll call at your preferred time with a free estimate</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> No obligation to hire — just get the information you need</li>
          </ul>
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────
  return (
    <div>
      {/* Top orange accent */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, transparent 0%, #f97316 25%, #fb923c 50%, #f97316 75%, transparent 100%)',
        borderRadius: '4px 4px 0 0',
      }} />

      <div style={{
        background: '#0b1526',
        border: '1px solid rgba(249,115,22,0.22)',
        borderTop: 'none',
        borderRadius: '0 0 18px 18px',
        padding: '24px 24px 28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.55), 0 0 40px rgba(249,115,22,0.04)',
      }}>

        {/* Header */}
        <h2 className="text-xl font-black text-white mb-0.5 leading-tight">Get Your Free Quote In 30 Seconds.</h2>
        <p className="text-gray-400 text-xs mb-4">A licensed local contractor calls within 2 hours. No obligation. No spam.</p>

        {/* Honeypot */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
          <input type="text" name="_hp" tabIndex={-1} autoComplete="off" value="" onChange={() => {}} />
        </div>

        {/* Step progress */}
        <div className="flex items-center mb-5">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center" style={{ flex: n < 2 ? '1' : 'none' }}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
                step > n
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40'
                  : step === n
                  ? 'bg-orange-500 text-white ring-2 ring-orange-500/30 ring-offset-1 ring-offset-transparent'
                  : 'bg-white/8 text-gray-500 border border-white/10'
              }`}>
                {step > n ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : n}
              </div>
              {n < 2 && (
                <div className="flex-1 mx-2 h-px transition-all duration-500"
                  style={{ background: step > n ? '#f97316' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
          <span className="ml-3 text-[11px] text-gray-500">{step === 1 ? 'Service details' : 'Contact info'}</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── STEP 1 ── */}
          <div className={step === 1 ? 'block' : 'hidden'}>

            {/* Service type — icon grid */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Service Needed <span className="text-orange-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {NICHES.map(n => (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => update('niche', form.niche === n.value ? '' : n.value)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all duration-200 ${
                      form.niche === n.value
                        ? 'border-orange-500 bg-orange-500/12 text-orange-300'
                        : 'border-white/10 bg-white/4 text-gray-400 hover:border-white/20 hover:text-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-0.5">{n.icon}</div>
                    <div className="text-[11px] font-semibold leading-tight">{n.label}</div>
                  </button>
                ))}
              </div>
              {errors.niche && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.niche}</p>}
            </div>

            {/* ZIP */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Your ZIP Code <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.zip}
                onChange={e => update('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="e.g. 90210"
                maxLength={5}
                className={`dark-input text-center font-bold tracking-widest ${errors.zip ? '!border-red-400/70' : ''}`}
              />
              {errors.zip && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.zip}</p>}
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Describe the Issue <span className="text-gray-600 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={2}
                className="dark-input resize-none"
                placeholder="Briefly describe what you need help with…"
              />
            </div>

            {/* Callback time */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Best Time to Call <span className="text-gray-600 normal-case font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CALLBACK_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('callback_time', form.callback_time === opt.value ? '' : opt.value)}
                    className={`py-2 px-3 rounded-xl border text-left transition-all duration-200 ${
                      form.callback_time === opt.value
                        ? 'border-orange-500 bg-orange-500/12 text-orange-300'
                        : 'border-white/10 bg-white/4 text-gray-400 hover:border-white/20 hover:text-gray-300'
                    }`}
                  >
                    <div className="text-xs font-semibold leading-tight">{opt.label}</div>
                    <div className="text-[10px] opacity-55 mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-orange-500/30 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Continue
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {['Licensed & Verified', 'Free. No Obligation', '~2hr Response'].map(badge => (
                <span key={badge} className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: 'rgba(209,213,219,0.85)' }}>
                  <span style={{ color: '#f97316' }}>✓</span>{badge}
                </span>
              ))}
            </div>
          </div>

          {/* ── STEP 2 ── */}
          <div className={step === 2 ? 'block' : 'hidden'}>

            {/* Back */}
            <button type="button" onClick={handleBack}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors group">
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back
            </button>

            {/* Summary */}
            {selectedNiche && (
              <div className="bg-white/4 border border-white/8 rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-3">
                <span className="text-xl">{selectedNiche.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{form.niche} · ZIP {form.zip || '—'}</p>
                  {form.description
                    ? <p className="text-gray-500 text-xs truncate">{form.description}</p>
                    : <p className="text-gray-600 text-xs">No description added</p>}
                </div>
                <button type="button" onClick={handleBack}
                  className="text-[11px] text-orange-500 hover:text-orange-400 font-semibold transition-colors">
                  Edit
                </button>
              </div>
            )}

            {/* Name */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Your Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="First & Last Name"
                className={`dark-input ${errors.name ? '!border-red-400/70' : ''}`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.name}</p>}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Phone Number <span className="text-orange-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', formatPhone(e.target.value))}
                placeholder="(555) 555-5555"
                className={`dark-input ${errors.phone ? '!border-red-400/70' : ''}`}
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.phone}</p>}
            </div>

            {/* TCPA */}
            <div className={`rounded-xl border p-3 mb-4 transition-colors duration-200 ${
              errors.tcpa_consent ? 'border-red-400/50 bg-red-500/5' : 'border-white/8 bg-white/4'
            }`}>
              <label className="flex gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tcpa_consent}
                  onChange={e => update('tcpa_consent', e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded flex-shrink-0 accent-orange-500"
                />
                <span style={{ fontSize: '10.5px', color: 'rgba(107,114,128,0.9)', lineHeight: '1.55' }}>
                  By checking this box, I provide my <strong style={{ color: 'rgba(156,163,175,0.85)' }}>prior express written consent</strong> to be contacted by TradeReach and its network of licensed contractors via automated calls, prerecorded messages, and/or SMS at the number provided, even if on a Do Not Call registry. Consent is not a condition of purchase. I also agree to TradeReach&apos;s{' '}
                  <a href="/terms/homeowner" target="_blank" style={{ color: 'rgba(249,115,22,0.75)' }} className="underline hover:text-orange-400">Terms</a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" style={{ color: 'rgba(249,115,22,0.75)' }} className="underline hover:text-orange-400">Privacy Policy</a>.
                  Reply STOP to opt out.
                </span>
              </label>
              {errors.tcpa_consent && (
                <p className="text-red-400 text-xs mt-2 ml-6 flex items-center gap-1"><span>⚠</span>{errors.tcpa_consent}</p>
              )}
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-3">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-orange-500/25 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  Get My Free Quote
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-600 mt-3 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              Your info is private and never sold to third parties.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
