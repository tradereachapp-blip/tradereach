'use client'

interface LogoBadgeProps {
  className?: string
  footer?: boolean
  /** 'dark' = logo on dark backgrounds (white wordmark fallback)
   *  'light' = logo on light backgrounds (dark wordmark fallback) */
  variant?: 'dark' | 'light'
  /** Override link destination — defaults to "/" */
  href?: string
}

export default function LogoBadge({
  className = 'h-12',
  footer = false,
  variant = 'dark',
  href = '/',
}: LogoBadgeProps) {
  const isLight = variant === 'light'

  return (
    <a
      href={href}
      className={`logo-badge-wrap inline-flex items-center select-none group ${
        footer ? 'opacity-60 hover:opacity-100 transition-opacity duration-200' : ''
      }`}
    >
      <img
        src="/images/logo-badge.png"
        alt="TradeReach — Home Service Leads"
        className={`logo-badge-img ${className} w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]`}
        onError={(e) => {
          const t = e.currentTarget as HTMLImageElement
          t.style.display = 'none'
          const sib = t.nextElementSibling as HTMLElement | null
          if (sib) sib.style.display = 'flex'
        }}
      />
      {/* Fallback text wordmark — shown only if image fails to load */}
      <span className="hidden items-center font-black tracking-tight leading-none" style={{ fontSize: '1.25rem' }}>
        <span className={isLight ? 'text-gray-900' : 'text-white'}>Trade</span>
        <span className="text-orange-500">Reach</span>
      </span>
    </a>
  )
}
