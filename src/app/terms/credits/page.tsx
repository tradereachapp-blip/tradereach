import Link from 'next/link'

export const metadata = { title: 'Lead Credit Policy | TradeReach' }

export default function CreditPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <Link href="/" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">← Back to TradeReach</Link>
          <h1 className="text-3xl font-black text-white mt-4 mb-2">Lead Credit Policy</h1>
          <p className="text-gray-500 text-sm">Effective Date: April 1, 2025 · Version 1.0</p>
        </div>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <p className="text-amber-400 font-semibold text-sm">Important: TradeReach issues <strong>lead credits, not cash refunds</strong>. Credits apply to your next billing cycle or future lead purchases.</p>
          </div>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">When Credits Are Issued</h2>
            <p>TradeReach will issue a lead credit equal to the amount paid for a lead in the following circumstances only:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong className="text-white">Duplicate Lead:</strong> You are charged for a lead you already received within the past 7 days (same homeowner, same phone number).</li>
              <li><strong className="text-white">Disconnected Phone Number:</strong> The homeowner's phone number is disconnected or not in service, reported within 24 hours of claiming the lead.</li>
              <li><strong className="text-white">Homeowner Did Not Submit:</strong> The homeowner confirms in writing (to TradeReach support) that they did not submit a quote request through our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">When Credits Are NOT Issued</h2>
            <p>TradeReach does not issue credits in the following circumstances:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>The homeowner does not answer your calls or return messages</li>
              <li>The homeowner already hired another contractor before you contacted them</li>
              <li>The homeowner changed their mind about the project</li>
              <li>You were unable to reach the homeowner within your preferred timeframe</li>
              <li>The job was outside your typical service scope or pricing range</li>
              <li>The lead was reported more than 24 hours after claiming (except duplicates, which have a 7-day window)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">How to Request a Credit</h2>
            <p>Navigate to your <Link href="/dashboard/claimed" className="text-orange-400 hover:text-orange-300">Claimed Leads</Link> page and click "Request Credit" on the applicable lead. Select the reason, provide a brief description, and submit. Our team will review within 2 business days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Credit Application</h2>
            <p>Approved credits are applied as a Stripe credit to your account and will automatically reduce your next invoice. Credits do not carry a cash value and are non-transferable. Credits expire 12 months after issuance if unused.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Appeals</h2>
            <p>If your credit request is denied and you believe this is in error, email <a href="mailto:support@tradereachapp.com" className="text-orange-400 hover:text-orange-300">support@tradereachapp.com</a> with your lead ID and supporting documentation. Appeals are reviewed within 5 business days. TradeReach's determination on appeals is final.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
