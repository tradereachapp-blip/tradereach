import { PRICING } from './pricing'

export const PLAN_CONFIG = {
  ppl: {
    name: 'Pay Per Lead',
    label: 'PPL',
    description: 'Pay for each lead you claim',
    price: PRICING.PPL_PRICE,
    billing: 'per-lead',
    credits: 0,
    maxZipCodes: 5,
    hasAccountManager: false,
    hasMonthlyReview: false,
  },
  pro: {
    name: 'Pro',
    label: 'Pro',
    description: '15 leads/month + shared territories',
    price: PRICING.PRO_MONTHLY,
    annualPrice: PRICING.PRO_ANNUAL,
    founding: PRICING.PRO_FOUNDING_MONTHLY,
    foundingAnnual: PRICING.PRO_ANNUAL_FOUNDING,
    billing: 'monthly',
    credits: PRICING.PRO_CREDITS,
    rolloverMax: PRICING.PRO_ROLLOVER_MAX,
    overage: PRICING.PRO_OVERAGE,
    maxZipCodes: 5,
    hasAccountManager: false,
    hasMonthlyReview: false,
    foundingSpots: 10,
  },
  elite: {
    name: 'Elite',
    label: 'Elite',
    description: '30 leads/month + exclusive territories',
    price: PRICING.ELITE_MONTHLY,
    annualPrice: PRICING.ELITE_ANNUAL,
    founding: PRICING.ELITE_FOUNDING_MONTHLY,
    foundingAnnual: PRICING.ELITE_ANNUAL_FOUNDING,
    billing: 'monthly',
    credits: PRICING.ELITE_CREDITS,
    rolloverMax: PRICING.ELITE_ROLLOVER_MAX,
    overage: PRICING.ELITE_OVERAGE,
    maxZipCodes: 'unlimited',
    hasAccountManager: false,
    hasMonthlyReview: false,
    foundingSpots: 5,
  },
  elite_plus: {
    name: 'Elite Plus',
    label: 'Elite Plus',
    description: '60 leads/month + super-exclusive + account manager',
    price: PRICING.ELITE_PLUS_MONTHLY,
    annualPrice: PRICING.ELITE_PLUS_ANNUAL,
    billing: 'monthly',
    credits: PRICING.ELITE_PLUS_CREDITS,
    rolloverMax: PRICING.ELITE_PLUS_ROLLOVER_MAX,
    overage: PRICING.ELITE_PLUS_OVERAGE,
    maxZipCodes: 'unlimited',
    hasAccountManager: true,
    hasMonthlyReview: true,
    foundingSpots: 0,
  },
}

export const ZIP_CAPACITY = {
  max_pro: 3,
  max_elite: 2,
  max_elite_plus: 1,
}

export const NOTIFICATION_WINDOWS = {
  elite_plus: 30, // minutes
  elite: 15,
  pro: 5,
  ppl: 'unlimited',
}
