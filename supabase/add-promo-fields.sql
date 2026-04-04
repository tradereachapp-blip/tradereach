-- ============================================================
-- TradeReach — Promo Code Fields Migration
-- Run this in your Supabase SQL editor
-- ============================================================

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS promo_expires_at timestamptz;
