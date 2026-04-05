'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleBilling() {
    setDropdownOpen(false)
    const res = await fetch('/api/stripe/billing-portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert(data.error || 'Could not open billing portal.')
  }

  function getInitials() {
    if (contractor?.contact_name) {
      const parts = contractor.contact_name.trim().split(' ')
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      return parts[0][0].toUpperCase()
    }
    return (userEmail[0] || 'U').toUpperCase()
  }

  function getDisplayName() {
    if (contractor?.contact_name) return contractor.contact_name.split(' ')[0]
    return userEmail.split('@')[0]
  }

  function planBadge(compact = false) {
    if (!contractor) return null
    const styles: Record<string, string> = {
      elite: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
      pro: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      pay_per_lead: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      none: 'bg-white/5 text-gray-500 border border-white/10',
    }
    const labels: Record<string, string> = {
      elite: compact ? 'Elite' : '⚡ Elite',
      pro: compact ? 'Pro' : '🔵 Pro',
      pay_per_lead: 'PPL',
      none: '',
    }
    if (contractor.plan_type === 'none') return null
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[contractor.plan_type]}`}>
        {labels[contractor.plan_type]}
      </span>
    )
  }

  const navLinks = [
    { href: '/dashboard', label: 'Available Leads' },
    { href: '/dashboard/claimed', label: 'Claimed Leads' },
    { href: '/dashboard/notifications', label: 'Notifications' },
    { href: '/dashboard/team', label: 'Team' },
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

          {/* Right side — account dropdown */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Account dropdown trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-white/5 border border-white/0 hover:border-white/8 transition-all"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md shadow-orange-500/20">
                  {getInitials()}
                </div>
                <div className="hidden sm:flex flex-col items-start min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate max-w-24">{getDisplayName()}</span>
                    {planBadge(true)}
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-gray-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/8 bg-gray-800/60">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-white truncate">{contractor?.contact_name || 'Contractor'}</p>
                      {planBadge()}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-orange-500/10 transition-colors"
                    >
                      <span className="text-base">⚙️</span>
                      Account Settings
                    </Link>
                    <button
                      onClick={handleBilling}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-orange-500/10 transition-colors"
                    >
                      <span className="text-base">💳</span>
                      Billing & Subscription
                    </button>
                    <a
                      href="mailto:support@tradereach.com"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-orange-500/10 transition-colors"
                    >
                      <span className="text-base">🙋</span>
                      Help & Support
                    </a>
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-white/8 py-1.5">
                    <button
                      onClick={() => { setDropdownOpen(false); handleSignOut() }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <span className="text-base">🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/settings'
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Settings
            </Link>
            <button
              onClick={() => { setMenuOpen(false); handleSignOut() }}
              className="w-full text-left block px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
