-- Função para obter colunas de uma tabela dinamicamente
CREATE OR REPLACE FUNCTION public.get_table_columns(p_table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.column_name::text, 
    c.data_type::text,
    c.is_nullable::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
  AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
$$;