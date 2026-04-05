-- ============================================================
-- TradeReach — Full Database Audit & Fix Migration
-- Generated: 2026-04-05
-- Run this in Supabase SQL Editor (safe — uses IF NOT EXISTS / IF EXISTS guards)
-- ============================================================

-- ============================================================
-- SECTION 1: CONTRACTORS TABLE — missing columns
-- ============================================================

-- notification_email: used in onboarding, settings, and lead notification routing
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS notification_email text;

-- alert_sound: contractor's preferred lead alert sound
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS alert_sound text DEFAULT 'siren';

-- license_confirmed + license_confirmed_at (legal compliance)
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS license_confirmed boolean NOT NULL DEFAULT false;

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS license_confirmed_at timestamptz;

-- ============================================================
-- SECTION 2: LEADS TABLE — missing columns + constraint fix
-- ============================================================

-- opted_out + opted_out_at: TCPA/STOP compliance
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS opted_out boolean NOT NULL DEFAULT false;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS opted_out_at timestamptz;

-- trustedform_cert_url: TCPA audit trail
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS trustedform_cert_url text;

-- notification_queue, active_notification_contractor_id, notification_window_expires_at
-- (from sequential notification queue migration)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS notification_queue jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS active_notification_contractor_id uuid
    REFERENCES public.contractors(id) ON DELETE SET NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS notification_window_expires_at timestamptz;

-- FIX: niche constraint is too narrow — code allows Electrical, Windows & Doors, Painting
-- Drop old constraint and replace with broader one
DO $$
BEGIN
  -- Remove old constraint if it exists
  ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_niche_check;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_niche_check;

-- Re-add with all supported niches
ALTER TABLE public.leads
  ADD CONSTRAINT leads_niche_check CHECK (
    niche IN ('Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Windows & Doors', 'Painting')
  );

-- ============================================================
-- SECTION 3: LEAD CLAIMS TABLE — missing columns + constraint fix
-- ============================================================

-- lead_status: contractor pipeline stage tracking
ALTER TABLE public.lead_claims
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'New'
    CHECK (lead_status IN ('New', 'Contacted', 'Appointment Set', 'Quote Sent', 'Closed Won', 'Closed Lost', 'Not Interested'));

-- notes: contractor call notes
ALTER TABLE public.lead_claims
  ADD COLUMN IF NOT EXISTS notes text;

-- job_value: dollar value if closed won
ALTER TABLE public.lead_claims
  ADD COLUMN IF NOT EXISTS job_value numeric(12,2);

-- follow_up_date: scheduled follow-up
ALTER TABLE public.lead_claims
  ADD COLUMN IF NOT EXISTS follow_up_date date;

-- contact_attempts: how many times contractor tried to reach homeowner
ALTER TABLE public.lead_claims
  ADD COLUMN IF NOT EXISTS contact_attempts integer NOT NULL DEFAULT 0;

-- FIX: payment_type constraint missing 'overage' value
ALTER TABLE public.lead_claims
  DROP CONSTRAINT IF EXISTS lead_claims_payment_type_check;

ALTER TABLE public.lead_claims
  ADD CONSTRAINT lead_claims_payment_type_check
    CHECK (payment_type IN ('subscription', 'pay_per_lead', 'overage'));

-- FIX: Foreign keys should be RESTRICT not CASCADE for financial records
-- (Can't alter FK behavior on existing columns without recreating — skip for now,
--  but note: lead_claims referencing leads/contractors with CASCADE is risky.
--  To fix properly: recreate the table. For now, document the risk.)

-- ============================================================
-- SECTION 4: NOTIFICATIONS TABLE — missing columns
-- ============================================================

-- team_member_id: which team member (if any) received this notification
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS team_member_id uuid
    REFERENCES public.team_members(id) ON DELETE SET NULL;

-- ============================================================
-- SECTION 5: TEAM MEMBERS TABLE — ensure exists with all columns
-- ============================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  timestamptz DEFAULT now() NOT NULL,
  owner_contractor_id         uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  user_id                     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email                       text NOT NULL,
  name                        text,
  role                        text NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member', 'dispatcher', 'sales')),
  status                      text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'active', 'suspended', 'expired')),
  invitation_token            text,
  invitation_expires_at       timestamptz,
  stripe_subscription_item_id text,
  notifications_enabled       boolean NOT NULL DEFAULT true
);

-- Add unique constraint on email (prevent duplicate team members)
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_email_unique;

-- Only add if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'team_members'
      AND constraint_name = 'team_members_email_unique'
  ) THEN
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_email_unique UNIQUE (email);
  END IF;
END $$;

-- ============================================================
-- SECTION 6: REX INTERACTIONS TABLE — ensure exists
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rex_interactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now() NOT NULL,
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  session_id    text,
  role          text CHECK (role IN ('user', 'assistant', 'system')),
  message       text,
  flow_type     text
);

-- ============================================================
-- SECTION 7: LEGAL ACCEPTANCES TABLE — ensure exists with all columns
-- ============================================================

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz DEFAULT now() NOT NULL,
  contractor_id     uuid NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  agreement_type    text NOT NULL,
  agreement_version text NOT NULL,
  accepted_at       timestamptz DEFAULT now() NOT NULL,
  ip_address        text,
  user_agent        text
);

