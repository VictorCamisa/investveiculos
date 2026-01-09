-- Atualizar a role do Matheus para gerente (master já tem is_master=true, mas precisa de role gerente para as políticas funcionarem)
-- Também adicionar role gerente se não existir
INSERT INTO user_roles (user_id, role)
VALUES ('6c6e6c96-41d1-4ccc-a8d7-bbe1d1e62336', 'gerente')
ON CONFLICT (user_id, role) DO NOTHING;

-- Atualizar políticas de leads para verificar is_master_user PRIMEIRO
-- Primeiro remover as políticas existentes de vendedor que conflitam

DROP POLICY IF EXISTS "Vendedores veem seus próprios leads" ON leads;
DROP POLICY IF EXISTS "Vendedores veem leads das suas negociações" ON leads;

-- Recriar com lógica que considera master
CREATE POLICY "Vendedores veem seus próprios leads" ON leads
FOR SELECT USING (
  is_master_user(auth.uid()) OR
  (has_role(auth.uid(), 'vendedor') AND assigned_to = auth.uid())
);

CREATE POLICY "Vendedores veem leads das suas negociações" ON leads
FOR SELECT USING (
  is_master_user(auth.uid()) OR
  (has_role(auth.uid(), 'vendedor') AND EXISTS (
    SELECT 1 FROM negotiations WHERE negotiations.lead_id = leads.id AND negotiations.salesperson_id = auth.uid()
  ))
);

-- Atualizar políticas de negotiations para master
DROP POLICY IF EXISTS "Master pode ver todas as negociações" ON negotiations;
DROP POLICY IF EXISTS "Vendedores veem suas próprias negociações" ON negotiations;

CREATE POLICY "Master pode ver todas as negociações" ON negotiations
FOR SELECT USING (is_master_user(auth.uid()));

CREATE POLICY "Vendedores veem suas próprias negociações" ON negotiations
FOR SELECT USING (
  has_role(auth.uid(), 'vendedor') AND salesperson_id = auth.uid()
);

-- Atualizar políticas de vehicles para master
DROP POLICY IF EXISTS "Master pode ver todos os veículos" ON vehicles;

CREATE POLICY "Master pode ver todos os veículos" ON vehicles
FOR SELECT USING (is_master_user(auth.uid()));

-- Atualizar sale_profit_report view policies
DROP POLICY IF EXISTS "Master pode ver todos os relatórios" ON sales;

CREATE POLICY "Master pode ver todos os relatórios" ON sales
FOR SELECT USING (is_master_user(auth.uid()));