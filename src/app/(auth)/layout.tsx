export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg">T</span>
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-xl leading-none">TradeReach</div>
                <div className="text-blue-300 text-xs">Home Service Leads</div>
              </div>
            </div>
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
