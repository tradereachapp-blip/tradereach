import LeadCaptureForm from '@/components/forms/LeadCaptureForm'

export const metadata = {
  title: 'Get a Free Quote From a Licensed Local Contractor',
  description: 'Tell us what you need and a verified pro in your area will call you within 2 hours. No obligation. No spam.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Minimal homeowner nav — no logo, no brand name */}
      <nav className="border-b border-white/10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-gray-300 font-medium text-sm tracking-wide">
            Free Home Service Quotes
          </span>
          <a
            href="#get-quote"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Get My Free Quote
          </a>
        </div>
      </nav>

      {/* Hero — offer-only, no brand mentions */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left: Headline + trust signals */}
            <div className="pt-2">
              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5">
                Get a Free Quote From a{' '}
                <span className="text-orange-500">Licensed Local</span>{' '}
                Contractor
              </h1>

              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Tell us what you need and a verified pro in your area will call
                you within 2 hours.{' '}
                <strong className="text-white">No obligation. No spam.</strong>
              </p>

              {/* Trust badge pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: '✓', label: 'Licensed & Verified Contractors' },
                  { icon: '✓', label: 'Free. No Obligation' },
                  { icon: '✓', label: 'Response Within 2 Hours' },
                ].map((badge) => (
                  <span
                    key={badge.label}
                    className="inline-flex items-center gap-1.5 bg-white/8 border border-white/15 text-gray-200 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    <span className="text-green-400 font-bold">{badge.icon}</span>
                    {badge.label}
                  </span>
                ))}
              </div>

              {/* Social proof */}
              <p className="text-gray-500 text-sm">
                Join <strong className="text-gray-400">2,400+ homeowners</strong> who got free quotes this month.
              </p>

              {/* How it works — compact */}
              <div className="mt-10 space-y-4 hidden md:block">
                {[
                  { n: '1', t: 'Fill out the quick form', d: 'Takes under 30 seconds. Tell us your service type, ZIP, and contact info.' },
                  { n: '2', t: 'We match you instantly', d: 'A licensed contractor in your area is alerted right away.' },
                  { n: '3', t: 'They call you', d: 'Expect a call within 2 hours with a free, no-obligation estimate.' },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/40 flex-shrink-0 flex items-center justify-center text-orange-400 font-bold text-xs">
                      {s.n}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{s.t}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div id="get-quote">
              <LeadCaptureForm />
            </div>
          </div>
        </div>
      </section>

      {/* Services strip */}
      <section className="py-12 px-4 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-gray-500 text-xs uppercase tracking-widest mb-6 font-medium">
            Services Available
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '🏠', niche: 'Roofing', desc: 'Repairs, replacements, gutters & storm damage' },
              { icon: '❄️', niche: 'HVAC', desc: 'AC, heating, furnaces & air quality systems' },
              { icon: '🔧', niche: 'Plumbing', desc: 'Water heaters, pipes, drains & fixtures' },
            ].map((s) => (
              <div key={s.niche} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center hover:border-orange-500/40 transition-colors">
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="font-bold text-white text-sm mb-1">{s.niche}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — brand only appears here, small and gray */}
      <footer className="border-t border-white/8 py-6 px-4 text-center">
        <p className="text-gray-600 text-xs">
          Powered by TradeReach
        </p>
      </footer>
    </div>
  )
}
