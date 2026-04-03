export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-bold text-white">TradeReach Admin</span>
          </div>
          <nav className="flex gap-4 text-sm">
            <a href="/admin" className="text-gray-400 hover:text-white transition-colors">Dashboard</a>
            <a href="/admin/leads" className="text-gray-400 hover:text-white transition-colors">Leads</a>
            <a href="/admin/contractors" className="text-gray-400 hover:text-white transition-colors">Contractors</a>
            <a href="/admin/errors" className="text-gray-400 hover:text-white transition-colors">Errors</a>
            <a href="/admin/revenue" className="text-gray-400 hover:text-white transition-colors">Revenue</a>
          </nav>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
