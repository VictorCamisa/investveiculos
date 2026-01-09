-- =====================================================
-- FASE 2: Novos campos para KPIs Automotivos
-- =====================================================

-- Adicionar campos na tabela negotiations para tracking de test drives e no-shows
ALTER TABLE public.negotiations 
ADD COLUMN IF NOT EXISTS test_drive_scheduled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS test_drive_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS no_show_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS contact_attempts integer DEFAULT 0;

-- Tabela para tracking de custos por canal de marketing
CREATE TABLE IF NOT EXISTS public.channel_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL, -- 'facebook', 'google', 'olx', 'webmotors', 'indicacao', etc.
  month date NOT NULL,
  fixed_cost numeric DEFAULT 0,
  variable_cost numeric DEFAULT 0,
  total_leads integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(channel, month)
);

-- Tabela para UTMs gerados
CREATE TABLE IF NOT EXISTS public.utm_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_url text NOT NULL,
  utm_source text NOT NULL,
  utm_medium text NOT NULL,
  utm_campaign text NOT NULL,
  utm_content text,
  utm_term text,
  full_url text NOT NULL,
  clicks integer DEFAULT 0,
  leads_generated integer DEFAULT 0,
  is_template boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Tabela para eventos do calendário de campanhas
CREATE TABLE IF NOT EXISTS public.campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL, -- 'campanha_inicio', 'campanha_fim', 'feriado', 'promocao', 'lembrete'
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  meta_campaign_id text,
  color text DEFAULT '#3b82f6',
  all_day boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela para alertas de marketing
CREATE TABLE IF NOT EXISTS public.marketing_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL, -- 'lead_sem_resposta', 'orcamento_alto', 'ctr_baixo', 'no_show', 'meta_atingida', 'roas_baixo'
  severity text NOT NULL, -- 'info', 'warning', 'critical'
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  related_entity_type text, -- 'lead', 'campaign', 'negotiation'
  related_entity_id uuid,
  user_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Tabela para relatórios agendados
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  report_type text NOT NULL, -- 'weekly_performance', 'monthly_roi', 'campaign_analysis', 'lost_leads'
  frequency text NOT NULL, -- 'daily', 'weekly', 'monthly'
  recipients text[], -- emails
  config jsonb, -- filtros, métricas selecionadas
  last_sent_at timestamptz,
  next_send_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.channel_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channel_costs
CREATE POLICY "Gerentes e Marketing podem ver channel_costs" ON public.channel_costs
  FOR SELECT USING (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Gerentes e Marketing podem inserir channel_costs" ON public.channel_costs
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Gerentes e Marketing podem atualizar channel_costs" ON public.channel_costs
  FOR UPDATE USING (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Apenas gerentes deletam channel_costs" ON public.channel_costs
  FOR DELETE USING (has_role(auth.uid(), 'gerente'::app_role));

-- RLS Policies for utm_links
CREATE POLICY "Gerentes e Marketing podem ver utm_links" ON public.utm_links
  FOR SELECT USING (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Gerentes e Marketing podem inserir utm_links" ON public.utm_links
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Gerentes e Marketing podem atualizar utm_links" ON public.utm_links
  FOR UPDATE USING (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Apenas gerentes deletam utm_links" ON public.utm_links
  FOR DELETE USING (has_role(auth.uid(), 'gerente'::app_role));

-- RLS Policies for campaign_events
CREATE POLICY "Gerentes e Marketing podem ver campaign_events" ON public.campaign_events
  FOR SELECT USING (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Gerentes e Marketing podem inserir campaign_events" ON public.campaign_events
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Gerentes e Marketing podem atualizar campaign_events" ON public.campaign_events
  FOR UPDATE USING (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Apenas gerentes deletam campaign_events" ON public.campaign_events
  FOR DELETE USING (has_role(auth.uid(), 'gerente'::app_role));

-- RLS Policies for marketing_alerts
CREATE POLICY "Usuarios podem ver seus alertas" ON public.marketing_alerts
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Sistema pode inserir alertas" ON public.marketing_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuarios podem atualizar seus alertas" ON public.marketing_alerts
  FOR UPDATE USING (user_id = auth.uid() OR has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Usuarios podem deletar seus alertas" ON public.marketing_alerts
  FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(), 'gerente'::app_role));

-- RLS Policies for scheduled_reports
CREATE POLICY "Gerentes e Marketing podem ver scheduled_reports" ON public.scheduled_reports
  FOR SELECT USING (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Gerentes e Marketing podem inserir scheduled_reports" ON public.scheduled_reports
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Gerentes e Marketing podem atualizar scheduled_reports" ON public.scheduled_reports
  FOR UPDATE USING (has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Apenas gerentes deletam scheduled_reports" ON public.scheduled_reports
  FOR DELETE USING (has_role(auth.uid(), 'gerente'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_channel_costs_updated_at BEFORE UPDATE ON public.channel_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_events_updated_at BEFORE UPDATE ON public.campaign_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();