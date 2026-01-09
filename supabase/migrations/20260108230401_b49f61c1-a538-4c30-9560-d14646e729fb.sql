
-- ===========================================
-- CORREÇÃO DE RLS: Vendedores só veem seus dados
-- ===========================================

-- 1. LIMPAR POLICIES DUPLICADAS E CONFLITANTES DE LEADS
DROP POLICY IF EXISTS "Vendedores veem seus próprios leads" ON leads;
DROP POLICY IF EXISTS "Vendedores veem leads das suas negociações" ON leads;
DROP POLICY IF EXISTS "Master pode ver todos os leads" ON leads;
DROP POLICY IF EXISTS "Master pode inserir leads" ON leads;
DROP POLICY IF EXISTS "Master pode atualizar todos os leads" ON leads;
DROP POLICY IF EXISTS "Master pode deletar leads" ON leads;

-- 2. LIMPAR POLICIES DUPLICADAS E CONFLITANTES DE NEGOTIATIONS
DROP POLICY IF EXISTS "Vendedores veem suas próprias negociações" ON negotiations;
DROP POLICY IF EXISTS "Master pode ver todas as negociações" ON negotiations;
DROP POLICY IF EXISTS "Master pode ver todas negociações" ON negotiations;
DROP POLICY IF EXISTS "Master pode inserir negociações" ON negotiations;
DROP POLICY IF EXISTS "Master pode atualizar negociações" ON negotiations;
DROP POLICY IF EXISTS "Master pode deletar negociações" ON negotiations;

-- 3. RECRIAR POLICY CORRETA PARA VENDEDORES VEREM LEADS
-- Vendedor vê: seus leads (assigned_to) OU leads de suas negociações
CREATE POLICY "Vendedores veem seus leads"
ON leads FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'vendedor'::app_role) 
  AND (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM negotiations 
      WHERE negotiations.lead_id = leads.id 
      AND negotiations.salesperson_id = auth.uid()
    )
  )
);

-- 4. RECRIAR POLICY CORRETA PARA VENDEDORES VEREM NEGOCIAÇÕES
CREATE POLICY "Vendedores veem suas negociações"
ON negotiations FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'vendedor'::app_role) 
  AND salesperson_id = auth.uid()
);
