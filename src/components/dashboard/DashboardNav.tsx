'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoBadge from '@/components/LogoBadge'
import AvatarComponent from '@/components/dashboard/AvatarComponent'
import type { Contractor } from '@/types'

interface Props {
  contractor: Contractor | null
  userEmail: string
}

// ── Inline SVG icons (no library dependency) ────────────────────────────
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
function IconTeam() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function IconCard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}
function IconSignOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function PlanBadge({ planType }: { planType: string }) {
  if (planType === 'elite') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md"
      style={{ color: 'rgb(251,191,36)', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', letterSpacing: '0.5px' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ELITE
    </span>
  )
  if (planType === 'pro') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md"
      style={{ color: 'rgb(249,115,22)', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', letterSpacing: '0.5px' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      PRO
    </span>
  )
  if (planType === 'pay_per_lead') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md"
      style={{ color: 'rgb(148,163,184)', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', letterSpacing: '0.5px' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
      PPL
    </span>
  )
  return null
}

export default function DashboardNav({ contractor, userEmail }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
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
    if (data.url) window.open(data.url, '_blank')
    else alert(data.error || 'Could not open billing portal.')
  }

  function getDisplayName() {
    if (contractor?.contact_name) return contractor.contact_name.split(' ')[0]
    return userEmail.split('@')[0]
  }

  const navLinks = [
    { href: '/dashboard', label: 'Available Leads' },
    { href: '/dashboard/claimed', label: 'Claimed Leads' },
    { href: '/dashboard/notifications', label: 'Notifications' },
    { href: '/dashboard/team', label: 'Team' },
  ]

  const avatarProps = {
    photoUrl: (contractor as any)?.profile_photo_url ?? null,
    contactName: contractor?.contact_name,
    businessName: contractor?.business_name,
  }

  return (
    <nav style={{ background: 'rgb(17, 34, 64)', borderBottom: '1px solid rgba(255,255,255,0.07)' }} className="shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <LogoBadge className="h-9" href="/dashboard" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    color: isActive ? 'white' : 'rgb(148, 163, 184)',
                    background: isActive ? 'rgba(249, 115, 22, 0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'white' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgb(148, 163, 184)' }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute left-0 right-0 rounded-full"
                      style={{ bottom: '-1px', height: '2px', background: 'rgb(249, 115, 22)' }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'rgb(148, 163, 184)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Avatar dropdown trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-xl p-1.5 transition-all duration-150 hover:bg-white/5"
              >
                <AvatarComponent {...avatarProps} size={36} showOnlineDot={true} />
                <span className="hidden sm:block text-sm font-medium text-white">{getDisplayName()}</span>
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'rgb(148, 163, 184)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Premium dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 z-50 dropdown-in"
                  style={{
                    top: 'calc(100% + 12px)',
                    minWidth: '240px',
                    background: 'rgb(17, 34, 64)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.05)',
                    padding: '8px',
                  }}
                >
                  {/* Contractor info card */}
                  <div
                    className="flex items-center gap-3 mb-1 rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <AvatarComponent {...avatarProps} size={32} showOnlineDot={false} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {contractor?.contact_name || contractor?.business_name || 'Contractor'}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'rgb(148, 163, 184)', fontFamily: "'DM Sans', sans-serif" }}>
                        {userEmail}
                      </p>
                    </div>
                    {contractor?.plan_type && contractor.plan_type !== 'none' && (
                      <PlanBadge planType={contractor.plan_type} />
                    )}
                  </div>

                  {/* Founding member badge */}
                  {(contractor as any)?.founding_member && (
                    <div
                      className="flex items-center gap-2 mx-1 mb-1 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="rgb(251,191,36)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span className="text-xs font-bold" style={{ color: 'rgb(251,191,36)', letterSpacing: '0.5px' }}>FOUNDING MEMBER</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="my-1" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                  {/* Menu items */}
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                    style={{ color: 'rgb(148,163,184)', fontFamily: "'DM Sans', sans-serif" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgb(148,163,184)' }}
                  >
                    <IconSettings /> Account Settings
                  </Link>
                  <Link
                    href="/dashboard/team"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                    style={{ color: 'rgb(148,163,184)', fontFamily: "'DM Sans', sans-serif" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgb(148,163,184)' }}
                  >
                    <IconTeam /> Team
                  </Link>
                  <button
                    onClick={handleBilling}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                    style={{ color: 'rgb(148,163,184)', fontFamily: "'DM Sans', sans-serif" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgb(148,163,184)' }}
                  >
                    <IconCard /> Billing
                  </button>

                  {/* Divider */}
                  <div className="my-1" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                  {/* Sign out */}
                  <button
                    onClick={() => { setDropdownOpen(false); handleSignOut() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                    style={{ color: 'rgb(239,68,68)', fontFamily: "'DM Sans', sans-serif" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <IconSignOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden pb-3 pt-1 space-y-1 border-t mt-1" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: isActive ? 'rgb(249,115,22)' : 'rgb(148,163,184)', background: isActive ? 'rgba(249,115,22,0.1)' : 'transparent' }}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: pathname === '/settings' ? 'rgb(249,115,22)' : 'rgb(148,163,184)', background: pathname === '/settings' ? 'rgba(249,115,22,0.1)' : 'transparent' }}
            >
              Settings
            </Link>
            <button
              onClick={() => { setMenuOpen(false); handleSignOut() }}
              className="w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'rgb(239,68,68)' }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
