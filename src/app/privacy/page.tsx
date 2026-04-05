import Link from 'next/link'

export const metadata = { title: 'Privacy Policy | TradeReach' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <Link href="/" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">← Back to TradeReach</Link>
          <h1 className="text-3xl font-black text-white mt-4 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Effective Date: April 1, 2025 · Version 1.0</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Who We Are</h2>
            <p>TradeReach LLC ("TradeReach," "we," "our," or "us") operates a lead generation marketplace at tradereachapp.com that connects homeowners seeking home services with local licensed contractors. This Privacy Policy explains how we collect, use, disclose, and protect your personal information.</p>
            <p className="mt-2">For privacy questions, contact us at: <a href="mailto:support@tradereachapp.com" className="text-orange-400 hover:text-orange-300">support@tradereachapp.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Information We Collect</h2>
            <p><strong className="text-white">From Homeowners:</strong> When you submit a quote request, we collect your name, phone number, email address (if provided), ZIP code, service type requested, preferred callback time, and your consent to be contacted.</p>
            <p className="mt-2"><strong className="text-white">From Contractors:</strong> When you register, we collect your name, business name, email address, phone number, contractor license number, ZIP codes served, and payment information processed through Stripe. We do not store full credit card numbers.</p>
            <p className="mt-2"><strong className="text-white">Automatically:</strong> We collect IP addresses, browser type and version (user agent), pages visited, timestamps, and session identifiers for security logging and analytics.</p>
            <p className="mt-2"><strong className="text-white">Consent Records:</strong> We record your consent to our terms and TCPA consent, including timestamp, IP address, and user agent, as required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Match homeowners with local licensed contractors in their service area</li>
              <li>Send lead alerts to contractors via SMS and email</li>
              <li>Process contractor subscription payments through Stripe</li>
              <li>Send transactional emails (welcome, billing, lead notifications)</li>
              <li>Operate, maintain, and improve our platform</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
              <li>Respond to customer support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. How We Share Your Information</h2>
            <p>We do not sell your personal information to third parties.</p>
            <p className="mt-2"><strong className="text-white">With Contractors:</strong> When a contractor claims your lead, we share your name, phone number, ZIP code, service type, and callback preference with that contractor only. No other contractor receives your contact information.</p>
            <p className="mt-2"><strong className="text-white">Service Providers:</strong> We share information with our technology vendors who help operate the platform: Supabase (database), Stripe (payments), Twilio (SMS), Resend (email), and Vercel (hosting). Each is bound by data processing agreements.</p>
            <p className="mt-2"><strong className="text-white">Legal Requirements:</strong> We may disclose information when required by law, court order, or to protect the rights and safety of our users or the public.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data Retention</h2>
            <p>We retain personal information for <strong className="text-white">2 years</strong> from the date of collection, after which we anonymize or delete records. Financial records required for tax compliance are retained for 7 years per IRS requirements. You may request earlier deletion as described in Section 7.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Security</h2>
            <p>We use industry-standard encryption for data in transit (TLS/HTTPS) and at rest. Chat messages are encrypted using AES encryption. We use Supabase Row Level Security to ensure contractors can only access their own data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Your Rights — California Residents (CCPA)</h2>
            <p>If you are a California resident, you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Know</strong> what personal information we collect about you</li>
              <li><strong className="text-white">Delete</strong> your personal information, subject to certain exceptions</li>
              <li><strong className="text-white">Opt out</strong> of the sale of your personal information (we do not sell personal data)</li>
              <li><strong className="text-white">Non-discrimination</strong> for exercising your privacy rights</li>
            </ul>
            <p className="mt-3">To exercise these rights, email <a href="mailto:support@tradereachapp.com" className="text-orange-400 hover:text-orange-300">support@tradereachapp.com</a> or use the deletion request form below. We will respond within 45 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. SMS Opt-Out</h2>
            <p>Homeowners who receive SMS messages from contractors matched through TradeReach may opt out at any time by replying <strong className="text-white">STOP</strong> to any text message. You will receive a confirmation message and no further messages will be sent. Reply <strong className="text-white">START</strong> at any time to re-enable messages.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use advertising cookies or third-party tracking cookies. You may disable cookies in your browser settings, but doing so may prevent you from using certain platform features.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Children's Privacy</h2>
            <p>Our platform is not directed to children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered contractors of material changes by email. The effective date at the top of this page will reflect the most recent update. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </section>

          {/* Data Deletion Request Form */}
          <section className="bg-gray-900 border border-white/8 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Request Data Deletion</h2>
            <p className="text-gray-400 text-sm mb-4">Submit your request below. We will process it within 45 days and confirm by email.</p>
            <DeletionRequestForm />
          </section>

        </div>
      </div>
    </div>
  )
}

// Client component for deletion form
import DeletionRequestForm from '@/components/DeletionRequestForm'
