-- Adicionar novos campos na tabela commission_rules para funcionalidades avançadas
ALTER TABLE public.commission_rules 
ADD COLUMN IF NOT EXISTS min_days_in_stock integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_days_in_stock integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lead_source_bonus jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS goal_period text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS goal_target integer DEFAULT NULL;

-- Adicionar novos campos na tabela sale_commissions para gestão completa
ALTER TABLE public.sale_commissions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
ADD COLUMN IF NOT EXISTS payment_due_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS split_percentage numeric DEFAULT 100;

-- Criar tabela para divisão de comissões entre múltiplos vendedores
CREATE TABLE IF NOT EXISTS public.commission_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  percentage numeric NOT NULL DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sale_id, user_id)
);

ALTER TABLE public.commission_splits ENABLE ROW LEVEL SECURITY;

-- RLS policies para commission_splits
CREATE POLICY "Gerentes podem ver todas as divisões" ON public.commission_splits
FOR SELECT USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir divisões" ON public.commission_splits
FOR INSERT WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar divisões" ON public.commission_splits
FOR UPDATE USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar divisões" ON public.commission_splits
FOR DELETE USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Vendedores veem suas próprias divisões" ON public.commission_splits
FOR SELECT USING (has_role(auth.uid(), 'vendedor'::app_role) AND user_id = auth.uid());

-- Criar tabela para metas de vendedores
CREATE TABLE IF NOT EXISTS public.salesperson_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_sales integer NOT NULL DEFAULT 0,
  target_revenue numeric NOT NULL DEFAULT 0,
  target_profit numeric NOT NULL DEFAULT 0,
  current_sales integer NOT NULL DEFAULT 0,
  current_revenue numeric NOT NULL DEFAULT 0,
  current_profit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

ALTER TABLE public.salesperson_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies para salesperson_goals
CREATE POLICY "Gerentes podem ver todas as metas" ON public.salesperson_goals
FOR SELECT USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir metas" ON public.salesperson_goals
FOR INSERT WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar metas" ON public.salesperson_goals
FOR UPDATE USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar metas" ON public.salesperson_goals
FOR DELETE USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Vendedores veem suas próprias metas" ON public.salesperson_goals
FOR SELECT USING (has_role(auth.uid(), 'vendedor'::app_role) AND user_id = auth.uid());

-- Criar tabela para histórico/auditoria de comissões
CREATE TABLE IF NOT EXISTS public.commission_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.sale_commissions(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.commission_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerentes podem ver todo o histórico" ON public.commission_audit_log
FOR SELECT USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Sistema pode inserir logs" ON public.commission_audit_log
FOR INSERT WITH CHECK (true);

-- Trigger para atualizar updated_at em salesperson_goals
CREATE TRIGGER update_salesperson_goals_updated_at
BEFORE UPDATE ON public.salesperson_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar view para ranking de vendedores
CREATE OR REPLACE VIEW public.salesperson_ranking AS
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