'use client'

// ─── Rex — Premium AI Mascot ──────────────────────────────────────────────────
// Full animation suite with spring physics, glow FX, speech bubbles.
// Built for TradeReach — dark navy + orange brand.

import { useEffect, useState, useRef } from 'react'
import type { RexAnimation } from '@/context/RexContext'

// ─── Premium CSS animations ───────────────────────────────────────────────────
export const REX_KEYFRAMES = `
  /* Idle — subtle breathe-float with slight rotation */
  @keyframes rexIdle {
    0%   { transform: translateY(0px) rotate(0deg) scale(1); }
    25%  { transform: translateY(-5px) rotate(.8deg) scale(1.008); }
    50%  { transform: translateY(-8px) rotate(0deg) scale(1.01); }
    75%  { transform: translateY(-4px) rotate(-.6deg) scale(1.005); }
    100% { transform: translateY(0px) rotate(0deg) scale(1); }
  }

  /* Wave — arm lift motion */
  @keyframes rexWave {
    0%   { transform: translateY(0) rotate(0deg); }
    15%  { transform: translateY(-12px) rotate(-6deg); }
    30%  { transform: translateY(-8px) rotate(4deg); }
    45%  { transform: translateY(-14px) rotate(-5deg); }
    60%  { transform: translateY(-6px) rotate(3deg); }
    75%  { transform: translateY(-10px) rotate(-3deg); }
    90%  { transform: translateY(-3px) rotate(1deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }

  /* Thinking — slow sway with slight lean */
  @keyframes rexThink {
    0%   { transform: translateY(0) rotate(0deg) scale(1); }
    20%  { transform: translateY(-4px) rotate(-4deg) scale(1.01); }
    40%  { transform: translateY(-2px) rotate(2deg) scale(1); }
    60%  { transform: translateY(-5px) rotate(-3deg) scale(1.01); }
    80%  { transform: translateY(-1px) rotate(1.5deg) scale(1); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
  }

  /* Excited — big pop bounce */
  @keyframes rexExcited {
    0%   { transform: translateY(0) scale(1) rotate(0deg); }
    12%  { transform: translateY(-28px) scale(1.08) rotate(-4deg); }
    24%  { transform: translateY(4px) scale(.94) rotate(3deg); }
    36%  { transform: translateY(-18px) scale(1.05) rotate(-2deg); }
    50%  { transform: translateY(2px) scale(.97) rotate(2deg); }
    62%  { transform: translateY(-10px) scale(1.03) rotate(-1deg); }
    76%  { transform: translateY(0) scale(.99) rotate(0deg); }
    100% { transform: translateY(0) scale(1) rotate(0deg); }
  }

  /* Celebrate — full party bounce */
  @keyframes rexCelebrate {
    0%   { transform: translateY(0) rotate(0deg) scale(1); }
    10%  { transform: translateY(-32px) rotate(-6deg) scale(1.1); }
    22%  { transform: translateY(6px) rotate(5deg) scale(.92); }
    34%  { transform: translateY(-26px) rotate(-4deg) scale(1.07); }
    46%  { transform: translateY(4px) rotate(4deg) scale(.95); }
    58%  { transform: translateY(-18px) rotate(-3deg) scale(1.05); }
    70%  { transform: translateY(2px) rotate(2deg) scale(.98); }
    82%  { transform: translateY(-10px) rotate(-1deg) scale(1.02); }
    92%  { transform: translateY(0) rotate(0deg) scale(1); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
  }

  /* Error — quick shake */
  @keyframes rexError {
    0%,100% { transform: translateX(0) rotate(0); }
    15%  { transform: translateX(-8px) rotate(-3deg); }
    30%  { transform: translateX(8px) rotate(3deg); }
    45%  { transform: translateX(-6px) rotate(-2deg); }
    60%  { transform: translateX(6px) rotate(2deg); }
    75%  { transform: translateX(-3px) rotate(-1deg); }
    90%  { transform: translateX(3px) rotate(1deg); }
  }

  /* Nod — dip forward */
  @keyframes rexNod {
    0%   { transform: translateY(0) rotate(0deg); }
    25%  { transform: translateY(-8px) rotate(-5deg); }
    50%  { transform: translateY(3px) rotate(2deg); }
    75%  { transform: translateY(-4px) rotate(-2deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }

  /* Bounce-in entrance */
  @keyframes rexBounceIn {
    0%   { transform: translateY(-100px) scale(.7) rotate(-8deg); opacity: 0; }
    55%  { transform: translateY(10px) scale(1.06) rotate(3deg); opacity: 1; }
    75%  { transform: translateY(-6px) scale(.97) rotate(-1deg); }
    90%  { transform: translateY(3px) scale(1.01) rotate(.5deg); }
    100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
  }

  /* Speech bubble pop */
  @keyframes rexSpeechPop {
    0%   { transform: scale(.4) translateY(8px); opacity: 0; }
    65%  { transform: scale(1.06) translateY(-2px); opacity: 1; }
    82%  { transform: scale(.97) translateY(1px); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }

  /* Glow pulse */
  @keyframes rexGlowPulse {
    0%,100% { filter: drop-shadow(0 0 8px rgba(249,115,22,.5)) drop-shadow(0 6px 16px rgba(0,0,0,.5)); }
    50%      { filter: drop-shadow(0 0 20px rgba(249,115,22,.85)) drop-shadow(0 8px 24px rgba(0,0,0,.6)); }
  }

  /* Tiny float for avatars */
  @keyframes rexTinyFloat {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-3px); }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-rex-anim] { animation: none !important; filter: none !important; }
  }
`

