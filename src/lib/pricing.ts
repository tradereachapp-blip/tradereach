// ============================================================
// TradeReach™ — Pricing Constants — v2.0 Final Confirmed
// ============================================================

export const PRICING = {
  // Pay-per-lead
  PPL_PRICE: 45,

  // Pro Plan — $497/month
  PRO_MONTHLY: 497,
  PRO_MONTHLY_FOUNDING: 397,
  PRO_ANNUAL: 4970,
  PRO_ANNUAL_FOUNDING: 3970,
  PRO_LEAD_CAP: 15,           // included credits per month (was 12, now 15)
  PRO_OVERAGE: 38,            // per lead over cap (was 40, now 38)
  PRO_ROLLOVER_MAX: 30,       // max total credits including rollover
  PRO_MAX_ZIPS: 10,
  PRO_FOUNDING_SPOTS: 10,

  // Elite Plan — $897/month
  ELITE_MONTHLY: 897,
  ELITE_MONTHLY_FOUNDING: 697,
  ELITE_ANNUAL: 8970,
  ELITE_ANNUAL_FOUNDING: 6970,
  ELITE_LEAD_CAP: 30,         // included credits per month (was 25, now 30)
  ELITE_OVERAGE: 28,          // per lead over cap (was 30, now 28)
  ELITE_ROLLOVER_MAX: 60,     // max total credits including rollover
  ELITE_FOUNDING_SPOTS: 5,
  ELITE_PRIORITY_WINDOW_MINUTES: 15,
  ELITE_TEAM_MEMBERS_FREE: 1,  // first team member free
  ELITE_TEAM_MEMBER_PRICE: 49,

  // Elite Plus Plan — $1,497/month
  ELITE_PLUS_MONTHLY: 1497,
  ELITE_PLUS_ANNUAL: 14970,
  ELITE_PLUS_ANNUAL_MONTHLY_EQUIV: 1247,
  ELITE_PLUS_LEAD_CAP: 60,
  ELITE_PLUS_OVERAGE: 22,
  ELITE_PLUS_ROLLOVER_MAX: 120,
  ELITE_PLUS_PRIORITY_WINDOW_MINUTES: 30,
  ELITE_PLUS_TEAM_MEMBERS_FREE: 3,
  ELITE_PLUS_TEAM_MEMBER_PRICE: 49,
} as const

export type PricingKey = keyof typeof PRICING

// Derived helpers
export function getMonthlyCredits(planType: string): number {
  switch (planType) {
    case 'pro': return PRICING.PRO_LEAD_CAP
    case 'elite': return PRICING.ELITE_LEAD_CAP
    case 'elite_plus': return PRICING.ELITE_PLUS_LEAD_CAP
    default: return 0
  }
}

export function getRolloverMax(planType: string): number {
  switch (planType) {
    case 'pro': return PRICING.PRO_ROLLOVER_MAX
    case 'elite': return PRICING.ELITE_ROLLOVER_MAX
    case 'elite_plus': return PRICING.ELITE_PLUS_ROLLOVER_MAX
    default: return 0
  }
}

export function getOveragePrice(planType: string): number {
  switch (planType) {
    case 'pro': return PRICING.PRO_OVERAGE
    case 'elite': return PRICING.ELITE_OVERAGE
    case 'elite_plus': return PRICING.ELITE_PLUS_OVERAGE
    case 'pay_per_lead': return PRICING.PPL_PRICE
    default: return 0
  }
}

export function getPriorityWindowMinutes(planType: string): number {
  switch (planType) {
    case 'elite_plus': return PRICING.ELITE_PLUS_PRIORITY_WINDOW_MINUTES
    case 'elite': return PRICING.ELITE_PRIORITY_WINDOW_MINUTES
    default: return 0
  }
}
