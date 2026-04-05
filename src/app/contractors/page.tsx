import LogoBadge from '@/components/LogoBadge'
import SiteFooter from '@/components/SiteFooter'
import PricingSection from '@/components/marketing/PricingSection'
import { createAdminClient } from '@/lib/supabase/server'
import { PRICING } from '@/lib/pricing'

export const revalidate = 60 // revalidate founding spots every 60s

export const metadata = {
  title: 'TradeReach™ — Home Service Leads for Contractors',
  description: 'Stop chasing cold leads. Start closing warm ones. TradeReach™ sends you homeowners who are ready for a quote.',
}

export default async function ContractorsPage() {
  // Fetch live founding member spot counts
  const admin = createAdminClient()
  const { data: spots } = await admin
    .from('founding_member_counts')
    .select('plan_type, filled_spots, max_spots')

  const proRow = spots?.find(s => s.plan_type === 'pro')
  const eliteRow = spots?.find(s => s.plan_type === 'elite')

  const foundingSpots = {
    pro: { filled: proRow?.filled_spots ?? 0, max: proRow?.max_spots ?? PRICING.PRO_FOUNDING_SPOTS },
    elite: { filled: eliteRow?.filled_spots ?? 0, max: eliteRow?.max_spots ?? PRICING.ELITE_FOUNDING_SPOTS },
  }

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

      {/* Founding member urgency bar */}
      {(foundingSpots.pro.filled < foundingSpots.pro.max || foundingSpots.elite.filled < foundingSpots.elite.max) && (
        <div className="py-2.5 px-4 text-center text-xs font-semibold"
          style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.2)', color: 'rgb(251,191,36)' }}>
          ⭐ Founding Member pricing active —{' '}
          {foundingSpots.pro.max - foundingSpots.pro.filled > 0 && `${foundingSpots.pro.max - foundingSpots.pro.filled} Pro spots`}
          {foundingSpots.pro.max - foundingSpots.pro.filled > 0 && foundingSpots.elite.max - foundingSpots.elite.filled > 0 && ' · '}
          {foundingSpots.elite.max - foundingSpots.elite.filled > 0 && `${foundingSpots.elite.max - foundingSpots.elite.filled} Elite spots`}
          {' '}remaining. Lock in your rate for life.
        </div>
      )}

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
            TradeReach™ sends you homeowners who already want a quote. You show up and close.
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
          <h2 className="text-3xl font-bold text-center mb-3">How TradeReach™ Works</h2>
          <p className="text-gray-400 text-center mb-14">Three steps from homeowner request to your phone ringing</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📝', step: '1', title: 'Homeowner requests a quote', desc: 'A real homeowner fills out our form and tells us exactly what service they need and when they want to be called.' },
              { icon: '⚡', step: '2', title: 'We match them to you', desc: "We instantly find licensed contractors in their ZIP code who specialize in their service type. You're notified within seconds." },
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

      {/* Pricing — client component with toggle + founding member */}
      <PricingSection foundingSpots={foundingSpots} />

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
                q: 'What is Founding Member pricing?',
                a: `The first ${PRICING.PRO_FOUNDING_SPOTS} Pro and ${PRICING.ELITE_FOUNDING_SPOTS} Elite subscribers lock in a lower rate for life. Pro founding price is $${PRICING.PRO_MONTHLY_FOUNDING}/mo and Elite is $${PRICING.ELITE_MONTHLY_FOUNDING}/mo. Once those spots are filled, the price goes up to $${PRICING.PRO_MONTHLY}/$${PRICING.ELITE_MONTHLY} for new subscribers. Your rate never changes.`,
              },
              {
                q: 'Can I get a refund on a bad lead?',
                a: "If a lead has an invalid or disconnected phone number, contact support and we'll review it. We do not offer refunds for leads that didn't convert — the homeowner was real and actively requested a quote. Closing is on you.",
              },
              {
                q: 'How many contractors compete for the same lead?',
                a: 'On Pay Per Lead and Pro, multiple contractors in the same territory can see the lead — first come, first served. Elite contractors get a 15-minute exclusive window before anyone else is notified. In either case, only one contractor can ever claim a lead.',
              },
              {
                q: 'How do I cancel?',
                a: 'Cancel anytime in one click from your account settings. No cancellation fees, no calls to make, no questions asked. Your access continues until the end of the current billing period.',
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
            Join 500+ contractors already growing with TradeReach™. Your first 7 days are free.
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
