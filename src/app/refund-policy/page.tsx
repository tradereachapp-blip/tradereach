import type { Metadata } from 'next'
import LogoBadge from '@/components/LogoBadge'

export const metadata: Metadata = {
  title: 'Refund Policy | TradeReach',
  description: 'TradeReach refund and cancellation policy for Pro and Elite subscriptions.',
}

const sections = [
  {
    title: 'Subscriptions',
    body: 'Pro and Elite monthly subscriptions are non-refundable once the billing period has started. You may cancel at any time and retain full access until the end of your current billing period. We offer a 7-day free trial so you can test the platform before being charged.',
  },
  {
    title: 'Pay Per Lead',
    body: 'Individual lead purchases are non-refundable once the lead has been claimed and contact information has been revealed.',
  },
  {
    title: 'Invalid Leads',
    body: 'If a lead contains an invalid phone number that cannot be reached after 3 attempts, we will credit your account with a replacement lead at no charge. To request a replacement lead, contact support@tradereachapp.com within 48 hours of claiming the lead.',
  },
  {
    title: 'Disputes',
    body: 'We encourage contractors to contact us before filing a dispute with their bank. We are a small team and will work with you to resolve any issues fairly and quickly. Contact support@tradereachapp.com.',
  },
  {
    title: 'No Refunds After 7 Days',
    body: 'No refunds will be issued after 7 days from the charge date under any circumstances.',
  },
]

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <header className="border-b border-white/8 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <LogoBadge className="h-7" href="/" />
          <a href="/contractors" className="text-sm text-gray-400 hover:text-white transition-colors">
            For Contractors
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-3">Refund Policy</h1>
          <p className="text-gray-400 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-gray-300 mt-4 leading-relaxed">
            At TradeReach we stand behind the quality of our leads and platform. Here is our policy.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={i} className="border-l-2 border-orange-500/40 pl-6">
              <h2 className="text-lg font-bold text-white mb-2">{s.title}</h2>
              <p className="text-gray-300 leading-relaxed text-sm">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-2">Questions?</h3>
          <p className="text-gray-400 text-sm">
            Email us at{' '}
            <a href="mailto:support@tradereachapp.com" className="text-orange-400 hover:underline">
              support@tradereachapp.com
            </a>{' '}
            and we'll respond within one business day.
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-8 pt-8 border-t border-white/8 flex flex-wrap gap-4 text-xs text-gray-600">
          <a href="/" className="hover:text-gray-400 transition-colors">Home</a>
          <a href="/contractors" className="hover:text-gray-400 transition-colors">For Contractors</a>
          <a href="/refund-policy" className="text-gray-400">Refund Policy</a>
        </div>
      </main>
    </div>
  )
}
