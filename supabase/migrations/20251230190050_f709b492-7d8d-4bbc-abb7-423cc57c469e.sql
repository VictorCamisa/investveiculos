-- Trocar Master User: Remover de Matheus de Almeida e adicionar para Venda de Soluções

-- Remover is_master de Matheus de Almeida
UPDATE public.profiles 
SET is_master = false 
WHERE id = '6c6e6c96-14f0-4444-bd2d-d91f06d1c4e2';

-- Adicionar is_master para Venda de Soluções
UPDATE public.profiles 
SET is_master = true 
WHERE id = '8e416585-5f26-4c72-aa04-9db682b425f2';