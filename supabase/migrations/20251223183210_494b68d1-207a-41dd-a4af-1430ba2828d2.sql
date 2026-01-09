-- Permitir que vendedores também possam inserir vendas
DROP POLICY IF EXISTS "Gerentes podem inserir vendas" ON public.sales;

CREATE POLICY "Usuarios autenticados podem inserir vendas"
ON public.sales
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  salesperson_id = auth.uid()
);

-- Permitir que vendedores atualizem suas próprias vendas pendentes
CREATE POLICY "Vendedores podem atualizar suas vendas pendentes"
ON public.sales
FOR UPDATE
USING (
  has_role(auth.uid(), 'vendedor'::app_role) AND 
  salesperson_id = auth.uid() AND
  status = 'pendente'
);