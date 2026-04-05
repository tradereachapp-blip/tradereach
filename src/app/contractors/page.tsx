'use client'

import { useState, useEffect, useRef } from 'react'
import LogoBadge from '@/components/LogoBadge'
import SiteFooter from '@/components/SiteFooter'
import PricingSection from '@/components/marketing/PricingSection'
import { PRICING } from '@/lib/pricing'

// ─── Font import (Bebas Neue + DM Sans) ────────────────────────────────────
const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;900&display=swap');

* { box-sizing: border-box; }

body { font-family: 'DM Sans', system-ui, sans-serif; }

@keyframes gridDrift {
  from { transform: translateY(0); }
  to   { transform: translateY(-40px); }
}

@keyframes float1 {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  50%       { transform: translateY(-30px) translateX(15px); }
}
@keyframes float2 {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  50%       { transform: translateY(20px) translateX(-20px); }
}
@keyframes float3 {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  60%       { transform: translateY(-25px) translateX(10px); }
}

@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes dashFlow {
  from { stroke-dashoffset: 100; }
  to   { stroke-dashoffset: 0; }
}

@keyframes particleRise {
  0%   { opacity: 0; transform: translateY(0) scale(0); }
  10%  { opacity: 1; }
  90%  { opacity: 0.4; }
  100% { opacity: 0; transform: translateY(-120px) scale(1.2); }
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.8); }
}

@keyframes rotateGradient {
  from { --border-angle: 0turn; }
  to   { --border-angle: 1turn; }
}

.hero-grid-bg {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(255,255,255,0.03) 0px,
    rgba(255,255,255,0.03) 1px,
    transparent 1px,
    transparent 40px
  );
  animation: gridDrift 20s linear infinite;
  will-change: transform;
}

.glass-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  border-color: rgba(249,115,22,0.3);
}

.cta-btn-primary {
  background: linear-gradient(135deg, rgb(249,115,22) 0%, rgb(234,88,12) 100%);
  box-shadow: 0 4px 24px rgba(249,115,22,0.4), 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform;
}
.cta-btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 40px rgba(249,115,22,0.6), 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
}

.cta-btn-secondary {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(10px);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.cta-btn-secondary:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
}

.accordion-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.32s ease;
}
.accordion-answer.open {
  max-height: 300px;
}

.noise-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
}

@media (max-width: 768px) {
  .desktop-connector { display: none !important; }
  .pricing-grid { grid-template-columns: 1fr !important; }
}

@property --border-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0turn;
}
`

// ─── Count-up hook ──────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

// ─── FAQ Accordion ──────────────────────────────────────────────────────────
function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(null as number | null)
  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden"
          style={{
            background: open === i ? 'rgba(249,115,22,0.05)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${open === i ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)'}`,
            transition: 'background 0.25s, border-color 0.25s',
          }}
        >
          <button
            className="w-full flex items-center justify-between p-5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-white pr-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{faq.q}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: open === i ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.08)',
                flexShrink: 0,
                transition: 'transform 0.3s ease, background 0.2s',
                transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                fontSize: 18,
                color: open === i ? '#f97316' : '#94a3b8',
              }}
            >+</span>
          </button>
          <div
            className={`accordion-answer ${open === i ? 'open' : ''}`}
            style={{
              borderLeft: open === i ? '2px solid rgba(249,115,22,0.4)' : '2px solid transparent',
              marginLeft: 20,
              transition: 'border-color 0.25s',
            }}
          >
            <p
              className="text-gray-400 text-sm leading-relaxed pb-5 pr-5 pl-4"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Particles ──────────────────────────────────────────────────────────────
function Particles({ count = 18 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 5 + (i * 5.3) % 90,
    size: 2 + (i * 0.7) % 2,
    duration: 4 + (i * 0.8) % 6,
    delay: (i * 0.4) % 5,
    opacity: 0.2 + (i * 0.05) % 0.3,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: -10,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(249,115,22,${p.opacity})`,
            animation: `particleRise ${p.duration}s ${p.delay}s ease-out infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}

// ─── Section divider ────────────────────────────────────────────────────────
function SectionDivider() {
  return (
    <div style={{
      height: 1,
      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(249,115,22,0.15) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)',
      margin: '0 auto',
    }} />
  )
}

