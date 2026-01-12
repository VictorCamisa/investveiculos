-- Adicionar campo phone na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Criar índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);