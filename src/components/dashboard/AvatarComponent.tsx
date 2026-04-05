'use client'

import Image from 'next/image'

interface AvatarProps {
  photoUrl?: string | null
  contactName?: string | null
  businessName?: string | null
  size?: number
  showOnlineDot?: boolean
}

function getInitials(contactName?: string | null, businessName?: string | null): string {
  if (contactName) {
    const parts = contactName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0]?.toUpperCase() ?? 'T'
  }
  if (businessName) return businessName[0]?.toUpperCase() ?? 'T'
  return 'T'
}

export default function AvatarComponent({
  photoUrl,
  contactName,
  businessName,
  size = 40,
  showOnlineDot = true,
}: AvatarProps) {
  const initials = getInitials(contactName, businessName)
  const dotSize = Math.max(8, Math.round(size * 0.22))
  const fontSize = Math.max(12, Math.round(size * 0.38))

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {photoUrl ? (
        /* ── Photo state ── */
        <div
          className="w-full h-full rounded-full overflow-hidden"
          style={{
            border: '2px solid rgb(249, 115, 22)',
            boxShadow: '0 0 12px rgba(249, 115, 22, 0.35)',
          }}
        >
          <Image
            src={photoUrl}
            alt="Profile photo"
            width={size}
            height={size}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        /* ── Premium monogram state ── */
        <div
          className="w-full h-full rounded-full flex items-center justify-center select-none"
          style={{
            background: 'linear-gradient(135deg, rgb(17, 34, 64) 0%, rgb(10, 22, 40) 100%)',
            border: '2px solid rgba(249, 115, 22, 0.6)',
            boxShadow: '0 0 12px rgba(249, 115, 22, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: `${fontSize}px`,
              color: 'white',
              letterSpacing: '1px',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              lineHeight: 1,
            }}
          >
            {initials}
          </span>
        </div>
      )}

      {/* Online indicator dot */}
      {showOnlineDot && (
        <span
          className="absolute rounded-full avatar-dot-pulse"
          style={{
            width: dotSize,
            height: dotSize,
            background: 'rgb(34, 197, 94)',
            border: '2px solid rgb(10, 22, 40)',
            bottom: 0,
            right: 0,
            boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)',
          }}
        />
      )}
    </div>
  )
}
