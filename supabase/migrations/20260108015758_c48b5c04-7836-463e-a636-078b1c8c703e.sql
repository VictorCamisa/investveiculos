-- 1) Garantir que apenas o usuário Matheus seja "gerente" (admin do sistema)
-- UUID do Matheus (conforme tela do Supabase Auth): 6c6e6c96-41d1-4ccc-a8d7-bbe1d1e62336
DELETE FROM public.user_roles
WHERE role = 'gerente'::public.app_role
  AND user_id <> '6c6e6c96-41d1-4ccc-a8d7-bbe1d1e62336'::uuid;

INSERT INTO public.user_roles (user_id, role)
VALUES ('6c6e6c96-41d1-4ccc-a8d7-bbe1d1e62336'::uuid, 'gerente'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;


-- 2) Permitir que o "gerente" (Matheus) possa gerenciar outros perfis (ativar/desativar/editar)
DROP POLICY IF EXISTS "Gerentes podem atualizar perfis" ON public.profiles;

CREATE POLICY "Gerentes podem atualizar perfis"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'gerente'::public.app_role));
