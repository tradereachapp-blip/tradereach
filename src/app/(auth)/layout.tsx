export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block select-none">
            <span className="text-3xl font-black tracking-tight">
              <span className="text-white">Trade</span><span className="text-orange-500">Reach</span>
            </span>
          </a>
          <p className="text-blue-300 text-xs mt-1 font-medium">Home Service Leads</p>
        </div>
        {children}
      </div>
    </div>
  )
}
