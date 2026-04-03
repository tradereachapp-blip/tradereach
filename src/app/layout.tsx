import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'TradeReach — Home Service Leads for Contractors',
    template: '%s | TradeReach',
  },
  description:
    'Connect with homeowners who need roofing, HVAC, and plumbing services. Real leads. Verified homeowners. Close more jobs.',
  keywords: ['home service leads', 'roofing leads', 'HVAC leads', 'plumbing leads', 'contractor leads'],
  openGraph: {
    title: 'TradeReach — Home Service Leads',
    description: 'Stop chasing cold leads. Start closing warm ones.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
