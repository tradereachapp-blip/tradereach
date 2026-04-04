export default function ThankYouPage() {
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? ''

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Nav with wordmark */}
      <nav className="border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <a href="/" className="select-none">
            <span className="text-xl font-black tracking-tight">
              <span className="text-white">Trade</span><span className="text-orange-500">Reach</span>
            </span>
          </a>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-black mb-4">Your request has been received.</h1>
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">
            A licensed contractor in your area will call you within{' '}
            <strong className="text-white">2 hours</strong> during business hours.
            They will call from a local number. No obligation to hire.
          </p>

          {supportPhone && (
            <p className="text-gray-400 text-sm mb-8">
              If you have questions, call or text{' '}
              <a href={`tel:${supportPhone}`} className="text-orange-400 hover:text-orange-300 font-medium">
                {supportPhone}
              </a>
            </p>
          )}

          <div className="bg-white/5 border border-white/8 rounded-2xl p-6 text-left mb-10">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">What happens next</p>
            <ul className="text-gray-300 text-sm space-y-3">
              <li className="flex gap-3 items-start">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                A verified contractor reviews your request
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                They'll call at your preferred time with a free estimate
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                No obligation to hire — just get the information you need
              </li>
            </ul>
          </div>

          <a href="/" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            ← Submit another request
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 py-6 px-4 text-center">
        <span className="text-base font-black tracking-tight opacity-40 select-none">
          <span className="text-white">Trade</span><span className="text-orange-500">Reach</span>
        </span>
      </footer>
    </div>
  )
}
