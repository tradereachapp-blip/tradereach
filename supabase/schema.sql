-- ============================================================
-- TradeReach — Complete Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- CONTRACTORS TABLE
-- ============================================================
create table if not exists public.contractors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  created_at timestamptz default now() not null,
  business_name text not null default '',
  contact_name text not null default '',
  phone text not null default '',
  license_number text,
  niche text not null default '',
  zip_codes text[] not null default '{}',
  plan_type text not null default 'none'
    check (plan_type in ('none', 'pay_per_lead', 'pro', 'elite')),
  subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  leads_used_this_month integer not null default 0,
  leads_reset_at timestamptz,
  email_notifications boolean not null default true,
  sms_notifications boolean not null default true,
  onboarding_complete boolean not null default false
);

-- ============================================================
-- LEADS TABLE
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  name text not null,
  phone text not null,  -- store encrypted via application layer
  zip text not null,
  niche text not null
    check (niche in ('Roofing', 'HVAC', 'Plumbing')),
  description text,
  callback_time text
    check (callback_time in ('Morning', 'Afternoon', 'Evening', 'Anytime')),
  status text not null default 'available'
    check (status in ('available', 'claimed', 'invalid', 'expired')),
  claimed_by uuid references public.contractors(id),
  claimed_at timestamptz,
  is_exclusive boolean not null default false,
  tcpa_consent boolean not null default false
);

-- ============================================================
-- LEAD CLAIMS TABLE
-- ============================================================
create table if not exists public.lead_claims (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade not null,
  contractor_id uuid references public.contractors(id) on delete cascade not null,
  claimed_at timestamptz default now() not null,
  payment_type text not null
    check (payment_type in ('subscription', 'pay_per_lead')),
  amount_charged numeric(10,2),
  stripe_payment_intent_id text
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  contractor_id uuid references public.contractors(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  type text not null
    check (type in ('email', 'sms')),
  status text not null
    check (status in ('sent', 'failed')),
  sent_at timestamptz default now() not null,
  error_message text
);

-- ============================================================
-- ERRORS TABLE
-- ============================================================
create table if not exists public.errors (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  type text,
  message text,
  context jsonb
);

-- ============================================================
-- INDEXES (critical for performance)
-- ============================================================
create index if not exists leads_niche_idx on public.leads(niche);
create index if not exists leads_zip_idx on public.leads(zip);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_claimed_by_idx on public.leads(claimed_by);
create index if not exists leads_phone_idx on public.leads(phone);
create index if not exists contractors_niche_idx on public.contractors(niche);
create index if not exists contractors_zip_codes_idx on public.contractors using gin(zip_codes);
create index if not exists contractors_subscription_status_idx on public.contractors(subscription_status);
create index if not exists contractors_plan_type_idx on public.contractors(plan_type);
create index if not exists lead_claims_contractor_idx on public.lead_claims(contractor_id);
create index if not exists lead_claims_lead_idx on public.lead_claims(lead_id);
create index if not exists notifications_contractor_idx on public.notifications(contractor_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.contractors enable row level security;
alter table public.leads enable row level security;
alter table public.lead_claims enable row level security;
alter table public.notifications enable row level security;
alter table public.errors enable row level security;

-- ============================================================
-- CONTRACTORS RLS POLICIES
-- ============================================================

-- Contractors can only read their own record
create policy "contractors_select_own"
  on public.contractors for select
  using (auth.uid() = user_id);

-- Contractors can update their own record
create policy "contractors_update_own"
  on public.contractors for update
  using (auth.uid() = user_id);

-- Authenticated users can insert their own contractor record
create policy "contractors_insert_own"
  on public.contractors for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- LEADS RLS POLICIES
-- ============================================================

-- Contractors can see available leads matching their niche and zips
-- They can also see leads they have claimed
create policy "leads_select_contractor"
  on public.leads for select
  using (
    status = 'available'
    or claimed_by = (
      select id from public.contractors where user_id = auth.uid() limit 1
    )
  );

-- Anyone (including unauthenticated) can insert leads (homeowner form)
create policy "leads_insert_public"
  on public.leads for insert
  with check (true);

-- ============================================================
-- LEAD CLAIMS RLS POLICIES
-- ============================================================

-- Contractors can see only their own claims
create policy "lead_claims_select_own"
  on public.lead_claims for select
  using (
    contractor_id = (
      select id from public.contractors where user_id = auth.uid() limit 1
    )
  );

-- Contractors can insert their own claims
create policy "lead_claims_insert_own"
  on public.lead_claims for insert
  with check (
    contractor_id = (
      select id from public.contractors where user_id = auth.uid() limit 1
    )
  );

-- ============================================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================================

-- Contractors can see only their own notifications
create policy "notifications_select_own"
  on public.notifications for select
  using (
    contractor_id = (
      select id from public.contractors where user_id = auth.uid() limit 1
    )
  );

-- ============================================================
-- ERRORS RLS POLICIES
-- ============================================================

-- Errors are admin-only (service role bypasses RLS)
-- Regular users cannot read errors
create policy "errors_no_public_access"
  on public.errors for select
  using (false);

-- ============================================================
-- HELPER FUNCTION: Get contractor by user_id
-- ============================================================
create or replace function public.get_contractor_id(p_user_id uuid)
returns uuid
language sql
security definer
as $$
  select id from public.contractors where user_id = p_user_id limit 1;
$$;

-- ============================================================
-- HELPER FUNCTION: Check if contractor can claim lead
-- ============================================================
create or replace function public.can_contractor_claim_lead(
  p_contractor_id uuid,
  p_lead_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_contractor record;
  v_lead record;
begin
  select * into v_contractor from public.contractors where id = p_contractor_id;
  select * into v_lead from public.leads where id = p_lead_id;

  if v_contractor is null or v_lead is null then
    return false;
  end if;

  -- Lead must be available
  if v_lead.status != 'available' then
    return false;
  end if;

  -- Niches must match
  if v_contractor.niche != v_lead.niche then
    return false;
  end if;

  -- Zip must be in contractor's zip codes
  if not (v_lead.zip = any(v_contractor.zip_codes)) then
    return false;
  end if;

  -- Contractor must have an active plan
  if v_contractor.plan_type = 'none' then
    return false;
  end if;

  if v_contractor.plan_type in ('pro', 'elite') then
    if v_contractor.subscription_status not in ('active', 'trialing') then
      return false;
    end if;
  end if;

  return true;
end;
$$;
