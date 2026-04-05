'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AGREEMENT_VERSION = '1.0'

export default function ContractorTermsPage() {
  const router = useRouter()
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (atBottom) setScrolledToBottom(true)
  }

  async function handleAccept() {
    setAccepting(true)
    setError('')
    const res = await fetch('/api/legal/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreement_type: 'contractor_tos', agreement_version: AGREEMENT_VERSION }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to record acceptance'); setAccepting(false); return }
    setAccepted(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Agreement Accepted</h2>
          <p className="text-gray-400 text-sm">Redirecting to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/8 px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-lg font-black text-white tracking-tight">Trade<span className="text-orange-500">Reach</span></span>
          <span className="text-xs text-gray-500">Contractor Terms of Service · v{AGREEMENT_VERSION}</span>
        </div>
      </div>

      {/* Instruction bar */}
      <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3 flex-shrink-0">
        <p className="text-center text-sm text-orange-400 max-w-3xl mx-auto">
          {scrolledToBottom
            ? '✅ You may now accept the agreement below.'
            : '📜 Please read the full agreement — scroll to the bottom to activate the Accept button.'}
        </p>
      </div>

      {/* Scrollable terms */}
      <div className="flex-1 overflow-hidden max-w-3xl mx-auto w-full px-4 py-6 flex flex-col">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-gray-900 border border-white/8 rounded-2xl p-8 space-y-6 text-gray-300 text-sm leading-relaxed"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Contractor Terms of Service</h1>
            <p className="text-gray-500 text-xs">Effective Date: April 1, 2025 · Version {AGREEMENT_VERSION}</p>
          </div>

          <section>
            <h2 className="text-base font-bold text-white mb-2">1. Nature of TradeReach</h2>
            <p>TradeReach LLC ("TradeReach," "we," "us") operates a <strong className="text-white">lead generation marketplace</strong>, not a contractor referral service or employment agency. We connect homeowners who request home service quotes with independent licensed contractors. TradeReach does not employ contractors, does not perform any home services, and is not responsible for any work performed by contractors.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. No Guarantee of Lead Quality, Volume, or Conversion</h2>
            <p>TradeReach makes <strong className="text-white">no guarantee</strong> regarding the quality, volume, or conversion rate of leads. Leads are generated through digital advertising targeting homeowners actively seeking home service quotes. However, homeowners may change their minds, may not respond, or may hire another contractor. TradeReach does not guarantee that any lead will result in a booked job or revenue for you.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. Leads Sold As-Is — Credit Policy</h2>
            <p>All leads are sold as-is. TradeReach does not issue cash refunds. Lead credits may be issued solely under the circumstances described in our <strong className="text-white">Lead Credit Policy</strong> (available at tradereachapp.com/terms/credits). Credits apply to future billing only and have no cash value.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. License, Bond, and Insurance</h2>
            <p>By accepting these terms, you represent and warrant that you hold a <strong className="text-white">valid contractor license</strong> (where required by your state and local jurisdiction), general liability insurance, and any required bonding. You agree to maintain these credentials for the duration of your TradeReach membership. Providing false information about your credentials will result in <strong className="text-white">immediate account termination</strong> without refund.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">5. Conduct with Homeowners</h2>
            <p>You agree to treat all homeowners with respect and professionalism. You must not harass, threaten, or engage in deceptive practices with any homeowner. Repeated homeowner complaints will result in account suspension or termination. You must contact each lead within a reasonable timeframe and honor any quotes provided.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">6. Contractor Responsibility for Work</h2>
            <p>You are <strong className="text-white">solely responsible</strong> for all work you perform for homeowners, including but not limited to work quality, safety compliance, permits, materials, and any disputes arising from the work. TradeReach is not a party to any agreement between you and a homeowner. Any dispute between you and a homeowner is entirely between those parties.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, <strong className="text-white">TradeReach's total liability</strong> to you for any claim arising from or related to these terms or the platform shall not exceed the total amount you paid to TradeReach in the <strong className="text-white">30 days immediately preceding</strong> the claim. Under no circumstances shall TradeReach be liable for indirect, incidental, consequential, special, or punitive damages of any kind, including lost profits, lost revenue, or loss of business opportunity.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">8. Dispute Resolution — Binding Arbitration</h2>
            <p>Any dispute, claim, or controversy arising out of or relating to these terms or your use of the TradeReach platform shall be resolved by <strong className="text-white">binding arbitration</strong> administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, in the State of California. The arbitrator's decision shall be final and binding. Judgment on the arbitration award may be entered in any court of competent jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">9. Governing Law</h2>
            <p>These terms are governed by and construed in accordance with the laws of the <strong className="text-white">State of California</strong>, without regard to conflict of law principles. You consent to the exclusive jurisdiction of courts located in California for any matters not subject to arbitration.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">10. Account Termination</h2>
            <p>TradeReach reserves the right to <strong className="text-white">terminate or suspend any account at any time</strong>, with or without notice, for any reason, including but not limited to violation of these terms, fraudulent activity, repeated homeowner complaints, or misrepresentation of credentials. Upon termination, your access to the platform will cease immediately. No refund will be issued for unused subscription time upon termination for cause.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">11. Class Action Waiver</h2>
            <p>You expressly waive your right to participate in any class action lawsuit or class-wide arbitration against TradeReach. All claims must be brought on an individual basis only. This waiver is a material term of these agreements, and if it is found to be unenforceable, the entirety of the arbitration provision shall be void.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">12. Lead Credit Policy (Summary)</h2>
            <p>Credits are issued only for: (a) duplicate leads received within 7 days, (b) disconnected phone numbers reported within 24 hours, or (c) homeowner confirms they did not submit a request. Credits are not issued because a homeowner is unresponsive, hired someone else, or changed their mind. See our full <a href="/terms/credits" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Lead Credit Policy</a> for details.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">13. Changes to Terms</h2>
            <p>TradeReach may update these terms at any time. Material changes will require re-acceptance before continued platform use. We will notify you by email of any material changes. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">14. Entire Agreement</h2>
            <p>These terms, together with our Privacy Policy and Lead Credit Policy, constitute the entire agreement between you and TradeReach with respect to your use of the platform and supersede all prior agreements, representations, and understandings.</p>
          </section>

          <div className="pt-4 border-t border-white/8 text-gray-500 text-xs">
            <p>TradeReach LLC · California · support@tradereachapp.com · Version {AGREEMENT_VERSION} · April 1, 2025</p>
          </div>
        </div>

        {/* Accept button */}
        <div className="mt-4 flex flex-col items-center gap-3">
          {!scrolledToBottom && (
            <p className="text-xs text-gray-500">↓ Scroll to the bottom of the agreement to continue</p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleAccept}
            disabled={!scrolledToBottom || accepting}
            className={`w-full max-w-sm py-3.5 rounded-xl font-bold text-sm transition-all ${
              scrolledToBottom
                ? 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-[1.02]'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {accepting ? 'Recording acceptance…' : 'I Accept the Contractor Terms of Service'}
          </button>
          <p className="text-xs text-gray-600 text-center max-w-sm">
            By clicking accept, you acknowledge you have read and agree to these terms. Your IP address and device information will be recorded as proof of acceptance.
          </p>
        </div>
      </div>
    </div>
  )
}
