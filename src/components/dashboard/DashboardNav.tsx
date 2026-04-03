'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
    const colors: Record<string, string> = {
      elite: 'bg-purple-100 text-purple-800',
      pro: 'bg-blue-100 text-blue-800',
      pay_per_lead: 'bg-orange-100 text-orange-800',
      none: 'bg-gray-100 text-gray-600',
    }
    const labels: Record<string, string> = {
      elite: 'Elite',
      pro: 'Pro',
      pay_per_lead: 'Pay Per Lead',
      none: 'No Plan',
    }
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[contractor.plan_type]}`}>
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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo.png"
              alt="TradeReach"
              width={130}
              height={73}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {planBadge()}
            <div className="hidden md:block text-sm text-gray-500 max-w-32 truncate">{userEmail}</div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
            >
              Sign Out
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50'
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
