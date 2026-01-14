-- Permitir acesso público de leitura às imagens de veículos
CREATE POLICY "Todos podem ver imagens de veículos"
ON public.vehicle_images
FOR SELECT
TO public
USING (true);