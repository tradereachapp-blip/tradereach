'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/client'

const plans = [
  {
    id: 'ppl',
    name: 'Pay Per Lead',
    price: '$45/lead',
    description: 'Pay only for leads you claim',
    features: ['No monthly fee', 'Flexible pricing', 'Shared territories'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$497/mo',
    description: '15 leads/month included',
    features: ['15 credits', 'Up to 5 ZIP codes', 'Shared territories', '7-day trial'],
    recommended: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$897/mo',
    description: '30 leads/month + exclusive territories',
    features: ['30 credits', 'Unlimited ZIP codes', 'Exclusive territories', '7-day trial'],
  },
  {
    id: 'elite_plus',
    name: 'Elite Plus',
    price: '$1,497/mo',
    description: '60 leads/month + super-exclusive + manager',
    features: ['60 credits', 'Super-exclusive territories', 'Account manager', 'Monthly reviews'],
    premium: true,
  },
]

const niches = ['Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Windows & Doors', 'Painting']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [selectedNiche, setSelectedNiche] = useState('Roofing')
  const [zips, setZips] = useState<string[]>([])
  const [newZip, setNewZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [zipStatus, setZipStatus] = useState<Record<string, any>>({})

  const handleAddZip = async () => {
    if (!/^\d{5}$/.test(newZip)) {
      alert('Invalid ZIP code')
      return
    }

    if (zips.includes(newZip)) {
      alert('ZIP already added')
      return
    }

    // Check ZIP status
    const res = await fetch(`/api/contractors/zip?zip=${newZip}&niche=${selectedNiche}`)
    const data = await res.json()
    setZipStatus({ ...zipStatus, [newZip]: data.status })

    if (!data.status.canAdd) {
      alert(data.status.description)
      return
    }

    setZips([...zips, newZip])
    setNewZip('')
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contractors/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: selectedPlan,
          niche: selectedNiche,
          zip_codes: zips,
        }),
      })

      if (res.ok) {
        router.push('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full mx-2 ${
                  s <= step ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">Step {step} of 3</p>
        </div>

        {/* Step 1: Select Plan */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
            <p className="text-gray-600 mb-8">
              Pick the plan that matches your lead generation goals
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    selectedPlan === plan.id
                      ? 'border-orange-600 bg-orange-50 shadow-lg'
                      : 'border-gray-200 hover:border-orange-300'
                  } ${
                    plan.premium ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  {plan.premium && (
                    <span className="inline-block px-3 py-1 bg-yellow-300 text-yellow-900 rounded-full text-xs font-bold mb-3">
                      Premium
                    </span>
                  )}
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-orange-600 font-bold text-2xl mb-3">{plan.price}</p>
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {plan.features.map((f) => (
                      <li key={f}>â {f}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Select Niche & ZIPs */}
        {step === 2 && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Service Area</h1>

            <div className="mb-8">
              <label className="block font-bold text-gray-900 mb-4">Primary Service</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {niches.map((niche) => (
                  <button
                    key={niche}
                    onClick={() => setSelectedNiche(niche)}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      selectedNiche === niche
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block font-bold text-gray-900 mb-4">
                Service ZIP Codes (up to 5)
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter ZIP code"
                  value={newZip}
                  onChange={(e) => setNewZip(e.target.value)}
                  maxLength={5}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddZip()}
                />
                <button
                  onClick={handleAddZip}
                  className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {zips.map((zip) => (
                  <div
                    key={zip}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="font-medium text-gray-900">{zip}</span>
                    <button
                      onClick={() => setZips(zips.filter((z) => z !== zip))}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 rounded-lg font-bold hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={zips.length === 0}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Review Your Setup</h1>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Plan</span>
                <span className="font-bold text-gray-900">
                  {plans.find((p) => p.id === selectedPlan)?.name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Service</span>
                <span className="font-bold text-gray-900">{selectedNiche}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ZIP Codes</span>
                <span className="font-bold text-gray-900">{zips.join(', ')}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 rounded-lg font-bold hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
