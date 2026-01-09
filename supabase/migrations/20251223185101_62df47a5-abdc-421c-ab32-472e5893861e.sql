-- Gera comissão para venda já concluída que não tem comissão ainda
INSERT INTO sale_commissions (sale_id, user_id, commission_rule_id, calculated_amount, final_amount, status)
SELECT 
  s.id,
  s.salesperson_id,
  r.id,
  r.fixed_value,
  r.fixed_value,
  'pending'
FROM sales s
CROSS JOIN (
  SELECT id, fixed_value 
  FROM commission_rules 
  WHERE is_active = true 
  ORDER BY priority DESC 
  LIMIT 1
) r
WHERE s.status = 'concluida'
  AND NOT EXISTS (SELECT 1 FROM sale_commissions sc WHERE sc.sale_id = s.id);