-- Atualizar view salesperson_ranking para mostrar apenas vendedores (não gerentes)
DROP VIEW IF EXISTS public.salesperson_ranking;

CREATE VIEW public.salesperson_ranking AS
SELECT 
  p.id AS user_id,
  p.full_name,
  COUNT(DISTINCT s.id) AS total_sales,
  COALESCE(SUM(s.sale_price), 0) AS total_revenue,
  COALESCE(SUM(spr.net_profit), 0) AS total_profit,
  COALESCE(SUM(sc.final_amount), 0) AS total_commissions,
  COALESCE(AVG(spr.net_profit), 0) AS avg_profit_per_sale,
  COUNT(DISTINCT CASE 
    WHEN s.sale_date >= date_trunc('month', CURRENT_DATE) THEN s.id 
    ELSE NULL 
  END) AS sales_this_month,
  COALESCE(SUM(CASE 
    WHEN s.sale_date >= date_trunc('month', CURRENT_DATE) THEN s.sale_price 
    ELSE 0 
  END), 0) AS revenue_this_month
FROM profiles p
-- Apenas usuários que têm role 'vendedor' e NÃO têm role 'gerente'
INNER JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'vendedor'
-- Excluir quem também é gerente
LEFT JOIN user_roles ur_gerente ON ur_gerente.user_id = p.id AND ur_gerente.role = 'gerente'
LEFT JOIN sales s ON s.salesperson_id = p.id AND s.status = 'concluida'
LEFT JOIN sale_profit_report spr ON spr.id = s.id
LEFT JOIN sale_commissions sc ON sc.sale_id = s.id
WHERE ur_gerente.id IS NULL -- Não é gerente
  AND p.is_active = true -- Apenas usuários ativos
GROUP BY p.id, p.full_name
ORDER BY total_revenue DESC;