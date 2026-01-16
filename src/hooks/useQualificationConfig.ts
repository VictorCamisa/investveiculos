import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type QualificationTier = 'Q1' | 'Q2' | 'Q3';

export interface QualificationConfig {
  id: string;
  target_tier: QualificationTier;
  updated_at: string;
  updated_by: string | null;
}

export const QUALIFICATION_TIERS = {
  Q1: {
    label: 'Q1 - Básico',
    description: 'Nome + contato (telefone/email)',
    color: 'blue',
    icon: '📋',
    requirements: ['name', 'contact'],
  },
  Q2: {
    label: 'Q2 - Interesse',
    description: 'Dados básicos + veículo de interesse + origem',
    color: 'yellow',
    icon: '🎯',
    requirements: ['name', 'contact', 'vehicle_interest', 'source'],
  },
  Q3: {
    label: 'Q3 - Completo',
    description: 'Qualificação completa com orçamento, troca, pagamento',
    color: 'green',
    icon: '✅',
    requirements: ['name', 'contact', 'vehicle_interest', 'source', 'budget', 'payment_method', 'timeline'],
  },
} as const;

// Helper to get supabase client for untyped tables
const getQualificationConfigTable = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from('qualification_config');
};

export function useQualificationConfig() {
  return useQuery({
    queryKey: ['qualification-config'],
    queryFn: async () => {
      const { data, error } = await getQualificationConfigTable()
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as QualificationConfig;
    },
  });
}

export function useUpdateQualificationConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (targetTier: QualificationTier): Promise<QualificationConfig> => {
      // Get current config id
      const { data: configData, error: fetchError } = await getQualificationConfigTable()
        .select('id')
        .limit(1)
        .single();
      
      if (fetchError || !configData) throw new Error('Config not found');
      
      const configId = (configData as { id: string }).id;
      
      const { data, error } = await getQualificationConfigTable()
        .update({ 
          target_tier: targetTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', configId)
        .select()
        .single();
      
      if (error) throw error;
      return data as QualificationConfig;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qualification-config'] });
      if (data) {
        toast.success(`Meta de qualificação alterada para ${QUALIFICATION_TIERS[data.target_tier].label}`);
      }
    },
    onError: (error) => {
      console.error('Error updating qualification config:', error);
      toast.error('Erro ao atualizar configuração');
    },
  });
}

// Calculate qualification tier based on lead/qualification data
export function calculateQualificationTier(data: {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  vehicle_interest?: string | null;
  source?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  payment_method?: string | null;
  purchase_timeline?: string | null;
  has_trade_in?: boolean | null;
  trade_in_vehicle?: string | null;
}): QualificationTier | null {
  const hasName = !!data.name?.trim();
  const hasContact = !!(data.phone?.trim() || data.email?.trim());
  const hasVehicleInterest = !!data.vehicle_interest?.trim();
  const hasSource = !!data.source?.trim();
  const hasBudget = !!(data.budget_min || data.budget_max);
  const hasPaymentMethod = !!data.payment_method?.trim();
  const hasTimeline = !!data.purchase_timeline?.trim();
  
  // Q3: Complete qualification
  if (hasName && hasContact && hasVehicleInterest && hasSource && hasBudget && hasPaymentMethod && hasTimeline) {
    return 'Q3';
  }
  
  // Q2: Basic + vehicle interest + source
  if (hasName && hasContact && hasVehicleInterest && hasSource) {
    return 'Q2';
  }
  
  // Q1: Basic data only
  if (hasName && hasContact) {
    return 'Q1';
  }
  
  return null;
}

// Get tier badge color classes
export function getTierColorClasses(tier: QualificationTier | null) {
  switch (tier) {
    case 'Q3':
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: 'text-green-600',
        badge: 'bg-green-500',
      };
    case 'Q2':
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-600',
        badge: 'bg-yellow-500',
      };
    case 'Q1':
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-600',
        badge: 'bg-blue-500',
      };
    default:
      return {
        bg: 'bg-muted/10',
        border: 'border-muted/30',
        text: 'text-muted-foreground',
        badge: 'bg-muted',
      };
  }
}
