'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  defaultNiche: 'Roofing' | 'HVAC' | 'Plumbing'
}

export default function LandingLeadForm({ defaultNiche }: Props) {
  const router = useRouter()
  const [loadTime] = useState(() => Date.now())
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

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^\+?[\d\s\-().]{10,}$/.test(form.phone)) e.phone = 'Enter a valid phone number'
    if (!form.zip.trim()) e.zip = 'ZIP code is required'
    else if (!/^\d{5}$/.test(form.zip.trim())) e.zip = 'Enter a valid 5-digit ZIP code'
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
        body: JSON.stringify({
          ...form,
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

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const inp = (field?: string) =>
    `dark-input ${field && errors[field] ? '!border-red-400/70' : ''}`

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
        <input type="text" name="_hp" tabIndex={-1} autoComplete="off" value="" onChange={() => {}} />
      </div>

      <div>
        <input
          type="text"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          className={inp('name')}
          placeholder="Full Name *"
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <input
          type="tel"
          value={form.phone}
          onChange={e => update('phone', e.target.value)}
          className={inp('phone')}
          placeholder="Phone Number *"
        />
        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
      </div>

      <div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={form.zip}
          onChange={e => update('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
          className={inp('zip')}
          placeholder="ZIP Code *"
          maxLength={5}
        />
        {errors.zip && <p className="text-red-400 text-xs mt-1">{errors.zip}</p>}
      </div>

      <textarea
        value={form.description}
        onChange={e => update('description', e.target.value)}
        rows={2}
        className={`${inp()} resize-none`}
        placeholder="Brief description (optional)"
      />

      <select
        value={form.callback_time}
        onChange={e => update('callback_time', e.target.value)}
        className={inp()}
      >
        <option value="" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Best time to call (optional)</option>
        <option value="Morning" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Morning (8am – 12pm)</option>
        <option value="Afternoon" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Afternoon (12pm – 5pm)</option>
        <option value="Evening" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Evening (5pm – 8pm)</option>
        <option value="Anytime" style={{ backgroundColor: '#1a2744', color: '#fff' }}>Anytime</option>
      </select>

      <div className="bg-white/4 border border-white/8 rounded-xl p-3.5">
        <label className="flex gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.tcpa_consent}
            onChange={e => update('tcpa_consent', e.target.checked)}
            className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 accent-orange-500 ${errors.tcpa_consent ? 'outline outline-red-400' : ''}`}
          />
          <span className="text-[11px] text-gray-400 leading-relaxed">
            By submitting this form I consent to be contacted by trusted local contractors in my area regarding my home service request. I understand I may be contacted by phone or text.{' '}
            <strong className="text-gray-300">This consent is not a condition of purchase.</strong>
          </span>
        </label>
        {errors.tcpa_consent && <p className="text-red-400 text-xs mt-1 ml-7">{errors.tcpa_consent}</p>}
      </div>

      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black py-4 rounded-xl transition-all text-lg shadow-lg shadow-orange-500/30 active:scale-[0.99]"
      >
        {loading ? 'Submitting...' : 'Get My Free Quote →'}
      </button>

      <p className="text-center text-xs text-gray-600">
        🔒 Your information is secure and never sold to third parties.
      </p>
    </form>
  )
}
