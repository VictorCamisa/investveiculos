-- Enum para status do veículo
CREATE TYPE public.vehicle_status AS ENUM ('disponivel', 'reservado', 'vendido', 'em_manutencao');

-- Enum para tipo de custo
CREATE TYPE public.vehicle_cost_type AS ENUM (
  'aquisicao',
  'documentacao',
  'transferencia', 
  'ipva',
  'manutencao',
  'limpeza',
  'frete',
  'comissao_compra',
  'outros'
);

-- Tabela de Veículos
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados básicos (nível simples)
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT,
  year_fabrication INTEGER NOT NULL,
  year_model INTEGER NOT NULL,
  color TEXT NOT NULL,
  plate TEXT,
  renavam TEXT,
  chassis TEXT,
  km INTEGER NOT NULL DEFAULT 0,
  fuel_type TEXT NOT NULL DEFAULT 'flex',
  transmission TEXT NOT NULL DEFAULT 'manual',
  doors INTEGER DEFAULT 4,
  
  -- Dados de aquisição (nível completo)
  purchase_price DECIMAL(12,2),
  purchase_date DATE,
  purchase_source TEXT,
  fipe_price_at_purchase DECIMAL(12,2),
  
  -- Preços e metas
  sale_price DECIMAL(12,2),
  minimum_price DECIMAL(12,2),
  expected_margin_percent DECIMAL(5,2),
  expected_sale_days INTEGER,
  
  -- Custos estimados (pré-compra)
  estimated_maintenance DECIMAL(12,2) DEFAULT 0,
  estimated_cleaning DECIMAL(12,2) DEFAULT 0,
  estimated_documentation DECIMAL(12,2) DEFAULT 0,
  estimated_other_costs DECIMAL(12,2) DEFAULT 0,
  
  -- Status e controle
  status vehicle_status NOT NULL DEFAULT 'disponivel',
  notes TEXT,
  featured BOOLEAN DEFAULT false,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Custos Reais do Veículo
CREATE TABLE public.vehicle_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  cost_type vehicle_cost_type NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Imagens do Veículo
CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Simulação Pré-Compra
CREATE TABLE public.vehicle_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do veículo simulado
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year_model INTEGER NOT NULL,
  km INTEGER NOT NULL,
  
  -- Valores
  purchase_price DECIMAL(12,2) NOT NULL,
  fipe_reference DECIMAL(12,2),
  
  -- Custos estimados
  estimated_maintenance DECIMAL(12,2) DEFAULT 0,
  estimated_cleaning DECIMAL(12,2) DEFAULT 0,
  estimated_documentation DECIMAL(12,2) DEFAULT 0,
  estimated_other_costs DECIMAL(12,2) DEFAULT 0,
  
  -- Resultados calculados
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (
    purchase_price + 
    COALESCE(estimated_maintenance, 0) + 
    COALESCE(estimated_cleaning, 0) + 
    COALESCE(estimated_documentation, 0) + 
    COALESCE(estimated_other_costs, 0)
  ) STORED,
  suggested_sale_price DECIMAL(12,2),
  expected_margin DECIMAL(12,2),
  expected_margin_percent DECIMAL(5,2),
  estimated_sale_days INTEGER,
  daily_holding_cost DECIMAL(12,2),
  
  -- Decisão
  decision TEXT,
  notes TEXT,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);