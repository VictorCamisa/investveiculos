-- Remover políticas problemáticas e recriar de forma mais simples
DROP POLICY IF EXISTS "Usuários podem ver suas próprias roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gerentes podem ver todas as roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gerentes podem gerenciar roles" ON public.user_roles;

-- Política simples: cada usuário pode ver seus próprios roles
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política para gerentes gerenciarem (usando a função security definer)
CREATE POLICY "Managers can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'gerente'
  )
);

-- Também corrigir user_permissions
DROP POLICY IF EXISTS "Usuários podem ver suas próprias permissões" ON public.user_permissions;
DROP POLICY IF EXISTS "Gerentes podem gerenciar permissões" ON public.user_permissions;

CREATE POLICY "Users can read own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Managers can manage permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'gerente'
  )
);