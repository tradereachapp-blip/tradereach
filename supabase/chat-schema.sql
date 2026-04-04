-- ============================================================
-- TradeReach Chat System — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── TABLE 1: chat_sessions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id       uuid REFERENCES public.contractors(id) ON DELETE CASCADE,
  created_at          timestamptz DEFAULT now(),
  last_message_at     timestamptz DEFAULT now(),
  status              text DEFAULT 'active' CHECK (status IN ('active','archived','escalated')),
  total_messages      integer DEFAULT 0,
  session_source      text CHECK (session_source IN ('dashboard','settings','onboarding','mobile')),
  device_type         text CHECK (device_type IN ('desktop','mobile','tablet')),
  resolved            boolean DEFAULT false,
  escalated           boolean DEFAULT false,
  escalated_at        timestamptz,
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  notes               text
);

-- ── TABLE 2: chat_messages ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  contractor_id     uuid REFERENCES public.contractors(id) ON DELETE CASCADE,
  created_at        timestamptz DEFAULT now(),
  role              text NOT NULL CHECK (role IN ('user','assistant','system')),
  content           text NOT NULL,
  content_encrypted boolean DEFAULT true,
  is_sensitive      boolean DEFAULT false,
  read_at           timestamptz,
  reaction          text CHECK (reaction IN ('thumbs_up','thumbs_down') OR reaction IS NULL),
  reaction_at       timestamptz,
  message_tokens    integer,
  response_time_ms  integer,
  flagged           boolean DEFAULT false
);

-- ── TABLE 3: chat_leads ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  session_id      uuid REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  contractor_id   uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  name            text,
  email           text,
  phone           text,
  interest        text,
  source          text DEFAULT 'support',
  status          text DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')),
  contacted_at    timestamptz,
  converted_at    timestamptz,
  notes           text,
  assigned_to     text
);

-- ── TABLE 4: support_escalations ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_escalations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz DEFAULT now(),
  session_id        uuid REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  contractor_id     uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  issue_summary     text,
  issue_category    text DEFAULT 'other' CHECK (issue_category IN ('billing','lead_quality','technical','cancellation','account','other')),
  contractor_email  text,
  contractor_phone  text,
  priority          text DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status            text DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  assigned_to       text,
  resolved_at       timestamptz,
  resolution_notes  text,
  follow_up_sent    boolean DEFAULT false
);

-- ── TABLE 5: chat_feedback ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  session_id    uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  message_id    uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  feedback_type text CHECK (feedback_type IN ('thumbs_up','thumbs_down')),
  feedback_text text,
  category      text CHECK (category IN ('helpful','not_helpful','wrong_info','too_long','too_short')),
  reviewed      boolean DEFAULT false
);

-- ── TABLE 6: proactive_triggers ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.proactive_triggers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES public.contractors(id) ON DELETE CASCADE,
  trigger_type  text CHECK (trigger_type IN ('no_leads_claimed_3_days','hit_lead_cap','inactive_7_days','trial_ending','approaching_lead_cap','first_lead_claimed')),
  fired_at      timestamptz DEFAULT now(),
  message_sent  text,
  channel       text CHECK (channel IN ('chatbot','email','sms')),
  opened        boolean DEFAULT false,
  clicked       boolean DEFAULT false
);

-- ── TABLE 7: chat_analytics ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_analytics (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                          date DEFAULT CURRENT_DATE UNIQUE,
  total_sessions                integer DEFAULT 0,
  total_messages                integer DEFAULT 0,
  total_escalations             integer DEFAULT 0,
  total_leads_captured          integer DEFAULT 0,
  avg_response_time_ms          integer,
  avg_session_length_minutes    integer,
  most_common_topics            jsonb,
  satisfaction_score            numeric(3,2),
  api_tokens_used               integer DEFAULT 0,
  api_cost_cents                integer DEFAULT 0,
  resolved_without_escalation   integer DEFAULT 0,
  cancellations_saved           integer DEFAULT 0
);

-- ── TABLE 8: blocked_content_log ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocked_content_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  session_id      uuid REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  contractor_id   uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  content_type    text CHECK (content_type IN ('credit_card','ssn','bank_account','other_sensitive')),
  action_taken    text DEFAULT 'content_not_stored',
  admin_notified  boolean DEFAULT false
);

