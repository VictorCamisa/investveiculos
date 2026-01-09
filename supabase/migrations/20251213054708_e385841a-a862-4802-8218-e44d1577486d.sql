
-- Enum para tipos de pagamento
CREATE TYPE public.payment_method AS ENUM (
  'dinheiro',
  'pix',
  'cartao_credito',
  'cartao_debito',
  'financiamento',
  'consorcio',
  'permuta',
  'misto'
);

-- Enum para status da venda
CREATE TYPE public.sale_status AS ENUM (
  'pendente',
  'concluida',
  'cancelada'
);

-- Enum para tipo de comissão
CREATE TYPE public.commission_type AS ENUM (
  'percentual_lucro',
  'valor_fixo',
  'escalonada',
  'mista'
);

-- Tabela de vendas
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  salesperson_id UUID NOT NULL,
  
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_price NUMERIC NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'pix',
  payment_details TEXT,
  
  documentation_cost NUMERIC DEFAULT 0,
  transfer_cost NUMERIC DEFAULT 0,
  other_sale_costs NUMERIC DEFAULT 0,
  
  status sale_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at em sales
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerentes podem ver todas as vendas"
  ON public.sales FOR SELECT
  USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Vendedores veem suas próprias vendas"
  ON public.sales FOR SELECT
  USING (has_role(auth.uid(), 'vendedor') AND salesperson_id = auth.uid());

CREATE POLICY "Marketing pode ver vendas"
  ON public.sales FOR SELECT
  USING (has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes podem inserir vendas"
  ON public.sales FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem atualizar vendas"
  ON public.sales FOR UPDATE
  USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem deletar vendas"
  ON public.sales FOR DELETE
  USING (has_role(auth.uid(), 'gerente'));

-- Tabela de regras de comissão
CREATE TABLE public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  commission_type commission_type NOT NULL,
  
  -- Para percentual_lucro
  percentage_value NUMERIC,
  
  -- Para valor_fixo
  fixed_value NUMERIC,
  
  -- Condições (JSON para flexibilidade)
  min_vehicle_price NUMERIC,
  max_vehicle_price NUMERIC,
  min_profit_margin NUMERIC,
  vehicle_categories TEXT[],
  
  -- Escalonamento (para tipo escalonada)
  tiers JSONB,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_commission_rules_updated_at
  BEFORE UPDATE ON public.commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para commission_rules (apenas gerentes)
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas gerentes veem regras de comissão"
  ON public.commission_rules FOR SELECT
  USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Apenas gerentes inserem regras"
  ON public.commission_rules FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Apenas gerentes atualizam regras"
  ON public.commission_rules FOR UPDATE
  USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Apenas gerentes deletam regras"
  ON public.commission_rules FOR DELETE
  USING (has_role(auth.uid(), 'gerente'));

-- Tabela de comissões por venda
CREATE TABLE public.sale_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  commission_rule_id UUID REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  
  calculated_amount NUMERIC NOT NULL DEFAULT 0,
  manual_adjustment NUMERIC DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_sale_commissions_updated_at
  BEFORE UPDATE ON public.sale_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para sale_commissions
ALTER TABLE public.sale_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerentes veem todas as comissões"
  ON public.sale_commissions FOR SELECT
  USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Vendedores veem suas próprias comissões"
  ON public.sale_commissions FOR SELECT
  USING (has_role(auth.uid(), 'vendedor') AND user_id = auth.uid());

CREATE POLICY "Gerentes podem inserir comissões"
  ON public.sale_commissions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem atualizar comissões"
  ON public.sale_commissions FOR UPDATE
  USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem deletar comissões"
  ON public.sale_commissions FOR DELETE
  USING (has_role(auth.uid(), 'gerente'));

-- Tabela de campanhas de marketing
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  budget NUMERIC NOT NULL DEFAULT 0,
  spent NUMERIC NOT NULL DEFAULT 0,
  
  start_date DATE NOT NULL,
  end_date DATE,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para marketing_campaigns
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerentes e Marketing veem campanhas"
  ON public.marketing_campaigns FOR SELECT
  USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing inserem campanhas"
  ON public.marketing_campaigns FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing atualizam campanhas"
  ON public.marketing_campaigns FOR UPDATE
  USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Apenas gerentes deletam campanhas"
  ON public.marketing_campaigns FOR DELETE
  USING (has_role(auth.uid(), 'gerente'));

-- Tabela de custos de leads (CAC)
CREATE TABLE public.lead_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  cost_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para lead_costs
ALTER TABLE public.lead_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerentes e Marketing veem custos de leads"
  ON public.lead_costs FOR SELECT
  USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing inserem custos"
  ON public.lead_costs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Gerentes e Marketing atualizam custos"
  ON public.lead_costs FOR UPDATE
  USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'marketing'));

