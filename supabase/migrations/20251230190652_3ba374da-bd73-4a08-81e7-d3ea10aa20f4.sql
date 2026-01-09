-- Garantir que apenas Venda de Soluções tenha is_master = true
-- Remover is_master de todos os outros perfis que possam ter

UPDATE public.profiles 
SET is_master = false 
WHERE is_master = true 
  AND id != '8e416585-5f26-4c72-aa04-9db682b425f2';

-- Confirmar que Venda de Soluções tem is_master = true
UPDATE public.profiles 
SET is_master = true 
WHERE id = '8e416585-5f26-4c72-aa04-9db682b425f2';