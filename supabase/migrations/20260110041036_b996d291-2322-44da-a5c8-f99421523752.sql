-- Adicionar colunas faltantes na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS vehicle_interest TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT,
ADD COLUMN IF NOT EXISTS meta_adset_id TEXT,
ADD COLUMN IF NOT EXISTS meta_ad_id TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS qualification_status TEXT DEFAULT 'nao_qualificado',
ADD COLUMN IF NOT EXISTS qualification_reason TEXT,
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;

-- Adicionar índice para buscas por telefone
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);

-- Adicionar índice para buscas por assigned_to
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);

-- Adicionar trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON public.leads;
CREATE TRIGGER update_leads_updated_at_trigger
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_leads_updated_at();