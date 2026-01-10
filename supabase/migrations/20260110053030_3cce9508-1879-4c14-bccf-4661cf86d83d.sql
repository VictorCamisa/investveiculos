-- Corrigir RLS para profiles - gerentes podem ver todos, usuários veem apenas seu próprio
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Gerentes can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Gerentes can update all profiles" ON public.profiles;

-- SELECT: Gerentes veem todos, demais veem apenas o próprio
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR public.check_user_role(auth.uid(), 'gerente')
);

-- UPDATE: Gerentes podem atualizar todos, demais apenas o próprio
CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR public.check_user_role(auth.uid(), 'gerente')
);

-- INSERT: Apenas via trigger ou service role (não expor insert direto)
CREATE POLICY "Insert profiles via trigger"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Corrigir RLS para user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gerentes can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can manage all user roles" ON public.user_roles;

-- SELECT: Todos autenticados podem ver roles (necessário para listas)
CREATE POLICY "Authenticated can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Apenas gerentes
CREATE POLICY "Gerentes can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.check_user_role(auth.uid(), 'gerente'))
WITH CHECK (public.check_user_role(auth.uid(), 'gerente'));

-- Corrigir RLS para user_permissions
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Gerentes can view all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Gerentes can manage permissions" ON public.user_permissions;

-- SELECT: Todos autenticados podem ver permissões
CREATE POLICY "Authenticated can view permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Apenas gerentes
CREATE POLICY "Gerentes can manage permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (public.check_user_role(auth.uid(), 'gerente'))
WITH CHECK (public.check_user_role(auth.uid(), 'gerente'));

-- Corrigir RLS para activity_logs
DROP POLICY IF EXISTS "Users can view their own logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Gerentes can view all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert logs" ON public.activity_logs;

-- SELECT: Gerentes veem todos, demais veem apenas os próprios
CREATE POLICY "View activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.check_user_role(auth.uid(), 'gerente')
);

-- INSERT: Qualquer autenticado pode inserir seus próprios logs
CREATE POLICY "Insert activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);