-- Drop existing policies
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários autenticados podem ver leads" ON public.leads;

-- Create new policies with proper INSERT/UPDATE/DELETE permissions
CREATE POLICY "Authenticated users can view leads"
ON public.leads
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create leads"
ON public.leads
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update leads"
ON public.leads
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete leads"
ON public.leads
FOR DELETE
USING (auth.role() = 'authenticated');