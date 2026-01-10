-- =============================================
-- PARTE 8: RECRIAR VIEWS COM final_amount
-- =============================================

-- Recriar view salesperson_ranking
DROP VIEW IF EXISTS public.salesperson_ranking;

CREATE VIEW public.salesperson_ranking AS
SELECT 
  p.id AS user_id,
  p.full_name,
  COUNT(s.id) AS total_sales,
  COALESCE(SUM(s.sale_price), 0) AS total_revenue,
  COALESCE(SUM(s.profit), 0) AS total_profit,
  COALESCE(AVG(s.profit), 0) AS avg_profit_per_sale,
  COALESCE(SUM(sc.final_amount), 0) AS total_commissions,
  COUNT(s.id) FILTER (WHERE EXTRACT(MONTH FROM s.sale_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM s.sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)) AS sales_this_month,
  COALESCE(SUM(s.sale_price) FILTER (WHERE EXTRACT(MONTH FROM s.sale_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM s.sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) AS revenue_this_month
FROM public.profiles p
LEFT JOIN public.sales s ON p.id = s.seller_id
LEFT JOIN public.sale_commissions sc ON s.id = sc.sale_id AND sc.user_id = p.id
GROUP BY p.id, p.full_name;

-- Recriar view sale_profit_report
DROP VIEW IF EXISTS public.sale_profit_report;

CREATE VIEW public.sale_profit_report AS
SELECT 
  s.id AS sale_id,
  s.vehicle_id,
  s.customer_id,
  s.seller_id AS salesperson_id,
  s.sale_price,
  s.total_costs,
  s.profit,
  s.sale_date,
  s.status,
  s.created_at,
  v.brand,
  v.model,
  v.plate,
  v.year_model,
  v.purchase_price AS vehicle_purchase_price,
  COALESCE((SELECT SUM(vc.amount) FROM public.vehicle_costs vc WHERE vc.vehicle_id = v.id), 0) AS vehicle_total_costs,
  v.purchase_price + COALESCE((SELECT SUM(vc.amount) FROM public.vehicle_costs vc WHERE vc.vehicle_id = v.id), 0) AS vehicle_total_investment,
  s.sale_price - v.purchase_price AS gross_profit,
  s.sale_price - v.purchase_price - COALESCE((SELECT SUM(vc.amount) FROM public.vehicle_costs vc WHERE vc.vehicle_id = v.id), 0) - COALESCE((SELECT SUM(sc.final_amount) FROM public.sale_commissions sc WHERE sc.sale_id = s.id), 0) AS net_profit,
  COALESCE((SELECT SUM(sc.final_amount) FROM public.sale_commissions sc WHERE sc.sale_id = s.id), 0) AS total_commissions,
  (s.sale_date - v.purchase_date) AS days_in_stock
FROM public.sales s
LEFT JOIN public.vehicles v ON s.vehicle_id = v.id;