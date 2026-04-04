-- ============================================================
-- Migration: Add SMS notification phone to contractors table
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS sms_notification_phone text;
