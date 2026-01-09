-- Corrigir a view salesperson_ranking para usar SECURITY INVOKER
DROP VIEW IF EXISTS public.salesperson_ranking;

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