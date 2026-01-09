-- Create financial_transactions table for managing expenses, revenues, and operational costs
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  payment_method TEXT,
  recurrence TEXT CHECK (recurrence IN ('unica', 'mensal', 'semanal', 'anual')),
  recurrence_end_date DATE,
  notes TEXT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Gerentes podem ver todas as transações"
ON public.financial_transactions FOR SELECT
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir transações"
ON public.financial_transactions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar transações"
ON public.financial_transactions FOR UPDATE
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar transações"
ON public.financial_transactions FOR DELETE
USING (has_role(auth.uid(), 'gerente'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_financial_transactions_category ON public.financial_transactions(category);
CREATE INDEX idx_financial_transactions_status ON public.financial_transactions(status);

-- Create categories table for organizing expense/revenue categories
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'ambos')),
  parent_id UUID REFERENCES public.financial_categories(id) ON DELETE CASCADE,
  icon TEXT,
  color TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Todos podem ver categorias"
ON public.financial_categories FOR SELECT
USING (true);

CREATE POLICY "Gerentes podem gerenciar categorias"
ON public.financial_categories FOR ALL
USING (has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

-- Insert default categories
INSERT INTO public.financial_categories (name, type, is_system) VALUES
-- Despesas operacionais
('Aluguel', 'despesa', true),
('Salários', 'despesa', true),
('Encargos Trabalhistas', 'despesa', true),
('Energia Elétrica', 'despesa', true),
('Água', 'despesa', true),
('Internet/Telefone', 'despesa', true),
('Material de Escritório', 'despesa', true),
('Marketing', 'despesa', true),
('Impostos', 'despesa', true),
('Seguros', 'despesa', true),
('Manutenção Predial', 'despesa', true),
('Despesas Bancárias', 'despesa', true),
('Contabilidade', 'despesa', true),
('Combustível', 'despesa', true),
('Outros', 'despesa', true),
-- Receitas
('Venda de Veículos', 'receita', true),
('Serviços', 'receita', true),
('Comissões Recebidas', 'receita', true),
('Outros Recebimentos', 'receita', true);