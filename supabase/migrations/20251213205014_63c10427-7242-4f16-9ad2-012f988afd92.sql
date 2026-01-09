-- Corrigir views existentes para usar SECURITY INVOKER (CASCADE para dependências)
DROP VIEW IF EXISTS public.salesperson_ranking CASCADE;
DROP VIEW IF EXISTS public.sale_profit_report CASCADE;
DROP VIEW IF EXISTS public.vehicle_dre CASCADE;

-- Recriar vehicle_dre com SECURITY INVOKER
CREATE VIEW public.vehicle_dre 
WITH (security_invoker = true)
AS
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
  v.estimated_documentation,
  v.estimated_maintenance,
  v.estimated_cleaning,
  v.estimated_other_costs,
  v.expected_margin_percent,
  v.expected_sale_days,
  v.created_at,
  v.updated_at,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'aquisicao' THEN vc.amount ELSE 0 END), 0) as cost_aquisicao,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'documentacao' THEN vc.amount ELSE 0 END), 0) as cost_documentacao,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'transferencia' THEN vc.amount ELSE 0 END), 0) as cost_transferencia,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'ipva' THEN vc.amount ELSE 0 END), 0) as cost_ipva,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'manutencao' THEN vc.amount ELSE 0 END), 0) as cost_manutencao,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'limpeza' THEN vc.amount ELSE 0 END), 0) as cost_limpeza,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'frete' THEN vc.amount ELSE 0 END), 0) as cost_frete,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'comissao_compra' THEN vc.amount ELSE 0 END), 0) as cost_comissao_compra,
  COALESCE(SUM(CASE WHEN vc.cost_type = 'outros' THEN vc.amount ELSE 0 END), 0) as cost_outros,
  COALESCE(SUM(vc.amount), 0) as total_real_costs,
  COALESCE(v.estimated_documentation, 0) + COALESCE(v.estimated_maintenance, 0) + COALESCE(v.estimated_cleaning, 0) + COALESCE(v.estimated_other_costs, 0) as total_estimated_costs,
  COALESCE(v.purchase_price, 0) + COALESCE(SUM(vc.amount), 0) as total_investment,
  CASE WHEN v.purchase_date IS NOT NULL THEN CURRENT_DATE - v.purchase_date ELSE 0 END as days_in_stock,
  CASE WHEN v.purchase_date IS NOT NULL THEN (CURRENT_DATE - v.purchase_date) * 50 ELSE 0 END as holding_cost
FROM public.vehicles v
LEFT JOIN public.vehicle_costs vc ON vc.vehicle_id = v.id
GROUP BY v.id, v.brand, v.model, v.year_model, v.plate, v.status, v.purchase_price, v.purchase_date, v.sale_price, 
         v.estimated_documentation, v.estimated_maintenance, v.estimated_cleaning, v.estimated_other_costs,
         v.expected_margin_percent, v.expected_sale_days, v.created_at, v.updated_at;

-- Recriar sale_profit_report com SECURITY INVOKER
CREATE VIEW public.sale_profit_report
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.sale_date,
  s.sale_price,
  s.customer_id,
  s.vehicle_id,
  s.lead_id,
  s.salesperson_id,
  s.status,
  v.brand,
  v.model,
  v.year_model,
  v.plate,
  v.purchase_price as vehicle_purchase_price,
  vd.total_real_costs as vehicle_total_costs,
  vd.total_investment as vehicle_total_investment,
  vd.days_in_stock,
  vd.holding_cost,
  s.documentation_cost,
  s.transfer_cost,
  s.other_sale_costs,
  COALESCE(s.documentation_cost, 0) + COALESCE(s.transfer_cost, 0) + COALESCE(s.other_sale_costs, 0) as total_sale_costs,
  COALESCE((SELECT SUM(lc.cost_amount) FROM public.lead_costs lc WHERE lc.lead_id = s.lead_id), 0) as lead_cac,
  COALESCE((SELECT SUM(sc.final_amount) FROM public.sale_commissions sc WHERE sc.sale_id = s.id), 0) as total_commissions,
  s.sale_price - COALESCE(vd.total_investment, 0) as gross_profit,
  s.sale_price - COALESCE(vd.total_investment, 0) 
    - COALESCE(s.documentation_cost, 0) 
    - COALESCE(s.transfer_cost, 0) 
    - COALESCE(s.other_sale_costs, 0)
    - COALESCE((SELECT SUM(lc.cost_amount) FROM public.lead_costs lc WHERE lc.lead_id = s.lead_id), 0)
    - COALESCE((SELECT SUM(sc.final_amount) FROM public.sale_commissions sc WHERE sc.sale_id = s.id), 0) as net_profit,
  s.created_at,
  s.updated_at
FROM public.sales s
JOIN public.vehicles v ON v.id = s.vehicle_id
LEFT JOIN public.vehicle_dre vd ON vd.id = s.vehicle_id;

-- Recriar salesperson_ranking com SECURITY INVOKER
CREATE VIEW public.salesperson_ranking 
WITH (security_invoker = true)
AS
SELECT 
  p.id as user_id,
  p.full_name,
  COUNT(DISTINCT s.id) as total_sales,
  COALESCE(SUM(s.sale_price), 0) as total_revenue,
  COALESCE(SUM(spr.net_profit), 0) as total_profit,
  COALESCE(SUM(sc.final_amount), 0) as total_commissions,
  COALESCE(AVG(spr.net_profit), 0) as avg_profit_per_sale,
  COUNT(DISTINCT CASE WHEN s.sale_date >= date_trunc('month', CURRENT_DATE) THEN s.id END) as sales_this_month,
  COALESCE(SUM(CASE WHEN s.sale_date >= date_trunc('month', CURRENT_DATE) THEN s.sale_price ELSE 0 END), 0) as revenue_this_month
FROM public.profiles p
LEFT JOIN public.sales s ON s.salesperson_id = p.id AND s.status = 'concluida'
LEFT JOIN public.sale_profit_report spr ON spr.id = s.id
LEFT JOIN public.sale_commissions sc ON sc.sale_id = s.id
GROUP BY p.id, p.full_name
ORDER BY total_revenue DESC;