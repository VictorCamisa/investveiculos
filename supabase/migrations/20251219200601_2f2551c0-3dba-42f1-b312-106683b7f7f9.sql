-- =====================================================
-- SISTEMA DE PERMISSÕES FLEXÍVEIS E HISTÓRICO DE ATIVIDADES
-- =====================================================

-- 1. Tabela de permissões específicas por usuário
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL, -- 'crm', 'vendas', 'estoque', 'financeiro', 'marketing', 'comissoes', 'configuracoes', 'usuarios'
  permission TEXT NOT NULL, -- 'view', 'create', 'edit', 'delete', 'manage'
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module, permission)
);

-- 2. Tabela de histórico de atividades
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'create', 'update', 'delete', 'view', 'export'
  entity_type TEXT NOT NULL, -- 'lead', 'vehicle', 'sale', 'customer', 'user', etc.
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Adicionar campo is_active na tabela profiles para desativar usuários
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 4. Adicionar campo email na tabela profiles para facilitar gerenciamento
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 5. Criar índices para performance
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_module ON public.user_permissions(module);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- 6. Habilitar RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para user_permissions
CREATE POLICY "Gerentes podem ver todas as permissões"
ON public.user_permissions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir permissões"
ON public.user_permissions FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar permissões"
ON public.user_permissions FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar permissões"
ON public.user_permissions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Usuários podem ver suas próprias permissões"
ON public.user_permissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 8. Políticas RLS para activity_logs
CREATE POLICY "Gerentes podem ver todos os logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Sistema pode inserir logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários podem ver seus próprios logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 9. Política para gerentes verem todos os user_roles
DROP POLICY IF EXISTS "Gerentes podem ver todos os roles" ON public.user_roles;
CREATE POLICY "Gerentes podem ver todos os roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Usuários podem ver seus próprios roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 10. Função para verificar permissão específica
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _module TEXT, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND module = _module
      AND permission = _permission
  )
  OR 
  -- Gerentes sempre têm todas as permissões
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'gerente'
  )
$$;

-- 11. Função para registrar atividade
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 12. Função para obter todas as permissões de um usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE (
  module TEXT,
  permissions TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    module,
    array_agg(permission) as permissions
  FROM public.user_permissions
  WHERE user_id = _user_id
  GROUP BY module
$$;