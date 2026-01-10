-- PARTE 1: CRIAR ENUMS (se não existirem)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('gerente', 'vendedor', 'marketing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.commission_type AS ENUM ('percentual_lucro', 'valor_fixo', 'escalonada', 'mista');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_source AS ENUM ('website', 'indicacao', 'facebook', 'instagram', 'google_ads', 'olx', 'webmotors', 'outros', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('novo', 'contato_inicial', 'qualificado', 'proposta', 'negociacao', 'convertido', 'perdido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.loss_reason_type AS ENUM ('sem_entrada', 'sem_credito', 'curioso', 'caro', 'comprou_outro', 'desistiu', 'sem_contato', 'veiculo_vendido', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.negotiation_status AS ENUM ('em_andamento', 'proposta_enviada', 'negociando', 'ganho', 'perdido', 'pausado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'financiamento', 'consorcio', 'permuta', 'misto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.qualification_status AS ENUM ('nao_qualificado', 'qualificado', 'desqualificado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sale_status AS ENUM ('pendente', 'concluida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vehicle_cost_type AS ENUM ('aquisicao', 'documentacao', 'transferencia', 'ipva', 'manutencao', 'limpeza', 'frete', 'comissao_compra', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vehicle_status AS ENUM ('disponivel', 'reservado', 'vendido', 'em_manutencao');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PARTE 2A: Adicionar colunas faltantes ao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Adicionar coluna granted_by e granted_at em user_permissions
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id);

-- PARTE 2B: Adicionar colunas faltantes em vehicles
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS year_fabrication INTEGER;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS km INTEGER;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS doors INTEGER;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_price NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS minimum_price NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_source TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS estimated_maintenance NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS estimated_documentation NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS estimated_cleaning NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS estimated_other_costs NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS expected_margin_percent NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS expected_sale_days INTEGER;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fipe_price_at_purchase NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS mercadolibre_id TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS ml_item_id TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS ml_status TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS ml_permalink TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS ml_listing_type TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS ml_published_at TIMESTAMPTZ;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Sincronizar mileage com km
DO $$ BEGIN
  UPDATE public.vehicles SET km = mileage WHERE km IS NULL AND mileage IS NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- PARTE 2C: Adicionar colunas faltantes em vehicle_images
ALTER TABLE public.vehicle_images ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.vehicle_images ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT false;
ALTER TABLE public.vehicle_images ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Sincronizar url com image_url
DO $$ BEGIN
  UPDATE public.vehicle_images SET image_url = url WHERE image_url IS NULL AND url IS NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- PARTE 2D: Adicionar colunas faltantes em vehicle_costs
ALTER TABLE public.vehicle_costs ADD COLUMN IF NOT EXISTS cost_type TEXT;
ALTER TABLE public.vehicle_costs ADD COLUMN IF NOT EXISTS cost_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.vehicle_costs ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.vehicle_costs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- PARTE 2E: Adicionar colunas faltantes em leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;

-- PARTE 2F: Adicionar colunas faltantes em lead_interactions  
ALTER TABLE public.lead_interactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.lead_interactions ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMPTZ;
ALTER TABLE public.lead_interactions ADD COLUMN IF NOT EXISTS follow_up_completed BOOLEAN DEFAULT false;

-- PARTE 2G: Adicionar colunas faltantes em customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- PARTE 2H: Adicionar colunas faltantes em negotiations
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS test_drive_scheduled BOOLEAN DEFAULT false;
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS test_drive_completed BOOLEAN DEFAULT false;
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0;
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS value_offered NUMERIC;