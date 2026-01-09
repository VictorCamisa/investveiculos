-- Atualiza a função para sempre atribuir comissão ao vendedor
CREATE OR REPLACE FUNCTION generate_commission_on_sale_completion()
RETURNS TRIGGER AS $$
DECLARE
  rule_record RECORD;
  vehicle_record RECORD;
  commission_amount NUMERIC;
  profit_margin NUMERIC;
  actual_salesperson_id UUID;
  negotiation_salesperson_id UUID;
  lead_assigned_to UUID;
BEGIN
  -- Verifica se a venda foi marcada como concluída
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    
    -- Verifica se já existe comissão para esta venda
    IF EXISTS (SELECT 1 FROM sale_commissions WHERE sale_id = NEW.id) THEN
      RETURN NEW;
    END IF;
    
    -- Tenta encontrar o vendedor real (nunca gerente)
    -- 1. Primeiro verifica se o salesperson_id da venda é vendedor
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.salesperson_id AND role = 'vendedor') THEN
      actual_salesperson_id := NEW.salesperson_id;
    ELSE
      -- 2. Busca o vendedor na negociação associada ao lead
      IF NEW.lead_id IS NOT NULL THEN
        SELECT n.salesperson_id INTO negotiation_salesperson_id
        FROM negotiations n
        WHERE n.lead_id = NEW.lead_id
          AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = n.salesperson_id AND ur.role = 'vendedor')
        ORDER BY n.updated_at DESC
        LIMIT 1;
        
        IF negotiation_salesperson_id IS NOT NULL THEN
          actual_salesperson_id := negotiation_salesperson_id;
        ELSE
          -- 3. Busca no assigned_to do lead
          SELECT l.assigned_to INTO lead_assigned_to
          FROM leads l
          WHERE l.id = NEW.lead_id
            AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = l.assigned_to AND ur.role = 'vendedor');
          
          IF lead_assigned_to IS NOT NULL THEN
            actual_salesperson_id := lead_assigned_to;
          END IF;
        END IF;
      END IF;
    END IF;
    
    -- Se não encontrou vendedor, não gera comissão
    IF actual_salesperson_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Busca dados do veículo
    SELECT purchase_price, sale_price INTO vehicle_record
    FROM vehicles WHERE id = NEW.vehicle_id;
    
    -- Calcula margem de lucro
    IF vehicle_record.purchase_price > 0 THEN
      profit_margin := ((NEW.sale_price - vehicle_record.purchase_price) / vehicle_record.purchase_price) * 100;
    ELSE
      profit_margin := 0;
    END IF;
    
    -- Busca a regra de comissão com maior prioridade que se aplica
    SELECT * INTO rule_record
    FROM commission_rules
    WHERE is_active = true
      AND (min_vehicle_price IS NULL OR NEW.sale_price >= min_vehicle_price)
      AND (max_vehicle_price IS NULL OR NEW.sale_price <= max_vehicle_price)
      AND (min_profit_margin IS NULL OR profit_margin >= min_profit_margin)
    ORDER BY priority DESC
    LIMIT 1;
    
    -- Se encontrou regra, calcula a comissão
    IF rule_record.id IS NOT NULL THEN
      -- Calcula valor da comissão baseado no tipo
      IF rule_record.commission_type = 'valor_fixo' THEN
        commission_amount := COALESCE(rule_record.fixed_value, 0);
      ELSIF rule_record.commission_type = 'percentual_lucro' THEN
        commission_amount := (NEW.sale_price - COALESCE(vehicle_record.purchase_price, 0)) * COALESCE(rule_record.percentage_value, 0) / 100;
      ELSE
        -- percentual_venda ou outros
        commission_amount := NEW.sale_price * COALESCE(rule_record.percentage_value, 0) / 100;
      END IF;
      
      -- Insere a comissão para o VENDEDOR encontrado
      INSERT INTO sale_commissions (
        sale_id,
        user_id,
        commission_rule_id,
        calculated_amount,
        final_amount,
        status
      ) VALUES (
        NEW.id,
        actual_salesperson_id,
        rule_record.id,
        commission_amount,
        commission_amount,
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;