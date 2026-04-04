// ============================================================
// TradeReach — Pricing Constants
// Single source of truth for all pricing values.
// Import from here instead of hardcoding anywhere.
// ============================================================

export const PRICING = {
  /** Pay-per-lead charge per lead */
  PPL_PRICE: 45,

  /** Pro monthly subscription */
  PRO_MONTHLY: 397,

  /** Pro included leads per month before overage */
  PRO_LEAD_CAP: 20,

  /** Pro overage charge per lead over cap */
  PRO_OVERAGE: 30,

  /** Elite monthly subscription */
  ELITE_MONTHLY: 697,

  /** Pro annual (10 months for 12) */
  PRO_ANNUAL: 3970,

  /** Elite annual (10 months for 12) */
  ELITE_ANNUAL: 6970,
} as const

export type PricingKey = keyof typeof PRICING
