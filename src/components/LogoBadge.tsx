'use client'

import Image from 'next/image'

interface LogoBadgeProps {
  className?: string
  footer?: boolean
  variant?: 'dark' | 'light'
  href?: string
}

export default function LogoBadge({
  className = 'h-12',
  footer = false,
  variant = 'dark',
  href = '/',
}: LogoBadgeProps) {
  return (
    <a
      href={href}
      className={`logo-badge-wrap inline-flex items-center select-none group ${footer ? 'opacity-70 hover:opacity-100' : ''}`}
      style={{ textDecoration: 'none' }}
    >
      <Image
        src="/logo.png"
        alt="TradeReach™"
        width={664}
        height={664}
        className={`w-auto object-contain transition-all duration-200 group-hover:scale-[1.05] ${className}`}
        style={{
          filter: footer
            ? 'drop-shadow(0 0 6px rgba(249,115,22,0.25))'
            : variant === 'dark'
              ? 'drop-shadow(0 0 8px rgba(249,115,22,0.55)) drop-shadow(0 0 20px rgba(249,115,22,0.2))'
              : 'drop-shadow(0 0 6px rgba(59,130,246,0.4))',
        }}
        priority
      />
    </a>
  )
}
