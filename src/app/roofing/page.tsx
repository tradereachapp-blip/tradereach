import LandingLeadForm from '@/components/LandingLeadForm'

export const metadata = {
  title: 'Free Roofing Estimate — Trusted Local Roofers in Los Angeles',
  description: 'Get a free roofing estimate from a trusted local contractor in Los Angeles. Call within 2 hours. No obligation.',
}

const TRUST_BADGES = [
  { icon: '🏆', label: 'Trusted Local Contractors' },
  { icon: '💰', label: 'Free Estimate' },
  { icon: '⏱️', label: '2 Hour Response' },
  { icon: '🚫', label: 'No Spam Calls' },
]

export default function RoofingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8 md:py-12">

        {/* Logo — not linked */}
        <div className="text-center mb-6">
          <span className="font-black text-xl tracking-tight">
            <span className="text-white">Trade</span><span className="text-orange-500">Reach</span>
          </span>
        </div>

        {/* Urgency line */}
        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest text-center mb-3">
          Los Angeles roofing season is here. Don't wait until damage gets worse.
        </p>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-black text-center mb-3 leading-tight">
          Is Your Roof Ready for<br />
          <span className="text-orange-400">Fire Season, Los Angeles?</span>
        </h1>

        {/* Subheadline */}
        <p className="text-gray-300 text-center text-sm leading-relaxed mb-5">
          Tell us what you need and a trusted local contractor calls you within <strong className="text-white">2 hours</strong> — free, no obligation estimate.
        </p>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {TRUST_BADGES.map(b => (
            <div key={b.label} className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2">
              <span className="text-base">{b.icon}</span>
              <span className="text-xs font-medium text-gray-300">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <svg key={i} className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-gray-400 text-xs">4.9 stars from 1,200+ homeowners</span>
        </div>

        {/* Form */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Get Your Free Roofing Estimate</h2>
          <p className="text-gray-500 text-xs mb-4">Takes 30 seconds. No obligation.</p>
          <LandingLeadForm defaultNiche="Roofing" />
        </div>

      </div>
    </div>
  )
}
