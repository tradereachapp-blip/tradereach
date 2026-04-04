'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoBadge from '@/components/LogoBadge'
import type { Niche } from '@/types'

// ─── Rex speech bubble messages per step ────────────────────────────────────
const REX_MESSAGES: Record<number, string> = {
  1: "Hey there! I'm Rex 👋 I'm going to help you start getting leads in the next 5 minutes. Ready?",
  2: "Start with your business name — this is what homeowners see when you call them.",
  3: "What's your specialty? Pick the service you focus on most. You can always expand later.",
  4: "Enter the ZIP codes where you work. We'll only send you leads from these exact areas. 📍",
  5: "This is important — make sure SMS is on so you get instant alerts the moment a lead comes in. Speed wins. ⚡",
  6: "Most contractors start with Pro. Still free for 7 days — no charge today. 🎉",
  7: "You're officially live on TradeReach! The moment a homeowner in your area requests a quote — boom. You get a text and email instantly.",
}

// ─── Lightweight Rex onboarding banner ───────────────────────────────────────
function RexBanner({ step, fieldsDone }: { step: number; fieldsDone?: boolean }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [step])
  const msg = fieldsDone && step === 2
    ? "Perfect. Looking good! Hit Continue when you're ready. ✅"
    : REX_MESSAGES[step] ?? ''
  if (!msg) return null
  return (
    <div
      className="flex items-start gap-3 bg-[#1a2744] border border-orange-500/30 rounded-2xl px-4 py-3.5 mb-6 transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-8px)' }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-orange-500 overflow-hidden"
        style={{ animation: 'rexFloatSm 3s ease-in-out infinite' }}
      >
        <img src="/images/rex-avatar.png" alt="Rex" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
      </div>
      <div>
        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">Rex says</div>
        <p className="text-sm text-gray-200 leading-snug">{msg}</p>
      </div>
      <style>{`@keyframes rexFloatSm{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
    </div>
  )
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface PromoState {
  input: string
  loading: boolean
  error: string
  success: string
}

function validateUSPhone(phone: string): boolean {
  return /^\+?1?[\s\-.]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}$/.test(phone.trim())
}

// ── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    color: ['#F97316', '#FB923C', '#FCD34D', '#34D399', '#60A5FA', '#A78BFA'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 8,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Step transition wrapper ────────────────────────────────────────────────
function StepCard({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  return (
    <div
      className="transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {children}
    </div>
  )
}

const STEP_LABELS = ['Welcome', 'Business', 'Service', 'Area', 'Notifications', 'Plan', 'Done']

const NICHE_CARDS: { niche: Niche; icon: string; desc: string }[] = [
  { niche: 'Roofing', icon: '🏠', desc: 'Roof repair, replacement, and inspection' },
  { niche: 'HVAC', icon: '❄️', desc: 'Heating, cooling, and ventilation systems' },
  { niche: 'Plumbing', icon: '🔧', desc: 'Pipes, drains, water heaters, and more' },
]

const inp = 'dark-input'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Business info
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')

  // Service
  const [niche, setNiche] = useState<Niche | null>(null)

  // ZIP codes
  const [zipInput, setZipInput] = useState('')
  const [zipCodes, setZipCodes] = useState<string[]>([])
  const [zipError, setZipError] = useState('')

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(true)
  const [smsNotifPhone, setSmsNotifPhone] = useState('')
  const [smsPhoneError, setSmsPhoneError] = useState('')

  // Plan / promo
  const [showPromo, setShowPromo] = useState(false)
  const [promo, setPromo] = useState<PromoState>({ input: '', loading: false, error: '', success: '' })

  // Animate between steps
  function goToStep(next: Step) {
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setError('')
      setVisible(true)
    }, 200)
  }

  function addZip() {
    const z = zipInput.trim()
    if (!/^\d{5}$/.test(z)) { setZipError('Please enter a valid 5-digit ZIP code.'); return }
    if (zipCodes.includes(z)) { setZipError('That ZIP code is already in your list.'); return }
    setZipCodes([...zipCodes, z])
    setZipInput('')
    setZipError('')
  }

  function validateStep2() {
    if (!businessName.trim()) { setError('Business name is required.'); return false }
    if (!contactName.trim()) { setError('Contact name is required.'); return false }
    if (!phone.trim()) { setError('Phone number is required.'); return false }
    return true
  }

  // Service card selection — auto-advances after 400ms
  function selectNiche(n: Niche) {
    setNiche(n)
    setTimeout(() => goToStep(4), 400)
  }

  async function handlePromoRedeem() {
    if (!promo.input.trim()) return
    setPromo(p => ({ ...p, loading: true, error: '', success: '' }))
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
      email_notifications: emailNotif,
      sms_notifications: smsNotif,
      sms_notification_phone: smsNotifPhone.trim() || null,
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
      setTimeout(() => goToStep(7), 1200)
    } else {
      setPromo(p => ({ ...p, loading: false, error: data.error || 'Invalid promo code.' }))
    }
  }

  async function handlePlanSelect(plan: 'pay_per_lead' | 'pro' | 'elite') {
    setLoading(true)
    setError('')
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
      plan_type: plan,
      email_notifications: emailNotif,
      sms_notifications: smsNotif,
      sms_notification_phone: smsNotifPhone.trim() || null,
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
      await supabase.from('contractors').update({ onboarding_complete: true }).eq('user_id', user.id)
      setLoading(false)
      goToStep(7)
    } else {
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

  const progressPct = ((step - 1) / (STEP_LABELS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/40 to-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/4 rounded-full blur-3xl" />
      </div>

      {step === 7 && <Confetti />}

      {/* Top bar with progress — hidden on step 1 */}
      {step > 1 && (
        <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-md border-b border-white/6 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <LogoBadge className="h-7" href="/" />
              <span className="text-xs text-gray-500">{STEP_LABELS[step - 1]}</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {/* Step dots */}
            <div className="flex justify-between mt-1.5">
              {STEP_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i + 1 < step ? 'bg-green-400' : i + 1 === step ? 'bg-orange-400' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-8 relative z-10">
        <StepCard visible={visible}>

          {/* ── STEP 1: WELCOME ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
              <div className="mb-6">
                <LogoBadge className="h-12" href="/" />
              </div>
              {/* Rex — drops in from above with bounce */}
              <div
                className="mb-4"
                style={{ animation: 'rexBounceIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, rexFloat 3s ease-in-out 0.9s infinite' }}
              >
                <div className="w-40 h-40 mx-auto">
                  <img src="/images/rex-avatar.png" alt="Rex — TradeReach AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              {/* Rex speech bubble */}
              <div
                className="bg-[#1a2744] border border-orange-500/50 rounded-2xl px-5 py-3 mb-6 max-w-xs text-sm text-white relative"
                style={{ animation: 'rexSpeechPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.6s both' }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a2744] border-l border-t border-orange-500/50 rotate-45" />
                Hey there! I'm Rex 👋 I'll get you set up and receiving leads in the next 5 minutes.
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
                Welcome to<br />
                <span className="text-orange-400">TradeReach.</span>
              </h1>
              <p className="text-gray-400 text-base mb-8 max-w-sm">You're minutes away from receiving warm leads in your area.</p>
              <button
                onClick={() => goToStep(2)}
                className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-black px-10 py-4 rounded-2xl transition-all text-lg shadow-xl shadow-orange-500/25"
              >
                Let's Go, Rex! →
              </button>
              <p className="text-gray-600 text-xs mt-5">No credit card required to start</p>
              <style>{`
                @keyframes rexBounceIn{0%{transform:translateY(-80px) scale(.8);opacity:0}60%{transform:translateY(8px) scale(1.05);opacity:1}80%{transform:translateY(-4px) scale(.98)}100%{transform:translateY(0) scale(1);opacity:1}}
                @keyframes rexFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
                @keyframes rexSpeechPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
              `}</style>
            </div>
          )}

          {/* ── STEP 2: BUSINESS INFO ───────────────────────────────────── */}
          {step === 2 && (
            <div className="py-6">
              <RexBanner step={2} fieldsDone={!!(businessName && contactName && phone)} />
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white mb-2">Tell us about<br />your business.</h2>
                <p className="text-gray-400 text-sm">This helps us match you with the right homeowners.</p>
              </div>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Business Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className={inp}
                    placeholder="Smith Roofing LLC"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Your Full Name *</label>
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className={inp} placeholder="John Smith" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Business Phone *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="(555) 555-5555" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    License Number <span className="text-gray-600 normal-case font-normal">(optional — builds trust)</span>
                  </label>
                  <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className={inp} placeholder="State contractor license #" />
                </div>
              </div>
              {error && <p className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 mt-6">
                <button onClick={() => goToStep(1)} className="px-5 py-3.5 border border-white/15 text-gray-400 rounded-xl hover:bg-white/5 transition-all font-medium text-sm">
                  ← Back
                </button>
                <button
                  onClick={() => { if (validateStep2()) goToStep(3) }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: SERVICE SELECTION ───────────────────────────────── */}
          {step === 3 && (
            <div className="py-6">
              <RexBanner step={3} />
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white mb-2">What do you specialize in?</h2>
                <p className="text-gray-400 text-sm">Pick your primary service. You can add more later.</p>
              </div>
              <div className="space-y-3">
                {NICHE_CARDS.map(({ niche: n, icon, desc }) => (
                  <button
                    key={n}
                    onClick={() => selectNiche(n)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                      niche === n
                        ? 'border-orange-500 bg-orange-500/15 shadow-lg shadow-orange-500/20'
                        : 'border-white/12 bg-white/4 hover:border-orange-500/40 hover:bg-white/8'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 transition-all ${
                      niche === n ? 'bg-orange-500/20' : 'bg-white/8 group-hover:bg-white/12'
                    }`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-lg">{n}</div>
                      <div className="text-gray-400 text-sm mt-0.5">{desc}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      niche === n ? 'border-orange-500 bg-orange-500' : 'border-white/20'
                    }`}>
                      {niche === n && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => goToStep(2)} className="mt-5 w-full py-2.5 text-gray-500 hover:text-gray-400 text-sm transition-colors">
                ← Back
              </button>
            </div>
          )}

          {/* ── STEP 4: SERVICE AREA ────────────────────────────────────── */}
          {step === 4 && (
            <div className="py-6">
              <RexBanner step={4} />
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white mb-2">Where do you work?</h2>
                <p className="text-gray-400 text-sm">Enter the ZIP codes you service. We'll only send you leads from these areas.</p>
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={zipInput}
                  onChange={e => { setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5)); setZipError('') }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addZip())}
                  className={inp}
                  placeholder="e.g. 90210"
                  maxLength={5}
                  autoFocus
                />
                <button
                  onClick={addZip}
                  className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              {zipError && <p className="text-red-400 text-sm mb-2">{zipError}</p>}
              <p className="text-gray-600 text-xs mb-4">Add up to 10 ZIP codes. Los Angeles area recommended to start.</p>

              {zipCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {zipCodes.map(z => (
                    <span key={z} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/25 text-orange-300 rounded-lg text-sm font-medium">
                      📍 {z}
                      <button onClick={() => setZipCodes(zipCodes.filter(x => x !== z))} className="text-orange-400 hover:text-red-400 font-bold ml-0.5 transition-colors">×</button>
                    </span>
                  ))}
                </div>
              )}

              {error && <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => goToStep(3)} className="px-5 py-3.5 border border-white/15 text-gray-400 rounded-xl hover:bg-white/5 transition-all font-medium text-sm">
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (zipCodes.length === 0) { setError('Add at least one ZIP code.'); return }
                    goToStep(5)
                  }}
                  disabled={zipCodes.length === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: NOTIFICATIONS ───────────────────────────────────── */}
          {step === 5 && (
            <div className="py-6">
              <RexBanner step={5} />
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white mb-2">How should we reach you?</h2>
                <p className="text-gray-400 text-sm">We'll alert you the moment a new lead matches your area.</p>
              </div>

              <div className="space-y-3 mb-5">
                {/* SMS toggle */}
                <label className="flex items-center justify-between p-4 bg-white/4 border border-white/10 rounded-2xl cursor-pointer hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-green-500/15 rounded-xl flex items-center justify-center text-xl">📱</div>
                    <div>
                      <div className="font-bold text-white">SMS Notifications</div>
                      <div className="text-gray-500 text-xs mt-0.5">Instant text alerts for new leads</div>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0 ml-3">
                    <input type="checkbox" checked={smsNotif} onChange={e => setSmsNotif(e.target.checked)} className="sr-only peer" />
                    <div className="w-12 h-6 bg-white/15 peer-checked:bg-green-500 rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-6" />
                  </div>
                </label>

                {/* SMS preview */}
                {smsNotif && (
                  <div className="ml-4 bg-gray-900 border border-white/8 rounded-xl p-3">
                    <p className="text-gray-600 text-xs mb-2">Preview of what you'll receive:</p>
                    <div className="bg-gray-800 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm text-white max-w-xs">
                      <span className="text-orange-400 font-bold">TradeReach:</span> New {niche || 'Roofing'} lead in 90210. {contactName.split(' ')[0] || 'John'} needs a quote. Claim now.
                    </div>
                  </div>
                )}

                {/* Email toggle */}
                <label className="flex items-center justify-between p-4 bg-white/4 border border-white/10 rounded-2xl cursor-pointer hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-500/15 rounded-xl flex items-center justify-center text-xl">📧</div>
                    <div>
                      <div className="font-bold text-white">Email Notifications</div>
                      <div className="text-gray-500 text-xs mt-0.5">Detailed lead info via email</div>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0 ml-3">
                    <input type="checkbox" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)} className="sr-only peer" />
                    <div className="w-12 h-6 bg-white/15 peer-checked:bg-green-500 rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-6" />
                  </div>
                </label>
              </div>

              {/* Contact details */}
              <div className="space-y-3 border-t border-white/8 pt-4">
                {smsNotif && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">SMS Number <span className="text-gray-600 normal-case font-normal">(leave blank to use business phone)</span></label>
                    <input
                      type="tel"
                      value={smsNotifPhone}
                      onChange={e => { setSmsNotifPhone(e.target.value); setSmsPhoneError('') }}
                      className={inp}
                      placeholder={phone || '(555) 555-5555'}
                    />
                    {smsPhoneError && <p className="text-red-400 text-xs mt-1">{smsPhoneError}</p>}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => goToStep(4)} className="px-5 py-3.5 border border-white/15 text-gray-400 rounded-xl hover:bg-white/5 transition-all font-medium text-sm">
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (smsNotifPhone.trim() && !validateUSPhone(smsNotifPhone)) {
                      setSmsPhoneError('Please enter a valid US phone number.')
                      return
                    }
                    goToStep(6)
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6: CHOOSE PLAN ─────────────────────────────────────── */}
          {step === 6 && (
            <div className="py-6">
              <RexBanner step={6} />
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white mb-2">Choose your plan.</h2>
                <p className="text-gray-400 text-sm">Start free for 7 days. Cancel anytime.</p>
              </div>

              <div className="space-y-3">
                {/* Pay Per Lead */}
                <div className="border border-white/12 rounded-2xl p-5 bg-white/4 hover:border-white/25 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">Pay Per Lead</h3>
                      <p className="text-gray-500 text-xs">Pay only for what you claim</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">$45</span>
                      <span className="text-gray-500 text-sm">/lead</span>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-400 space-y-1.5 mb-4">
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> Pay only when you claim a lead</li>
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> Up to 5 ZIP codes</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600 text-xs">✗</span> No priority delivery</li>
                  </ul>
                  <button onClick={() => handlePlanSelect('pay_per_lead')} disabled={loading}
                    className="w-full py-3 border border-white/20 text-white rounded-xl hover:bg-white/8 transition-all font-medium text-sm disabled:opacity-50">
                    Select Pay Per Lead
                  </button>
                </div>

                {/* Pro */}
                <div className="border border-blue-500/30 rounded-2xl p-5 bg-blue-500/8 hover:border-blue-400/50 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">Pro</h3>
                      <p className="text-blue-400 text-xs font-medium">7-day free trial</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">$297</span>
                      <span className="text-gray-500 text-sm">/mo</span>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1.5 mb-4">
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> 30 leads/month included</li>
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> Up to 10 ZIP codes</li>
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> Shared territory</li>
                  </ul>
                  <button onClick={() => handlePlanSelect('pro')} disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-sm disabled:opacity-50">
                    {loading ? 'Starting...' : 'Start Free Trial'}
                  </button>
                </div>

                {/* Elite */}
                <div className="relative border-2 border-orange-500 rounded-2xl p-5 bg-orange-500/8 shadow-lg shadow-orange-500/10">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-black px-4 py-1 rounded-full tracking-wide">⚡ MOST POPULAR</span>
                  </div>
                  <div className="flex justify-between items-start mb-3 mt-1">
                    <div>
                      <h3 className="font-bold text-white text-lg">Elite</h3>
                      <p className="text-orange-300 text-xs font-medium">7-day free trial</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">$597</span>
                      <span className="text-orange-300 text-sm">/mo</span>
                    </div>
                  </div>
                  <ul className="text-sm text-orange-100 space-y-1.5 mb-4">
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> <strong>Unlimited</strong> leads</li>
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> Exclusive territory</li>
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> 15-min priority head start</li>
                    <li className="flex items-center gap-2"><span className="text-green-400 text-xs">✓</span> Unlimited ZIP codes</li>
                  </ul>
                  <button onClick={() => handlePlanSelect('elite')} disabled={loading}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-black text-sm disabled:opacity-50">
                    {loading ? 'Starting...' : 'Start Free Trial'}
                  </button>
                </div>
              </div>

              {/* Promo code */}
              <div className="mt-5 border-t border-white/8 pt-4">
                {!showPromo ? (
                  <button onClick={() => setShowPromo(true)} className="w-full text-center text-gray-500 hover:text-gray-400 text-sm underline underline-offset-2 transition-colors">
                    Have a promo code?
                  </button>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promo.input}
                        onChange={e => setPromo(p => ({ ...p, input: e.target.value, error: '', success: '' }))}
                        onKeyDown={e => e.key === 'Enter' && handlePromoRedeem()}
                        placeholder="Enter promo code"
                        className={inp + ' font-mono tracking-widest'}
                        disabled={promo.loading}
                        autoFocus
                      />
                      <button onClick={handlePromoRedeem} disabled={promo.loading || !promo.input.trim()}
                        className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-50">
                        {promo.loading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promo.error && <p className="mt-2 text-red-400 text-sm">{promo.error}</p>}
                    {promo.success && (
                      <div className="mt-3 bg-green-500/15 border border-green-500/25 rounded-xl p-3 text-center">
                        <p className="text-green-300 font-semibold text-sm">🎉 {promo.success}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && <p className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

              <button onClick={() => goToStep(5)} className="mt-4 w-full py-2.5 text-gray-600 hover:text-gray-400 text-sm transition-colors">
                ← Back
              </button>
            </div>
          )}

          {/* ── STEP 7: YOU'RE ALL SET ──────────────────────────────────── */}
          {step === 7 && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center relative z-10">
              {/* Rex celebrating */}
              <div
                className="mb-2"
                style={{ animation: 'rexCelebrate 2s ease-in-out forwards, rexFloat 3s ease-in-out 2.1s infinite' }}
              >
                <img src="/images/rex-avatar.png" alt="Rex celebrating" style={{ width: 120, height: 120, objectFit: 'contain' }} />
              </div>
              <style>{`@keyframes rexCelebrate{0%,100%{transform:translateY(0) rotate(0)}15%{transform:translateY(-24px) rotate(-5deg)}30%{transform:translateY(0) rotate(5deg)}45%{transform:translateY(-20px) rotate(-3deg)}60%{transform:translateY(0) rotate(3deg)}75%{transform:translateY(-12px)}}`}</style>

              {/* Rex speech */}
              <div className="bg-[#1a2744] border border-orange-500/40 rounded-2xl px-4 py-3 mb-5 max-w-xs text-sm text-white"
                style={{ animation: 'rexSpeechPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both' }}>
                You're officially live! 🎉 First lead text incoming — stay close to your phone!
              </div>

              <h2 className="text-4xl font-black text-white mb-3">You're all set.</h2>
              <p className="text-gray-300 text-base mb-6 max-w-sm">
                Your account is active. The moment a homeowner in your area submits a request, we'll text and email you instantly.
              </p>

              {/* Quick tips */}
              <div className="grid gap-3 w-full mb-8">
                {[
                  { icon: '⚡', title: 'Claim leads fast', desc: 'The faster you call, the higher your close rate.' },
                  { icon: '📍', title: 'Update your ZIPs anytime', desc: 'Expand your territory in Settings.' },
                  { icon: '🏆', title: 'Go Elite for exclusivity', desc: 'No competing contractors in your territory.' },
                ].map(tip => (
                  <div key={tip.title} className="flex items-start gap-3 bg-white/4 border border-white/8 rounded-xl p-4 text-left">
                    <span className="text-xl mt-0.5">{tip.icon}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{tip.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-black py-4 rounded-2xl transition-all text-lg shadow-xl shadow-orange-500/25"
              >
                Go to My Dashboard →
              </button>
            </div>
          )}

        </StepCard>
      </div>
    </div>
  )
}
