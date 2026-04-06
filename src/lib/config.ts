// ============================================================
// TradeReach™ — Central Config v2.0
// ============================================================

import type { Niche, PlanType } from '@/types'
import { PRICING } from '@/lib/pricing'

export const NICHES: Niche[] = ['Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Windows & Doors', 'Painting']

export const NICHE_DESCRIPTIONS: Record<Niche, string> = {
  Roofing: 'Roof repairs, replacements, inspections, gutters, and storm damage.',
  HVAC: 'Heating, cooling, ventilation, AC installation, and furnace repair.',
  Plumbing: 'Pipe repair, water heaters, drain cleaning, and fixture installation.',
  Electrical: 'Wiring, panels, outlets, lighting installation, and electrical repairs.',
  'Windows & Doors': 'Window replacement, door installation, and frame repairs.',
  Painting: 'Interior and exterior painting, staining, and surface prep.',
}

export const NICHE_ICONS: Record<Niche, string> = {
  Roofing: '🏠',
  HVAC: '❄️',
  Plumbing: '🔧',
  Electrical: '⚡',
  'Windows & Doors': '🪟',
  Painting: '🎨',
}

export const PLAN_CONFIG: Record<PlanType, {
  label: string
  price: number | null
  foundingPrice: number | null
  annualPrice: number | null
  foundingAnnualPrice: number | null
  monthlyCredits: number
  creditRolloverMax: number
  maxZipCodes: number | 'unlimited'
  hasExclusiveTerritory: boolean
  hasPriorityDelivery: boolean
  hasSuperExclusiveTerritory: boolean
  hasFreeTrial: boolean
  trialDays: number
  overagePrice: number | null
  priorityWindowMinutes: number
  priorityLevel: number
  teamMembersFree: number
  teamMemberPrice: number | null
  hasAccountManager: boolean
  hasMonthlyReview: boolean
  priceId: string | null
  annualPriceId: string | null
  foundingPriceId: string | null
  foundingAnnualPriceId: string | null
}> = {
  none: {
    label: 'No Plan',
    price: null,
    foundingPrice: null,
    annualPrice: null,
    foundingAnnualPrice: null,
    monthlyCredits: 0,
    creditRolloverMax: 0,
    maxZipCodes: 0,
    hasExclusiveTerritory: false,
    hasPriorityDelivery: false,
    hasSuperExclusiveTerritory: false,
    hasFreeTrial: false,
    trialDays: 0,
    overagePrice: null,
    priorityWindowMinutes: 0,
    priorityLevel: 5,
    teamMembersFree: 0,
    teamMemberPrice: null,
    hasAccountManager: false,
    hasMonthlyReview: false,
    priceId: null,
    annualPriceId: null,
    foundingPriceId: null,
    foundingAnnualPriceId: null,
  },
  pay_per_lead: {
    label: 'Pay Per Lead',
    price: PRICING.PPL_PRICE,
    foundingPrice: null,
    annualPrice: null,
    foundingAnnualPrice: null,
    monthlyCredits: 0,
    creditRolloverMax: 0,
    maxZipCodes: 5,
    hasExclusiveTerritory: false,
    hasPriorityDelivery: false,
    hasSuperExclusiveTerritory: false,
    hasFreeTrial: false,
    trialDays: 0,
    overagePrice: null,
    priorityWindowMinutes: 0,
    priorityLevel: 4,
    teamMembersFree: 0,
    teamMemberPrice: null,
    hasAccountManager: false,
    hasMonthlyReview: false,
    priceId: null,
    annualPriceId: null,
    foundingPriceId: null,
    foundingAnnualPriceId: null,
  },
  pro: {
    label: 'Pro',
    price: PRICING.PRO_MONTHLY,
    foundingPrice: PRICING.PRO_MONTHLY_FOUNDING,
    annualPrice: PRICING.PRO_ANNUAL,
    foundingAnnualPrice: PRICING.PRO_ANNUAL_FOUNDING,
    monthlyCredits: PRICING.PRO_LEAD_CAP,
    creditRolloverMax: PRICING.PRO_ROLLOVER_MAX,
    maxZipCodes: 10,
    hasExclusiveTerritory: false,
    hasPriorityDelivery: false,
    hasSuperExclusiveTerritory: false,
    hasFreeTrial: true,
    trialDays: 7,
    overagePrice: PRICING.PRO_OVERAGE,
    priorityWindowMinutes: 0,
    priorityLevel: 3,
    teamMembersFree: 0,
    teamMemberPrice: null,
    hasAccountManager: false,
    hasMonthlyReview: false,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? null,
    foundingPriceId: process.env.STRIPE_PRO_FOUNDING_PRICE_ID ?? null,
    foundingAnnualPriceId: process.env.STRIPE_PRO_ANNUAL_FOUNDING_PRICE_ID ?? null,
  },
  elite: {
    label: 'Elite',
    price: PRICING.ELITE_MONTHLY,
    foundingPrice: PRICING.ELITE_MONTHLY_FOUNDING,
    annualPrice: PRICING.ELITE_ANNUAL,
    foundingAnnualPrice: PRICING.ELITE_ANNUAL_FOUNDING,
    monthlyCredits: PRICING.ELITE_LEAD_CAP,
    creditRolloverMax: PRICING.ELITE_ROLLOVER_MAX,
    maxZipCodes: 'unlimited',
    hasExclusiveTerritory: true,
    hasPriorityDelivery: true,
    hasSuperExclusiveTerritory: false,
    hasFreeTrial: true,
    trialDays: 7,
    overagePrice: PRICING.ELITE_OVERAGE,
    priorityWindowMinutes: PRICING.ELITE_PRIORITY_WINDOW_MINUTES,
    priorityLevel: 2,
    teamMembersFree: PRICING.ELITE_TEAM_MEMBERS_FREE,
    teamMemberPrice: PRICING.ELITE_TEAM_MEMBER_PRICE,
    hasAccountManager: false,
    hasMonthlyReview: false,
    priceId: process.env.STRIPE_ELITE_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID ?? null,
    foundingPriceId: process.env.STRIPE_ELITE_FOUNDING_PRICE_ID ?? null,
    foundingAnnualPriceId: process.env.STRIPE_ELITE_ANNUAL_FOUNDING_PRICE_ID ?? null,
  },
  elite_plus: {
    label: 'Elite Plus',
    price: PRICING.ELITE_PLUS_MONTHLY,
    foundingPrice: null,
    annualPrice: PRICING.ELITE_PLUS_ANNUAL,
    foundingAnnualPrice: null,
    monthlyCredits: PRICING.ELITE_PLUS_LEAD_CAP,
    creditRolloverMax: PRICING.ELITE_PLUS_ROLLOVER_MAX,
    maxZipCodes: 'unlimited',
    hasExclusiveTerritory: true,
    hasPriorityDelivery: true,
    hasSuperExclusiveTerritory: true,
    hasFreeTrial: false,
    trialDays: 0,
    overagePrice: PRICING.ELITE_PLUS_OVERAGE,
    priorityWindowMinutes: PRICING.ELITE_PLUS_PRIORITY_WINDOW_MINUTES,
    priorityLevel: 1,
    teamMembersFree: PRICING.ELITE_PLUS_TEAM_MEMBERS_FREE,
    teamMemberPrice: PRICING.ELITE_PLUS_TEAM_MEMBER_PRICE,
    hasAccountManager: true,
    hasMonthlyReview: true,
    priceId: process.env.STRIPE_ELITE_PLUS_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_ELITE_PLUS_ANNUAL_PRICE_ID ?? null,
    foundingPriceId: null,
    foundingAnnualPriceId: null,
  },
}

// Legacy exports for backwards compatibility
export const ELITE_PRIORITY_WINDOW_MINUTES = PRICING.ELITE_PRIORITY_WINDOW_MINUTES
export const LEAD_EXPIRY_HOURS = 72
export const DUPLICATE_LEAD_WINDOW_HOURS = 24
export const PRO_MONTHLY_LEAD_CAP = PRICING.PRO_LEAD_CAP
export const PAY_PER_LEAD_PRICE_CENTS = PRICING.PPL_PRICE * 100
export const PRO_OVERAGE_PRICE_CENTS = PRICING.PRO_OVERAGE * 100
export const ELITE_OVERAGE_PRICE_CENTS = PRICING.ELITE_OVERAGE * 100
export const ELITE_PLUS_OVERAGE_PRICE_CENTS = PRICING.ELITE_PLUS_OVERAGE * 100

export const CALLBACK_TIMES = ['Morning', 'Afternoon', 'Evening', 'Anytime'] as const

// ZIP capacity defaults
export const ZIP_MAX_PRO_CONTRACTORS = 3
export const ZIP_MAX_ELITE_CONTRACTORS = 1
export const ZIP_MAX_ELITE_PLUS_CONTRACTORS = 1
