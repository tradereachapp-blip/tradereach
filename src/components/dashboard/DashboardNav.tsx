'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoBadge from '@/components/LogoBadge'
import type { Contractor } from '@/types'

interface Props {
  contractor: Contractor | null
  userEmail: string
}

export default function DashboardNav({ contractor, userEmail }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function planBadge() {
    if (!contractor) return null
    const styles: Record<string, string> = {
      elite: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
      pro: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      pay_per_lead: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      none: 'bg-white/5 text-gray-500 border border-white/10',
    }
    const labels: Record<string, string> = {
      elite: '⚡ Elite',
      pro: '🔵 Pro',
      pay_per_lead: 'Pay Per Lead',
      none: 'No Plan',
    }
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${styles[contractor.plan_type]}`}>
        {labels[contractor.plan_type]}
      </span>
    )
  }

  const navLinks = [
    { href: '/dashboard', label: 'Available Leads' },
    { href: '/dashboard/claimed', label: 'Claimed Leads' },
    { href: '/dashboard/notifications', label: 'Notifications' },
    { href: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-white/8 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <LogoBadge className="h-9" href="/dashboard" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {planBadge()}
            <div className="hidden md:block text-xs text-gray-500 max-w-32 truncate">{userEmail}</div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              Sign Out
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden pb-3 pt-1 space-y-1 border-t border-white/8 mt-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
