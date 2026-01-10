-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can manage all roles" ON public.user_roles;

-- Create a simpler policy for reading own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Managers can do everything
CREATE POLICY "Managers can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'gerente'
  )
);

-- Update get_my_role function to be more robust
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Busca o role do usuário atual com prioridade
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role 
      WHEN 'gerente' THEN 1 
      WHEN 'marketing' THEN 2 
      WHEN 'vendedor' THEN 3 
      ELSE 4 
    END
  LIMIT 1;
  
  RETURN user_role;
END;
$$;