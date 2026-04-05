'use client'

import { useState } from 'react'

interface PlanStatusBannerProps {
  planType: string
  creditsRemaining: number
  creditsMonthly: number
  foundingMember: boolean
  pausedUntil?: string
  subscriptionStatus: string
}

export default function PlanStatusBanner({
  planType,
  creditsRemaining,
  creditsMonthly,
  foundingMember,
  pausedUntil,
  subscriptionStatus,
}: PlanStatusBannerProps) {
  const creditPercentage = (creditsRemaining / creditsMonthly) * 100
  const isPaused = subscriptionStatus === 'paused' && pausedUntil

  if (isPaused) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-blue-600 text-lg">⏸</div>
          <div className="flex-1 ml-3">
            <h3 className="font-bold text-blue-900">Your subscription is paused</h3>
            <p className="text-blue-800 text-sm mt-1">
              Resumes on {new Date(pausedUntil).toLocaleDateString()}. Your territory is protected during this time.
            </p>
            <button className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">
              Resume Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <h3 className="font-bold text-gray-900">
              {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
              {foundingMember && <span className="ml-2 text-yellow-600 font-black">FOUNDING</span>}
            </h3>
            <p className="text-sm text-gray-600">You have {creditsRemaining} credits remaining this month</p>
          </div>
        </div>
      </div>

      {/* Credit Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full transition-all ${
            creditPercentage > 80 ? 'bg-red-500' : creditPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(creditPercentage, 100)}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-gray-600">
        <span>{creditsRemaining} used</span>
        <span>{creditsRemaining} remaining of {creditsMonthly}</span>
      </div>
    </div>
  )
}
