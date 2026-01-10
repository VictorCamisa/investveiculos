// Tipos para vendas - baseados no schema real do banco

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'financiamento' | 'consorcio' | 'permuta' | 'misto';
export type SaleStatus = 'pendente' | 'concluida' | 'cancelada';
export type CommissionType = 'percentual_lucro' | 'valor_fixo' | 'escalonada' | 'mista';

export interface Sale {
  id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  lead_id?: string | null;
  seller_id: string | null;
  // Alias for compatibility
  salesperson_id?: string | null;
  sale_date: string | null;
  sale_price: number;
  payment_method?: PaymentMethod;
  payment_details?: string | null;
  documentation_cost?: number | null;
  transfer_cost?: number | null;
  other_sale_costs?: number | null;
  status: string | null;
  profit: number | null;
  total_costs: number | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string;
  // Joined data
  customer?: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    year_model: number | null;
    plate: string | null;
  } | null;
  salesperson?: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface SaleProfitReport {
  id?: string;
  sale_id?: string;
  sale_date: string | null;
  sale_price: number | null;
  customer_id?: string;
  vehicle_id?: string;
  lead_id?: string | null;
  salesperson_id?: string;
  status?: string;
  brand: string | null;
  model: string | null;
  year_model?: number | null;
  plate?: string | null;
  vehicle_purchase_price?: number | null;
  vehicle_total_costs?: number | null;
  vehicle_total_investment?: number | null;
  days_in_stock?: number | null;
  holding_cost?: number | null;
  documentation_cost?: number | null;
  transfer_cost?: number | null;
  other_sale_costs?: number | null;
  total_sale_costs?: number | null;
  lead_cac?: number | null;
  total_commissions?: number | null;
  gross_profit?: number | null;
  net_profit: number | null;
  total_costs: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CommissionRule {
  id: string;
  name?: string;
  description?: string | null;
  commission_type?: CommissionType;
  role: string | null;
  percentage: number | null;
  percentage_value?: number | null; // Alias for compatibility
  fixed_value: number | null;
  min_profit_percentage: number | null;
  min_vehicle_price?: number | null;
  max_vehicle_price?: number | null;
  min_profit_margin?: number | null;
  vehicle_categories?: string[] | null;
  tiers?: CommissionTier[] | null;
  is_active?: boolean;
  priority?: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommissionTier {
  min_sales: number;
  max_sales: number | null;
  percentage: number;
}

export interface SaleCommission {
  id: string;
  sale_id: string | null;
  user_id: string | null;
  commission_rule_id?: string | null;
  amount: number;
  calculated_amount?: number;
  manual_adjustment?: number | null;
  final_amount?: number;
  paid?: boolean;
  paid_at: string | null;
  status: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string;
  // Joined data
  sale?: Sale;
  user?: {
    id: string;
    full_name: string | null;
  };
  commission_rule?: CommissionRule;
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  financiamento: 'Financiamento',
  consorcio: 'Consórcio',
  permuta: 'Permuta',
  misto: 'Misto',
};

export const saleStatusLabels: Record<SaleStatus, string> = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const saleStatusColors: Record<SaleStatus, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-400',
  concluida: 'bg-green-500/20 text-green-400',
  cancelada: 'bg-red-500/20 text-red-400',
};

export const commissionTypeLabels: Record<CommissionType, string> = {
  percentual_lucro: 'Percentual do Lucro',
  valor_fixo: 'Valor Fixo',
  escalonada: 'Escalonada',
  mista: 'Mista',
};
