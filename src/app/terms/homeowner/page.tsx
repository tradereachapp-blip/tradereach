import Link from 'next/link'

export const metadata = { title: 'Homeowner Terms of Service | TradeReach' }

export default function HomeownerTermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <Link href="/" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">← Back to TradeReach</Link>
          <h1 className="text-3xl font-black text-white mt-4 mb-2">Homeowner Terms of Service</h1>
          <p className="text-gray-500 text-sm">Effective Date: April 1, 2025 · Version 1.0</p>
        </div>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. What TradeReach Is</h2>
            <p>TradeReach LLC ("TradeReach") operates a referral marketplace that connects homeowners with local licensed home service contractors. <strong className="text-white">TradeReach is not a contractor and does not perform any home services.</strong> We do not employ, supervise, direct, or control any contractor, and we are not responsible for the quality, safety, legality, or any other aspect of the services they provide.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. How the Matching Process Works</h2>
            <p>When you submit a quote request through our website, your information is shared with up to three (3) licensed contractors in our network who serve your area and provide the service you requested. These contractors may contact you by phone, text, or email to discuss your project and provide a quote. Your contact information will not be shared with any contractor who does not serve your ZIP code or offer the service you requested.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Contractor Responsibility</h2>
            <p>All contractors in our network represent that they hold a valid contractor license, general liability insurance, and any other certifications required by their state and local jurisdiction. However, <strong className="text-white">TradeReach does not independently verify</strong> each contractor's license status, insurance coverage, or work quality.</p>
            <p className="mt-2">You are solely responsible for evaluating any contractor before hiring them. We recommend requesting proof of license and insurance, reading reviews, and obtaining multiple quotes before making any hiring decision.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. No Warranty or Guarantee</h2>
            <p>TradeReach makes no warranty, express or implied, about the quality of any contractor's work, their responsiveness, their pricing, or their fitness for any particular purpose. TradeReach is not responsible for any disputes between you and a contractor, including disputes about work quality, pricing, property damage, or personal injury.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, TradeReach's total liability to you for any claim arising out of or relating to these terms or our services shall not exceed $100. In no event shall TradeReach be liable for indirect, incidental, special, or consequential damages of any kind.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. TCPA Consent and Communications</h2>
            <p>By submitting a quote request and checking the TCPA consent box, you provide your prior express written consent to be contacted by TradeReach and matched contractors at the phone number you provided. This may include calls, texts, and emails including those using automated dialing systems. This consent is not a condition of receiving any service.</p>
            <p className="mt-2">You may opt out of text messages at any time by replying <strong className="text-white">STOP</strong> to any text message. You may opt out of emails by clicking "Unsubscribe" in any email.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Privacy</h2>
            <p>Your personal information is handled in accordance with our <Link href="/privacy" className="text-orange-400 hover:text-orange-300">Privacy Policy</Link>, which is incorporated into these terms by reference.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Governing Law</h2>
            <p>These terms are governed by the laws of the State of California without regard to conflict of law principles. Any dispute not resolved by the parties directly will be submitted to binding arbitration in California under the rules of the American Arbitration Association.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:support@tradereachapp.com" className="text-orange-400 hover:text-orange-300">support@tradereachapp.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