CREATE POLICY "Apenas gerentes deletam custos"
  ON public.lead_costs FOR DELETE
  USING (has_role(auth.uid(), 'gerente'));

-- View de DRE completo por venda (lucro real)
CREATE OR REPLACE VIEW public.sale_profit_report AS
SELECT 
  s.id,
  s.sale_date,
  s.sale_price,
  s.customer_id,
  s.vehicle_id,
  s.lead_id,
  s.salesperson_id,
  s.status,
  
  -- Dados do veículo
  v.brand,
  v.model,
  v.year_model,
  v.plate,
  v.purchase_price AS vehicle_purchase_price,
  
  -- Custos do veículo (da view vehicle_dre)
  vd.total_real_costs AS vehicle_total_costs,
  vd.total_investment AS vehicle_total_investment,
  vd.days_in_stock,
  vd.holding_cost,
  
  -- Custos da venda
  s.documentation_cost,
  s.transfer_cost,
  s.other_sale_costs,
  COALESCE(s.documentation_cost, 0) + COALESCE(s.transfer_cost, 0) + COALESCE(s.other_sale_costs, 0) AS total_sale_costs,
  
  -- CAC (custo de aquisição do lead)
  COALESCE((SELECT SUM(cost_amount) FROM public.lead_costs WHERE lead_id = s.lead_id), 0) AS lead_cac,
  
  -- Comissões
  COALESCE((SELECT SUM(final_amount) FROM public.sale_commissions WHERE sale_id = s.id), 0) AS total_commissions,
  
  -- Lucro bruto (venda - investimento no veículo)
  s.sale_price - COALESCE(vd.total_investment, COALESCE(v.purchase_price, 0)) AS gross_profit,
  
  -- Lucro líquido (bruto - custos da venda - CAC - comissões)
  s.sale_price 
    - COALESCE(vd.total_investment, COALESCE(v.purchase_price, 0))
    - COALESCE(s.documentation_cost, 0) 
    - COALESCE(s.transfer_cost, 0) 
    - COALESCE(s.other_sale_costs, 0)
    - COALESCE((SELECT SUM(cost_amount) FROM public.lead_costs WHERE lead_id = s.lead_id), 0)
    - COALESCE((SELECT SUM(final_amount) FROM public.sale_commissions WHERE sale_id = s.id), 0) AS net_profit,
    
  s.created_at,
  s.updated_at
FROM public.sales s
LEFT JOIN public.vehicles v ON s.vehicle_id = v.id
LEFT JOIN public.vehicle_dre vd ON s.vehicle_id = vd.id;

-- Atualizar status do veículo para 'vendido' quando venda é concluída
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluida' AND OLD.status != 'concluida' THEN
    UPDATE public.vehicles SET status = 'vendido' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status != 'concluida' AND OLD.status = 'concluida' THEN
    UPDATE public.vehicles SET status = 'disponivel' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_vehicle_on_sale
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_status_on_sale();

-- Atualizar lead para 'convertido' quando venda é criada
CREATE OR REPLACE FUNCTION public.update_lead_status_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads SET status = 'convertido' WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_lead_on_sale_insert
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_status_on_sale();
