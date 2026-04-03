'use client'

import { useState } from 'react'

export default function LeadCaptureForm() {
  const [form, setForm] = useState({
    name: '', phone: '', zip: '', niche: '', description: '', callback_time: '', tcpa_consent: false,
  })
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
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, zip: form.zip.trim() }),
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

  if (duplicate) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
        <div className="text-4xl mb-4">👋</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">You're already in the queue</h3>
        <p className="text-gray-600">
          It looks like you already submitted a request recently. A licensed contractor will be in touch within 2 hours during business hours.
        </p>
        {supportPhone && (
          <p className="text-gray-500 text-sm mt-4">
            Questions? Call or text{' '}
            <a href={`tel:${supportPhone}`} className="text-orange-600 font-medium">
              {supportPhone}
            </a>
          </p>
        )}
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Your request has been received.</h3>
        <p className="text-gray-600 mb-5 leading-relaxed">
          A licensed <strong>{form.niche}</strong> contractor in your area will call you within{' '}
          <strong>2 hours</strong> during business hours. They will call you from a local number.
          No obligation to hire.
        </p>
        {supportPhone && (
          <p className="text-gray-500 text-sm mb-5">
            If you have questions, call or text{' '}
            <a href={`tel:${supportPhone}`} className="text-orange-600 font-medium">
              {supportPhone}
            </a>
          </p>
        )}
        <div className="bg-gray-50 rounded-xl p-4 text-left">
          <ul className="text-gray-600 text-sm space-y-2">
            <li className="flex gap-2"><span className="text-green-500">✓</span> A verified contractor will review your request</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> They'll call at your preferred time</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Your estimate is completely free — no obligation</li>
          </ul>
        </div>
        <p className="text-gray-400 text-xs mt-5">Powered by TradeReach</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Get Your Free Quote</h2>
      <p className="text-gray-500 text-sm mb-6">Takes 30 seconds. No spam, ever.</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="John Smith"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="(555) 555-5555"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
            <input
              type="text"
              value={form.zip}
              onChange={e => update('zip', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.zip ? 'border-red-400' : 'border-gray-200'}`}
              placeholder="90210"
              maxLength={5}
            />
            {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Needed *</label>
            <select
              value={form.niche}
              onChange={e => update('niche', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.niche ? 'border-red-400' : 'border-gray-200'}`}
            >
              <option value="">Select...</option>
              <option value="Roofing">Roofing</option>
              <option value="HVAC">HVAC</option>
              <option value="Plumbing">Plumbing</option>
            </select>
            {errors.niche && <p className="text-red-500 text-xs mt-1">{errors.niche}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Describe the Issue <span className="text-gray-400">(optional)</span></label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            placeholder="Briefly describe what you need help with..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Best Time to Call <span className="text-gray-400">(optional)</span></label>
          <select
            value={form.callback_time}
            onChange={e => update('callback_time', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Any time</option>
            <option value="Morning">Morning (8am – 12pm)</option>
            <option value="Afternoon">Afternoon (12pm – 5pm)</option>
            <option value="Evening">Evening (5pm – 8pm)</option>
            <option value="Anytime">Anytime</option>
          </select>
        </div>

        {/* TCPA Consent */}
        <div className="bg-gray-50 rounded-xl p-4">
          <label className="flex gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.tcpa_consent}
              onChange={e => update('tcpa_consent', e.target.checked)}
              className={`mt-1 w-4 h-4 rounded text-orange-500 flex-shrink-0 ${errors.tcpa_consent ? 'outline outline-red-400' : ''}`}
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              By submitting this form, I consent to be contacted by licensed contractors in my area regarding my home service request. I understand I may be contacted by phone, text, or email.{' '}
              <strong>This consent is not a condition of purchase.</strong>
            </span>
          </label>
          {errors.tcpa_consent && <p className="text-red-500 text-xs mt-1 ml-7">{errors.tcpa_consent}</p>}
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        >
          {loading ? 'Submitting...' : 'Get My Free Quote →'}
        </button>

        <p className="text-center text-xs text-gray-400">
          🔒 Your information is secure and never sold to third parties.
        </p>
      </form>
    </div>
  )
}
