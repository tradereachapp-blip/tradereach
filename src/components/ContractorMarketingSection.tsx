export default function ContractorMarketingSection() {
  return (
    <section id="contractors" className="py-20 px-4 bg-gradient-to-b from-gray-950 to-blue-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-6">
            For Contractors
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Stop Chasing Cold Leads.{' '}
            <span className="text-orange-500">Start Closing Warm Ones.</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            TradeReach sends you homeowners who already want a quote. You show up and close.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: '📝', step: '1', title: 'Homeowner requests a quote', desc: 'A real homeowner fills out our form and tells us exactly what service they need.' },
            { icon: '⚡', step: '2', title: 'We match them to you', desc: 'We instantly find contractors in their area who specialize in their service type.' },
            { icon: '📞', step: '3', title: 'You get notified and claim', desc: 'You receive an SMS and email instantly. Log in, claim the lead, and call them.' },
          ].map(s => (
            <div key={s.step} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="text-orange-500 font-black text-sm mb-1">Step {s.step}</div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-white mb-8">Simple, Transparent Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pay Per Lead */}
            <div className="bg-white/5 border border-white/20 rounded-2xl p-6">
              <h4 className="font-bold text-white text-lg mb-1">Pay Per Lead</h4>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black text-white">$45</span>
                <span className="text-gray-400">/lead</span>
              </div>
              <ul className="text-sm text-gray-300 space-y-2 mb-6">
                <li className="flex gap-2"><span className="text-green-400">✓</span> No monthly commitment</li>
                <li className="flex gap-2"><span className="text-green-400">✓</span> Pay only when you claim</li>
                <li className="flex gap-2"><span className="text-green-400">✓</span> Up to 5 ZIP codes</li>
                <li className="flex gap-2"><span className="text-gray-500">–</span> Shared territory</li>
              </ul>
              <a href="/signup" className="block w-full text-center py-3 border border-white/30 text-white rounded-xl hover:bg-white/10 transition-all font-medium text-sm">
                Get Started Free
              </a>
            </div>

            {/* Pro */}
            <div className="bg-blue-900/30 border border-blue-500/40 rounded-2xl p-6">
              <h4 className="font-bold text-white text-lg mb-1">Pro</h4>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-white">$397</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-blue-400 text-xs mb-4">7-day free trial</p>
              <ul className="text-sm text-gray-300 space-y-2 mb-6">
                <li className="flex gap-2"><span className="text-green-400">✓</span> 30 leads/month included</li>
                <li className="flex gap-2"><span className="text-green-400">✓</span> $25/lead after cap</li>
                <li className="flex gap-2"><span className="text-green-400">✓</span> Up to 10 ZIP codes</li>
                <li className="flex gap-2"><span className="text-blue-400">✓</span> Shared territory</li>
              </ul>
              <a href="/signup" className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold text-sm">
                Start Free Trial
              </a>
            </div>

            {/* Elite — Most Popular */}
            <div className="bg-orange-500/10 border-2 border-orange-500 rounded-2xl p-6 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <h4 className="font-bold text-white text-lg mb-1 mt-2">Elite</h4>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-white">$697</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-orange-400 text-xs mb-4">7-day free trial</p>
              <ul className="text-sm text-gray-200 space-y-2 mb-6">
                <li className="flex gap-2"><span className="text-orange-400">✓</span> <strong>Unlimited</strong> leads/month</li>
                <li className="flex gap-2"><span className="text-orange-400">✓</span> Exclusive territory by ZIP</li>
                <li className="flex gap-2"><span className="text-orange-400">✓</span> 15-min priority delivery head start</li>
                <li className="flex gap-2"><span className="text-orange-400">✓</span> Unlimited ZIP codes</li>
                <li className="flex gap-2"><span className="text-orange-400">✓</span> No overage charges ever</li>
              </ul>
              <a href="/signup" className="block w-full text-center py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-bold text-sm">
                Start Free Trial
              </a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-white mb-8">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              {
                q: 'How fresh are the leads?',
                a: 'Very fresh. Leads are submitted by homeowners in real time and delivered to you within seconds. You\'ll receive an SMS and email the moment a matching lead comes in.',
              },
              {
                q: 'Can I get a refund on a bad lead?',
                a: 'We stand behind our leads. If a lead has an invalid phone number or is clearly fraudulent, contact support and we\'ll review it. We do not offer refunds for leads that simply didn\'t convert — the homeowner was real, the opportunity is what you make of it.',
              },
              {
                q: 'How many contractors compete for the same lead?',
                a: 'On the Pay Per Lead and Pro plans, multiple contractors in the same territory can see and claim the same lead — first come, first served. Elite contractors get a 15-minute exclusive window before anyone else sees the lead. Only one contractor can claim each lead.',
              },
              {
                q: 'How do I cancel?',
                a: 'Cancel anytime from your account settings in one click. No cancellation fees, no questions asked. Your access continues until the end of your current billing period.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to fill your pipeline?</h3>
          <p className="text-gray-400 mb-8">Join 500+ contractors already growing with TradeReach</p>
          <a
            href="/signup"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all"
          >
            Start Your Free 7-Day Trial →
          </a>
          <p className="text-gray-500 text-sm mt-3">No credit card required for trial</p>
        </div>
      </div>
    </section>
  )
}
