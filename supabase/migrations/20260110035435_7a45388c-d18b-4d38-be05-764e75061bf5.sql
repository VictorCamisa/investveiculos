-- Habilitar RLS nas tabelas principais e criar políticas

-- 1. Políticas para user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Gerentes podem ver todas as roles"
ON public.user_roles
FOR SELECT
USING (public.has_role('gerente'));

CREATE POLICY "Gerentes podem gerenciar roles"
ON public.user_roles
FOR ALL
USING (public.has_role('gerente'));

-- 2. Políticas para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Sistema pode criar perfis"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- 3. Políticas para user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias permissões"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Gerentes podem gerenciar permissões"
ON public.user_permissions
FOR ALL
USING (public.has_role('gerente'));

-- 4. Políticas para vehicles (estoque público)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver veículos"
ON public.vehicles
FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar veículos"
ON public.vehicles
FOR ALL
TO authenticated
USING (true);

-- 5. Políticas para customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver clientes"
ON public.customers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar clientes"
ON public.customers
FOR ALL
TO authenticated
USING (true);

-- 6. Políticas para leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar leads"
ON public.leads
FOR ALL
TO authenticated
USING (true);

-- 7. Políticas para sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver vendas"
ON public.sales
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar vendas"
ON public.sales
FOR ALL
TO authenticated
USING (true);

-- 8. Políticas para negotiations
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver negociações"
ON public.negotiations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar negociações"
ON public.negotiations
FOR ALL
TO authenticated
USING (true);