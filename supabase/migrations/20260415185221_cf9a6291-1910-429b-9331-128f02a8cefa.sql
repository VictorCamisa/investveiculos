
-- Drop old simplified tables (all are empty)
DROP TABLE IF EXISTS meta_insights CASCADE;
DROP TABLE IF EXISTS meta_ads CASCADE;
DROP TABLE IF EXISTS meta_adsets CASCADE;
DROP TABLE IF EXISTS meta_campaigns CASCADE;
DROP TABLE IF EXISTS meta_sync_logs CASCADE;

-- Recreate meta_campaigns with full schema
CREATE TABLE public.meta_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_campaign_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  daily_budget NUMERIC,
  lifetime_budget NUMERIC,
  start_time TIMESTAMPTZ,
  stop_time TIMESTAMPTZ,
  created_time TIMESTAMPTZ,
  updated_time TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate meta_adsets with full schema
CREATE TABLE public.meta_adsets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_adset_id TEXT NOT NULL UNIQUE,
  campaign_id UUID REFERENCES public.meta_campaigns(id) ON DELETE SET NULL,
  meta_campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  optimization_goal TEXT,
  billing_event TEXT,
  daily_budget NUMERIC,
  lifetime_budget NUMERIC,
  targeting JSONB,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate meta_ads with full schema
CREATE TABLE public.meta_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_ad_id TEXT NOT NULL UNIQUE,
  adset_id UUID REFERENCES public.meta_adsets(id) ON DELETE SET NULL,
  meta_adset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  creative_id TEXT,
  preview_url TEXT,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate meta_insights with full schema
CREATE TABLE public.meta_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  unique_clicks INTEGER NOT NULL DEFAULT 0,
  spend NUMERIC NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  cpc NUMERIC NOT NULL DEFAULT 0,
  cpm NUMERIC NOT NULL DEFAULT 0,
  frequency NUMERIC NOT NULL DEFAULT 0,
  actions JSONB,
  conversions INTEGER NOT NULL DEFAULT 0,
  cost_per_result NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, date_start)
);

-- Recreate meta_sync_logs with full schema
CREATE TABLE public.meta_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  campaigns_synced INTEGER NOT NULL DEFAULT 0,
  adsets_synced INTEGER NOT NULL DEFAULT 0,
  ads_synced INTEGER NOT NULL DEFAULT 0,
  insights_synced INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all meta data
CREATE POLICY "Authenticated users can read meta_campaigns" ON public.meta_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read meta_adsets" ON public.meta_adsets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read meta_ads" ON public.meta_ads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read meta_insights" ON public.meta_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read meta_sync_logs" ON public.meta_sync_logs FOR SELECT TO authenticated USING (true);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access meta_campaigns" ON public.meta_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access meta_adsets" ON public.meta_adsets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access meta_ads" ON public.meta_ads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access meta_insights" ON public.meta_insights FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access meta_sync_logs" ON public.meta_sync_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
