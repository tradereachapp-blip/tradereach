export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="logo-badge-wrap inline-flex items-center justify-center select-none">
            <img
              src="/images/logo-badge.png"
              alt="TradeReach"
              className="logo-badge-img h-14 w-auto object-contain"
              onError={(e) => {
                const t = e.currentTarget
                t.style.display = 'none'
                const next = t.nextElementSibling as HTMLElement | null
                if (next) next.style.display = 'inline'
              }}
            />
            {/* Fallback wordmark */}
            <span className="hidden text-3xl font-black tracking-tight">
              <span className="text-white">Trade</span><span className="text-orange-500">Reach</span>
            </span>
          </a>
          <p className="text-blue-300 text-xs mt-2 font-medium tracking-wide uppercase">Home Service Leads</p>
        </div>
        {children}
      </div>
    </div>
  )
}
