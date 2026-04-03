'use client'

import { useState, useEffect, useCallback } from 'react'

/* ─── Types ─────────────────────────────────────────────── */
interface QuizAnswers {
  service: string
  projectType: string
  urgency: string
  propertyType: string
  name: string
  phone: string
  zip: string
}

/* ─── Quiz Data ──────────────────────────────────────────── */
const SERVICES = [
  { id: 'roofing',  icon: '🏠', label: 'Roofing',         active: true  },
  { id: 'hvac',     icon: '❄️', label: 'HVAC',             active: false },
  { id: 'plumbing', icon: '🔧', label: 'Plumbing',         active: false },
  { id: 'electric', icon: '⚡', label: 'Electrical',       active: false },
  { id: 'windows',  icon: '🪟', label: 'Windows & Doors',  active: false },
  { id: 'painting', icon: '🎨', label: 'Painting',         active: false },
]

const PROJECT_TYPES = [
  { id: 'repair',      icon: '🔨', label: 'Repair / Fix a Leak',   sub: 'Missing shingles, water damage, leaks' },
  { id: 'replace',     icon: '🏗️', label: 'Full Replacement',      sub: 'Replace the entire roof' },
  { id: 'inspection',  icon: '🔍', label: 'Inspection / Estimate', sub: 'Find out what\'s needed' },
  { id: 'new',         icon: '🆕', label: 'New Installation',      sub: 'New construction or addition' },
]

const URGENCY_OPTIONS = [
  { id: 'emergency', icon: '🚨', label: 'Emergency',       sub: 'It\'s leaking or actively damaged' },
  { id: 'week',      icon: '📅', label: 'Within 1 Week',   sub: 'Urgent but not an emergency' },
  { id: 'month',     icon: '🗓️', label: 'Within a Month',  sub: 'I have some time to plan' },
  { id: 'quotes',    icon: '💭', label: 'Just Getting Quotes', sub: 'Comparing prices for now' },
]

const PROPERTY_TYPES = [
  { id: 'house',   icon: '🏡', label: 'Single Family Home', sub: 'Detached house' },
  { id: 'townhome',icon: '🏘️', label: 'Townhome / Duplex', sub: 'Attached unit' },
  { id: 'condo',   icon: '🏢', label: 'Condo / Apartment',  sub: 'Unit in a building' },
  { id: 'mobile',  icon: '🚐', label: 'Mobile / Manufactured', sub: 'Mobile or modular home' },
]

const TOTAL_STEPS = 5

