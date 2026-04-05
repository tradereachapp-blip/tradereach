-- Pricing & Territory System v2.0 Database Migration
-- Run in Supabase SQL editor

-- New enum types
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'paused', 'cancelled', 'past_due');
CREATE TYPE zip_claim_type AS ENUM ('available', 'available_with_warning', 'exclusive', 'exclusive_locked', 'super_exclusive', 'super_exclusive_locked');
CREATE TYPE credit_transaction_type AS ENUM ('monthly_grant', 'lead_claim', 'overage_payment', 'upgrade_conversion', 'rollover_cap', 'bonus', 'deduction');

-- Extend contractors table
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'ppl';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS plan_interval TEXT DEFAULT 'monthly';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'active';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS lead_credits_remaining INT DEFAULT 0;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS exclusive_zips TEXT[] DEFAULT '{}';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS founding_member BOOLEAN DEFAULT FALSE;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS founding_member_locked_price DECIMAL(10, 2);
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS account_manager_id TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS pause_subscription_until TIMESTAMP;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS pause_months_used INT DEFAULT 0;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS cancellation_at TIMESTAMP;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS win_back_email_30_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS win_back_email_90_sent BOOLEAN DEFAULT FALSE;

-- New tables for credits
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  transaction_type credit_transaction_type NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_contractor ON credit_transactions(contractor_id, created_at);

-- ZIP claim tracking
CREATE TABLE IF NOT EXISTS zip_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  zip VARCHAR(5) NOT NULL,
  niche TEXT NOT NULL,
  claim_type zip_claim_type NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  claimed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contractor_id, zip, niche)
);

CREATE INDEX IF NOT EXISTS idx_zip_claims_zip_niche ON zip_claims(zip, niche, is_active);

-- ZIP capacity monitoring
CREATE TABLE IF NOT EXISTS zip_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code VARCHAR(5) NOT NULL,
  niche TEXT NOT NULL,
  max_pro_count INT DEFAULT 3,
  current_pro_count INT DEFAULT 0,
  max_elite_count INT DEFAULT 2,
  current_elite_count INT DEFAULT 0,
  max_elite_plus_count INT DEFAULT 1,
  current_elite_plus_count INT DEFAULT 0,
  is_oversaturated BOOLEAN DEFAULT FALSE,
  leads_last_30_days INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY(zip_code, niche)
);

-- Account manager assignments
CREATE TABLE IF NOT EXISTS account_manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL UNIQUE REFERENCES contractors(id) ON DELETE CASCADE,
  account_manager_id UUID NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Cancellation retention tracking
CREATE TABLE IF NOT EXISTS cancellation_retention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  retention_offer TEXT,
  cancelled_anyway BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Founding member counter
CREATE TABLE IF NOT EXISTS founding_member_counts (
  plan_type TEXT PRIMARY KEY,
  filled_spots INT DEFAULT 0,
  max_spots INT DEFAULT 10
);

INSERT INTO founding_member_counts (plan_type, filled_spots, max_spots) VALUES ('pro', 0, 10) ON CONFLICT(plan_type) DO NOTHING;
INSERT INTO founding_member_counts (plan_type, filled_spots, max_spots) VALUES ('elite', 0, 5) ON CONFLICT(plan_type) DO NOTHING;
