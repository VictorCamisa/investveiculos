import type { Database } from '@/integrations/supabase/types';

export type CommissionType = Database['public']['Enums']['commission_type'];

export interface CommissionRule {
  id: string;
  name: string;
  description: string | null;
  commission_type: CommissionType;
  percentage_value: number | null;
  fixed_value: number | null;
  min_vehicle_price: number | null;
  max_vehicle_price: number | null;
  min_profit_margin: number | null;
  vehicle_categories: string[] | null;
  tiers: CommissionTier[] | null;
  is_active: boolean;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Novos campos
  min_days_in_stock: number | null;
  max_days_in_stock: number | null;
  campaign_id: string | null;
  lead_source_bonus: Record<string, number> | null;
  goal_period: string | null;
  goal_target: number | null;
}

export interface CommissionTier {
  min_sales: number;
  max_sales: number | null;
  percentage: number;
}

export type CommissionStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface SaleCommission {
  id: string;
  sale_id: string;
  user_id: string;
  commission_rule_id: string | null;
  calculated_amount: number;
  manual_adjustment: number | null;
  final_amount: number;
  paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Novos campos
  status: CommissionStatus;
  payment_due_date: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  split_percentage: number;
  // Joined data
  sale?: {
    id: string;
    sale_date: string;
    sale_price: number;
    vehicle?: {
      brand: string;
      model: string;
    };
  };
  user?: {
    id: string;
    full_name: string | null;
  };
  commission_rule?: CommissionRule;
  approver?: {
    id: string;
    full_name: string | null;
  };
}

export interface CommissionSplit {
  id: string;
  sale_id: string;
  user_id: string;
  percentage: number;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
  };
}

export interface SalespersonGoal {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  target_sales: number;
  target_revenue: number;
  target_profit: number;
  current_sales: number;
  current_revenue: number;
  current_profit: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
  };
}

export interface CommissionAuditLog {
  id: string;
  commission_id: string;
  action: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  changer?: {
    id: string;
    full_name: string | null;
  };
}

export interface SalespersonRanking {
  user_id: string;
  full_name: string | null;
  total_sales: number;
  total_revenue: number;
  total_profit: number;
  total_commissions: number;
  avg_profit_per_sale: number;
  sales_this_month: number;
  revenue_this_month: number;
}

export const commissionTypeLabels: Record<CommissionType, string> = {
  percentual_lucro: 'Percentual do Lucro',
  valor_fixo: 'Valor Fixo',
  escalonada: 'Escalonada',
  mista: 'Mista',
};

export const commissionStatusLabels: Record<CommissionStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  paid: 'Paga',
};

export const commissionStatusColors: Record<CommissionStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export const goalPeriodLabels: Record<string, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};