// ─── Stats bar ──────────────────────────────────────────────────────────────
function StatsBar() {
  const ref = useRef(null as HTMLDivElement | null)
  const [triggered, setTriggered] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setTriggered(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  const count60 = useCountUp(60, 1500, triggered)

  return (
    <div ref={ref} style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { value: 'Sacramento', suffix: '', label: 'LAUNCHING IN' },
            { value: 'Real-Time', suffix: '', label: 'LEAD DELIVERY' },
            { value: 'Roofing · HVAC', suffix: '', label: '· PLUMBING' },
            { value: count60.toString(), suffix: 's', label: 'DELIVERY TIME' },
          ].map((s, i) => (
            <div
              key={i}
              className="text-center py-4"
              style={{
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                padding: '16px 12px',
              }}
            >
              <div style={{
                fontFamily: "'Bebas Neue', impact, sans-serif",
                fontSize: 'clamp(22px,4vw,42px)',
                color: '#f97316',
                lineHeight: 1,
                textShadow: '0 0 20px rgba(249,115,22,0.3)',
                letterSpacing: '0.5px',
              }}>
                {s.value}{s.suffix}
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#64748b',
                marginTop: 6,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Comparison table ────────────────────────────────────────────────────────
function ComparisonTable() {
  const rows = [
    { feature: 'Exclusive lead window', tr: true, ha: false, angi: false },
    { feature: 'ZIP-based territory control', tr: true, ha: false, angi: false },
    { feature: 'Credit rollover (unused leads)', tr: true, ha: false, angi: false },
    { feature: 'Flat monthly pricing', tr: true, ha: false, angi: false },
    { feature: 'No bidding wars', tr: true, ha: false, angi: false },
    { feature: 'Real-time SMS + email alerts', tr: true, ha: true, angi: true },
    { feature: 'Contractor dashboard', tr: true, ha: true, angi: true },
    { feature: 'Lead quality guarantee', tr: true, ha: false, angi: false },
    { feature: 'Dedicated account manager', tr: true, ha: false, angi: false },
  ]
  const Check = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: '50%',
      background: 'rgba(249,115,22,0.2)', color: '#f97316', fontSize: 14,
    }}>✓</span>
  )
  const X = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: '50%',
      background: 'rgba(255,255,255,0.05)', color: '#475569', fontSize: 14,
    }}>✕</span>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
        <thead>
          <tr style={{ background: 'rgba(249,115,22,0.12)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#f97316', fontWeight: 700, borderLeft: '2px solid rgba(249,115,22,0.3)' }}>TradeReach™</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#64748b', fontWeight: 600 }}>HomeAdvisor</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#64748b', fontWeight: 600 }}>Angi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <td style={{ padding: '11px 16px', fontSize: 14, color: '#cbd5e1', fontFamily: "'DM Sans',sans-serif" }}>{row.feature}</td>
              <td style={{ padding: '11px 16px', textAlign: 'center', borderLeft: '2px solid rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.03)' }}>{row.tr ? <Check /> : <X />}</td>
              <td style={{ padding: '11px 16px', textAlign: 'center' }}>{row.ha ? <Check /> : <X />}</td>
              <td style={{ padding: '11px 16px', textAlign: 'center' }}>{row.angi ? <Check /> : <X />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Testimonial cards ───────────────────────────────────────────────────────
function TestimonialCards() {
  const cards = [
    { name: 'Marcus T.', city: 'Sacramento, CA', niche: 'Roofing', quote: 'First week I got three leads. Closed two of them. Paid for the whole month.' },
    { name: 'Denise R.', city: 'Elk Grove, CA', niche: 'HVAC', quote: 'No more wasting money on HomeAdvisor. These leads actually answer the phone.' },
    { name: 'Jason M.', city: 'Roseville, CA', niche: 'Plumbing', quote: "The Elite exclusive window is the real deal. I've closed four out of five leads this month." },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
      {cards.map((c, i) => (
        <div key={i} className="glass-card rounded-2xl p-6 text-left" style={{ borderRadius: 16 }}>
          <div style={{ color: '#f97316', fontSize: 18, marginBottom: 10, letterSpacing: 2 }}>★★★★★</div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.7, marginBottom: 16 }}>"{c.quote}"</p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{c.name}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.city} · {c.niche}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function ContractorsPage() {
  const [foundingSpots, setFoundingSpots] = useState({
    pro: { filled: 0, max: PRICING.PRO_FOUNDING_SPOTS },
    elite: { filled: 0, max: PRICING.ELITE_FOUNDING_SPOTS },
  })

  useEffect(() => {
    fetch('/api/admin/founding-members')
      .then(r => r.json())
      .then(d => {
        if (d.pro !== undefined) setFoundingSpots(d)
      })
      .catch(() => {})
  }, [])

  const faqs = [
    {
      q: 'How fresh are the leads?',
      a: 'Every lead is submitted in real time by a homeowner. The moment they hit submit, you get an SMS and email. No delay, no recycling, no reselling. Elite contractors get a 15-minute exclusive window. Elite Plus gets 30 minutes.',
    },
    {
      q: 'What is Founding Member pricing?',
      a: `The first ${PRICING.PRO_FOUNDING_SPOTS} Pro and ${PRICING.ELITE_FOUNDING_SPOTS} Elite subscribers lock in a lower rate for life. Pro founding price is $${PRICING.PRO_MONTHLY_FOUNDING}/mo and Elite is $${PRICING.ELITE_MONTHLY_FOUNDING}/mo. Once those spots fill, new subscribers pay the standard rate. Your rate never changes.`,
    },
    {
      q: 'What happens when my monthly credits run out?',
      a: `Claims beyond your monthly credit limit are charged at your plan's overage rate: $${PRICING.PRO_OVERAGE} for Pro, $${PRICING.ELITE_OVERAGE} for Elite, $${PRICING.ELITE_PLUS_OVERAGE} for Elite Plus. You'll see a confirmation modal before any overage charge. Unused credits roll over (capped at 2× monthly).`,
    },
    {
      q: 'How many contractors compete for the same lead?',
      a: 'Elite Plus gets a 30-minute exclusive window. Elite gets 15 minutes. Pro gets a 5-minute head start before all remaining contractors are notified. Only one contractor can ever claim a lead — it disappears from everyone else the moment it\'s claimed.',
    },
    {
      q: 'Can I pause my subscription?',
      a: 'Yes. You can pause for up to 30 days from your account settings. Your ZIP territory claims are preserved during the pause. Leads will resume routing to you automatically when your pause ends.',
    },
    {
      q: 'How do I cancel?',
      a: 'Cancel anytime in one click from account settings. No fees, no phone calls. Access continues until end of current billing period.',
    },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONT_IMPORT }} />

      {/* Global noise overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      <div style={{ minHeight: '100vh', background: 'rgb(10,22,40)', color: '#fff', position: 'relative', zIndex: 1, fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,22,40,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '8px 16px',
        }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <LogoBadge className="h-12 sm:h-14" href="/contractors" />
            <div className="flex items-center gap-4">
              <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                Login
              </a>
              <a href="/signup" className="cta-btn-primary" style={{
                color: '#fff', textDecoration: 'none', fontWeight: 700,
                fontSize: 14, padding: '9px 18px', borderRadius: 10, display: 'inline-block',
              }}>
                Start Free Trial
              </a>
            </div>
          </div>
        </nav>

        {/* ── Founding member urgency bar ──────────────────────────────────── */}
        {(foundingSpots.pro.filled < foundingSpots.pro.max || foundingSpots.elite.filled < foundingSpots.elite.max) && (
          <div style={{
            background: 'rgba(251,191,36,0.08)',
            borderBottom: '1px solid rgba(251,191,36,0.2)',
            color: 'rgb(251,191,36)',
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            ⭐ Founding Member pricing active —{' '}
            {foundingSpots.pro.max - foundingSpots.pro.filled > 0 && `${foundingSpots.pro.max - foundingSpots.pro.filled} Pro spots`}
            {foundingSpots.pro.max - foundingSpots.pro.filled > 0 && foundingSpots.elite.max - foundingSpots.elite.filled > 0 && ' · '}
            {foundingSpots.elite.max - foundingSpots.elite.filled > 0 && `${foundingSpots.elite.max - foundingSpots.elite.filled} Elite spots`}
            {' '}remaining. Lock in your rate for life.
          </div>
        )}

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', padding: 'clamp(80px,10vw,128px) 16px', textAlign: 'center', overflow: 'hidden' }}>

          {/* Hero radial glows */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
            {/* Floating blobs */}
            <div className="hidden md:block" style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, background: 'rgba(249,115,22,0.06)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float1 12s ease-in-out infinite', willChange: 'transform' }} />
            <div className="hidden md:block" style={{ position: 'absolute', top: '40%', right: '8%', width: 500, height: 500, background: 'rgba(59,130,246,0.04)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float2 16s ease-in-out infinite', willChange: 'transform' }} />
            <div className="hidden md:block" style={{ position: 'absolute', bottom: '5%', left: '20%', width: 350, height: 350, background: 'rgba(249,115,22,0.04)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float3 14s ease-in-out infinite', willChange: 'transform' }} />
            {/* Animated grid */}
            <div className="hero-grid-bg" style={{ position: 'absolute', inset: '-40px', opacity: 1 }} />
          </div>

          <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {/* Live ticker */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(15,30,55,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: '3px solid #f97316',
              borderRadius: 100, padding: '8px 18px',
              marginBottom: 36, backdropFilter: 'blur(10px)',
              backgroundSize: '200% auto',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
                flexShrink: 0, animation: 'pulseDot 1.5s ease-in-out infinite',
                boxShadow: '0 0 8px rgba(34,197,94,0.6)',
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.02em' }}>
                <span style={{ color: '#f97316', fontWeight: 700 }}>Live</span> — Leads available in your area right now
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(44px,8vw,88px)',
              fontFamily: "'Bebas Neue', impact, sans-serif",
              lineHeight: 0.95,
              letterSpacing: '-1px',
              margin: '0 0 28px',
            }}>
              <span style={{ color: '#fff', display: 'block' }}>Stop Chasing Cold Leads.</span>
              <span style={{
                color: '#f97316', display: 'block',
                textShadow: '0 0 40px rgba(249,115,22,0.4)',
              }}>Start Closing Warm Ones.</span>
            </h1>

            {/* Sub-headline */}
            <p style={{
              fontSize: 'clamp(16px,2vw,20px)',
              background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 40, lineHeight: 1.65,
              maxWidth: 580, margin: '0 auto 44px',
              fontWeight: 400,
            }}>
              TradeReach™ sends you homeowners who already want a quote. You show up and close.
              No door-knocking. No cold calls. Just real jobs.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 14 }}>
              <a href="/signup" className="cta-btn-primary" style={{
                color: '#fff', textDecoration: 'none', fontWeight: 700,
                fontSize: 16, padding: '16px 32px', borderRadius: 14, display: 'inline-block',
              }}>
                Start Your Free 7-Day Trial →
              </a>
              <a href="#pricing" className="cta-btn-secondary" style={{
                color: '#fff', textDecoration: 'none', fontWeight: 600,
                fontSize: 16, padding: '16px 32px', borderRadius: 14, display: 'inline-block',
              }}>
                See Pricing
              </a>
            </div>
            <p style={{ color: '#475569', fontSize: 13, marginTop: 10 }}>No credit card required during trial</p>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        <StatsBar />

        <SectionDivider />

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <section style={{
          padding: 'clamp(64px,8vw,96px) 16px',
          background: 'rgb(14,28,50)',
          position: 'relative',
        }}>
          {/* Hex SVG bg */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.02, pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpolygon points='28,2 54,17 54,47 28,62 2,47 2,17' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }} />
          <div style={{ maxWidth: 1024, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Bebas Neue',impact,sans-serif", fontSize: 'clamp(32px,5vw,52px)', textAlign: 'center', marginBottom: 8, color: '#fff', letterSpacing: '0.5px' }}>
              How TradeReach™ Works
            </h2>
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 60, fontFamily: "'DM Sans',sans-serif", fontSize: 16 }}>
              Three steps from homeowner request to your phone ringing
            </p>

            <div style={{ position: 'relative' }}>
              {/* Connecting dashed line — desktop only */}
              <div className="desktop-connector" style={{
                position: 'absolute', top: 40, left: '17%', right: '17%', height: 2,
                zIndex: 0,
                background: 'repeating-linear-gradient(90deg, rgba(249,115,22,0.5) 0px, rgba(249,115,22,0.5) 12px, transparent 12px, transparent 24px)',
                backgroundSize: '24px 2px',
                animation: 'shimmer 2s linear infinite',
                backgroundPosition: '0 0',
              }} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { num: '01', title: 'Homeowner requests a quote', desc: 'A real homeowner fills out our form and tells us exactly what service they need and when they want to be called.' },
                  { num: '02', title: 'We match them to you', desc: "We instantly find licensed contractors in their ZIP who specialize in that niche. You're notified within seconds." },
                  { num: '03', title: 'You claim the lead and close', desc: 'You get SMS + email with lead details. Log in, claim it before another contractor, then call and close.' },
                ].map((s, i) => (
                  <div key={i} className="glass-card" style={{
                    borderRadius: 20, padding: '32px 28px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    zIndex: 1,
                  }}>
                    {/* Top glow line */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.8), transparent)', boxShadow: '0 0 12px rgba(249,115,22,0.4)' }} />
                    {/* Large step number watermark */}
                    <div style={{
                      position: 'absolute', top: -10, right: 12,
                      fontFamily: "'Bebas Neue',impact,sans-serif",
                      fontSize: 96, color: 'rgba(249,115,22,0.1)',
                      lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
                    }}>{s.num}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'rgba(249,115,22,0.15)',
                      marginBottom: 16,
                    }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#f97316' }}>
                        {['●', '◆', '★'][i]}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f97316', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>Step {s.num}</div>
                    <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 10, lineHeight: 1.3 }}>{s.title}</h3>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ── Pricing ──────────────────────────────────────────────────────── */}
        <div id="pricing" style={{
          background: 'linear-gradient(180deg, rgb(8,18,34) 0%, rgb(12,24,44) 100%)',
          position: 'relative',
        }}>
          {/* Diagonal stripe bg */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 60px)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <PricingSection foundingSpots={foundingSpots} />
          </div>
        </div>

        <SectionDivider />

        {/* ── Comparison table ─────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(64px,8vw,96px) 16px', background: 'rgb(10,22,40)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Bebas Neue',impact,sans-serif", fontSize: 'clamp(28px,4vw,48px)', textAlign: 'center', marginBottom: 8, color: '#fff', letterSpacing: '0.5px' }}>
              How We Stack Up
            </h2>
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 36, fontFamily: "'DM Sans',sans-serif", fontSize: 15 }}>
              TradeReach™ vs. the lead mills
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              <ComparisonTable />
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section style={{
          padding: 'clamp(64px,8vw,96px) 16px',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(249,115,22,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Bebas Neue',impact,sans-serif", fontSize: 'clamp(28px,4vw,48px)', textAlign: 'center', marginBottom: 40, color: '#fff', letterSpacing: '0.5px' }}>
              Frequently Asked Questions
            </h2>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        <SectionDivider />

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section style={{
          padding: 'clamp(80px,10vw,120px) 16px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgb(15,30,55) 0%, rgb(20,40,70) 50%, rgb(10,22,40) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* CTA center glow */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(249,115,22,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          {/* Particles */}
          <Particles count={20} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Testimonials */}
            <TestimonialCards />

            {/* Headline */}
            <h2 style={{
              fontFamily: "'Bebas Neue',impact,sans-serif",
              fontSize: 'clamp(48px,7vw,80px)',
              letterSpacing: '0.5px',
              marginBottom: 20, lineHeight: 0.95,
            }}>
              Ready to fill your{' '}
              <span style={{ color: '#f97316', textShadow: '0 0 40px rgba(249,115,22,0.4)' }}>pipeline?</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, marginBottom: 40, fontFamily: "'DM Sans',sans-serif" }}>
              Your first 7 days are free. No credit card required.
            </p>

            {/* Big CTA button */}
            <a href="/signup" className="cta-btn-primary" style={{
              display: 'inline-block',
              color: '#fff', textDecoration: 'none', fontWeight: 700,
              fontSize: 18, padding: '18px 0', borderRadius: 14,
              width: 'min(600px, 100%)',
              letterSpacing: '0.01em',
            }}>
              Start Your Free 7-Day Trial — No Credit Card Required
            </a>
            <p style={{ color: '#334155', fontSize: 13, marginTop: 14, fontFamily: "'DM Sans',sans-serif" }}>
              Cancel anytime. Your territory is yours until you cancel.
            </p>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  )
}
