-- PARTE 3: CRIAR FUNÇÕES SQL NOVAS

-- Função is_master_user
CREATE OR REPLACE FUNCTION public.is_master_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND is_master = true
  )
$$;

-- Função has_permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND module = _module
      AND permission = _permission
  )
$$;

-- Função get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(module text, permissions text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT module, array_agg(permission)
  FROM public.user_permissions
  WHERE user_id = _user_id
  GROUP BY module
$$;

-- Função get_next_round_robin_salesperson
CREATE OR REPLACE FUNCTION public.get_next_round_robin_salesperson()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_salesperson_id uuid;
BEGIN
  SELECT user_id INTO next_salesperson_id
  FROM round_robin_config
  WHERE is_active = true
    AND (daily_limit IS NULL OR current_count < daily_limit)
  ORDER BY 
    COALESCE(last_assigned_at, '1970-01-01'::timestamptz),
    priority DESC
  LIMIT 1;

  RETURN next_salesperson_id;
END;
$$;

-- Função increment_round_robin_counters
CREATE OR REPLACE FUNCTION public.increment_round_robin_counters(p_salesperson_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE round_robin_config
  SET 
    current_count = current_count + 1,
    last_assigned_at = now()
  WHERE user_id = p_salesperson_id;
END;
$$;

-- Função reset_daily_lead_counts
CREATE OR REPLACE FUNCTION public.reset_daily_lead_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE round_robin_config
  SET current_count = 0;
END;
$$;

-- Função create_notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, message)
  VALUES (p_user_id, p_title, p_message)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Função log_activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO activity_logs (user_id, action, module, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_details)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- PARTE 4: CRIAR VIEW sale_profit_report (usando amount ao invés de final_amount)
DROP VIEW IF EXISTS public.sale_profit_report;

CREATE VIEW public.sale_profit_report AS
SELECT 
  s.id AS sale_id,
  s.vehicle_id,
  s.customer_id,
  s.seller_id AS salesperson_id,
  s.sale_price,
  s.profit,
  s.total_costs,
  s.status,
  s.sale_date,
  s.created_at,
  v.brand,
  v.model,
  v.year_model,
  v.plate,
  v.price_purchase AS vehicle_purchase_price,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id), 0) AS vehicle_total_costs,
  COALESCE(v.price_purchase, 0) + COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id), 0) AS vehicle_total_investment,
  s.sale_price - COALESCE(v.price_purchase, 0) AS gross_profit,
  EXTRACT(DAY FROM (s.sale_date::timestamp - COALESCE(v.purchase_date, v.created_at::date)::timestamp))::integer AS days_in_stock,
  COALESCE((SELECT SUM(amount) FROM sale_commissions WHERE sale_id = s.id), 0) AS total_commissions,
  s.sale_price 
    - COALESCE(v.price_purchase, 0) 
    - COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id), 0)
    - COALESCE(s.total_costs, 0)
    - COALESCE((SELECT SUM(amount) FROM sale_commissions WHERE sale_id = s.id), 0)
  AS net_profit
FROM sales s
LEFT JOIN vehicles v ON s.vehicle_id = v.id;

-- PARTE 5: CRIAR VIEW vehicle_dre
CREATE OR REPLACE VIEW public.vehicle_dre AS
SELECT 
  v.id,
  v.brand,
  v.model,
  v.plate,
  v.year_model,
  v.status,
  v.price_purchase AS purchase_price,
  v.price_sale AS sale_price,
  v.purchase_date,
  v.estimated_maintenance,
  v.estimated_documentation,
  v.estimated_cleaning,
  v.estimated_other_costs,
  v.expected_margin_percent,
  v.expected_sale_days,
  v.created_at,
  v.updated_at,
  COALESCE(v.estimated_maintenance, 0) + COALESCE(v.estimated_documentation, 0) + COALESCE(v.estimated_cleaning, 0) + COALESCE(v.estimated_other_costs, 0) AS total_estimated_costs,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'aquisicao'), 0) AS cost_aquisicao,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'documentacao'), 0) AS cost_documentacao,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'transferencia'), 0) AS cost_transferencia,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'ipva'), 0) AS cost_ipva,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'manutencao'), 0) AS cost_manutencao,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'limpeza'), 0) AS cost_limpeza,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'frete'), 0) AS cost_frete,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'comissao_compra'), 0) AS cost_comissao_compra,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id AND cost_type = 'outros'), 0) AS cost_outros,
  COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id), 0) AS total_real_costs,
  COALESCE(v.price_purchase, 0) + COALESCE((SELECT SUM(amount) FROM vehicle_costs WHERE vehicle_id = v.id), 0) AS total_investment,
  EXTRACT(DAY FROM (COALESCE(
    (SELECT sale_date FROM sales WHERE vehicle_id = v.id AND status = 'Concluída' LIMIT 1)::timestamp,
    now()
  ) - COALESCE(v.purchase_date, v.created_at::date)::timestamp))::integer AS days_in_stock,
  ROUND(EXTRACT(DAY FROM (COALESCE(
    (SELECT sale_date FROM sales WHERE vehicle_id = v.id AND status = 'Concluída' LIMIT 1)::timestamp,
    now()
  ) - COALESCE(v.purchase_date, v.created_at::date)::timestamp)) * 10)::numeric AS holding_cost
FROM vehicles v;

-- PARTE 6: CRIAR VIEW salesperson_ranking (usando amount ao invés de final_amount)
CREATE OR REPLACE VIEW public.salesperson_ranking AS
SELECT 
  p.id AS user_id,
  p.full_name,
  COUNT(DISTINCT s.id) AS total_sales,
  COALESCE(SUM(s.sale_price), 0) AS total_revenue,
  COUNT(DISTINCT CASE 
    WHEN EXTRACT(MONTH FROM s.sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM s.sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    THEN s.id 
  END) AS sales_this_month,
  COALESCE(SUM(CASE 
    WHEN EXTRACT(MONTH FROM s.sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM s.sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    THEN s.sale_price 
  END), 0) AS revenue_this_month,
  COALESCE(SUM(s.sale_price - COALESCE(v.price_purchase, 0)), 0) AS total_profit,
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN ROUND(SUM(s.sale_price - COALESCE(v.price_purchase, 0)) / COUNT(DISTINCT s.id), 2)
    ELSE 0 
  END AS avg_profit_per_sale,
  COALESCE((SELECT SUM(amount) FROM sale_commissions WHERE user_id = p.id), 0) AS total_commissions
FROM profiles p
LEFT JOIN sales s ON s.seller_id = p.id AND s.status = 'Concluída'
LEFT JOIN vehicles v ON s.vehicle_id = v.id
WHERE EXISTS (SELECT 1 FROM user_roles WHERE user_id = p.id AND role = 'vendedor')
GROUP BY p.id, p.full_name;