-- Add is_lead_source column to whatsapp_instances
-- When true, incoming messages from this instance will create leads and trigger AI agent
-- Only ONE instance should be the lead source (the "Principal" instance)
ALTER TABLE public.whatsapp_instances
ADD COLUMN IF NOT EXISTS is_lead_source BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.whatsapp_instances.is_lead_source IS 
'Se true, mensagens recebidas nesta instância criam leads automaticamente e ativam o agente de IA. Apenas UMA instância deve ter este flag ativo (a instância principal).';

-- Create a function to ensure only one instance can be lead_source
CREATE OR REPLACE FUNCTION ensure_single_lead_source()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_lead_source = true THEN
    -- Set all other instances to false
    UPDATE public.whatsapp_instances
    SET is_lead_source = false
    WHERE id != NEW.id AND is_lead_source = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single lead source
DROP TRIGGER IF EXISTS ensure_single_lead_source_trigger ON public.whatsapp_instances;
CREATE TRIGGER ensure_single_lead_source_trigger
BEFORE INSERT OR UPDATE ON public.whatsapp_instances
FOR EACH ROW
WHEN (NEW.is_lead_source = true)
EXECUTE FUNCTION ensure_single_lead_source();