-- Políticas RLS para tabela sales
-- Permitir leitura para usuários autenticados
CREATE POLICY "Authenticated users can view all sales"
ON public.sales
FOR SELECT
TO authenticated
USING (true);

-- Permitir inserção para usuários autenticados
CREATE POLICY "Authenticated users can create sales"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir atualização para usuários autenticados
CREATE POLICY "Authenticated users can update sales"
ON public.sales
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir deleção para usuários autenticados
CREATE POLICY "Authenticated users can delete sales"
ON public.sales
FOR DELETE
TO authenticated
USING (true);