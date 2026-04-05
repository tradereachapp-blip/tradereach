'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoBadge from '@/components/LogoBadge'
import type { Niche } from '@/types'
import { PRICING } from '@/lib/pricing'

// âââ Rex speech bubble messages per step ââââââââââââââââââââââââââââââââââââ
const REX_MESSAGES: Record<number, string> = {
  1: "Hey there! I'm Rex ð I'm going to help you start getting leads in the next 5 minutes. Ready?",
  2: "Start with your business name â this is what homeowners see when you call them.",
  3: "What's your specialty? Pick the service you focus on most. You can always expand later.",
  4: "Enter the ZIP codes where you work. We'll only send you leads from these exact areas. ð",
  5: "This is important â make sure SMS is on so you get instant alerts the moment a lead comes in. Speed wins. â¡",
  6: "Most contractors start with Pro. Still free for 7 days â no charge today. ð",
  7: "You're officially live on TradeReach! The moment a homeowner in your area requests a quote â boom. You get a text and email instantly.",
}

// âââ Lightweight Rex onboarding banner âââââââââââââââââââââââââââââââââââââââ
function RexBanner({ step, fieldsDone }: { step: number; fieldsDone?: boolean }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [step])
  const msg = fieldsDone && step === 2
    ? "Perfect. Looking good! Hit Continue when you're ready. â"
    : REX_MESSAGES[step] ?? ''
  if (!msg) return null
  return (
    <div
      className="transition-all duration-300 mb-6"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-8px)' }}
    >
      {/* Rex avatar â visible on all steps */}
      <div className="flex justify-center mb-2">
        <img
          src="/images/rex-avatar.png"
          alt="Rex"
          style={{ height: 80, width: 'auto', objectFit: 'contain', animation: 'rexFloatSm 3s ease-in-out infinite' }}
        />
      </div>
      {/* Rex speech bubble */}
      <div className="flex items-start gap-3 bg-[#1a2744] border border-orange-500/30 rounded-2xl px-4 py-3.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-orange-500 overflow-hidden">
          <img src="/images/rex-avatar.png" alt="Rex" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">Rex says</div>
          <p className="text-sm text-gray-200 leading-snug">{msg}</p>
        </div>
      </div>
      <style>{`@keyframes rexFloatSm{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

interface PromoState {
  input: string
  loading: boolean
  error: string
  success: string
}

function validateUSPhone(phone: string): boolean {
  return /^\+?1?[\s\-.]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}$/.test(phone.trim())
}

// ââ Confetti âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ Step transition wrapper ââââââââââââââââââââââââââââââââââââââââââââââââ
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
  { niche: 'Roofing', icon: 'ð ', desc: 'Roof repair, replacement, and inspection' },
  { niche: 'HVAC', icon: 'âï¸', desc: 'Heating, cooling, and ventilation systems' },
  { niche: 'Plumbing', icon: 'ð§', desc: 'Pipes, drains, water heaters, and more' },
]

const inp = 'dark-input'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
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
  const [notificationEmail, setNotificationEmail] = useState('')
  const [notifEmailError, setNotifEmailError] = useState('')

  // Legal agreement (step 0)
  const [legalScrolled, setLegalScrolled] = useState(false)
  const [legalAccepting, setLegalAccepting] = useState(false)
  const legalScrollRef = useRef<HTMLDivElement>(null)

  function handleLegalScroll() {
    const el = legalScrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    if (nearBottom) setLegalScrolled(true)
  }

  async function handleLegalAccept() {
    setLegalAccepting(true)
    try {
      await fetch('/api/legal/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreement_type: 'contractor_tos', agreement_version: '1.0' }),
      })
    } catch {}
    setLegalAccepting(false)
    goToStep(1)
  }

  // Pre-fill notification email from auth session
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
    