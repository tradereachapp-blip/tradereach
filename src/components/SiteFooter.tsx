import LogoBadge from '@/components/LogoBadge'

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/8 py-8 px-4 bg-gray-950">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <LogoBadge className="h-11" footer />
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-gray-500 text-xs">
          <a href="/contractors" className="hover:text-gray-300 transition-colors">For Contractors</a>
          <a href="/login" className="hover:text-gray-300 transition-colors">Contractor Login</a>
          <a href="/terms/homeowner" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <a href="/terms/credits" className="hover:text-gray-300 transition-colors">Lead Credit Policy</a>
          <a href="mailto:support@tradereachapp.com" className="hover:text-gray-300 transition-colors">Contact Support</a>
        </div>
        <p className="text-gray-600 text-xs text-center">
          &copy; {new Date().getFullYear()} TradeReach LLC.™ All rights reserved.
        </p>
      </div>
    </footer>
  )
}
