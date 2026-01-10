-- Criar uma função security definer para buscar o role do usuário
-- Isso bypassa RLS e evita qualquer problema de permissão
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE role 
      WHEN 'gerente' THEN 1 
      WHEN 'marketing' THEN 2 
      WHEN 'vendedor' THEN 3 
      ELSE 4 
    END
  LIMIT 1;
$$;