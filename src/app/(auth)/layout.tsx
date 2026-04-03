import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="TradeReach Home Service Leads"
              width={200}
              height={113}
              className="h-16 w-auto mx-auto"
              priority
            />
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
