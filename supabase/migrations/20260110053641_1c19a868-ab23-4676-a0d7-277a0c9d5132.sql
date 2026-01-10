-- Atribuir role 'vendedor' para usuários que não têm role definido
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'vendedor'::app_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.id IS NULL
  AND p.is_master = false;