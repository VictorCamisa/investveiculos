-- Adicionar campos de localização e Mercado Livre na tabela vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS ml_item_id TEXT,
ADD COLUMN IF NOT EXISTS ml_status TEXT,
ADD COLUMN IF NOT EXISTS ml_permalink TEXT,
ADD COLUMN IF NOT EXISTS ml_listing_type TEXT DEFAULT 'gold_special',
ADD COLUMN IF NOT EXISTS ml_published_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela para tokens do Mercado Livre
CREATE TABLE IF NOT EXISTS public.mercadolibre_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ml_user_id TEXT NOT NULL,
  ml_nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.mercadolibre_tokens ENABLE ROW LEVEL SECURITY;

-- Policies para mercadolibre_tokens
CREATE POLICY "Gerentes podem ver tokens ML" 
ON public.mercadolibre_tokens 
FOR SELECT 
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir tokens ML" 
ON public.mercadolibre_tokens 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar tokens ML" 
ON public.mercadolibre_tokens 
FOR UPDATE 
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar tokens ML" 
ON public.mercadolibre_tokens 
FOR DELETE 
USING (has_role(auth.uid(), 'gerente'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_mercadolibre_tokens_updated_at
BEFORE UPDATE ON public.mercadolibre_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para imagens de veículos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket de imagens
CREATE POLICY "Imagens de veículos são públicas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Usuários autenticados podem fazer upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');

CREATE POLICY "Gerentes podem deletar imagens" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vehicle-images' AND has_role(auth.uid(), 'gerente'::app_role));