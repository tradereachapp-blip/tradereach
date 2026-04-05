'use client'

import { useState } from 'react'
import { PLAN_CONFIG } from '@/lib/config'

const plans = [
  { id: 'ppl', ...PLAN_CONFIG.ppl },
  { id: 'pro', ...PLAN_CONFIG.pro },
  { id: 'elite', ...PLAN_CONFIG.elite },
  { id: 'elite_plus', ...PLAN_CONFIG.elite_plus },
]

const comparisonRows = [
  { feature: 'Credits/Month', ppl: 'N/A', pro: '15', elite: '30', elite_plus: '60' },
  { feature: 'Overage Price', ppl: '$45/lead', pro: '$38', elite: '$28', elite_plus: '$22' },
  { feature: 'ZIP Codes', ppl: '5', pro: '5', elite: 'Unlimited', elite_plus: 'Unlimited' },
  { feature: 'Territory Type', ppl: 'Shared', pro: 'Shared', elite: 'Exclusive', elite_plus: 'Super-Exclusive' },
  { feature: 'Lead Notification', ppl: 'Unlimited', pro: '5 min', elite: '15 min', elite_plus: '30 min' },
  { feature: 'Account Manager', ppl: 'No', pro: 'No', elite: 'No', elite_plus: 'Yes' },
  { feature: 'Monthly Review', ppl: 'No', pro: 'No', elite: 'No', elite_plus: 'Yes' },
  { feature: 'Credit Rollover', ppl: 'N/A', pro: '30 max', elite: '60 max', elite_plus: '120 max' },
  { feature: 'Trial Period', ppl: 'N/A', pro: '7 days', elite: '7 days', elite_plus: 'None' },
]

const competitorComparison = [
  { company: 'HomeAdvisor', ppl: true, pro: true, elite: true, elite_plus: true },
  { company: 'Angi', ppl: true, pro: false, elite: false, elite_plus: false },
]

export default function PricingSection() {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')

  const getPrice = (plan: any) => {
    if (interval === 'monthly') return `$${plan.price}`
    return `$${plan.annualPrice}`
  }

  return (
    <div className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your lead generation goals
          </p>

          {/* Toggle */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                interval === 'monthly' ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                interval === 'annual' ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annual (Save 10%)
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 border-2 transition-all ${
                plan.id === 'elite_plus'
                  ? 'border-yellow-400 bg-gradient-to-b from-yellow-50 to-white ring-2 ring-yellow-300 scale-105'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              {plan.id === 'elite_plus' && (
                <div className="mb-4 inline-block px-3 py-1 bg-yellow-300 text-yellow-900 rounded-full text-xs font-bold uppercase">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.label}</h3>
              <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

              <div className="mb-8">
                <span className="text-4xl font-black text-gray-900">{getPrice(plan)}</span>
                <span className="text-gray-600">/month</span>
              </div>

              <button className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors mb-6">
                Get Started
              </button>

              <ul className="space-y-3 text-sm text-gray-700">
                {plan.id === 'ppl' && <li>✓ Pay only for leads you claim</li>}
                {plan.id === 'pro' && (
                  <>
                    <li>✓ 15 credits/month</li>
                    <li>✓ Up to 5 ZIP codes</li>
                    <li>✓ 7-day free trial</li>
                  </>
                )}
                {plan.id === 'elite' && (
                  <>
                    <li>✓ 30 credits/month</li>
                    <li>✓ Exclusive territories</li>
                    <li>✓ Unlimited ZIP codes</li>
                    <li>✓ 7-day free trial</li>
                  </>
                )}
                {plan.id === 'elite_plus' && (
                  <>
                    <li>✓ 60 credits/month</li>
                    <li>✓ Super-exclusive territories</li>
                    <li>✓ Personal account manager</li>
                    <li>✓ Monthly performance reviews</li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b-2 border-gray-300 px-4 py-4 text-left font-bold text-gray-900">Feature</th>
                <th className="border-b-2 border-gray-300 px-4 py-4 text-center font-bold text-gray-900">PPL</th>
                <th className="border-b-2 border-gray-300 px-4 py-4 text-center font-bold text-gray-900">Pro</th>
                <th className="border-b-2 border-gray-300 px-4 py-4 text-center font-bold text-gray-900">Elite</th>
                <th className="border-b-2 border-gray-300 px-4 py-4 text-center font-bold text-gray-900 bg-yellow-50">Elite Plus</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border-b border-gray-200 px-4 py-4 font-medium text-gray-900">{row.feature}</td>
                  <td className="border-b border-gray-200 px-4 py-4 text-center text-gray-700">{row.ppl}</td>
                  <td className="border-b border-gray-200 px-4 py-4 text-center text-gray-700">{row.pro}</td>
                  <td className="border-b border-gray-200 px-4 py-4 text-center text-gray-700">{row.elite}</td>
                  <td className="border-b border-gray-200 px-4 py-4 text-center text-gray-700 bg-yellow-50 font-medium">{row.elite_plus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
