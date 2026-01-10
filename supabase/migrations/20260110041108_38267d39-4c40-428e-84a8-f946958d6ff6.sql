-- Adicionar colunas faltantes na tabela negotiations
ALTER TABLE public.negotiations 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS salesperson_id UUID,
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC,
ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS actual_close_date DATE,
ADD COLUMN IF NOT EXISTS loss_reason TEXT,
ADD COLUMN IF NOT EXISTS structured_loss_reason TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS appointment_date DATE,
ADD COLUMN IF NOT EXISTS appointment_time TIME,
ADD COLUMN IF NOT EXISTS showed_up BOOLEAN,
ADD COLUMN IF NOT EXISTS objections TEXT[] DEFAULT '{}';

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_negotiations_lead_id ON public.negotiations(lead_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_salesperson_id ON public.negotiations(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON public.negotiations(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_negotiations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_negotiations_updated_at_trigger ON public.negotiations;
CREATE TRIGGER update_negotiations_updated_at_trigger
BEFORE UPDATE ON public.negotiations
FOR EACH ROW
EXECUTE FUNCTION public.update_negotiations_updated_at();