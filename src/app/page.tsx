import LeadCaptureForm from '@/components/forms/LeadCaptureForm'
import ServiceQuizPopup from '@/components/ServiceQuizPopup'

export const metadata = {
  title: 'Get a Free Quote From a Licensed Local Contractor | TradeReach',
  description: 'Tell us what you need and a verified pro in your area will call you within 2 hours. No obligation. No spam.',
}

const SERVICES = [
  { icon: '🏠', niche: 'Roofing', desc: 'Repairs, replacements, gutters & storm damage', img: '/images/iDUkX.jpg' },
  { icon: '❄️', niche: 'HVAC', desc: 'AC, heating, furnaces & air quality systems', img: '/images/LXimw.jpg' },
  { icon: '🔧', niche: 'Plumbing', desc: 'Water heaters, pipes, drains & fixtures', img: null },
  { icon: '⚡', niche: 'Electrical', desc: 'Panel upgrades, wiring, outlets & EV chargers', img: null },
  { icon: '🪟', niche: 'Windows & Doors', desc: 'Installation, repair & energy upgrades', img: null },
  { icon: '🎨', niche: 'Painting', desc: 'Interior & exterior painting and finishing', img: null },
]

const STATS = [
  { value: '2,400+', label: 'Homeowners helped this month' },
  { value: '< 2 hrs', label: 'Average contractor response time' },
  { value: '100%', label: 'Free — no fees, ever' },
  { value: '50+ states', label: 'Nationwide contractor network' },
]

