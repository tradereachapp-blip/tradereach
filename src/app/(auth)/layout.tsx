import LogoBadge from '@/components/LogoBadge'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <LogoBadge className="h-14" />
          <p className="text-blue-300 text-xs mt-2 font-medium tracking-wide uppercase">Home Service Leads</p>
        </div>
        {children}
      </div>
    </div>
  )
}
