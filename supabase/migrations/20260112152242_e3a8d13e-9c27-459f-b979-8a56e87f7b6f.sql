-- Corrigir o nome do lead para usar o nome correto do contato WhatsApp
UPDATE public.leads l
SET 
  name = wc.name,
  updated_at = now()
FROM public.whatsapp_contacts wc
WHERE wc.lead_id = l.id
  AND wc.name IS NOT NULL 
  AND wc.name != ''
  AND l.name != wc.name
  AND l.id = '9f33c533-b8bd-495b-82e6-e31d554d13fb';

-- Criar trigger para sincronizar nome do lead com contato WhatsApp
CREATE OR REPLACE FUNCTION sync_lead_name_from_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando o contato WhatsApp for atualizado com um novo nome
  IF NEW.lead_id IS NOT NULL AND NEW.name IS NOT NULL AND NEW.name != '' THEN
    UPDATE public.leads
    SET name = NEW.name, updated_at = now()
    WHERE id = NEW.lead_id
      AND (name IS NULL OR name = 'WhatsApp' OR name = 'Cliente Interessado' OR name LIKE 'Lead %');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Adicionar trigger na tabela whatsapp_contacts
DROP TRIGGER IF EXISTS trigger_sync_lead_name ON public.whatsapp_contacts;
CREATE TRIGGER trigger_sync_lead_name
AFTER INSERT OR UPDATE OF name ON public.whatsapp_contacts
FOR EACH ROW
EXECUTE FUNCTION sync_lead_name_from_whatsapp();