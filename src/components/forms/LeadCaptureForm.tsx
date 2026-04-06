'use client'

import { useState, useEffect, useRef } from 'react'

export default function LeadCaptureForm() {
  const [form, setForm] = useState({
    name: '', phone: '', zip: '', niche: '', description: '', callback_time: '', tcpa_consent: false,
  })
  // Bot protection: track when the form first loaded
  const [loadTime] = useState(() => Date.now())
  const trustedformRef = useRef<HTMLInputElement>(null)

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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [duplicate, setDuplicate] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^\+?[\d\s\-().]{10,}$/.test(form.phone)) e.phone = 'Enter a valid phone number'
    if (!form.zip.trim()) e.zip = 'ZIP code is required'
    else if (!/^\d{5}$/.test(form.zip.trim())) e.zip = 'Enter a valid 5-digit ZIP code'
    if (!form.niche) e.niche = 'Please select a service type'
    if (!form.tcpa_consent) e.tcpa_consent = 'You must agree to be contacted'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      // Capture TrustedForm cert URL if available
      const tfField = document.getElementById('xxTrustedFormCertUrl') as HTMLInputElement | null
      const trustedform_cert_url = tfField?.value || null

      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          zip: form.zip.trim(),
          trustedform_cert_url,
          _t: loadTime,           // form load timestamp
          _hp: '',                // honeypot (intentionally empty)
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

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? ''

  const inputClass = (field?: string) =>
    `dark-input ${field && errors[field] ? '!border-red-400/70' : ''}`

  if (duplicate) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
        <div className="text-4xl mb-4">👋</div>
        <h3 className="text-xl font-bold text-white mb-2">You're already in the queue</h3>
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
            <li className="flex gap-2"><span className="text-green-400">✓</span> They'll call at your preferred time with a free estimate</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> No obligation to hire — just get the information you need</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Thin orange accent line above form card */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, transparent 0%, #f97316 25%, #fb923c 50%, #f97316 75%, transparent 100%)',
        borderRadius: '4px 4px 0 0',
      }} />

      {/* Form card — dark navy with orange border glow */}
      <div style={{
        background: '#0b1526',
        border: '1px solid rgba(249,115,22,0.22)',
        borderTop: 'none',
        borderRadius: '0 0 18px 18px',
        padding: '28px 28px 32px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.55), 0 0 40px rgba(249,115,22,0.04)',
      }}>

        {/* Header */}
        <h2 className="text-xl font-black text-white mb-1 leading-tight">Get Your Free Quote In 30 Seconds.</h2>
        <p className="text-gray-300 text-sm mb-1">A licensed local contractor will call you within 2 hours. No obligation. No spam. Ever.</p>
        <p className="text-gray-500 text-xs italic mb-5">Join 2,400+ homeowners who got free quotes this month.</p>

        {/* Bot honeypot — hidden from real users via CSS, bots will fill it */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
          <label htmlFor="_hp">Leave this empty</label>
          <input
            type="text"
            id="_hp"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            value=""
            onChange={() => {}}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              className={inputClass('name')}
              placeholder="John Smith"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              className={inputClass('phone')}
              placeholder="(555) 555-5555"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code *</label>
              <input
                type="text"
                value={form.zip}
                onChange={e => update('zip', e.target.value)}
                className={inputClass('zip')}
                placeholder="90210"
                maxLength={5}
              />
              {errors.zip && <p className="text-red-400 text-xs mt-1">{errors.zip}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Service Needed *</label>
              <select
                value={form.niche}
                onChange={e => update('niche', e.target.value)}
                className={inputClass('niche')}
              >
                <option value="" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Select...</option>
                <option value="Roofing" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Roofing</option>
                <option value="HVAC" style={{ backgroundColor: '#1a2744', color: '#fff' }}>HVAC</option>
                <option value="Plumbing" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Plumbing</option>
                <option value="Electrical" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Electrical</option>
                <option value="Windows & Doors" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Windows & Doors</option>
                <option value="Painting" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Painting</option>
              </select>
              {errors.niche && <p className="text-red-400 text-xs mt-1">{errors.niche}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Describe the Issue <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              rows={3}
              className={`${inputClass()} resize-none`}
              placeholder="Briefly describe what you need help with..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Best Time to Call <span className="text-gray-500">(optional)</span>
            </label>
            <select
              value={form.callback_time}
              onChange={e => update('callback_time', e.target.value)}
              className={inputClass()}
            >
              <option value="" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Any time</option>
              <option value="Morning" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Morning (8am – 12pm)</option>
              <option value="Afternoon" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Afternoon (12pm – 5pm)</option>
              <option value="Evening" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Evening (5pm – 8pm)</option>
              <option value="Anytime" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Anytime</option>
            </select>
          </div>

          {/* TCPA consent — fine print */}
          <div>
            <label className="flex gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.tcpa_consent}
                onChange={e => update('tcpa_consent', e.target.checked)}
                className={`mt-0.5 w-3.5 h-3.5 rounded flex-shrink-0 accent-orange-500 ${errors.tcpa_consent ? 'outline outline-red-400' : ''}`}
              />
              <span style={{ fontSize: '11px', color: 'rgba(107,114,128,0.9)', lineHeight: '1.55' }}>
                By checking this box and submitting this form, I provide my <strong style={{ color: 'rgba(156,163,175,0.85)' }}>prior express written consent</strong> to be contacted by TradeReach and its network of licensed contractors via automated telephone calls, prerecorded messages, and/or text messages (SMS) at the phone number I provided, even if my number is on a Do Not Call registry. Message and data rates may apply. I understand this consent is not a condition of purchase or service. I also agree to TradeReach&apos;s{' '}
                <a href="/terms/homeowner" target="_blank" style={{ color: 'rgba(249,115,22,0.75)' }} className="underline hover:text-orange-400">Terms of Service</a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" style={{ color: 'rgba(249,115,22,0.75)' }} className="underline hover:text-orange-400">Privacy Policy</a>.
                Reply STOP to opt out of SMS at any time.
              </span>
            </label>
            {errors.tcpa_consent && <p className="text-red-400 text-xs mt-1 ml-6">{errors.tcpa_consent}</p>}
          </div>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {submitError}
            </div>
          )}

          {/* Trust badges — directly above submit */}
          <div className="flex flex-wrap gap-2">
            {['Licensed & Verified Contractors', 'Free. No Obligation', 'Response Within 2 Hours'].map(badge => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.22)', color: 'rgba(209,213,219,0.9)' }}
              >
                <span style={{ color: '#f97316' }}>✓</span>
                {badge}
              </span>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black py-4 rounded-xl transition-all text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg shadow-orange-500/25 cta-btn"
          >
            {loading ? 'Submitting...' : 'Get My Free Quote →'}
          </button>

          <p className="text-center text-xs text-gray-500">
            🔒 Your information is secure and never sold to third parties.
          </p>
        </form>

      </div>
    </div>
  )
}
