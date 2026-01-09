-- Habilitar RLS nas tabelas
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_simulations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Vehicles
CREATE POLICY "Usuários autenticados podem ver veículos"
ON public.vehicles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerentes podem inserir veículos"
ON public.vehicles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem atualizar veículos"
ON public.vehicles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem deletar veículos"
ON public.vehicles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Políticas RLS para Vehicle Costs
CREATE POLICY "Usuários autenticados podem ver custos"
ON public.vehicle_costs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerentes podem inserir custos"
ON public.vehicle_costs FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem atualizar custos"
ON public.vehicle_costs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem deletar custos"
ON public.vehicle_costs FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Políticas RLS para Vehicle Images
CREATE POLICY "Usuários autenticados podem ver imagens"
ON public.vehicle_images FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerentes podem inserir imagens"
ON public.vehicle_images FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem atualizar imagens"
ON public.vehicle_images FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem deletar imagens"
ON public.vehicle_images FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Políticas RLS para Vehicle Simulations
CREATE POLICY "Gerentes podem ver simulações"
ON public.vehicle_simulations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem inserir simulações"
ON public.vehicle_simulations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerentes podem deletar simulações"
ON public.vehicle_simulations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Trigger para updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- View para DRE do Veículo
CREATE OR REPLACE VIEW public.vehicle_dre AS
SELECT 
  v.id,
  v.brand,
  v.model,
  v.year_model,
  v.plate,
  v.status,
  v.purchase_price,
  v.purchase_date,
  v.sale_price,
  v.expected_margin_percent,
  v.expected_sale_days,
  
  -- Custos reais agrupados
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'aquisicao'), 0) AS cost_aquisicao,
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'documentacao'), 0) AS cost_documentacao,
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'transferencia'), 0) AS cost_transferencia,
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'ipva'), 0) AS cost_ipva,
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'manutencao'), 0) AS cost_manutencao,
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'limpeza'), 0) AS cost_limpeza,
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'frete'), 0) AS cost_frete,
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'comissao_compra'), 0) AS cost_comissao_compra,
  COALESCE(SUM(vc.amount) FILTER (WHERE vc.cost_type = 'outros'), 0) AS cost_outros,
  
  -- Total de custos reais
  COALESCE(SUM(vc.amount), 0) AS total_real_costs,
  
  -- Custo total (compra + custos)
  COALESCE(v.purchase_price, 0) + COALESCE(SUM(vc.amount), 0) AS total_investment,
  
  -- Dias em estoque
  CASE 
    WHEN v.purchase_date IS NOT NULL THEN 
      (CURRENT_DATE - v.purchase_date)
    ELSE 0
  END AS days_in_stock,
  
  -- Custo diário de capital (considerando 2% ao mês)
  CASE 
    WHEN v.purchase_date IS NOT NULL AND v.purchase_price > 0 THEN 
      ROUND((v.purchase_price * 0.02 / 30) * (CURRENT_DATE - v.purchase_date), 2)
    ELSE 0
  END AS holding_cost,
  
  -- Margem esperada vs estimada
  v.estimated_maintenance,
  v.estimated_cleaning,
  v.estimated_documentation,
  v.estimated_other_costs,
  COALESCE(v.estimated_maintenance, 0) + 
  COALESCE(v.estimated_cleaning, 0) + 
  COALESCE(v.estimated_documentation, 0) + 
  COALESCE(v.estimated_other_costs, 0) AS total_estimated_costs,
  
  v.created_at,
  v.updated_at
  
FROM public.vehicles v
LEFT JOIN public.vehicle_costs vc ON vc.vehicle_id = v.id
GROUP BY v.id;