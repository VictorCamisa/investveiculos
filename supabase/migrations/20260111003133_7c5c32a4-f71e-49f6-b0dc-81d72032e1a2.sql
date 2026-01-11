-- Fix RLS policies for ai_agents table - ensure they apply to authenticated users

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Gerentes e masters podem atualizar agentes" ON public.ai_agents;
DROP POLICY IF EXISTS "Gerentes e masters podem criar agentes" ON public.ai_agents;
DROP POLICY IF EXISTS "Gerentes podem atualizar ai_agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Gerentes podem criar ai_agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Gerentes podem deletar ai_agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Gerentes podem visualizar ai_agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Masters podem deletar agentes" ON public.ai_agents;
DROP POLICY IF EXISTS "Usuários autenticados podem ver agentes" ON public.ai_agents;

-- Make sure RLS is enabled
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Create simpler policies that work for authenticated users
CREATE POLICY "ai_agents_select_policy" 
ON public.ai_agents 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "ai_agents_insert_policy" 
ON public.ai_agents 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.is_master_user(auth.uid()) OR 
  public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "ai_agents_update_policy" 
ON public.ai_agents 
FOR UPDATE 
TO authenticated
USING (
  public.is_master_user(auth.uid()) OR 
  public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "ai_agents_delete_policy" 
ON public.ai_agents 
FOR DELETE 
TO authenticated
USING (
  public.is_master_user(auth.uid()) OR 
  public.has_role(auth.uid(), 'gerente'::app_role)
);