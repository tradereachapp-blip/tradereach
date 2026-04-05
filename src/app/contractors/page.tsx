import LogoBadge from '@/components/LogoBadge'
import { PRICING } from '@/lib/pricing'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'TradeReach — Home Service Leads for Contractors',
  description: 'Stop chasing cold leads. Start closing warm ones. TradeReach sends you homeowners who are ready for a quote.',
}

export default function ContractorsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-4 py-2 sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <LogoBadge className="h-12 sm:h-14" href="/contractors" />
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Login
            </a>
            <a
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Leads available in your area right now
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
            Stop Chasing Cold Leads.{' '}
            <span className="text-orange-500">Start Closing Warm Ones.</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            TradeReach sends you homeowners who already want a quote. You show up and close.
            No door-knocking. No cold calls. Just real jobs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all"
            >
              Start Your Free 7-Day Trial →
            </a>
            <a
              href="#pricing"
              className="border border-white/20 hover:border-white/40 text-white font-medium px-8 py-4 rounded-xl text-lg transition-all"
            >
              See Pricing
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-4">No credit card required during trial</p>
        </div>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-white/8 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { value: '500+', label: 'Active Contractors' },
            { value: '10,000+', label: 'Leads Generated' },
            { value: '3 Niches', label: 'Roofing · HVAC · Plumbing' },
            { value: '<60s', label: 'Lead Delivery Time' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">How TradeReach Works</h2>
          <p className="text-gray-400 text-center mb-14">Three steps from homeowner request to your phone ringing</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📝', step: '1', title: 'Homeowner requests a quote', desc: 'A real homeowner fills out our form and tells us exactly what service they need and when they want to be called.' },
              { icon: '⚡', step: '2', title: 'We match them to you', desc: 'We instantly find licensed contractors in their ZIP code who specialize in their service type. You\'re notified within seconds.' },
              { icon: '📞', step: '3', title: 'You claim the lead and close', desc: 'You get an SMS and email with lead details. Log in, claim it before another contractor does, then call and close.' },
            ].map((s) => (
              <div key={s.step} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/40 transition-colors">
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="text-orange-500 font-bold text-xs mb-2 uppercase tracking-wide">Step {s.step}</div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white/2">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 text-center mb-14">No setup fees. No long-term contracts. Cancel anytime.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pay Per Lead */}
            <div className="bg-white/5 border border-white/15 rounded-2xl p-6">
              <h4 className="font-bold text-white text-xl mb-1">Pay Per Lead</h4>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">$45</span>
                <span className="text-gray-400 text-sm">/lead</span>
              </div>
              <p className="text-gray-500 text-xs mb-6">No monthly commitment</p>
              <ul className="text-sm text-gray-300 space-y-2.5 mb-8">
                <li className="flex gap-2"><span className="text-green-400 font-bold">✓</span> Pay only when you claim</li>
                <li className="flex gap-2"><span className="text-green-400 font-bold">✓</span> Up to 5 ZIP codes</li>
                <li className="flex gap-2"><span className="text-green-400 font-bold">✓</span> Email &amp; SMS alerts</li>
                <li className="flex gap-2"><span className="text-gray-600">–</span> Shared territory</li>
                <li className="flex gap-2"><span className="text-gray-600">–</span> No priority delivery</li>
              </ul>
              <a href="/signup" className="block w-full text-center py-3 border border-white/25 text-white rounded-xl hover:bg-white/8 transition-all font-medium text-sm">
                Get Started
              </a>
            </div>

            {/* Pro */}
            <div className="bg-blue-900/25 border border-blue-500/40 rounded-2xl p-6">
              <h4 className="font-bold text-white text-xl mb-1">Pro</h4>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">{`$${PRICING.PRO_MONTHLY}`}</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <p className="text-blue-400 text-xs mb-6">7-day free trial included</p>
              <ul className="text-sm text-gray-300 space-y-2.5 mb-8">
                <li className="flex gap-2"><span className="text-green-400 font-bold">✓</span> {PRICING.PRO_LEAD_CAP} leads/month included</li>
                <li className="flex gap-2"><span className="text-green-400 font-bold">✓</span> ${PRICING.PRO_OVERAGE}/lead after monthly cap</li>
                <li className="flex gap-2"><span className="text-green-400 font-bold">✓</span> Up to 10 ZIP codes</li>
                <li className="flex gap-2"><span className="text-green-400 font-bold">✓</span> Email &amp; SMS alerts</li>
                <li className="flex gap-2"><span className="text-gray-600">–</span> Shared territory</li>
              </ul>
              <a href="/signup" className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold text-sm">
                Start Free Trial
              </a>
            </div>

            {/* Elite */}
            <div className="bg-orange-500/8 border-2 border-orange-500 rounded-2xl p-6 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <h4 className="font-bold text-white text-xl mb-1 mt-2">Elite</h4>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">{`$${PRICING.ELITE_MONTHLY}`}</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <p className="text-orange-400 text-xs mb-6">7-day free trial included</p>
              <ul className="text-sm text-gray-200 space-y-2.5 mb-8">
                <li className="flex gap-2"><span className="text-orange-400 font-bold">✓</span> <strong>Unlimited</strong> leads/month</li>
                <li className="flex gap-2"><span className="text-orange-400 font-bold">✓</span> Exclusive ZIP territory</li>
                <li className="flex gap-2"><span className="text-orange-400 font-bold">✓</span> 15-min priority head start</li>
                <li className="flex gap-2"><span className="text-orange-400 font-bold">✓</span> Unlimited ZIP codes</li>
                <li className="flex gap-2"><span className="text-orange-400 font-bold">✓</span> No overage charges — ever</li>
              </ul>
              <a href="/signup" className="block w-full text-center py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-bold text-sm">
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How fresh are the leads?',
                a: 'Every lead is submitted in real time by a homeowner. The moment they hit submit, you get an SMS and email. There is no delay, no recycling, no reselling. Elite contractors get a 15-minute exclusive window before the lead goes to anyone else.',
              },
              {
                q: 'Can I get a refund on a bad lead?',
                a: 'If a lead has an invalid or disconnected phone number, contact support and we\'ll review it. We do not offer refunds for leads that didn\'t convert — the homeowner was real and actively requested a quote. Closing is on you.',
              },
              {
                q: 'How many contractors compete for the same lead?',
                a: 'On Pay Per Lead and Pro, multiple contractors in the same territory can see the lead — first come, first served. Elite contractors get a 15-minute exclusive window before anyone else is notified. In either case, only one contractor can ever claim a lead.',
              },
              {
                q: 'How do I cancel?',
                a: 'Cancel anytime in one click from your account settings. No cancellation fees, no calls to make, no questions asked. Your access continues until the end of the current billing period.',
              },
              {
                q: 'What niches are available?',
                a: 'We currently match leads for Roofing, HVAC, and Plumbing. You pick your niche during signup. Additional verticals are in the roadmap.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white/4 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 border-t border-white/8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4">Ready to fill your pipeline?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join 500+ contractors already growing with TradeReach. Your first 7 days are free.
          </p>
          <a
            href="/signup"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all"
          >
            Start Your Free 7-Day Trial →
          </a>
          <p className="text-gray-600 text-sm mt-4">No credit card required to start</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
