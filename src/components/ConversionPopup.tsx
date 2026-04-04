'use client'

import { useState, useEffect } from 'react'

export default function ConversionPopup() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Show after 10 seconds
    const timer = setTimeout(() => {
      if (!dismissed) setVisible(true)
    }, 10000)

    // Exit-intent: mouse leaves top of viewport
    const handleExitIntent = (e: MouseEvent) => {
      if (e.clientY <= 10 && !dismissed && !visible) {
        setVisible(true)
      }
    }

    document.addEventListener('mouseleave', handleExitIntent)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleExitIntent)
    }
  }, [dismissed, visible])

  const handleCTA = () => {
    dismiss()
    setTimeout(() => {
      document.getElementById('get-quote')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  const dismiss = () => {
    setVisible(false)
    setDismissed(true)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Get a free quote">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        style={{ animation: 'scaleIn 0.25s cubic-bezier(0.22,1,0.36,1) both' }}>

        {/* Top orange accent bar */}
        <div className="h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600" />

        <div className="p-6 sm:p-8">
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all text-sm"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Live availability badge */}
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            Contractors available in your area right now
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-3">
            Before You Go — Your Free Quote Takes <span className="text-orange-500">30 Seconds</span>
          </h2>

          {/* Body copy */}
          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            Don't spend hours calling contractors who won't return your call. Tell us what you need — a licensed pro in your area will call <em className="text-gray-300 not-italic font-medium">you</em> with a free estimate.
          </p>

          {/* Social proof row */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/8">
            <div className="flex -space-x-1">
              {['JM','SD','RK','AT'].map(initials => (
                <div key={initials} className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-[9px] font-bold border border-gray-900 flex-shrink-0">
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-500 text-[11px]">2,400+ homeowners helped this month</p>
            </div>
          </div>

          {/* Trust bullets */}
          <ul className="space-y-2 mb-6">
            {[
              '✓ 100% free — no credit card, no hidden fees',
              '✓ Licensed & insured contractors only',
              '✓ Response within 2 hours, guaranteed',
            ].map(item => (
              <li key={item} className="text-gray-300 text-xs flex items-center gap-2">
                {item}
              </li>
            ))}
          </ul>

          {/* Primary CTA */}
          <button
            onClick={handleCTA}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20 mb-3"
          >
            Get My Free Quote Now →
          </button>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="w-full text-gray-600 hover:text-gray-400 text-xs py-1.5 transition-colors"
          >
            No thanks, I'll keep searching on my own
          </button>
        </div>
      </div>
    </div>
  )
}
