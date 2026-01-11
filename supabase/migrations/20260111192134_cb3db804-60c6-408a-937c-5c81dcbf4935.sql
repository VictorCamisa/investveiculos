-- Adicionar coluna para vincular agente a instância WhatsApp
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS whatsapp_instance_id uuid REFERENCES public.whatsapp_instances(id);

-- Adicionar coluna para controlar se o bot está ativo na instância
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS whatsapp_auto_reply boolean DEFAULT true;

-- Adicionar coluna para controlar transferência para humano
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS transfer_to_human_enabled boolean DEFAULT true;

-- Adicionar coluna para palavras-chave que ativam transferência
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS transfer_keywords text[] DEFAULT ARRAY['falar com humano', 'atendente', 'vendedor', 'pessoa real'];

-- Índice para buscar agentes por instância
CREATE INDEX IF NOT EXISTS idx_ai_agents_whatsapp_instance ON public.ai_agents(whatsapp_instance_id);

-- Criar tabela para controlar conversas que foram transferidas para humano
CREATE TABLE IF NOT EXISTS public.ai_agent_human_takeover (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_agent_conversations(id),
  lead_id uuid REFERENCES public.leads(id),
  phone text,
  instance_id uuid REFERENCES public.whatsapp_instances(id),
  taken_over_by uuid REFERENCES public.profiles(id),
  taken_over_at timestamptz DEFAULT now(),
  released_at timestamptz,
  reason text
);

-- RLS
ALTER TABLE public.ai_agent_human_takeover ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON public.ai_agent_human_takeover
FOR ALL USING (true) WITH CHECK (true);

-- Índice para buscar takeovers ativos por telefone/lead
CREATE INDEX IF NOT EXISTS idx_ai_agent_human_takeover_phone ON public.ai_agent_human_takeover(phone);
CREATE INDEX IF NOT EXISTS idx_ai_agent_human_takeover_lead ON public.ai_agent_human_takeover(lead_id);