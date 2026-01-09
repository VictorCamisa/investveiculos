-- Meta Campaigns - Campanhas sincronizadas do Meta Ads
CREATE TABLE public.meta_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_campaign_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  daily_budget NUMERIC,
  lifetime_budget NUMERIC,
  start_time TIMESTAMP WITH TIME ZONE,
  stop_time TIMESTAMP WITH TIME ZONE,
  created_time TIMESTAMP WITH TIME ZONE,
  updated_time TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meta Ad Sets - Conjuntos de anúncios
CREATE TABLE public.meta_adsets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_adset_id TEXT NOT NULL UNIQUE,
  campaign_id UUID REFERENCES public.meta_campaigns(id) ON DELETE CASCADE,
  meta_campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  optimization_goal TEXT,
  billing_event TEXT,
  daily_budget NUMERIC,
  lifetime_budget NUMERIC,
  targeting JSONB,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meta Ads - Anúncios individuais
CREATE TABLE public.meta_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_ad_id TEXT NOT NULL UNIQUE,
  adset_id UUID REFERENCES public.meta_adsets(id) ON DELETE CASCADE,
  meta_adset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  creative_id TEXT,
  preview_url TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meta Insights - Métricas diárias (histórico)
CREATE TABLE public.meta_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('account', 'campaign', 'adset', 'ad')),
  entity_id TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  unique_clicks BIGINT DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  frequency NUMERIC DEFAULT 0,
  actions JSONB,
  conversions BIGINT DEFAULT 0,
  cost_per_result NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, date_start)
);

-- Meta Sync Logs - Log de sincronizações
CREATE TABLE public.meta_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'pending',
  campaigns_synced INTEGER DEFAULT 0,
  adsets_synced INTEGER DEFAULT 0,
  ads_synced INTEGER DEFAULT 0,
  insights_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Gerentes e Marketing podem ver/gerenciar
CREATE POLICY "Gerentes e Marketing veem meta_campaigns" 
ON public.meta_campaigns FOR SELECT 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing inserem meta_campaigns" 
ON public.meta_campaigns FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing atualizam meta_campaigns" 
ON public.meta_campaigns FOR UPDATE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing deletam meta_campaigns" 
ON public.meta_campaigns FOR DELETE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing veem meta_adsets" 
ON public.meta_adsets FOR SELECT 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing inserem meta_adsets" 
ON public.meta_adsets FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing atualizam meta_adsets" 
ON public.meta_adsets FOR UPDATE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing deletam meta_adsets" 
ON public.meta_adsets FOR DELETE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing veem meta_ads" 
ON public.meta_ads FOR SELECT 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing inserem meta_ads" 
ON public.meta_ads FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing atualizam meta_ads" 
ON public.meta_ads FOR UPDATE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing deletam meta_ads" 
ON public.meta_ads FOR DELETE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing veem meta_insights" 
ON public.meta_insights FOR SELECT 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing inserem meta_insights" 
ON public.meta_insights FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing atualizam meta_insights" 
ON public.meta_insights FOR UPDATE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing deletam meta_insights" 
ON public.meta_insights FOR DELETE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing veem meta_sync_logs" 
ON public.meta_sync_logs FOR SELECT 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing inserem meta_sync_logs" 
ON public.meta_sync_logs FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing atualizam meta_sync_logs" 
ON public.meta_sync_logs FOR UPDATE 
USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

-- Indexes for performance
CREATE INDEX idx_meta_campaigns_status ON public.meta_campaigns(status);
CREATE INDEX idx_meta_adsets_campaign_id ON public.meta_adsets(campaign_id);
CREATE INDEX idx_meta_ads_adset_id ON public.meta_ads(adset_id);
CREATE INDEX idx_meta_insights_entity ON public.meta_insights(entity_type, entity_id);
CREATE INDEX idx_meta_insights_date ON public.meta_insights(date_start);
CREATE INDEX idx_meta_sync_logs_status ON public.meta_sync_logs(status);