export type Niche = 'Roofing' | 'HVAC' | 'Plumbing' | 'Electrical' | 'Windows & Doors' | 'Painting'
export type LeadStatus = 'available' | 'claimed' | 'invalid' | 'expired'
export type PlanType = 'none' | 'pay_per_lead' | 'pro' | 'elite' | 'elite_plus'
export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'
export type PaymentType = 'subscription' | 'pay_per_lead'
export type NotificationType = 'email' | 'sms'
export type NotificationStatus = 'sent' | 'failed'
export type CallbackTime = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime'
export type ZipClaimType = 'super_exclusive' | 'exclusive' | 'priority' | 'shared'
export type ZipStatus = 'SUPER_EXCLUSIVE_LOCKED' | 'ELITE_EXCLUSIVE_LOCKED' | 'ELITE_PRIORITY_SHARED' | 'PRO_CAPACITY_REACHED' | 'AVAILABLE_EXCLUSIVELY' | 'SHARED_AVAILABLE' | 'OPEN'
export type LeadTierWindow = 'elite_plus_window' | 'elite_window' | 'open' | 'expired'
export type CreditTransactionType = 'monthly_grant' | 'rollover' | 'overage_charge' | 'credit_issued' | 'bonus' | 'lead_claim' | 'upgrade_conversion' | 'downgrade_reduction'

export interface Lead {
  id: string
  niche: Niche
  zip: string
  homeowner_name: string
  homeowner_phone: string
  homeowner_email: string
  homeowner_address: string
  homeowner_city: string
  homeowner_state: string
  homeowner_zip: string
  project_type: string
  project_description: string
  estimated_budget: string | null
  urgency: 'low' | 'medium' | 'high'
  callback_time: CallbackTime
  callback_date: string
  lead_status: LeadStatus
  lead_tier_window: LeadTierWindow
  assigned_to_contractor_id: string | null
  claimed_at: string | null
  claimed_by: string | null
  rex_interaction_id: string | null
  created_at: string
  expires_at: string
  source: string | null
  property_type: string | null
  is_duplicate: boolean
  duplicate_of: string | null
}

export interface LeadClaim {
  id: string
  lead_id: string
  contractor_id: string
  claimed_at: string
  source: 'web' | 'sms' | 'email'
}

export interface Contractor {
  id: string
  email: string
  business_name: string
  primary_niche: Niche
  secondary_niches: Niche[]
  subscription_status: SubscriptionStatus
  plan_type: PlanType
  plan_started_at: string
  plan_expires_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  // Credit system
  lead_credits_remaining: number
  lead_credits_used_this_month: number
  lead_credits_rollover: number
  credits_reset_at: string | null
  // Plan details
  plan_interval: 'monthly' | 'annual'
  founding_member: boolean
  founding_member_locked_price: number | null
  // Territory
  exclusive_zips: string[]
  priority_zips: string[]
  // Pause
  pause_subscription_until: string | null
  pause_months_used: number
  // Referral
  referral_code: string | null
  referred_by: string | null
  referral_credits_earned: number
  // Misc
  digest_unsubscribed: boolean
  profile_photo_url: string | null
  timezone: string
  notification_email: string | null
  alert_sound: string | null
  // Account manager (Elite Plus)
  account_manager_id: string | null
  cancellation_reason: string | null
  cancellation_at: string | null
  win_back_email_30_sent: boolean
  win_back_email_90_sent: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  contractor_id: string
  notification_type: NotificationType
  status: NotificationStatus
  message: string
  recipient: string
  sent_at: string | null
  failed_reason: string | null
  created_at: string
}

export interface AppError {
  status: number
  message: string
  code: string
}

export interface TeamMember {
  id: string
  contractor_id: string
  email: string
  name: string
  role: 'admin' | 'user'
  created_at: string
}

export interface RexInteraction {
  id: string
  lead_id: string
  contractor_id: string
  interaction_type: string
  notes: string | null
  created_at: string
}

export interface ZipClaim {
  id: string
  zip: string
  niche: Niche
  contractor_id: string
  claim_type: ZipClaimType
  plan_at_claim: string
  claimed_at: string
  is_active: boolean
}

export interface ZipCapacity {
  zip: string
  niche: Niche
  max_pro_contractors: number
  current_pro_count: number
  max_elite_contractors: number
  current_elite_count: number
  max_elite_plus_contractors: number
  current_elite_plus_count: number
  is_oversaturated: boolean
  oversaturated_at: string | null
}

export interface ZipStatusResult {
  status: ZipStatus
  badge: string
  description: string
  canAdd: boolean
  claimType: ZipClaimType | null
  upgradeSuggestion: string | null
  contractorCount: number
}

export interface CreditTransaction {
  id: string
  contractor_id: string
  transaction_type: CreditTransactionType
  amount: number
  balance_after: number
  description: string | null
  lead_id: string | null
  created_at: string
}

export interface AccountManagerAssignment {
  id: string
  contractor_id: string
  account_manager_id: string
  assigned_at: string
  last_contact_at: string | null
  notes: string | null
  satisfaction_score: number | null
  is_active: boolean
}

export interface FoundingMemberCount {
  plan_type: string
  max_spots: number
  filled_spots: number
}

export interface CheckoutMetadata {
  contractor_id: string
  plan_type: 'pro' | 'elite' | 'elite_plus'
}
