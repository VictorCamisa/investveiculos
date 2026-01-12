-- Garantir que RLS está habilitado
ALTER TABLE public.lead_qualifications ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas que possam estar bloqueando
DROP POLICY IF EXISTS "Users can view lead qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Users can insert lead qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Users can update lead qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can view lead qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can insert lead qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can update lead qualifications" ON public.lead_qualifications;

-- Criar policies para usuários autenticados
CREATE POLICY "Authenticated users can view lead qualifications" 
ON public.lead_qualifications 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead qualifications" 
ON public.lead_qualifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update lead qualifications" 
ON public.lead_qualifications 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete lead qualifications" 
ON public.lead_qualifications 
FOR DELETE 
TO authenticated
USING (true);