/* ── Logo component used in nav + footer ──────────────────────────────────── */
function LogoBadge({ className = 'h-12', footer = false }: { className?: string; footer?: boolean }) {
  return (
    <a href="/" className={`logo-badge-wrap inline-flex items-center select-none ${footer ? 'opacity-70 hover:opacity-100 transition-opacity duration-200' : ''}`}>
      <img
        src="/images/logo-badge.png"
        alt="TradeReach — Home Service Leads"
        className={`logo-badge-img ${className} w-auto object-contain`}
        onError={(e) => {
          const t = e.currentTarget as HTMLImageElement
          t.style.display = 'none'
          const sib = t.nextElementSibling as HTMLElement | null
          if (sib) sib.style.display = 'flex'
        }}
      />
      {/* Fallback text wordmark */}
      <span className="hidden items-center text-xl font-black tracking-tight">
        <span className="text-white">Trade</span><span className="text-orange-500">Reach</span>
      </span>
    </a>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── NAV ── */}
      <nav className="border-b border-white/10 px-4 py-2 sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <LogoBadge className="h-12 sm:h-14" />
          <div className="flex items-center gap-4">
            <a href="/contractors" className="text-gray-400 hover:text-white text-sm font-medium transition-colors hidden sm:block">
              Are you a contractor? →
            </a>
            <a
              href="#get-quote"
              data-quiz-trigger="true"
              className="cta-btn bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-orange-500/20"
            >
              Get Free Quote
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="pt-16 pb-8 px-4 relative overflow-hidden"
        id="get-quote"
        style={{ backgroundImage: "url('/images/teUub.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gray-950/70 pointer-events-none" aria-hidden="true" />
        <div className="glow-line glow-line-1" aria-hidden="true" />
        <div className="glow-line glow-line-2" aria-hidden="true" />
        <div className="glow-line glow-line-3" aria-hidden="true" />
        <div className="shooting-star-el shooting-star-1" aria-hidden="true" />
        <div className="shooting-star-el shooting-star-2" aria-hidden="true" />
        <div className="shooting-star-el shooting-star-3" aria-hidden="true" />
        <div className="node-dot" style={{ top: '38%', left: '8%', animationDelay: '0s' }} aria-hidden="true" />
        <div className="node-dot" style={{ top: '22%', left: '45%', animationDelay: '0.8s' }} aria-hidden="true" />
        <div className="node-dot" style={{ top: '62%', left: '28%', animationDelay: '1.6s' }} aria-hidden="true" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-start">

            {/* Left */}
            <div className="pt-2 reveal-up">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
                Contractors available in your area right now
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] mb-6 tracking-tight">
                Stop Overpaying.<br />
                <span className="text-orange-500">Get a Free Quote</span><br />
                in 30 Seconds.
              </h1>

              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                Tell us what you need and a <strong className="text-white">licensed, verified contractor</strong> in your area calls you within 2 hours — with a free, no-obligation estimate.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {['✓ Licensed & Insured Contractors', '✓ No Fees. Ever.', '✓ Response in Under 2 Hours', '✓ No Spam Calls'].map((b) => (
                  <span key={b} className="trust-badge inline-flex items-center bg-white/5 border border-white/10 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full">
                    {b}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-400 text-sm"><strong className="text-gray-200">4.9/5</strong> from 1,200+ homeowners</span>
              </div>
            </div>

            {/* Right: Form */}
            <div className="reveal-up" style={{ animationDelay: '0.1s' }}>
              <LeadCaptureForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-10 px-4 border-y border-white/8 bg-white/2 mt-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={s.label} className="text-center reveal-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="text-2xl md:text-3xl font-black text-orange-400 mb-1">{s.value}</div>
              <div className="text-gray-500 text-xs leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        className="py-20 px-4 relative overflow-hidden"
        style={{ backgroundImage: "url('/images/Y1t34.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gray-950/80 pointer-events-none" aria-hidden="true" />
        <div className="glow-line glow-line-1" style={{ animationDelay: '1s', top: '30%' }} aria-hidden="true" />
        <div className="glow-line glow-line-2" style={{ animationDelay: '3.5s', top: '70%' }} aria-hidden="true" />
        <div className="shooting-star-el shooting-star-1" style={{ animationDelay: '2s' }} aria-hidden="true" />
        <div className="node-dot" style={{ top: '25%', left: '15%', animationDelay: '0.3s' }} aria-hidden="true" />
        <div className="node-dot" style={{ top: '65%', left: '75%', animationDelay: '1.2s' }} aria-hidden="true" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14 reveal-up">
            <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="text-3xl md:text-4xl font-black mb-4">How TradeReach Works</h2>
            <p className="text-gray-400 max-w-lg mx-auto">We cut out the middleman. Your request goes directly to verified local contractors — no call centers, no runaround.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', icon: '📋', title: 'Tell Us What You Need', desc: 'Fill out our 30-second form. Tell us your service type, ZIP code, and the best time to call. No account needed.' },
              { n: '02', icon: '🔔', title: 'We Alert Nearby Contractors', desc: 'Your request is instantly sent to licensed, vetted contractors in your area who specialize in exactly what you need.' },
              { n: '03', icon: '📞', title: 'They Call You — Free', desc: 'Expect a call within 2 hours with a free estimate. No obligation to hire. Compare quotes and choose who you want.' },
            ].map((s, i) => (
              <div key={s.n} className="premium-card reveal-up relative bg-white/3 border border-white/8 rounded-2xl p-8 hover:border-orange-500/30 transition-all" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-4xl mb-5">{s.icon}</div>
                <div className="absolute top-6 right-6 text-white/8 font-black text-5xl leading-none select-none">{s.n}</div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-20 px-4 bg-white/2 border-y border-white/8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal-up">
            <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">What we cover</p>
            <h2 className="text-3xl md:text-4xl font-black mb-4">Every Major Home Service</h2>
            <p className="text-gray-400 max-w-lg mx-auto">From emergency repairs to planned upgrades, we have verified contractors ready for any job.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
            {SERVICES.map((s) => (
              <a
                key={s.niche}
                href="#get-quote"
                data-quiz-trigger="true"
                className="premium-card group bg-white/3 border border-white/8 rounded-xl overflow-hidden hover:border-orange-500/40 hover:bg-orange-500/5 transition-all cursor-pointer"
              >
                {s.img && (
                  <div className="w-full h-36 overflow-hidden">
                    <img
                      src={s.img}
                      alt={s.niche}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5">
                  {!s.img && <div className="text-3xl mb-3">{s.icon}</div>}
                  <h3 className="font-bold text-white text-sm mb-1 group-hover:text-orange-400 transition-colors">{s.niche}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="text-center mt-10 reveal-up">
            <a
              href="#get-quote"
              data-quiz-trigger="true"
              className="cta-btn inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 text-sm"
            >
              Get My Free Quote Now →
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY TRADEREACH ── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-up">
              <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">Why homeowners choose us</p>
              <h2 className="text-3xl md:text-4xl font-black mb-6">No More Chasing Contractors Who Never Show</h2>
              <p className="text-gray-300 leading-relaxed mb-8">
                Finding a reliable contractor is a nightmare. Unreturned calls, no-shows, wildly different quotes — most homeowners give up or overpay. TradeReach exists to fix that.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '🔍', title: 'Every contractor is verified', desc: 'We check licenses, insurance, and reviews before anyone gets access to your info.' },
                  { icon: '⚡', title: 'No sitting on hold', desc: 'Your request goes out instantly. Contractors come to you — not the other way around.' },
                  { icon: '💰', title: 'Free for homeowners — always', desc: 'Contractors pay to access leads. You never pay a cent to get quotes.' },
                ].map((f, i) => (
                  <div key={f.title} className="flex gap-4 items-start reveal-up" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0 text-lg">{f.icon}</div>
                    <div>
                      <p className="text-white font-semibold text-sm mb-0.5">{f.title}</p>
                      <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              {[
                { name: 'Jennifer M.', location: 'Austin, TX', service: 'Roofing', quote: 'I filled out the form at 9am and had two contractors calling me by 10:30. Got my roof replaced for $800 less than what my neighbor paid.' },
                { name: 'Mike D.', location: 'Phoenix, AZ', service: 'HVAC', quote: 'AC went out on a 105° day. TradeReach had a tech at my door same afternoon. Couldn\'t believe it.' },
                { name: 'Sandra T.', location: 'Nashville, TN', service: 'Plumbing', quote: 'Finally a service that doesn\'t spam you. One call, one contractor, fixed same day.' },
              ].map((t, i) => (
                <div key={t.name} className="premium-card reveal-up bg-white/3 border border-white/8 rounded-2xl p-5" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex mb-3">
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-xs">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.location}</p>
                    </div>
                    <span className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded-full font-medium">{t.service}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR CONTRACTORS CTA ── */}
      <section className="py-16 px-4 bg-orange-500/8 border-y border-orange-500/20">
        <div className="max-w-4xl mx-auto text-center reveal-up">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">For home service professionals</p>
          <h2 className="text-3xl md:text-4xl font-black mb-4">Are You a Contractor?</h2>
          <p className="text-gray-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Stop chasing cold leads. TradeReach delivers homeowners who are actively looking for exactly what you do — in your service area.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/contractors" className="cta-btn inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 text-sm">
              View Contractor Plans →
            </a>
            <a href="/login" className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl transition-all text-sm">
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto reveal-up">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Get Your Free Quote?</h2>
          <p className="text-gray-400 mb-8">Takes 30 seconds. No account. No spam. A contractor will call you within 2 hours.</p>
          <a
            href="#get-quote"
            data-quiz-trigger="true"
            className="cta-btn inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-5 rounded-xl transition-all shadow-xl shadow-orange-500/30 text-base"
          >
            Get My Free Quote →
          </a>
        </div>
      </section>

      {/* ── LEGAL POLICY ── */}
      <section className="border-t border-white/5 bg-gray-950 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-4">Legal &amp; Disclosures</p>
          <div className="space-y-4 text-gray-600 text-[11px] leading-relaxed">
            <div>
              <p className="text-gray-500 font-semibold mb-1">Telephone Consumer Protection Act (TCPA) Consent</p>
              <p>By submitting your information through this website, you expressly authorize TradeReach and its network of licensed home service contractors to contact you at the phone number and email address you provide, including via live calls, pre-recorded or artificial voice messages, text messages (SMS/MMS), and automated dialing systems, for the purpose of providing free quotes and home service information. This consent is not required as a condition of any purchase. Message and data rates may apply. Reply STOP to any text to opt out at any time. You may also opt out by contacting us at <a href="mailto:support@tradereachapp.com" className="text-gray-500 underline hover:text-gray-400">support@tradereachapp.com</a>.</p>
            </div>
            <div>
              <p className="text-gray-500 font-semibold mb-1">Lead Generation Disclosure</p>
              <p>TradeReach is a lead generation and marketing platform, not a licensed contractor. We connect homeowners with independent, third-party contractors who operate independently of TradeReach. Contractors pay a fee to receive leads through our platform. This fee does not influence which contractors are displayed or connected with homeowners.</p>
            </div>
            <div>
              <p className="text-gray-500 font-semibold mb-1">Contractor Verification Disclaimer</p>
              <p>While TradeReach makes reasonable efforts to verify contractor licenses and insurance, we do not guarantee the accuracy or current status of any contractor&apos;s credentials. Homeowners are strongly encouraged to independently verify credentials before engaging any contractor. TradeReach disclaims all responsibility for contractor acts or omissions.</p>
            </div>
            <div>
              <p className="text-gray-500 font-semibold mb-1">Privacy &amp; Data Use</p>
              <p>TradeReach collects your name, phone number, email address, ZIP code, and service request information solely for connecting you with qualified local contractors. We do not sell your personally identifiable information to data brokers. California residents have rights under CCPA — contact <a href="mailto:support@tradereachapp.com" className="text-gray-500 underline hover:text-gray-400">support@tradereachapp.com</a> to exercise them.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-8 px-4 bg-gray-950">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <LogoBadge className="h-11" footer />
          <div className="flex flex-wrap justify-center gap-6 text-gray-500 text-xs">
            <a href="/contractors" className="hover:text-gray-300 transition-colors">For Contractors</a>
            <a href="/login" className="hover:text-gray-300 transition-colors">Contractor Login</a>
            <a href="mailto:support@tradereachapp.com" className="hover:text-gray-300 transition-colors">Contact</a>
          </div>
          <p className="text-gray-600 text-xs text-center">&copy; {new Date().getFullYear()} TradeReach LLC. All rights reserved.</p>
        </div>
      </footer>

      {/* ── SERVICE QUIZ POPUP ── */}
      <ServiceQuizPopup />

    </div>
  )
}
