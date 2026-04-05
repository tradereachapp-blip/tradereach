-- ============================================================
-- TradeReach — Support Tickets Table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now() NOT NULL,
  contractor_id   uuid NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  contractor_name text NOT NULL,
  contractor_email text NOT NULL,
  contractor_phone text,
  plan_type        text NOT NULL,
  subject          text NOT NULL,
  message          text NOT NULL,
  source           text NOT NULL DEFAULT 'rex'
    CHECK (source IN ('rex', 'manual', 'email')),
  status           text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority         text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  resolved_at      timestamptz,
  resolved_by      text,
  admin_notes      text,
  conversation_context jsonb  -- last 5 Rex messages for context
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Contractors can see only their own tickets
CREATE POLICY "support_tickets_contractor_select"
  ON public.support_tickets FOR SELECT
  USING (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Contractors can insert their own tickets
CREATE POLICY "support_tickets_contractor_insert"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    contractor_id = (
      SELECT id FROM public.contractors WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS support_tickets_contractor_idx ON public.support_tickets(contractor_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_priority_idx ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON public.support_tickets(created_at DESC);

SELECT 'support_tickets table created ✓' AS status;
