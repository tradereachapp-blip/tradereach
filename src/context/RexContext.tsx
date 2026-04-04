'use client'

// ─── Rex Context & useRex Hook ────────────────────────────────────────────────
// Global state so any component can trigger Rex animations without prop drilling.

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

export type RexAnimation =
  | 'idle'
  | 'wave'
  | 'thinking'
  | 'excited'
  | 'celebrate'
  | 'point'
  | 'error'
  | 'nod'
  | 'thumbsup'
  | 'wrenchspin'

export interface RexState {
  animation: RexAnimation
  speechBubble: string | null
  isVisible: boolean
  pointDirection: 'left' | 'right' | 'down' | null
}

interface RexContextValue {
  rexState: RexState
  triggerIdle: () => void
  triggerExcited: () => void
  triggerThinking: () => void
  triggerWave: () => void
  triggerError: () => void
  triggerCelebrate: () => void
  triggerWrenchSpin: () => void
  triggerNod: () => void
  triggerPoint: (direction?: 'left' | 'right' | 'down') => void
  showSpeechBubble: (message: string, durationMs?: number) => void
  hideSpeechBubble: () => void
  setRexVisible: (v: boolean) => void
}

const RexContext = createContext<RexContextValue | null>(null)

export function RexProvider({ children }: { children: ReactNode }) {
  const [rexState, setRexState] = useState<RexState>({
    animation: 'idle',
    speechBubble: null,
    isVisible: false,
    pointDirection: null,
  })

  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setAnimation = useCallback((anim: RexAnimation, returnToIdle = true, duration = 2000) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    setRexState(s => ({ ...s, animation: anim }))
    if (returnToIdle) {
      animTimerRef.current = setTimeout(() => {
        setRexState(s => ({ ...s, animation: 'idle', pointDirection: null }))
      }, duration)
    }
  }, [])

  const triggerIdle = useCallback(() => setAnimation('idle', false), [setAnimation])
  const triggerExcited = useCallback(() => setAnimation('excited', true, 1200), [setAnimation])
  const triggerWave = useCallback(() => setAnimation('wave', true, 1500), [setAnimation])
  const triggerThinking = useCallback(() => setAnimation('thinking', false), [setAnimation])
  const triggerError = useCallback(() => setAnimation('error', true, 1000), [setAnimation])
  const triggerNod = useCallback(() => setAnimation('nod', true, 800), [setAnimation])
  const triggerWrenchSpin = useCallback(() => setAnimation('wrenchspin', true, 800), [setAnimation])

  const triggerCelebrate = useCallback(() => {
    setAnimation('celebrate', true, 3000)
  }, [setAnimation])

  const triggerPoint = useCallback((direction: 'left' | 'right' | 'down' = 'right') => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    setRexState(s => ({ ...s, animation: 'point', pointDirection: direction }))
  }, [])

  const showSpeechBubble = useCallback((message: string, durationMs = 0) => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    setRexState(s => ({ ...s, speechBubble: message }))
    if (durationMs > 0) {
      bubbleTimerRef.current = setTimeout(() => {
        setRexState(s => ({ ...s, speechBubble: null }))
      }, durationMs)
    }
  }, [])

  const hideSpeechBubble = useCallback(() => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    setRexState(s => ({ ...s, speechBubble: null }))
  }, [])

  const setRexVisible = useCallback((v: boolean) => {
    setRexState(s => ({ ...s, isVisible: v }))
  }, [])

  return (
    <RexContext.Provider value={{
      rexState,
      triggerIdle, triggerExcited, triggerThinking, triggerWave,
      triggerError, triggerCelebrate, triggerWrenchSpin, triggerNod,
      triggerPoint, showSpeechBubble, hideSpeechBubble, setRexVisible,
    }}>
      {children}
    </RexContext.Provider>
  )
}

export function useRex(): RexContextValue {
  const ctx = useContext(RexContext)
  if (!ctx) throw new Error('useRex must be used within RexProvider')
  return ctx
}
