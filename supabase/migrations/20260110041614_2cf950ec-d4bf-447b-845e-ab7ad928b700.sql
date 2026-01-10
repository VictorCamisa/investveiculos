-- Drop existing policies on user_roles if any
DROP POLICY IF EXISTS "Service role can access all" ON public.user_roles;

-- Create policy to allow service role full access to user_roles
-- This is needed for edge functions using service role key
CREATE POLICY "Service role can access all" 
ON public.user_roles 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure authenticated users can read their own roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());