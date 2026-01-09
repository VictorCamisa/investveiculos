import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { CommissionRule, SaleCommission, CommissionType, CommissionTier } from '@/types/sales';

// Commission Rules
export function useCommissionRules() {
  return useQuery({
    queryKey: ['commission-rules'],
    queryFn: async (): Promise<CommissionRule[]> => {
      const { data, error } = await (supabase as any)
        .from('commission_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data || []).map((rule: any) => ({
        ...rule,
        tiers: rule.tiers as CommissionTier[] | null,
      })) as CommissionRule[];
    },
  });
}

interface CreateCommissionRuleInput {
  name: string;
  description?: string;
  commission_type: CommissionType;
  percentage_value?: number;
  fixed_value?: number;
  min_vehicle_price?: number;
  max_vehicle_price?: number;
  min_profit_margin?: number;
  vehicle_categories?: string[];
  tiers?: CommissionTier[];
  is_active?: boolean;
  priority?: number;
}

export function useCreateCommissionRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCommissionRuleInput) => {
      const { data, error } = await (supabase as any)
        .from('commission_rules')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast({ title: 'Regra de comissão criada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar regra', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCommissionRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CreateCommissionRuleInput>) => {
      const { data, error } = await (supabase as any)
        .from('commission_rules')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast({ title: 'Regra atualizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCommissionRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('commission_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast({ title: 'Regra excluída!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });
}

// Sale Commissions - Corrigido para evitar erro PGRST200
export function useSaleCommissions(saleId?: string) {
  return useQuery({
    queryKey: ['sale-commissions', saleId],
    queryFn: async (): Promise<SaleCommission[]> => {
      let query = (supabase as any)
        .from('sale_commissions')
        .select(`
          *,
          commission_rule:commission_rules(id, name, commission_type)
        `)
        .order('created_at', { ascending: false });

      if (saleId) {
        query = query.eq('sale_id', saleId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const commissions = (data || []) as SaleCommission[];

      // Buscar profiles separadamente para evitar erro PGRST200
      const userIds = Array.from(
        new Set(commissions.map((c) => c.user_id).filter(Boolean))
      );

      if (userIds.length === 0) return commissions;

      const { data: profilesData } = await (supabase as any)
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map<string, { id: string; full_name: string | null }>();
      (profilesData || []).forEach((p: any) => profileMap.set(p.id, p));

      return commissions.map((c) => ({
        ...c,
        user: profileMap.get(c.user_id) || null,
      }));
    },
  });
}

interface CreateSaleCommissionInput {
  sale_id: string;
  user_id: string;
  commission_rule_id?: string;
  calculated_amount: number;
  manual_adjustment?: number;
  final_amount: number;
  notes?: string;
}

export function useCreateSaleCommission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSaleCommissionInput) => {
      const { data, error } = await (supabase as any)
        .from('sale_commissions')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['sale-profit-reports'] });
      toast({ title: 'Comissão registrada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao registrar comissão', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSaleCommission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CreateSaleCommissionInput & { paid: boolean; paid_at: string }>) => {
      const { data, error } = await (supabase as any)
        .from('sale_commissions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['sale-profit-reports'] });
      toast({ title: 'Comissão atualizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}