function getAnimCSS(anim: RexAnimation, bouncing: boolean): React.CSSProperties {
  if (bouncing) return {
    animation: 'rexBounceIn .85s cubic-bezier(0.34,1.4,0.64,1) forwards',
    willChange: 'transform, opacity',
  }
  const base: React.CSSProperties = { willChange: 'transform' }
  switch (anim) {
    case 'idle':      return { ...base, animation: 'rexIdle 3.6s ease-in-out infinite, rexGlowPulse 4s ease-in-out infinite' }
    case 'wave':      return { ...base, animation: 'rexWave 1.6s cubic-bezier(0.22,1,0.36,1)' }
    case 'thinking':  return { ...base, animation: 'rexThink 2s ease-in-out infinite' }
    case 'excited':   return { ...base, animation: 'rexExcited 1s cubic-bezier(0.22,1,0.36,1)' }
    case 'celebrate': return { ...base, animation: 'rexCelebrate 2.2s cubic-bezier(0.22,1,0.36,1)' }
    case 'error':     return { ...base, animation: 'rexError .7s ease-in-out' }
    case 'nod':       return { ...base, animation: 'rexNod .8s cubic-bezier(0.22,1,0.36,1)' }
    case 'wrenchspin':return { ...base, animation: 'rexExcited .9s cubic-bezier(0.22,1,0.36,1)' }
    case 'point':     return { ...base, animation: 'rexIdle 3.6s ease-in-out infinite' }
    default:          return { ...base, animation: 'rexIdle 3.6s ease-in-out infinite' }
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface RexProps {
  size?: number
  animation?: RexAnimation
  speechBubble?: string | null
  bubblePosition?: 'right' | 'left' | 'top' | 'bottom'
  className?: string
  bounceIn?: boolean
  glowColor?: string
}

// ─── Main Rex ─────────────────────────────────────────────────────────────────
export default function Rex({
  size = 96,
  animation = 'idle',
  speechBubble,
  bubblePosition = 'right',
  className = '',
  bounceIn = false,
  glowColor = '#f97316',
}: RexProps) {
  const [mounted, setMounted] = useState(false)
  const [isBouncing, setIsBouncing] = useState(bounceIn)

  useEffect(() => {
    setMounted(true)
    if (bounceIn) {
      const t = setTimeout(() => setIsBouncing(false), 950)
      return () => clearTimeout(t)
    }
  }, [bounceIn])

  if (!mounted) return null

  const animStyle = getAnimCSS(animation, isBouncing)

  const rexImg = (
    <div
      data-rex-anim
      style={{ ...animStyle, width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <img
        src="/images/rex-avatar.png"
        alt="Rex — TradeReach AI"
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        draggable={false}
      />
    </div>
  )

  return (
    <>
      <style>{REX_KEYFRAMES}</style>
      <div className={`inline-flex items-center ${bubblePosition === 'top' || bubblePosition === 'bottom' ? 'flex-col' : 'flex-row'} gap-3 ${className}`}>
        {bubblePosition === 'top' && speechBubble && <SpeechBubble text={speechBubble} position="top" />}
        {bubblePosition === 'left' && speechBubble && <SpeechBubble text={speechBubble} position="left" />}
        {rexImg}
        {bubblePosition === 'right' && speechBubble && <SpeechBubble text={speechBubble} position="right" />}
        {bubblePosition === 'bottom' && speechBubble && <SpeechBubble text={speechBubble} position="bottom" />}
      </div>
    </>
  )
}

// ─── Speech Bubble ────────────────────────────────────────────────────────────
export function SpeechBubble({ text, position = 'right', className = '' }: {
  text: string
  position?: 'right' | 'left' | 'top' | 'bottom'
  className?: string
}) {
  // Tail position class
  const tailStyle: React.CSSProperties = {
    position: 'absolute',
    width: 10, height: 10,
    background: '#1a2744',
    border: '1px solid rgba(249,115,22,.45)',
    ...(position === 'right'  ? { left: -5, top: '50%', marginTop: -5, transform: 'rotate(45deg)', borderRight: 'none', borderTop: 'none' } : {}),
    ...(position === 'left'   ? { right: -5, top: '50%', marginTop: -5, transform: 'rotate(45deg)', borderLeft: 'none', borderBottom: 'none' } : {}),
    ...(position === 'top'    ? { bottom: -5, left: '50%', marginLeft: -5, transform: 'rotate(45deg)', borderTop: 'none', borderLeft: 'none' } : {}),
    ...(position === 'bottom' ? { top: -5, left: '50%', marginLeft: -5, transform: 'rotate(45deg)', borderBottom: 'none', borderRight: 'none' } : {}),
  }

  return (
    <>
      <style>{REX_KEYFRAMES}</style>
      <div
        className={`relative max-w-[220px] px-4 py-3 rounded-2xl text-sm text-white leading-snug ${className}`}
        style={{
          background: '#1a2744',
          border: '1px solid rgba(249,115,22,.45)',
          boxShadow: '0 4px 24px rgba(0,0,0,.4), 0 0 0 1px rgba(249,115,22,.1)',
          animation: 'rexSpeechPop .35s cubic-bezier(0.34,1.4,0.64,1) both',
        }}
      >
        <div style={tailStyle} />
        {text}
      </div>
    </>
  )
}

// ─── Floating Chat Bubble (shows Rex face) ────────────────────────────────────
export function RexBubbleIcon({
  size = 56,
  animation = 'idle' as RexAnimation,
  unread = 0,
  onClick,
  isOpen = false,
}: {
  size?: number
  animation?: RexAnimation
  unread?: number
  onClick?: () => void
  isOpen?: boolean
}) {
  const animStyle = getAnimCSS(isOpen ? 'idle' : animation, false)

  return (
    <>
      <style>{REX_KEYFRAMES}</style>
      <button
        onClick={onClick}
        aria-label="Open Rex support chat"
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent', position: 'relative',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          data-rex-anim
          style={{
            ...animStyle,
            width: size, height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #f97316',
            boxShadow: unread > 0
              ? '0 0 0 4px rgba(249,115,22,.3), 0 8px 32px rgba(249,115,22,.4)'
              : '0 8px 32px rgba(249,115,22,.25), 0 2px 8px rgba(0,0,0,.5)',
            background: '#1a2744',
          }}
        >
          <img
            src="/images/rex-avatar.png"
            alt="Rex"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
          />
        </div>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 20, height: 20,
            background: '#ef4444', borderRadius: 10,
            border: '2px solid #030712',
            color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
          }}>
            {unread}
          </span>
        )}
      </button>
    </>
  )
}

// ─── Rex Avatar (for chat message rows) ──────────────────────────────────────
export function RexAvatar({ size = 28 }: { size?: number }) {
  return (
    <>
      <style>{REX_KEYFRAMES}</style>
      <div
        data-rex-anim
        style={{
          width: size, height: size, flexShrink: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #f97316',
          boxShadow: '0 0 12px rgba(249,115,22,.3)',
          animation: 'rexTinyFloat 3s ease-in-out infinite',
          background: '#1a2744',
        }}
      >
        <img
          src="/images/rex-avatar.png"
          alt="Rex"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
        />
      </div>
    </>
  )
}
