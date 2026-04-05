'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function AcceptInviteInner() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'needs-login'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Invalid invitation link.'); return }

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setStatus('needs-login')
        return
      }
      setStatus('accepting')
      const res = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? 'Something went wrong.')
      } else {
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    })
  }, [token, router])

  if (status === 'loading' || status === 'accepting') {
    return (
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">{status === 'accepting' ? 'Accepting invitation…' : 'Checking…'}</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30">
          <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-white mb-2">You're in!</h2>
        <p className="text-gray-400 text-sm">Redirecting to your dashboard…</p>
      </div>
    )
  }

  if (status === 'needs-login') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-orange-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
          <span className="text-2xl">👥</span>
        </div>
        <h2 className="text-xl font-black text-white mb-2">You've been invited</h2>
        <p className="text-gray-400 text-sm mb-6">Sign in or create an account to accept your invitation.</p>
        <div className="flex gap-3 justify-center">
          <Link
            href={`/login?redirect=/accept-invite%3Ftoken%3D${token}`}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm hover:scale-[1.02]"
          >
            Sign In
          </Link>
          <Link
            href={`/signup?redirect=/accept-invite%3Ftoken%3D${token}`}
            className="bg-gray-800 border border-white/10 text-gray-300 hover:text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm hover:scale-[1.02]"
          >
            Create Account
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-black text-white mb-2">Invitation Error</h2>
      <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
      <Link href="/login" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
        Back to Login →
      </Link>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="mb-8 text-center">
          <span className="text-2xl font-black text-white tracking-tight">Trade<span className="text-orange-500">Reach</span></span>
        </div>
        <Suspense fallback={<div className="text-center text-gray-500 text-sm">Loading…</div>}>
          <AcceptInviteInner />
        </Suspense>
      </div>
    </div>
  )
}
