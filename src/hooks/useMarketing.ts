import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { MarketingCampaign, LeadCost } from '@/types/marketing';

export function useMarketingCampaigns() {
  return useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async (): Promise<MarketingCampaign[]> => {
      const { data, error } = await (supabase as any)
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MarketingCampaign[];
    },
  });
}

interface CreateCampaignInput {
  name: string;
  platform: string;
  budget: number;
  spent?: number;
  start_date: string;
  end_date?: string;
  is_active?: boolean;
  notes?: string;
}

export function useCreateCampaign() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data, error } = await (supabase as any)
        .from('marketing_campaigns')
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
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: 'Campanha criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar campanha', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCampaign() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CreateCampaignInput>) => {
      const { data, error } = await (supabase as any)
        .from('marketing_campaigns')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: 'Campanha atualizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCampaign() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: 'Campanha excluída!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });
}

// Lead Costs
export function useLeadCosts(leadId?: string) {
  return useQuery({
    queryKey: ['lead-costs', leadId],
    queryFn: async (): Promise<LeadCost[]> => {
      let query = (supabase as any)
        .from('lead_costs')
        .select(`
          *,
          campaign:marketing_campaigns(id, name, platform)
        `)
        .order('created_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as LeadCost[];
    },
  });
}

interface CreateLeadCostInput {
  lead_id: string;
  campaign_id?: string;
  cost_amount: number;
  description?: string;
}

export function useCreateLeadCost() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLeadCostInput) => {
      const { data, error } = await (supabase as any)
        .from('lead_costs')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-costs'] });
      queryClient.invalidateQueries({ queryKey: ['sale-profit-reports'] });
      toast({ title: 'Custo registrado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao registrar custo', description: error.message, variant: 'destructive' });
    },
  });
}
