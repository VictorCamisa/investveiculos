-- Adicionar role gerente para o usuário Guto
INSERT INTO user_roles (user_id, role) 
VALUES ('864d76e9-5fa0-4bf4-a570-458b5686534e', 'gerente');

-- Definir Guto como master (mesmo nível do Victor)
UPDATE profiles 
SET is_master = true 
WHERE id = '864d76e9-5fa0-4bf4-a570-458b5686534e';