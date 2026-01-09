-- Create Round Robin configuration table
CREATE TABLE public.round_robin_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  max_leads_per_day INTEGER DEFAULT NULL,
  current_leads_today INTEGER NOT NULL DEFAULT 0,
  last_assigned_at TIMESTAMP WITH TIME ZONE,
  total_leads_assigned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(salesperson_id)
);

-- Create lead assignment history table
CREATE TABLE public.lead_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  salesperson_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  assignment_type TEXT NOT NULL DEFAULT 'round_robin', -- round_robin, manual
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.round_robin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for round_robin_config
CREATE POLICY "Gerentes podem ver config round robin"
ON public.round_robin_config FOR SELECT
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir config round robin"
ON public.round_robin_config FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar config round robin"
ON public.round_robin_config FOR UPDATE
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar config round robin"
ON public.round_robin_config FOR DELETE
USING (has_role(auth.uid(), 'gerente'::app_role));

-- RLS policies for lead_assignments
CREATE POLICY "Gerentes podem ver todas atribuições"
ON public.lead_assignments FOR SELECT
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Vendedores podem ver suas atribuições"
ON public.lead_assignments FOR SELECT
USING (has_role(auth.uid(), 'vendedor'::app_role) AND salesperson_id = auth.uid());

CREATE POLICY "Gerentes podem inserir atribuições"
ON public.lead_assignments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar atribuições"
ON public.lead_assignments FOR DELETE
USING (has_role(auth.uid(), 'gerente'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_round_robin_config_updated_at
BEFORE UPDATE ON public.round_robin_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to reset daily lead counts (for scheduled job)
CREATE OR REPLACE FUNCTION public.reset_daily_lead_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.round_robin_config SET current_leads_today = 0;
END;
$$;

-- Create function to get next salesperson in round robin
CREATE OR REPLACE FUNCTION public.get_next_round_robin_salesperson()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_salesperson_id UUID;
BEGIN
  SELECT salesperson_id INTO next_salesperson_id
  FROM public.round_robin_config
  WHERE is_active = true
    AND (max_leads_per_day IS NULL OR current_leads_today < max_leads_per_day)
  ORDER BY 
    last_assigned_at ASC NULLS FIRST,
    priority DESC,
    total_leads_assigned ASC
  LIMIT 1;
  
  RETURN next_salesperson_id;
END;
$$;