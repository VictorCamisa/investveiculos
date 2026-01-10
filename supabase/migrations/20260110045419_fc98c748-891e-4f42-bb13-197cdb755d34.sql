-- =============================================
-- PARTE 1: CRIAR TABELAS FALTANTES (IF NOT EXISTS para evitar erro)
-- =============================================

-- Tabela scheduled_reports
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  config JSONB,
  recipients TEXT[],
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated access scheduled_reports" ON public.scheduled_reports;
CREATE POLICY "Authenticated access scheduled_reports" ON public.scheduled_reports
  FOR ALL USING (true);

-- Tabela mercadolibre_tokens
CREATE TABLE IF NOT EXISTS public.mercadolibre_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mercadolibre_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated access mercadolibre_tokens" ON public.mercadolibre_tokens;
CREATE POLICY "Authenticated access mercadolibre_tokens" ON public.mercadolibre_tokens
  FOR ALL USING (true);

-- Tabela utm_links
CREATE TABLE IF NOT EXISTS public.utm_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  full_url TEXT,
  clicks INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated access utm_links" ON public.utm_links;
CREATE POLICY "Authenticated access utm_links" ON public.utm_links
  FOR ALL USING (true);

-- =============================================
-- PARTE 2: ADICIONAR COLUNAS EM sale_commissions
-- =============================================

ALTER TABLE public.sale_commissions 
  ADD COLUMN IF NOT EXISTS commission_rule_id UUID REFERENCES public.commission_rules(id),
  ADD COLUMN IF NOT EXISTS calculated_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manual_adjustment NUMERIC,
  ADD COLUMN IF NOT EXISTS final_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS split_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_due_date DATE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================
-- PARTE 3: ADICIONAR COLUNAS EM notifications
-- =============================================

ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS link TEXT;

-- =============================================
-- PARTE 4: ADICIONAR COLUNAS EM activity_logs
-- =============================================

ALTER TABLE public.activity_logs 
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- =============================================
-- PARTE 5: ADICIONAR COLUNAS EM round_robin_config
-- =============================================

ALTER TABLE public.round_robin_config 
  ADD COLUMN IF NOT EXISTS total_leads_assigned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================
-- PARTE 6: ADICIONAR COLUNAS EM whatsapp_instances
-- =============================================

ALTER TABLE public.whatsapp_instances 
  ADD COLUMN IF NOT EXISTS instance_name TEXT,
  ADD COLUMN IF NOT EXISTS api_url TEXT,
  ADD COLUMN IF NOT EXISTS api_key TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS qr_code TEXT,
  ADD COLUMN IF NOT EXISTS qr_code_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================
-- PARTE 7: CRIAR TRIGGER on_auth_user_created
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();