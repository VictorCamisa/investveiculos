-- Garantir permissões de acesso na tabela user_permissions
GRANT ALL ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO anon;

-- Garantir permissões na tabela user_roles também
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO anon;