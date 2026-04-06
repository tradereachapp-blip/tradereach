'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Check if onboarding is complete
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: contractor } = await supabase
          .from('contractors')
          .select('onboarding_complete')
          .eq('user_id', user.id)
          .single()

        if (!contractor?.onboarding_complete) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
      <p className="text-blue-200 mb-6 text-sm">Sign in to your contractor account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-blue-100 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="dark-input"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-100 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="dark-input"
            placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-blue-300 hover:text-orange-400 transition-colors">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-blue-300 hover:text-orange-400 transition-colors">
          Create account
        </Link>
      </div>
    </div>
  )
}
