// ============================================================
// TradeReach — Central Config
// Add new niches, plan tiers, and ZIP limits here only
// ============================================================

import type { Niche, PlanType } from '@/types'
import { PRICING } from '@/lib/pricing'

export const NICHES: Niche[] = ['Roofing', 'HVAC', 'Plumbing']

export const NICHE_DESCRIPTIONS: Record<Niche, string> = {
  Roofing: 'Roof repairs, replacements, inspections, gutters, and storm damage.',
  HVAC: 'Heating, cooling, ventilation, AC installation, and furnace repair.',
  Plumbing: 'Pipe repair, water heaters, drain cleaning, and fixture installation.',
}

export const NICHE_ICONS: Record<Niche, string> = {
  Roofing: '🏠',
  HVAC: '❄️',
  Plumbing: '🔧',
}

export const PLAN_CONFIG: Record<PlanType, {
  label: string
  price: number | null
  monthlyLeads: number | 'unlimited'
  maxZipCodes: number | 'unlimited'
  hasExclusiveTerritory: boolean
  hasPriorityDelivery: boolean
  hasFreeTrial: boolean
  trialDays: number
  overagePrice: number | null
  priceId: string | null
}> = {
  none: {
    label: 'No Plan',
    price: null,
    monthlyLeads: 0,
    maxZipCodes: 0,
    hasExclusiveTerritory: false,
    hasPriorityDelivery: false,
    hasFreeTrial: false,
    trialDays: 0,
    overagePrice: null,
    priceId: null,
  },
  pay_per_lead: {
    label: 'Pay Per Lead',
    price: PRICING.PPL_PRICE,
    monthlyLeads: 'unlimited',
    maxZipCodes: 5,
    hasExclusiveTerritory: false,
    hasPriorityDelivery: false,
    hasFreeTrial: false,
    trialDays: 0,
    overagePrice: null,
    priceId: null,
  },
  pro: {
    label: 'Pro',
    price: PRICING.PRO_MONTHLY,
    monthlyLeads: PRICING.PRO_LEAD_CAP,
    maxZipCodes: 10,
    hasExclusiveTerritory: false,
    hasPriorityDelivery: false,
    hasFreeTrial: true,
    trialDays: 7,
    overagePrice: PRICING.PRO_OVERAGE,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
  },
  elite: {
    label: 'Elite',
    price: PRICING.ELITE_MONTHLY,
    monthlyLeads: 'unlimited',
    maxZipCodes: 'unlimited' as any,
    hasExclusiveTerritory: true,
    hasPriorityDelivery: true,
    hasFreeTrial: true,
    trialDays: 7,
    overagePrice: null,
    priceId: process.env.STRIPE_ELITE_PRICE_ID ?? null,
  },
}

export const ELITE_PRIORITY_WINDOW_MINUTES = 15
export const LEAD_EXPIRY_HOURS = 72
export const DUPLICATE_LEAD_WINDOW_HOURS = 24
export const PRO_MONTHLY_LEAD_CAP = PRICING.PRO_LEAD_CAP
export const PAY_PER_LEAD_PRICE_CENTS = PRICING.PPL_PRICE * 100   // $45.00 → 4500
export const PRO_OVERAGE_PRICE_CENTS  = PRICING.PRO_OVERAGE * 100 // $30.00 → 3000

export const CALLBACK_TIMES = ['Morning', 'Afternoon', 'Evening', 'Anytime'] as const
