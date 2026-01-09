-- Adicionar campo is_master na tabela profiles para conta principal
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_master BOOLEAN NOT NULL DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.is_master IS 'Conta Master tem acesso total ao sistema e pode gerenciar todos os usuários';

-- Função para verificar se usuário é master
CREATE OR REPLACE FUNCTION public.is_master_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND is_master = true
      AND is_active = true
  )
$$;

-- Atualizar função has_permission para incluir check de master
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _module TEXT, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Master users have all permissions
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = _user_id AND is_master = true AND is_active = true
    )
    OR
    -- Check specific permission
    EXISTS (
      SELECT 1
      FROM public.user_permissions
      WHERE user_id = _user_id
        AND module = _module
        AND permission = _permission
    )
$$;