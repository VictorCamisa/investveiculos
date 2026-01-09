-- Função que calcula e insere comissão ao concluir venda
CREATE OR REPLACE FUNCTION public.generate_commission_on_sale_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_calculated_amount NUMERIC := 0;
  v_vehicle RECORD;
  v_profit_margin NUMERIC;
BEGIN
  -- Só executa se a venda mudou para 'concluida'
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status <> 'concluida') THEN
    
    -- Evita duplicar comissão
    IF EXISTS (SELECT 1 FROM sale_commissions WHERE sale_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    -- Busca dados do veículo para aplicar regras
    SELECT * INTO v_vehicle FROM vehicles WHERE id = NEW.vehicle_id;
    
    -- Calcula margem de lucro (se houver custo)
    IF v_vehicle.purchase_price IS NOT NULL AND v_vehicle.purchase_price > 0 THEN
      v_profit_margin := ((NEW.sale_price - v_vehicle.purchase_price) / v_vehicle.purchase_price) * 100;
    ELSE
      v_profit_margin := NULL;
    END IF;

    -- Busca a regra de maior prioridade que se aplica
    SELECT * INTO v_rule 
    FROM commission_rules
    WHERE is_active = true
      AND (min_vehicle_price IS NULL OR NEW.sale_price >= min_vehicle_price)
      AND (max_vehicle_price IS NULL OR NEW.sale_price <= max_vehicle_price)
      AND (min_profit_margin IS NULL OR v_profit_margin IS NULL OR v_profit_margin >= min_profit_margin)
    ORDER BY priority DESC
    LIMIT 1;

    -- Se não encontrar regra, usa valor padrão 0
    IF v_rule IS NULL THEN
      v_calculated_amount := 0;
    ELSIF v_rule.commission_type = 'valor_fixo' THEN
      v_calculated_amount := COALESCE(v_rule.fixed_value, 0);
    ELSIF v_rule.commission_type = 'percentual_venda' THEN
      v_calculated_amount := NEW.sale_price * COALESCE(v_rule.percentage_value, 0) / 100;
    ELSIF v_rule.commission_type = 'percentual_lucro' THEN
      v_calculated_amount := (NEW.sale_price - COALESCE(v_vehicle.purchase_price, 0)) * COALESCE(v_rule.percentage_value, 0) / 100;
    ELSE
      v_calculated_amount := COALESCE(v_rule.fixed_value, 0);
    END IF;

    -- Insere a comissão
    INSERT INTO sale_commissions (
      sale_id,
      user_id,
      commission_rule_id,
      calculated_amount,
      final_amount,
      status
    ) VALUES (
      NEW.id,
      NEW.salesperson_id,
      v_rule.id,
      v_calculated_amount,
      v_calculated_amount,
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger se existir e cria novo
DROP TRIGGER IF EXISTS trigger_generate_commission_on_sale_completion ON public.sales;

CREATE TRIGGER trigger_generate_commission_on_sale_completion
AFTER INSERT OR UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.generate_commission_on_sale_completion();