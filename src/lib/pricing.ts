export const PRICING = {
  // PPL tier
  PPL_PRICE: 45,

  // Pro
  PRO_MONTHLY: 497,
  PRO_ANNUAL: 4970,
  PRO_FOUNDING_MONTHLY: 397,
  PRO_ANNUAL_FOUNDING: 3970,
  PRO_CREDITS: 15,
  PRO_ROLLOVER_MAX: 30,
  PRO_OVERAGE: 38,

  // Elite
  ELITE_MONTHLY: 897,
  ELITE_ANNUAL: 8970,
  ELITE_FOUNDING_MONTHLY: 697,
  ELITE_ANNUAL_FOUNDING: 6970,
  ELITE_CREDITS: 30,
  ELITE_ROLLOVER_MAX: 60,
  ELITE_OVERAGE: 28,

  // Elite Plus
  ELITE_PLUS_MONTHLY: 1497,
  ELITE_PLUS_ANNUAL: 14970,
  ELITE_PLUS_CREDITS: 60,
  ELITE_PLUS_ROLLOVER_MAX: 120,
  ELITE_PLUS_OVERAGE: 22,
}

export function getMonthlyCredits(planType: string): number {
  const credits: Record<string, number> = {
    pro: PRICING.PRO_CREDITS,
    elite: PRICING.ELITE_CREDITS,
    elite_plus: PRICING.ELITE_PLUS_CREDITS,
  }
  return credits[planType] ?? 0
}

export function getRolloverMax(planType: string): number {
  const maxes: Record<string, number> = {
    pro: PRICING.PRO_ROLLOVER_MAX,
    elite: PRICING.ELITE_ROLLOVER_MAX,
    elite_plus: PRICING.ELITE_PLUS_ROLLOVER_MAX,
  }
  return maxes[planType] ?? 0
}

export function getOveragePrice(planType: string): number {
  const prices: Record<string, number> = {
    pro: PRICING.PRO_OVERAGE,
    elite: PRICING.ELITE_OVERAGE,
    elite_plus: PRICING.ELITE_PLUS_OVERAGE,
  }
  return prices[planType] ?? 45
}
