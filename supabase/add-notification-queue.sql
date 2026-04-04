-- ============================================================
-- Migration: Add sequential notification queue to leads table
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS notification_queue jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS active_notification_contractor_id uuid REFERENCES public.contractors(id),
  ADD COLUMN IF NOT EXISTS notification_window_expires_at timestamptz;

-- Index for the cron job query (find expired windows on available leads)
CREATE INDEX IF NOT EXISTS idx_leads_notification_window
  ON public.leads (notification_window_expires_at)
  WHERE status = 'available' AND notification_window_expires_at IS NOT NULL;
