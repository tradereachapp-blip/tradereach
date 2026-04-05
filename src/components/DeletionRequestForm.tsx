'use client'

import { useState } from 'react'

export default function DeletionRequestForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/deletion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    })
    if (res.ok) { setDone(true) }
    else { const d = await res.json(); setError(d.error ?? 'Submission failed') }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 text-green-400 text-sm">
        <span className="text-lg">✅</span>
        <p>Request received. We'll process it within 45 days and confirm at <strong>{email}</strong>.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Smith"
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors" />
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={submitting}
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm hover:scale-[1.02] disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Request Deletion'}
      </button>
    </form>
  )
}
