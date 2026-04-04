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
      className={`logo-badge-wrap inline-flex items-center select-none group transition-opacity duration-200 ${
        footer ? 'opacity-60 hover:opacity-100' : ''
      }`}
    >
      {/* CSS text wordmark — crisp at all sizes */}
      <span
        className="font-black tracking-tight leading-none transition-transform duration-200 group-hover:scale-[1.03]"
        style={{ fontSize: '1.25rem' }}
      >
        <span className={isLight ? 'text-gray-900' : 'text-white'}>Trade</span>
        <span style={{ color: '#f97316' }}>Reach</span>
      </span>
    </a>
  )
}
