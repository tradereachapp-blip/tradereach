-- ============================================================
-- TradeReach — System Health Monitoring Table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_health (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  checked_at timestamptz NOT NULL DEFAULT now(),
  service_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('operational', 'degraded', 'down')),
  response_time_ms integer,
  error_message text,
  alerted boolean NOT NULL DEFAULT false,
  recovered_at timestamptz
);

-- Index for fast lookups by service + time
CREATE INDEX IF NOT EXISTS system_health_service_idx
  ON public.system_health (service_name, checked_at DESC);

CREATE INDEX IF NOT EXISTS system_health_status_idx
  ON public.system_health (status, checked_at DESC);

CREATE INDEX IF NOT EXISTS system_health_checked_at_idx
  ON public.system_health (checked_at DESC);

-- Enable RLS (admin access only via service role)
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- No public access — only service role can read/write
-- (The cron job and admin panel use service role)

SELECT 'system_health table created successfully' AS result;
