-- Enum para status de qualificação do lead
CREATE TYPE public.qualification_status AS ENUM ('nao_qualificado', 'qualificado', 'desqualificado');

-- Enum para motivos de perda estruturados
CREATE TYPE public.loss_reason_type AS ENUM (
  'sem_entrada', 
  'sem_credito', 
  'curioso', 
  'caro', 
  'comprou_outro', 
  'desistiu', 
  'sem_contato',
  'veiculo_vendido',
  'outros'
);

-- Adicionar novos campos na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS meta_campaign_id uuid REFERENCES public.meta_campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS meta_adset_id uuid REFERENCES public.meta_adsets(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS meta_ad_id uuid REFERENCES public.meta_ads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS qualification_status public.qualification_status DEFAULT 'nao_qualificado',
ADD COLUMN IF NOT EXISTS qualification_reason text,
ADD COLUMN IF NOT EXISTS first_response_at timestamp with time zone;

-- Adicionar novos campos na tabela negotiations
ALTER TABLE public.negotiations
ADD COLUMN IF NOT EXISTS appointment_date date,
ADD COLUMN IF NOT EXISTS appointment_time time,
ADD COLUMN IF NOT EXISTS showed_up boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS objections jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS structured_loss_reason public.loss_reason_type;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_meta_campaign ON public.leads(meta_campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON public.leads(qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_first_response ON public.leads(first_response_at);
CREATE INDEX IF NOT EXISTS idx_negotiations_appointment ON public.negotiations(appointment_date);
CREATE INDEX IF NOT EXISTS idx_negotiations_showed_up ON public.negotiations(showed_up);

-- Trigger para atualizar first_response_at automaticamente
CREATE OR REPLACE FUNCTION public.update_lead_first_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza first_response_at apenas se for a primeira interação e ainda não tiver valor
  UPDATE public.leads 
  SET first_response_at = NEW.created_at 
  WHERE id = NEW.lead_id 
    AND first_response_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_lead_first_response ON public.lead_interactions;
CREATE TRIGGER trigger_lead_first_response
  AFTER INSERT ON public.lead_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_first_response();