-- ── INDEXES ───────────────────────────────────────────────────

-- chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_contractor ON public.chat_sessions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status     ON public.chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created    ON public.chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_msg   ON public.chat_sessions(last_message_at DESC);

-- chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_session    ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_contractor ON public.chat_messages(contractor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created    ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role       ON public.chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_flagged    ON public.chat_messages(flagged) WHERE flagged = true;

-- chat_leads
CREATE INDEX IF NOT EXISTS idx_chat_leads_status        ON public.chat_leads(status);
CREATE INDEX IF NOT EXISTS idx_chat_leads_source        ON public.chat_leads(source);
CREATE INDEX IF NOT EXISTS idx_chat_leads_created       ON public.chat_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_leads_contractor    ON public.chat_leads(contractor_id);

-- support_escalations
CREATE INDEX IF NOT EXISTS idx_escalations_status       ON public.support_escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_priority     ON public.support_escalations(priority);
CREATE INDEX IF NOT EXISTS idx_escalations_created      ON public.support_escalations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_contractor   ON public.support_escalations(contractor_id);

-- proactive_triggers
CREATE INDEX IF NOT EXISTS idx_proactive_contractor     ON public.proactive_triggers(contractor_id);
CREATE INDEX IF NOT EXISTS idx_proactive_type           ON public.proactive_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_proactive_fired          ON public.proactive_triggers(fired_at DESC);

-- chat_analytics
CREATE INDEX IF NOT EXISTS idx_chat_analytics_date      ON public.chat_analytics(date DESC);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────

ALTER TABLE public.chat_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_escalations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_triggers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_content_log  ENABLE ROW LEVEL SECURITY;

-- chat_sessions: contractors see only their own
CREATE POLICY "contractors_own_sessions" ON public.chat_sessions
  FOR ALL USING (contractor_id = auth.uid());

-- chat_messages: contractors see only messages in their sessions
CREATE POLICY "contractors_own_messages" ON public.chat_messages
  FOR ALL USING (contractor_id = auth.uid());

-- chat_leads: contractors see only their own
CREATE POLICY "contractors_own_leads" ON public.chat_leads
  FOR ALL USING (contractor_id = auth.uid() OR contractor_id IS NULL);

-- support_escalations: contractors see only their own
CREATE POLICY "contractors_own_escalations" ON public.support_escalations
  FOR SELECT USING (contractor_id = auth.uid());
CREATE POLICY "contractors_insert_escalations" ON public.support_escalations
  FOR INSERT WITH CHECK (contractor_id = auth.uid() OR contractor_id IS NULL);

-- chat_feedback: contractors see and insert their own
CREATE POLICY "contractors_own_feedback" ON public.chat_feedback
  FOR ALL USING (contractor_id = auth.uid() OR contractor_id IS NULL);

-- proactive_triggers: contractors read their own
CREATE POLICY "contractors_read_triggers" ON public.proactive_triggers
  FOR SELECT USING (contractor_id = auth.uid());

-- chat_analytics: all authenticated contractors can read aggregate data
CREATE POLICY "authenticated_read_analytics" ON public.chat_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

-- blocked_content_log: no contractor access — admin service role only
-- (no policy = no access for anon/authenticated; service role bypasses RLS)

-- ── FUNCTIONS ─────────────────────────────────────────────────

-- FUNCTION 1: get_contractor_chat_summary
CREATE OR REPLACE FUNCTION public.get_contractor_chat_summary(p_contractor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sessions',        (SELECT COUNT(*) FROM public.chat_sessions WHERE contractor_id = p_contractor_id),
    'total_messages',        (SELECT COUNT(*) FROM public.chat_messages WHERE contractor_id = p_contractor_id),
    'total_escalations',     (SELECT COUNT(*) FROM public.support_escalations WHERE contractor_id = p_contractor_id),
    'avg_satisfaction',      (SELECT AVG(satisfaction_rating) FROM public.chat_sessions WHERE contractor_id = p_contractor_id AND satisfaction_rating IS NOT NULL),
    'most_recent_session',   (SELECT MAX(created_at) FROM public.chat_sessions WHERE contractor_id = p_contractor_id),
    'total_leads_captured',  (SELECT COUNT(*) FROM public.chat_leads WHERE contractor_id = p_contractor_id),
    'pending_triggers',      (SELECT COUNT(*) FROM public.proactive_triggers WHERE contractor_id = p_contractor_id AND fired_at > now() - interval '24 hours')
  ) INTO result;
  RETURN result;
END;
$$;

-- FUNCTION 2: update_chat_analytics (run daily by cron)
CREATE OR REPLACE FUNCTION public.update_chat_analytics()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  yesterday date := CURRENT_DATE - 1;
BEGIN
  INSERT INTO public.chat_analytics (
    date, total_sessions, total_messages, total_escalations,
    total_leads_captured, avg_response_time_ms, api_tokens_used
  )
  SELECT
    yesterday,
    (SELECT COUNT(*) FROM public.chat_sessions WHERE DATE(created_at) = yesterday),
    (SELECT COUNT(*) FROM public.chat_messages WHERE DATE(created_at) = yesterday),
    (SELECT COUNT(*) FROM public.support_escalations WHERE DATE(created_at) = yesterday),
    (SELECT COUNT(*) FROM public.chat_leads WHERE DATE(created_at) = yesterday),
    (SELECT AVG(response_time_ms)::integer FROM public.chat_messages WHERE DATE(created_at) = yesterday AND role = 'assistant'),
    (SELECT COALESCE(SUM(message_tokens),0) FROM public.chat_messages WHERE DATE(created_at) = yesterday)
  ON CONFLICT (date) DO UPDATE SET
    total_sessions         = EXCLUDED.total_sessions,
    total_messages         = EXCLUDED.total_messages,
    total_escalations      = EXCLUDED.total_escalations,
    total_leads_captured   = EXCLUDED.total_leads_captured,
    avg_response_time_ms   = EXCLUDED.avg_response_time_ms,
    api_tokens_used        = EXCLUDED.api_tokens_used;
END;
$$;

-- FUNCTION 3: check_proactive_triggers
CREATE OR REPLACE FUNCTION public.check_proactive_triggers(p_contractor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  triggers jsonb := '[]';
  last_login timestamptz;
  claimed_count integer;
  days_since_signup integer;
BEGIN
  -- Check inactive 7 days
  SELECT last_sign_in_at INTO last_login FROM auth.users WHERE id = p_contractor_id;
  IF last_login < now() - interval '7 days' THEN
    triggers := triggers || '["inactive_7_days"]'::jsonb;
  END IF;

  -- Check no leads claimed in 3 days since signup
  SELECT EXTRACT(DAY FROM (now() - created_at))::integer INTO days_since_signup
    FROM public.contractors WHERE id = p_contractor_id;
  SELECT COUNT(*) INTO claimed_count FROM public.leads WHERE claimed_by = p_contractor_id;
  IF days_since_signup >= 3 AND claimed_count = 0 THEN
    triggers := triggers || '["no_leads_claimed_3_days"]'::jsonb;
  END IF;

  RETURN triggers;
END;
$$;

-- FUNCTION 4: flag_sensitive_content
CREATE OR REPLACE FUNCTION public.flag_sensitive_content(p_content text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  -- Credit card pattern
  IF p_content ~ '\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}' THEN RETURN true; END IF;
  -- SSN pattern
  IF p_content ~ '\d{3}-\d{2}-\d{4}' THEN RETURN true; END IF;
  -- Bank routing/account
  IF p_content ~* '(routing|account|aba)[\s#:]*\d{6,17}' THEN RETURN true; END IF;
  RETURN false;
END;
$$;

-- FUNCTION 5: archive_old_sessions
CREATE OR REPLACE FUNCTION public.archive_old_sessions()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete messages older than 30 days
  DELETE FROM public.chat_messages
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Archive old sessions (keep metadata, just mark archived)
  UPDATE public.chat_sessions
  SET status = 'archived'
  WHERE created_at < now() - interval '30 days'
    AND status = 'active';

  RETURN deleted_count;
END;
$$;

-- ── Done ─────────────────────────────────────────────────────
SELECT 'TradeReach chat schema created successfully ✓' AS status;
