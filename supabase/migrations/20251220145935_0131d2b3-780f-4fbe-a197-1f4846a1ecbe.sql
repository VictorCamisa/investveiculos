-- Google Ads Campaigns
CREATE TABLE IF NOT EXISTS public.google_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_campaign_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ENABLED',
  advertising_channel_type TEXT,
  bidding_strategy_type TEXT,
  daily_budget NUMERIC,
  start_date TEXT,
  end_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE
);

-- Google Ads Ad Groups (equivalente a adsets)
CREATE TABLE IF NOT EXISTS public.google_ad_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_ad_group_id TEXT NOT NULL UNIQUE,
  google_campaign_id TEXT NOT NULL,
  campaign_id UUID REFERENCES public.google_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ENABLED',
  cpc_bid_micros BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE
);

-- Google Ads
CREATE TABLE IF NOT EXISTS public.google_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_ad_id TEXT NOT NULL UNIQUE,
  google_ad_group_id TEXT NOT NULL,
  ad_group_id UUID REFERENCES public.google_ad_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ENABLED',
  ad_type TEXT,
  final_urls TEXT[],
  headlines TEXT[],
  descriptions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE
);

-- Google Ads Insights (métricas)
CREATE TABLE IF NOT EXISTS public.google_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost_micros BIGINT DEFAULT 0,
  conversions NUMERIC DEFAULT 0,
  conversions_value NUMERIC DEFAULT 0,
  ctr NUMERIC,
  avg_cpc_micros BIGINT,
  avg_cpm_micros BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, date_start, date_stop)
);

-- Google Ads Sync Logs
CREATE TABLE IF NOT EXISTS public.google_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  campaigns_synced INTEGER DEFAULT 0,
  ad_groups_synced INTEGER DEFAULT 0,
  ads_synced INTEGER DEFAULT 0,
  insights_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ad_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies para usuários autenticados
CREATE POLICY "Authenticated users can view google_campaigns"
  ON public.google_campaigns FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage google_campaigns"
  ON public.google_campaigns FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view google_ad_groups"
  ON public.google_ad_groups FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage google_ad_groups"
  ON public.google_ad_groups FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view google_ads"
  ON public.google_ads FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage google_ads"
  ON public.google_ads FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view google_insights"
  ON public.google_insights FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage google_insights"
  ON public.google_insights FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view google_sync_logs"
  ON public.google_sync_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage google_sync_logs"
  ON public.google_sync_logs FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_google_campaigns_status ON public.google_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_google_ad_groups_campaign ON public.google_ad_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ad_group ON public.google_ads(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_google_insights_entity ON public.google_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_google_insights_date ON public.google_insights(date_start, date_stop);

-- Triggers para updated_at
CREATE TRIGGER update_google_campaigns_updated_at
  BEFORE UPDATE ON public.google_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_ad_groups_updated_at
  BEFORE UPDATE ON public.google_ad_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_ads_updated_at
  BEFORE UPDATE ON public.google_ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();