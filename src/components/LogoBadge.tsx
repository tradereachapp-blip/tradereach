'use client'

interface LogoBadgeProps {
  className?: string
  footer?: boolean
}

export default function LogoBadge({ className = 'h-12', footer = false }: LogoBadgeProps) {
  return (
    <a
      href="/"
      className={`logo-badge-wrap inline-flex items-center select-none ${footer ? 'opacity-70 hover:opacity-100 transition-opacity duration-200' : ''}`}
    >
      <img
        src="/images/logo-badge.png"
        alt="TradeReach — Home Service Leads"
        className={`logo-badge-img ${className} w-auto object-contain`}
        onError={(e) => {
          const t = e.currentTarget as HTMLImageElement
          t.style.display = 'none'
          const sib = t.nextElementSibling as HTMLElement | null
          if (sib) sib.style.display = 'flex'
        }}
      />
      {/* Fallback text wordmark */}
      <span className="hidden items-center text-xl font-black tracking-tight">
        <span className="text-white">Trade</span><span className="text-orange-500">Reach</span>
      </span>
    </a>
  )
}
