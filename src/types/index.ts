// ============================================================
// TradeReach — Shared TypeScript Types
// ============================================================

export type Niche = 'Roofing' | 'HVAC' | 'Plumbing'
export type LeadStatus = 'available' | 'claimed' | 'invalid' | 'expired'
export type PlanType = 'none' | 'pay_per_lead' | 'pro' | 'elite'
export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled'
export type PaymentType = 'subscription' | 'pay_per_lead'
export type NotificationType = 'email' | 'sms'
export type NotificationStatus = 'sent' | 'failed'
export type CallbackTime = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime'

export interface Lead {
  id: string
  created_at: string
  name: string
  phone: string
  zip: string
  niche: Niche
  description: string | null
  callback_time: CallbackTime | null
  status: LeadStatus
  claimed_by: string | null
  claimed_at: string | null
  is_exclusive: boolean
}

export interface Contractor {
  id: string
  user_id: string
  created_at: string
  business_name: string
  contact_name: string
  phone: string
  license_number: string | null
  niche: Niche
  zip_codes: string[]
  plan_type: PlanType
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  leads_used_this_month: number
  leads_reset_at: string | null
  promo_code: string | null
  promo_expires_at: string | null
}

export interface LeadClaim {
  id: string
  lead_id: string
  contractor_id: string
  claimed_at: string
  payment_type: PaymentType
  amount_charged: number | null
}

export interface Notification {
  id: string
  contractor_id: string | null
  lead_id: string | null
  type: NotificationType
  status: NotificationStatus
  sent_at: string
  error_message: string | null
}

export interface AppError {
  id: string
  created_at: string
  type: string
  message: string
  context: Record<string, unknown> | null
}

// Dashboard-specific types
export interface LeadWithClaim extends Lead {
  lead_claims?: LeadClaim[]
}

export interface ContractorWithUser extends Contractor {
  email?: string
}

// Stripe checkout session metadata
export interface CheckoutMetadata {
  contractor_id: string
  plan_type: 'pro' | 'elite'
}

// Lead notification payload
export interface LeadNotificationPayload {
  lead: Lead
  contractors: Contractor[]
}