-- ============================================================
-- SECTION 8: CREDIT REQUESTS TABLE — ensure exists with all columns
-- ============================================================

CREATE TABLE IF NOT EXISTS public.credit_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz DEFAULT now() NOT NULL,
  contractor_id    uuid NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  claim_id         uuid REFERENCES public.lead_claims(id) ON DELETE SET NULL,
  lead_id          uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reason           text NOT NULL
    CHECK (reason IN ('duplicate_lead', 'disconnected_phone', 'homeowner_did_not_submit')),
  description      text,
  status           text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_at      timestamptz,
  reviewed_by      text,
  stripe_credit_id text,
  credit_amount    numeric(10,2)
);

-- ============================================================
-- SECTION 9: DELETION REQUESTS TABLE — ensure exists with all columns
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now() NOT NULL,
  email        text NOT NULL,
  name         text,
  status       text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'denied')),
  completed_at timestamptz,
  notes        text
);

-- ============================================================
-- SECTION 10: SYSTEM HEALTH TABLE — ensure exists
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_health (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at   timestamptz DEFAULT now() NOT NULL,
  service_name text NOT NULL,
  status       text NOT NULL CHECK (status IN ('ok', 'degraded', 'down')),
  latency_ms   integer,
  details      jsonb
);

-- ============================================================
-- SECTION 11: INDEXES — all tables
-- ============================================================

-- LEADS
CREATE INDEX IF NOT EXISTS leads_niche_idx ON public.leads(niche);
CREATE INDEX IF NOT EXISTS leads_zip_idx ON public.leads(zip);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_claimed_by_idx ON public.leads(claimed_by);
CREATE INDEX IF NOT EXISTS leads_phone_idx ON public.leads(phone);
CREATE INDEX IF NOT EXISTS leads_opted_out_idx ON public.leads(opted_out) WHERE opted_out = true;
CREATE INDEX IF NOT EXISTS idx_leads_notification_window
  ON public.leads(notification_window_expires_at)
  WHERE status = 'available' AND notification_window_expires_at IS NOT NULL;

-- CONTRACTORS
CREATE INDEX IF NOT EXISTS contractors_niche_idx ON public.contractors(niche);
CREATE INDEX IF NOT EXISTS contractors_zip_codes_idx ON public.contractors USING gin(zip_codes);
CREATE INDEX IF NOT EXISTS contractors_subscription_status_idx ON public.contractors(subscription_status);
CREATE INDEX IF NOT EXISTS contractors_plan_type_idx ON public.contractors(plan_type);

