-- Simplify RLS policies for ai_agents table to maximum permissiveness for authenticated users

-- Drop existing policies
DROP POLICY IF EXISTS "ai_agents_select_policy" ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents_insert_policy" ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents_update_policy" ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents_delete_policy" ON public.ai_agents;

-- Create simple policies for all authenticated users (can restrict later)
CREATE POLICY "authenticated_select_ai_agents" 
ON public.ai_agents 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "authenticated_insert_ai_agents" 
ON public.ai_agents 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_ai_agents" 
ON public.ai_agents 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "authenticated_delete_ai_agents" 
ON public.ai_agents 
FOR DELETE 
TO authenticated
USING (true);