/* ─── Component ─────────────────────────────────────────── */
export default function ServiceQuizPopup() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)   // for animation
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [answers, setAnswers] = useState<QuizAnswers>({
    service: '', projectType: '', urgency: '', propertyType: '',
    name: '', phone: '', zip: '',
  })

  /* Open triggers */
  const openQuiz = useCallback(() => {
    if (!dismissed) { setOpen(true); setStep(1); setSelected(null) }
  }, [dismissed])

  useEffect(() => {
    // Time delay
    const timer = setTimeout(openQuiz, 12000)

    // Exit intent
    const onExit = (e: MouseEvent) => { if (e.clientY <= 10) openQuiz() }
    document.addEventListener('mouseleave', onExit)

    // CTA button trigger via data attribute
    const onCTAClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-quiz-trigger]')) {
        e.preventDefault()
        openQuiz()
      }
    }
    document.addEventListener('click', onCTAClick)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', onExit)
      document.removeEventListener('click', onCTAClick)
    }
  }, [openQuiz])

  /* Close & dismiss */
  const close = () => { setOpen(false); setDismissed(true) }

  /* Pick an option and auto-advance */
  const pick = (key: keyof QuizAnswers, value: string) => {
    setSelected(value)
    setTimeout(() => {
      setAnswers(prev => ({ ...prev, [key]: value }))
      setSelected(null)
      setStep(s => s + 1)
    }, 280)
  }

  /* Submit final step */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: answers.name,
          phone: answers.phone,
          zip: answers.zip,
          service: 'Roofing',
          description: `Project: ${answers.projectType} | Urgency: ${answers.urgency} | Property: ${answers.propertyType}`,
          _t: Date.now(),
          _hp: '',
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const progress = Math.round(((step - 1) / TOTAL_STEPS) * 100)

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={close} aria-hidden="true" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        style={{ animation: 'scaleIn 0.22s cubic-bezier(0.22,1,0.36,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {step > 1 && !submitted && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all text-xs"
                  aria-label="Back"
                >
                  ←
                </button>
              )}
              {!submitted && (
                <span className="text-gray-500 text-xs font-medium">
                  Step {step} of {TOTAL_STEPS}
                </span>
              )}
            </div>
            <button
              onClick={close}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* ── STEP 1: Service Selection ─────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-black text-white mb-1">What do you need help with?</h2>
              <p className="text-gray-500 text-sm mb-5">Select a service to get started</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICES.map(svc => (
                  <button
                    key={svc.id}
                    disabled={!svc.active}
                    onClick={() => svc.active && pick('service', svc.id)}
                    className={`
                      relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all
                      ${svc.active
                        ? selected === svc.id
                          ? 'bg-orange-500/20 border-orange-400 scale-[0.97]'
                          : 'bg-white/4 border-white/10 hover:border-orange-400/60 hover:bg-orange-500/8 cursor-pointer'
                        : 'bg-white/2 border-white/5 cursor-not-allowed opacity-40'}
                    `}
                  >
                    <span className="text-2xl">{svc.icon}</span>
                    <span className={`text-xs font-semibold ${svc.active ? 'text-white' : 'text-gray-500'}`}>
                      {svc.label}
                    </span>
                    {!svc.active && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        Coming Soon
                      </span>
                    )}
                    {svc.active && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-orange-500/20 border border-orange-500/40 text-orange-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        Available Now
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Project Type ──────────────────────── */}
          {step === 2 && (
            <div>
              <div className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full mb-4">
                🏠 Roofing
              </div>
              <h2 className="text-xl font-black text-white mb-1">What type of roofing project?</h2>
              <p className="text-gray-500 text-sm mb-5">Select the option that best fits</p>
              <div className="space-y-2.5">
                {PROJECT_TYPES.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => pick('projectType', opt.id)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all
                      ${selected === opt.id
                        ? 'bg-orange-500/20 border-orange-400 scale-[0.99]'
                        : 'bg-white/4 border-white/10 hover:border-orange-400/60 hover:bg-orange-500/8'}
                    `}
                  >
                    <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                    <div>
                      <p className="text-white text-sm font-semibold">{opt.label}</p>
                      <p className="text-gray-500 text-xs">{opt.sub}</p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${selected === opt.id ? 'bg-orange-500 border-orange-500' : 'border-white/20'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Urgency ───────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full mb-4">
                🏠 Roofing
              </div>
              <h2 className="text-xl font-black text-white mb-1">How soon do you need this done?</h2>
              <p className="text-gray-500 text-sm mb-5">This helps us find the right contractor</p>
              <div className="space-y-2.5">
                {URGENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => pick('urgency', opt.id)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all
                      ${selected === opt.id
                        ? 'bg-orange-500/20 border-orange-400 scale-[0.99]'
                        : 'bg-white/4 border-white/10 hover:border-orange-400/60 hover:bg-orange-500/8'}
                    `}
                  >
                    <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                    <div>
                      <p className="text-white text-sm font-semibold">{opt.label}</p>
                      <p className="text-gray-500 text-xs">{opt.sub}</p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${selected === opt.id ? 'bg-orange-500 border-orange-500' : 'border-white/20'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Property Type ─────────────────────── */}
          {step === 4 && (
            <div>
              <div className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full mb-4">
                🏠 Roofing
              </div>
              <h2 className="text-xl font-black text-white mb-1">What type of property is it?</h2>
              <p className="text-gray-500 text-sm mb-5">Helps match you with the right specialist</p>
              <div className="space-y-2.5">
                {PROPERTY_TYPES.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => pick('propertyType', opt.id)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all
                      ${selected === opt.id
                        ? 'bg-orange-500/20 border-orange-400 scale-[0.99]'
                        : 'bg-white/4 border-white/10 hover:border-orange-400/60 hover:bg-orange-500/8'}
                    `}
                  >
                    <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                    <div>
                      <p className="text-white text-sm font-semibold">{opt.label}</p>
                      <p className="text-gray-500 text-xs">{opt.sub}</p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${selected === opt.id ? 'bg-orange-500 border-orange-500' : 'border-white/20'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 5: Contact Info ──────────────────────── */}
          {step === 5 && !submitted && (
            <div>
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Contractors available in your area
              </div>
              <h2 className="text-xl font-black text-white mb-1">Almost there! Where should we send your quotes?</h2>
              <p className="text-gray-500 text-sm mb-5">A licensed roofer will call you within 2 hours — free, no obligation</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Smith"
                    value={answers.name}
                    onChange={e => setAnswers(a => ({ ...a, name: e.target.value }))}
                    className="w-full bg-white/6 border border-white/12 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(555) 555-5555"
                    value={answers.phone}
                    onChange={e => setAnswers(a => ({ ...a, phone: e.target.value }))}
                    className="w-full bg-white/6 border border-white/12 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="90210"
                    maxLength={5}
                    value={answers.zip}
                    onChange={e => setAnswers(a => ({ ...a, zip: e.target.value.replace(/\D/g, '') }))}
                    className="w-full bg-white/6 border border-white/12 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
                  />
                </div>

                {/* TCPA mini-disclosure */}
                <p className="text-gray-600 text-[10px] leading-relaxed pt-1">
                  By submitting, you consent to be contacted by TradeReach and its contractor network via phone, text, or email regarding your roofing request. Consent is not required for purchase. Msg & data rates may apply.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20 mt-1"
                >
                  {submitting ? 'Connecting you with contractors...' : 'Get My Free Roofing Quotes →'}
                </button>
              </form>
            </div>
          )}

          {/* ── SUCCESS ───────────────────────────────────── */}
          {submitted && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
                ✅
              </div>
              <h2 className="text-xl font-black text-white mb-3">You're all set, {answers.name.split(' ')[0]}!</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                A licensed roofing contractor in your area will call you within <strong className="text-white">2 hours</strong> with a free, no-obligation estimate.
              </p>
              <div className="bg-white/4 border border-white/8 rounded-xl p-4 text-left mb-6">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">What happens next</p>
                <ul className="space-y-2">
                  {[
                    '📞 A local roofing pro calls you within 2 hours',
                    '💰 They provide a free, no-obligation estimate',
                    '✅ You decide if you want to move forward — no pressure',
                  ].map(item => (
                    <li key={item} className="text-gray-300 text-xs flex gap-2">{item}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={close}
                className="w-full bg-white/8 hover:bg-white/12 border border-white/10 text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
