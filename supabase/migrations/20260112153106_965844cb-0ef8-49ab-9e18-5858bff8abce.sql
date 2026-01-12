-- Garantir permissões de acesso na tabela
GRANT ALL ON public.lead_qualifications TO authenticated;
GRANT ALL ON public.lead_qualifications TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;