-- LEAD CLAIMS
CREATE INDEX IF NOT EXISTS lead_claims_contractor_idx ON public.lead_claims(contractor_id);
CREATE INDEX IF NOT EXISTS lead_claims_lead_idx ON public.lead_claims(lead_id);
CREATE INDEX IF NOT EXISTS lead_claims_lead_status_idx ON public.lead_claims(lead_status);
CREATE INDEX IF NOT EXISTS lead_claims_follow_up_idx ON public.lead_claims(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- NOTIFICATIONS
CREATE INDEX IF NOT EXISTS notifications_contractor_idx ON public.notifications(contractor_id);
CREATE INDEX IF NOT EXISTS notifications_lead_idx ON public.notifications(lead_id);

-- TEAM MEMBERS
CREATE INDEX IF NOT EXISTS team_members_owner_idx ON public.team_members(owner_contractor_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON public.team_members(status);
CREATE INDEX IF NOT EXISTS team_members_token_idx ON public.team_members(invitation_token) WHERE invitation_token IS NOT NULL;

-- REX INTERACTIONS
CREATE INDEX IF NOT EXISTS rex_contractor_idx ON public.rex_interactions(contractor_id);
CREATE INDEX IF NOT EXISTS rex_flow_type_idx ON public.rex_interactions(flow_type);
CREATE INDEX IF NOT EXISTS rex_created_at_idx ON public.rex_interactions(created_at DESC);

-- LEGAL ACCEPTANCES
CREATE INDEX IF NOT EXISTS legal_contractor_idx ON public.legal_acceptances(contractor_id);
CREATE INDEX IF NOT EXISTS legal_type_version_idx ON public.legal_acceptances(agreement_type, agreement_version);

-- CREDIT REQUESTS
CREATE INDEX IF NOT EXISTS credit_requests_contractor_idx ON public.credit_requests(contractor_id);
CREATE INDEX IF NOT EXISTS credit_requests_claim_idx ON public.credit_requests(claim_id);
CREATE INDEX IF NOT EXISTS credit_requests_status_idx ON public.credit_requests(status);

-- DELETION REQUESTS
CREATE INDEX IF NOT EXISTS deletion_requests_email_idx ON public.deletion_requests(email);
CREATE INDEX IF NOT EXISTS deletion_requests_status_idx ON public.deletion_requests(status);

-- SYSTEM HEALTH
CREATE INDEX IF NOT EXISTS system_health_checked_at_idx ON public.system_health(checked_at DESC);
CREATE INDEX IF NOT EXISTS system_health_service_idx ON public.system_health(service_name);

-- ============================================================
-- SECTION 12: ROW LEVEL SECURITY — enable on new tables
-- ============================================================

ALTER TABLE public.team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rex_interactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 13: RLS POLICIES — team_members
-- ============================================================

-- Owner can manage all their team members
DROP POLICY IF EXISTS "team_owner_all" ON public.team_members;
CREATE POLICY "team_owner_all"
  ON public.team_members FOR ALL
  USING (
    owner_contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Team members can see their own record
DROP POLICY IF EXISTS "team_member_see_own" ON public.team_members;
CREATE POLICY "team_member_see_own"
  ON public.team_members FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- SECTION 14: RLS POLICIES — rex_interactions
-- ============================================================

DROP POLICY IF EXISTS "rex_contractor_own" ON public.rex_interactions;
CREATE POLICY "rex_contractor_own"
  ON public.rex_interactions FOR ALL
  USING (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- ============================================================
-- SECTION 15: RLS POLICIES — legal_acceptances
-- ============================================================

DROP POLICY IF EXISTS "legal_contractor_own" ON public.legal_acceptances;
CREATE POLICY "legal_contractor_own"
  ON public.legal_acceptances FOR ALL
  USING (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- ============================================================
-- SECTION 16: RLS POLICIES — credit_requests
-- ============================================================

DROP POLICY IF EXISTS "credit_requests_contractor_select" ON public.credit_requests;
CREATE POLICY "credit_requests_contractor_select"
  ON public.credit_requests FOR SELECT
  USING (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

DROP POLICY IF EXISTS "credit_requests_contractor_insert" ON public.credit_requests;
CREATE POLICY "credit_requests_contractor_insert"
  ON public.credit_requests FOR INSERT
  WITH CHECK (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- ============================================================
-- SECTION 17: RLS POLICIES — deletion_requests (admin only)
-- ============================================================

-- No contractor access — admin uses service role which bypasses RLS
DROP POLICY IF EXISTS "deletion_no_public" ON public.deletion_requests;
CREATE POLICY "deletion_no_public"
  ON public.deletion_requests FOR SELECT
  USING (false);

-- Allow inserts from public (homeowners submitting deletion requests)
DROP POLICY IF EXISTS "deletion_public_insert" ON public.deletion_requests;
CREATE POLICY "deletion_public_insert"
  ON public.deletion_requests FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- SECTION 18: RLS POLICIES — system_health (admin only)
-- ============================================================

DROP POLICY IF EXISTS "system_health_no_public" ON public.system_health;
CREATE POLICY "system_health_no_public"
  ON public.system_health FOR SELECT
  USING (false);

-- ============================================================
-- SECTION 19: FIX chat system RLS (bug — uses auth.uid() directly
--   as contractor_id, but contractor_id is contractors.id not user_id)
-- ============================================================

-- Fix chat_sessions
DROP POLICY IF EXISTS "contractors_own_sessions" ON public.chat_sessions;
CREATE POLICY "contractors_own_sessions"
  ON public.chat_sessions FOR ALL
  USING (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Fix chat_messages
DROP POLICY IF EXISTS "contractors_own_messages" ON public.chat_messages;
CREATE POLICY "contractors_own_messages"
  ON public.chat_messages FOR ALL
  USING (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Fix chat_leads
DROP POLICY IF EXISTS "contractors_own_leads" ON public.chat_leads;
CREATE POLICY "contractors_own_leads"
  ON public.chat_leads FOR ALL
  USING (
    contractor_id IS NULL
    OR contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Fix support_escalations select
DROP POLICY IF EXISTS "contractors_own_escalations" ON public.support_escalations;
CREATE POLICY "contractors_own_escalations"
  ON public.support_escalations FOR SELECT
  USING (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

DROP POLICY IF EXISTS "contractors_insert_escalations" ON public.support_escalations;
CREATE POLICY "contractors_insert_escalations"
  ON public.support_escalations FOR INSERT
  WITH CHECK (
    contractor_id IS NULL
    OR contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Fix chat_feedback
DROP POLICY IF EXISTS "contractors_own_feedback" ON public.chat_feedback;
CREATE POLICY "contractors_own_feedback"
  ON public.chat_feedback FOR ALL
  USING (
    contractor_id IS NULL
    OR contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Fix proactive_triggers
DROP POLICY IF EXISTS "contractors_read_triggers" ON public.proactive_triggers;
CREATE POLICY "contractors_read_triggers"
  ON public.proactive_triggers FOR SELECT
  USING (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- ============================================================
-- SECTION 20: VERIFICATION QUERIES (run these to confirm)
-- ============================================================

-- Table row counts
SELECT
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.tablename AND c.table_schema = 'public') AS column_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- Active RLS policies
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Indexes on each table
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify key columns exist on leads
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
ORDER BY ordinal_position;

-- Verify key columns exist on contractors
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contractors'
ORDER BY ordinal_position;

-- Verify key columns exist on lead_claims
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lead_claims'
ORDER BY ordinal_position;

SELECT 'Audit migration complete ✓' AS status;
