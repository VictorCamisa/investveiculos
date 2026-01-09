-- Enum para status do lead
CREATE TYPE public.lead_status AS ENUM ('novo', 'contato_inicial', 'qualificado', 'proposta', 'negociacao', 'convertido', 'perdido');

-- Enum para fonte do lead
CREATE TYPE public.lead_source AS ENUM ('website', 'indicacao', 'facebook', 'instagram', 'google_ads', 'olx', 'webmotors', 'outros');

-- Tabela de Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  source lead_source NOT NULL DEFAULT 'outros',
  status lead_status NOT NULL DEFAULT 'novo',
  notes TEXT,
  vehicle_interest TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Clientes (convertidos após compra)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cpf_cnpj TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de interações com leads
CREATE TABLE public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Leads

-- Gerentes veem todos os leads
CREATE POLICY "Gerentes podem ver todos os leads"
ON public.leads FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Vendedores veem apenas seus próprios leads
CREATE POLICY "Vendedores veem seus próprios leads"
ON public.leads FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'vendedor') 
  AND assigned_to = auth.uid()
);

-- Marketing pode ver todos os leads
CREATE POLICY "Marketing pode ver todos os leads"
ON public.leads FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'marketing'));

-- Gerentes e Marketing podem inserir leads
CREATE POLICY "Gerentes e Marketing podem inserir leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'gerente') 
  OR public.has_role(auth.uid(), 'marketing')
);

-- Vendedores podem inserir leads (atribuídos a si mesmos)
CREATE POLICY "Vendedores podem inserir seus leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'vendedor') 
  AND assigned_to = auth.uid()
);

-- Gerentes podem atualizar todos os leads
CREATE POLICY "Gerentes podem atualizar todos os leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Vendedores podem atualizar seus próprios leads
CREATE POLICY "Vendedores podem atualizar seus leads"
ON public.leads FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'vendedor') 
  AND assigned_to = auth.uid()
);

-- Marketing pode atualizar leads
CREATE POLICY "Marketing pode atualizar leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'marketing'));

-- Apenas gerentes podem deletar leads
CREATE POLICY "Apenas gerentes podem deletar leads"
ON public.leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Políticas RLS para Customers

-- Gerentes veem todos os clientes
CREATE POLICY "Gerentes podem ver todos os clientes"
ON public.customers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Marketing pode ver todos os clientes
CREATE POLICY "Marketing pode ver clientes"
ON public.customers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'marketing'));

-- Vendedores veem clientes relacionados aos seus leads
CREATE POLICY "Vendedores veem seus clientes"
ON public.customers FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'vendedor') 
  AND EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = customers.lead_id 
    AND leads.assigned_to = auth.uid()
  )
);

-- Gerentes podem inserir clientes
CREATE POLICY "Gerentes podem inserir clientes"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gerente'));

-- Gerentes podem atualizar clientes
CREATE POLICY "Gerentes podem atualizar clientes"
ON public.customers FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Políticas RLS para Lead Interactions

-- Gerentes veem todas as interações
CREATE POLICY "Gerentes veem todas as interações"
ON public.lead_interactions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gerente'));

-- Marketing vê todas as interações
CREATE POLICY "Marketing vê todas as interações"
ON public.lead_interactions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'marketing'));

-- Vendedores veem interações dos seus leads
CREATE POLICY "Vendedores veem interações dos seus leads"
ON public.lead_interactions FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'vendedor') 
  AND EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_interactions.lead_id 
    AND leads.assigned_to = auth.uid()
  )
);

-- Usuários autenticados podem inserir interações
CREATE POLICY "Usuários podem inserir interações"
ON public.lead_interactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_id 
    AND (
      leads.assigned_to = auth.uid() 
      OR public.has_role(auth.uid(), 'gerente')
      OR public.has_role(auth.uid(), 'marketing')
    )
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();