'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  defaultNiche: 'Roofing' | 'HVAC' | 'Plumbing'
}

const NICHE_META: Record<string, { icon: string; label: string }> = {
  Roofing: { icon: '🏠', label: 'Roofing Estimate' },
  HVAC: { icon: '❄️', label: 'HVAC Estimate' },
  Plumbing: { icon: '🔧', label: 'Plumbing Estimate' },
}

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

export default function LandingLeadForm({ defaultNiche }: Props) {
  const router = useRouter()
  const [loadTime] = useState(() => Date.now())
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    zip: '',
    niche: defaultNiche,
    description: '',
    callback_time: '',
    tcpa_consent: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  function validateStep1() {
    const e: Record<string, string> = {}
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
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone.replace(/\D/g, ''),
          zip: form.zip.trim(),
          _t: loadTime,
          _hp: '',
        }),
      })
      const data = await res.json()
      if (data.success || data.duplicate) {
        router.push('/thank-you')
      } else {
        setSubmitError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  const niche = NICHE_META[defaultNiche] ?? { icon: '🏡', label: 'Free Estimate' }

  return (
    <div className="relative">
      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
        <input type="text" name="_hp" tabIndex={-1} autoComplete="off" value="" onChange={() => {}} />
      </div>

      {/* Step progress */}
      <div className="flex items-center mb-6">
        {[1, 2].map((n, i) => (
          <div key={n} className="flex items-center" style={{ flex: n < 2 ? '1' : 'none' }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300 ${
              step > n
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40'
                : step === n
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40 ring-2 ring-orange-500/30 ring-offset-2 ring-offset-transparent'
                : 'bg-white/8 text-gray-500 border border-white/10'
            }`}>
              {step > n ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : n}
            </div>
            {n < 2 && (
              <div className="flex-1 mx-2 h-px transition-all duration-500" style={{ background: step > n ? '#f97316' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        ))}
        <div className="ml-3 flex flex-col items-end">
          <span className="text-[11px] font-medium text-gray-400">Step {step} of 2</span>
          <span className="text-[10px] text-gray-600">{step === 1 ? 'Project details' : 'Contact info'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── STEP 1 ── */}
        <div className={step === 1 ? 'block' : 'hidden'}>

          {/* Niche header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-2xl flex-shrink-0">
              {niche.icon}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{niche.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">Tell us where you are and what you need</p>
            </div>
          </div>

          {/* ZIP */}
          <div className="mb-4">
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
              className={`dark-input text-center text-xl font-bold tracking-[0.3em] ${errors.zip ? '!border-red-400/70' : ''}`}
            />
            {errors.zip && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.zip}</p>}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Project Description <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              rows={2}
              className="dark-input resize-none"
              placeholder="Briefly describe your project or what needs attention…"
            />
          </div>

          {/* Callback time */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Best Time to Call <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CALLBACK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('callback_time', form.callback_time === opt.value ? '' : opt.value)}
                  className={`py-2.5 px-3 rounded-xl border text-left transition-all duration-200 ${
                    form.callback_time === opt.value
                      ? 'border-orange-500 bg-orange-500/12 text-orange-300'
                      : 'border-white/10 bg-white/4 text-gray-400 hover:border-white/20 hover:text-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold leading-tight">{opt.label}</div>
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

          {/* Trust row */}
          <div className="flex items-center justify-center gap-3 mt-4 text-[11px] text-gray-600">
            <span className="flex items-center gap-1">🔒 Secure</span>
            <span className="text-gray-700">·</span>
            <span>Free & No Obligation</span>
            <span className="text-gray-700">·</span>
            <span className="flex items-center gap-1">⚡ ~2hr Response</span>
          </div>
        </div>

        {/* ── STEP 2 ── */}
        <div className={step === 2 ? 'block' : 'hidden'}>

          {/* Back */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors group"
          >
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back
          </button>

          {/* Summary card */}
          <div className="bg-white/4 border border-white/8 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">{niche.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">{defaultNiche} · ZIP {form.zip || '—'}</p>
              {form.description
                ? <p className="text-gray-500 text-xs mt-0.5 truncate">{form.description}</p>
                : <p className="text-gray-600 text-xs mt-0.5">No description provided</p>}
              {form.callback_time && (
                <p className="text-gray-500 text-xs mt-0.5">Best time: {form.callback_time}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="text-[11px] text-orange-500 hover:text-orange-400 font-semibold flex-shrink-0 transition-colors"
            >
              Edit
            </button>
          </div>

          {/* Name */}
          <div className="mb-3.5">
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
          <div className={`rounded-2xl border p-3.5 mb-4 transition-colors duration-200 ${
            errors.tcpa_consent ? 'border-red-400/50 bg-red-500/5' : 'border-white/8 bg-white/4'
          }`}>
            <label className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.tcpa_consent}
                onChange={e => update('tcpa_consent', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded flex-shrink-0 accent-orange-500"
              />
              <span className="text-[11px] text-gray-400 leading-relaxed">
                By submitting, I consent to be contacted by trusted local contractors regarding my home service request via phone or text.{' '}
                <strong className="text-gray-300">Not a condition of purchase.</strong>
              </span>
            </label>
            {errors.tcpa_consent && (
              <p className="text-red-400 text-xs mt-2 ml-7 flex items-center gap-1"><span>⚠</span>{errors.tcpa_consent}</p>
            )}
          </div>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-3.5">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-orange-500/30 active:scale-[0.99] flex items-center justify-center gap-2"
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

          <p className="text-center text-xs text-gray-600 mt-3.5 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
            Your information is private and never sold to third parties.
          </p>
        </div>
      </form>
    </div>
  )
}
