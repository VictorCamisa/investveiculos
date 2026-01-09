-- Create negotiation status enum
CREATE TYPE public.negotiation_status AS ENUM (
  'em_andamento',
  'proposta_enviada',
  'negociando',
  'ganho',
  'perdido',
  'pausado'
);

-- Create negotiations table (separate from leads - a lead can have multiple negotiations)
CREATE TABLE public.negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  salesperson_id UUID NOT NULL,
  status negotiation_status NOT NULL DEFAULT 'em_andamento',
  estimated_value NUMERIC,
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  loss_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for negotiations
CREATE POLICY "Gerentes podem ver todas as negociações"
ON public.negotiations FOR SELECT
USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Vendedores veem suas próprias negociações"
ON public.negotiations FOR SELECT
USING (has_role(auth.uid(), 'vendedor') AND salesperson_id = auth.uid());

CREATE POLICY "Marketing pode ver negociações"
ON public.negotiations FOR SELECT
USING (has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes podem inserir negociações"
ON public.negotiations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Vendedores podem inserir suas negociações"
ON public.negotiations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'vendedor') AND salesperson_id = auth.uid());

CREATE POLICY "Gerentes podem atualizar negociações"
ON public.negotiations FOR UPDATE
USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Vendedores podem atualizar suas negociações"
ON public.negotiations FOR UPDATE
USING (has_role(auth.uid(), 'vendedor') AND salesperson_id = auth.uid());

CREATE POLICY "Gerentes podem deletar negociações"
ON public.negotiations FOR DELETE
USING (has_role(auth.uid(), 'gerente'));

-- Add follow_up fields to lead_interactions
ALTER TABLE public.lead_interactions 
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS follow_up_completed BOOLEAN DEFAULT false;

-- Create updated_at trigger for negotiations
CREATE TRIGGER update_negotiations_updated_at
BEFORE UPDATE ON public.negotiations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_negotiations_salesperson ON public.negotiations(salesperson_id);
CREATE INDEX idx_negotiations_lead ON public.negotiations(lead_id);
CREATE INDEX idx_negotiations_status ON public.negotiations(status);
CREATE INDEX idx_lead_interactions_follow_up ON public.lead_interactions(follow_up_date) WHERE follow_up_completed = false;